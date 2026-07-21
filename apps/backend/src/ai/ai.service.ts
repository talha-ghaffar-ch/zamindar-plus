import { Injectable, Logger } from '@nestjs/common';
import { CropsService } from '../crops/crops.service';
import { ExpensesService } from '../expenses/expenses.service';
import { IncomeService } from '../income/income.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { ReportsService } from '../reports/reports.service';
import { ZameenService } from '../zameen/zameen.service';
import { AGENT_FUNCTION_DECLARATIONS } from './agent-tools';
import { ChatMessageDto } from './dto/chat-message.dto';

const MAX_TOOL_ROUNDS = 8;
const MAX_LIST_ITEMS = 60;

const AREA_UNIT_ALIASES: Record<string, string> = {
  acre: 'Acre',
  acres: 'Acre',
  killa: 'Killa',
  killay: 'Killa',
  murabba: 'Murabba',
  kanal: 'Kanal',
  marla: 'Marla',
  marlay: 'Marla',
  'square feet': 'Square feet',
  sqft: 'Square feet',
  'sq ft': 'Square feet',
};

const AREA_UNIT_TO_SQFT: Record<string, number> = {
  Acre: 43560,
  Killa: 43560,
  Murabba: 1089000,
  Kanal: 5445,
  Marla: 272.25,
  'Square feet': 1,
};

export type AgentActionEntity =
  | 'profile'
  | 'zameen'
  | 'crop'
  | 'expense'
  | 'income';

export type AgentAction = {
  type: 'created' | 'updated' | 'deleted';
  entity: AgentActionEntity;
  id: string;
  label: string;
};

type ToolArgs = Record<string, unknown>;

type GeminiFunctionCall = {
  name: string;
  args?: ToolArgs;
};

type GeminiPart = {
  text?: string;
  functionCall?: GeminiFunctionCall;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
};

type RequestPart = Record<string, unknown>;

type RequestContent = {
  role: 'user' | 'model';
  parts: RequestPart[];
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
    private readonly zameenService: ZameenService,
    private readonly cropsService: CropsService,
    private readonly expensesService: ExpensesService,
    private readonly incomeService: IncomeService,
    private readonly reportsService: ReportsService,
  ) {}

  async chat(userId: string, chatMessageDto: ChatMessageDto) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const actions: AgentAction[] = [];

    if (!apiKey) {
      return {
        reply:
          'Zamindar AI is not configured on this server yet. Please ask the administrator to set the Gemini API key.',
        actions,
      };
    }

    const model = process.env.GEMINI_MODEL?.trim() || 'gemini-flash-latest';
    const systemPrompt =
      (await this.buildSystemPrompt(userId)) +
      this.languageInstruction(chatMessageDto.language);

    const history = (chatMessageDto.history ?? []).map(
      (message): RequestContent => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.text }],
      }),
    );

    // Gemini requires the conversation to open on a user turn, but the client
    // history starts with the assistant greeting; drop any leading model turns.
    while (history.length > 0 && history[0].role === 'model') {
      history.shift();
    }

    const contents: RequestContent[] = [
      ...history,
      { role: 'user', parts: [{ text: chatMessageDto.message }] },
    ];

    try {
      for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
        const response = await this.callGemini(
          apiKey,
          model,
          systemPrompt,
          contents,
        );
        const parts = response.candidates?.[0]?.content?.parts ?? [];
        const functionCalls = parts
          .map((part) => part.functionCall)
          .filter((call): call is GeminiFunctionCall => Boolean(call?.name));

        if (functionCalls.length === 0 || round === MAX_TOOL_ROUNDS) {
          const reply = parts
            .map((part) => part.text ?? '')
            .join('')
            .trim();

          return {
            reply:
              reply ||
              'Sorry, I could not finish that request. Please try again.',
            actions,
          };
        }

        contents.push({
          role: 'model',
          parts: parts,
        });

        const responseParts: RequestPart[] = [];
        for (const call of functionCalls) {
          const result = await this.executeTool(userId, call, actions);
          responseParts.push({
            functionResponse: {
              name: call.name,
              response: result,
            },
          });
        }

        contents.push({ role: 'user', parts: responseParts });
      }

      return {
        reply: 'Sorry, I could not finish that request. Please try again.',
        actions,
      };
    } catch (error) {
      this.logger.error(
        `Zamindar AI chat failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      return {
        reply:
          actions.length > 0
            ? 'I saved some of the changes but could not finish the whole request. Please check your records and tell me what is missing.'
            : 'Zamindar AI is having trouble responding right now. Please try again in a moment.',
        actions,
      };
    }
  }

  private async callGemini(
    apiKey: string,
    model: string,
    systemPrompt: string,
    contents: RequestContent[],
  ): Promise<GeminiResponse> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          tools: [{ functionDeclarations: AGENT_FUNCTION_DECLARATIONS }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Gemini request failed with status ${response.status}: ${errorText.slice(0, 300)}`,
      );
    }

    return (await response.json()) as GeminiResponse;
  }

  private async buildSystemPrompt(userId: string) {
    const [user, profiles] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          preferredAreaUnit: true,
          preferredCurrency: true,
          preferredLanguage: true,
        },
      }),
      this.prisma.profile.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          profileName: true,
          city: true,
          chakAreaName: true,
          villageName: true,
          zameen: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              zameenName: true,
              totalAreaValue: true,
              totalAreaUnit: true,
              totalAreaSqft: true,
              ownershipType: true,
              crops: {
                orderBy: { createdAt: 'asc' },
                select: {
                  id: true,
                  cropName: true,
                  status: true,
                  cropAreaValue: true,
                  cropAreaUnit: true,
                  cropAreaSqft: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const snapshotLines: string[] = [];

    if (profiles.length === 0) {
      snapshotLines.push(
        'The user has no profiles yet. The first step is creating a profile.',
      );
    }

    for (const profile of profiles) {
      const location = [profile.city, profile.chakAreaName, profile.villageName]
        .filter(Boolean)
        .join(', ');
      snapshotLines.push(
        `- Profile "${profile.profileName}" (id: ${profile.id})${location ? ` — ${location}` : ''}`,
      );

      if (profile.zameen.length === 0) {
        snapshotLines.push('  (no zameen under this profile yet)');
      }

      for (const zameen of profile.zameen) {
        const usedSqft = zameen.crops.reduce(
          (total, crop) => total + crop.cropAreaSqft,
          0,
        );
        const freeSqft = Math.max(zameen.totalAreaSqft - usedSqft, 0);
        const unitSqft = AREA_UNIT_TO_SQFT[zameen.totalAreaUnit] ?? 1;
        const freeInUnit = Math.round((freeSqft / unitSqft) * 100) / 100;
        snapshotLines.push(
          `  - Zameen "${zameen.zameenName}" (id: ${zameen.id}) — ${zameen.totalAreaValue} ${zameen.totalAreaUnit} total, ${freeInUnit} ${zameen.totalAreaUnit} free${zameen.ownershipType ? `, ${zameen.ownershipType}` : ''}`,
        );

        if (zameen.crops.length === 0) {
          snapshotLines.push('    (no crops on this zameen yet)');
        }

        for (const crop of zameen.crops) {
          snapshotLines.push(
            `    - Crop "${crop.cropName}" (id: ${crop.id}) — ${crop.cropAreaValue} ${crop.cropAreaUnit}, ${crop.status}`,
          );
        }
      }
    }

    const userName = user
      ? `${user.firstName} ${user.lastName}`.trim()
      : 'the user';
    const today = new Date().toISOString().slice(0, 10);

    return `You are Zamindar AI, the smart assistant with full control of the Zamindar Plus farm ledger app. You manage the user's farm records directly through your tools: you can create, list, update and delete profiles, zameen (land), crops, expenses and income, and read reports.

Today's date: ${today}. User: ${userName}. Preferred currency: ${user?.preferredCurrency ?? 'PKR'}. Preferred area unit: ${user?.preferredAreaUnit ?? 'Acre'}.

DATA HIERARCHY: Profile -> Zameen -> Crop -> Expense / Income. Every zameen belongs to a profile, every crop to a zameen, every expense and income to a crop.

HOW TO WORK:
1. Understand the user in any language they use (English, Urdu, Roman Urdu, Punjabi) and always reply in that same language.
2. Use the workspace snapshot below to resolve names to ids for tool calls. Never ask the user for an id and never show raw ids in replies.
3. If a request matches more than one record, ask which one they mean.
4. Before creating a record, make sure the required information is present. If something required is missing, ask for it in one short message and also mention the useful optional details they can give. Requirements:
   - Profile: name required. Optional: city, chak/area name, village.
   - Zameen: profile, name, and area (value + unit) required. Optional: murabba number, killa number, khasra number, ownership type.
   - Crop: zameen, crop name, and area required. Optional: sowing month/year, expected harvest month/year. Crop area must fit in the zameen's free area.
   - Expense: crop, category, description, amount, and date required. Optional: payment status (default Paid).
   - Income: crop, total amount, and date required. Optional: quantity, quantity unit, rate, payment status (default Received), buyer name. If quantity and rate are given, compute the total yourself.
5. Use sensible values the user implies: "aaj" or "today" means today's date, "kal" usually means yesterday for past expenses. If only one profile or zameen or crop exists, use it without asking. Never invent amounts, names or areas.
6. If the parent record does not exist (for example adding a crop when there is no zameen), explain the hierarchy briefly and offer to create the parent first.
7. Deleting is permanent and removes child records too. Before calling any delete tool, tell the user what will be removed and get a clear yes from them in chat. Creates and updates do not need confirmation when the request is clear.
8. After saving anything, confirm in one short message what was saved with its key values, and mention that they can check it in the relevant section of the app (Profiles, Zameen, Crops, Expenses, Income, Reports).
9. Area units: Acre, Killa, Murabba, Kanal, Marla, Square feet. Pass value plus unit to tools; conversion to square feet is automatic.
10. Answer questions about the user's data with your list and report tools instead of guessing. You may also give brief practical farming advice; keep the focus on the user's farm and records.
11. Some messages are dictated by voice, so they may be informal, run together, or lightly misheard ("add karo teen hazar ka kharcha gandum par"). Read through the wording to the intent, fix obvious transcription slips using the workspace snapshot (crop, zameen and profile names), and act. Only ask when the intent is genuinely unclear or a required value is missing.

HOW TO FORMAT REPLIES:
- Be warm, direct and practical. Lead with the outcome, not a preamble.
- Keep a simple confirmation to one or two short sentences.
- When you report several values or list records, put each on its own line as a bullet starting with "- ".
- Use **bold** only for key values such as amounts, names, dates and totals.
- Separate distinct ideas with a blank line so the reply is easy to scan.
- Use a numbered list only for steps the user must follow in order.
- Never output headings, tables, code blocks, links or raw ids.
- Keep the whole reply under about eight lines unless the user asked for a full listing.

EXAMPLE OF A GOOD SAVE CONFIRMATION:
Fertilizer kharcha save kar diya.

- Crop: **Wheat (Main Road Block)**
- Amount: **Rs 20,000**
- Date: **19 Jul 2026**

Expenses section mein dekh sakte hain.

WORKSPACE SNAPSHOT (live data, ids are for your tool calls only):
${snapshotLines.join('\n')}`;
  }

  private languageInstruction(language?: 'en' | 'ur' | 'roman'): string {
    switch (language) {
      case 'ur':
        return '\n\nSELECTED LANGUAGE: Urdu. Reply ONLY in natural, fluent Urdu using Urdu script (اردو), no matter which language the user writes in. Use authentic Urdu wording, not transliteration. Keep numbers, amounts and dates in Latin digits.';
      case 'roman':
        return '\n\nSELECTED LANGUAGE: Roman Urdu. Reply ONLY in natural Roman Urdu (Urdu written in English letters), no matter which language the user writes in. Use everyday Pakistani wording, not formal English.';
      case 'en':
        return '\n\nSELECTED LANGUAGE: English. Reply ONLY in clear, professional English, no matter which language the user writes in.';
      default:
        return '';
    }
  }

  private async executeTool(
    userId: string,
    call: GeminiFunctionCall,
    actions: AgentAction[],
  ): Promise<Record<string, unknown>> {
    try {
      const result = await this.runTool(
        userId,
        call.name,
        call.args ?? {},
        actions,
      );
      return { ok: true, ...result };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : 'The action could not run.',
      };
    }
  }

  private async runTool(
    userId: string,
    name: string,
    args: ToolArgs,
    actions: AgentAction[],
  ): Promise<Record<string, unknown>> {
    switch (name) {
      case 'list_profiles': {
        const profiles = await this.profilesService.findAll(userId);
        return {
          profiles: profiles.map((profile) => ({
            id: profile.id,
            profileName: profile.profileName,
            city: profile.city,
            chakAreaName: profile.chakAreaName,
            villageName: profile.villageName,
          })),
        };
      }

      case 'create_profile': {
        const profile = await this.profilesService.create(userId, {
          profileName: this.requireString(args, 'profileName'),
          city: this.optionalString(args, 'city'),
          chakAreaName: this.optionalString(args, 'chakAreaName'),
          villageName: this.optionalString(args, 'villageName'),
        });
        actions.push({
          type: 'created',
          entity: 'profile',
          id: profile.id,
          label: `Profile "${profile.profileName}" created`,
        });
        return { profile };
      }

      case 'update_profile': {
        const profileId = this.requireString(args, 'profileId');
        const profile = await this.profilesService.update(userId, profileId, {
          profileName: this.optionalString(args, 'profileName'),
          city: this.optionalString(args, 'city'),
          chakAreaName: this.optionalString(args, 'chakAreaName'),
          villageName: this.optionalString(args, 'villageName'),
        });
        actions.push({
          type: 'updated',
          entity: 'profile',
          id: profile.id,
          label: `Profile "${profile.profileName}" updated`,
        });
        return { profile };
      }

      case 'delete_profile': {
        const profileId = this.requireString(args, 'profileId');
        await this.profilesService.remove(userId, profileId);
        actions.push({
          type: 'deleted',
          entity: 'profile',
          id: profileId,
          label: 'Profile deleted',
        });
        return { deleted: true };
      }

      case 'list_zameen': {
        const profileId = this.optionalString(args, 'profileId');
        const zameenList = await this.prisma.zameen.findMany({
          where: {
            profile: { userId },
            ...(profileId ? { profileId } : {}),
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            profileId: true,
            zameenName: true,
            murabbaNumber: true,
            killaNumber: true,
            khasraNumber: true,
            ownershipType: true,
            totalAreaValue: true,
            totalAreaUnit: true,
            totalAreaSqft: true,
            crops: { select: { cropAreaSqft: true } },
          },
        });
        return {
          zameen: zameenList.map((zameen) => {
            const usedAreaSqft = zameen.crops.reduce(
              (total, crop) => total + crop.cropAreaSqft,
              0,
            );
            return {
              id: zameen.id,
              profileId: zameen.profileId,
              zameenName: zameen.zameenName,
              murabbaNumber: zameen.murabbaNumber,
              killaNumber: zameen.killaNumber,
              khasraNumber: zameen.khasraNumber,
              ownershipType: zameen.ownershipType,
              totalAreaValue: zameen.totalAreaValue,
              totalAreaUnit: zameen.totalAreaUnit,
              totalAreaSqft: zameen.totalAreaSqft,
              usedAreaSqft,
              availableAreaSqft: Math.max(
                zameen.totalAreaSqft - usedAreaSqft,
                0,
              ),
            };
          }),
        };
      }

      case 'create_zameen': {
        const areaValue = this.requireNumber(args, 'totalAreaValue');
        const areaUnit = this.normalizeAreaUnit(
          this.requireString(args, 'totalAreaUnit'),
        );
        const zameen = await this.zameenService.create(userId, {
          profileId: this.requireString(args, 'profileId'),
          zameenName: this.requireString(args, 'zameenName'),
          totalAreaValue: areaValue,
          totalAreaUnit: areaUnit,
          totalAreaSqft: this.toSquareFeet(areaValue, areaUnit),
          murabbaNumber: this.optionalString(args, 'murabbaNumber'),
          killaNumber: this.optionalString(args, 'killaNumber'),
          khasraNumber: this.optionalString(args, 'khasraNumber'),
          ownershipType: this.optionalString(args, 'ownershipType'),
        });
        actions.push({
          type: 'created',
          entity: 'zameen',
          id: zameen.id,
          label: `Zameen "${zameen.zameenName}" added (${zameen.totalAreaValue} ${zameen.totalAreaUnit})`,
        });
        return { zameen };
      }

      case 'update_zameen': {
        const zameenId = this.requireString(args, 'zameenId');
        const areaValue = this.optionalNumber(args, 'totalAreaValue');
        const areaUnitRaw = this.optionalString(args, 'totalAreaUnit');

        let areaFields = {};
        if (areaValue !== undefined || areaUnitRaw !== undefined) {
          const existing = await this.prisma.zameen.findFirst({
            where: { id: zameenId, profile: { userId } },
            select: { totalAreaValue: true, totalAreaUnit: true },
          });
          if (!existing) {
            throw new Error('Zameen not found.');
          }
          const value = areaValue ?? existing.totalAreaValue;
          const unit = this.normalizeAreaUnit(
            areaUnitRaw ?? existing.totalAreaUnit,
          );
          areaFields = {
            totalAreaValue: value,
            totalAreaUnit: unit,
            totalAreaSqft: this.toSquareFeet(value, unit),
          };
        }

        const zameen = await this.zameenService.update(userId, zameenId, {
          zameenName: this.optionalString(args, 'zameenName'),
          murabbaNumber: this.optionalString(args, 'murabbaNumber'),
          killaNumber: this.optionalString(args, 'killaNumber'),
          khasraNumber: this.optionalString(args, 'khasraNumber'),
          ownershipType: this.optionalString(args, 'ownershipType'),
          ...areaFields,
        });
        actions.push({
          type: 'updated',
          entity: 'zameen',
          id: zameen.id,
          label: `Zameen "${zameen.zameenName}" updated`,
        });
        return { zameen };
      }

      case 'delete_zameen': {
        const zameenId = this.requireString(args, 'zameenId');
        await this.zameenService.remove(userId, zameenId);
        actions.push({
          type: 'deleted',
          entity: 'zameen',
          id: zameenId,
          label: 'Zameen deleted',
        });
        return { deleted: true };
      }

      case 'list_crops': {
        const zameenId = this.optionalString(args, 'zameenId');
        const crops = zameenId
          ? await this.cropsService.findByZameen(userId, zameenId)
          : await this.cropsService.findAll(userId);
        return {
          crops: crops.map((crop) => ({
            id: crop.id,
            zameenId: crop.zameenId,
            cropName: crop.cropName,
            cropAreaValue: crop.cropAreaValue,
            cropAreaUnit: crop.cropAreaUnit,
            status: crop.status,
            startMonth: crop.startMonth,
            startYear: crop.startYear,
            expectedEndMonth: crop.expectedEndMonth,
            expectedEndYear: crop.expectedEndYear,
          })),
        };
      }

      case 'create_crop': {
        const areaValue = this.requireNumber(args, 'cropAreaValue');
        const areaUnit = this.normalizeAreaUnit(
          this.requireString(args, 'cropAreaUnit'),
        );
        const crop = await this.cropsService.create(userId, {
          zameenId: this.requireString(args, 'zameenId'),
          cropName: this.requireString(args, 'cropName'),
          cropAreaValue: areaValue,
          cropAreaUnit: areaUnit,
          cropAreaSqft: this.toSquareFeet(areaValue, areaUnit),
          startMonth: this.optionalInt(args, 'startMonth'),
          startYear: this.optionalInt(args, 'startYear'),
          expectedEndMonth: this.optionalInt(args, 'expectedEndMonth'),
          expectedEndYear: this.optionalInt(args, 'expectedEndYear'),
          status: this.optionalString(args, 'status'),
        });
        actions.push({
          type: 'created',
          entity: 'crop',
          id: crop.id,
          label: `Crop "${crop.cropName}" added (${crop.cropAreaValue} ${crop.cropAreaUnit})`,
        });
        return { crop };
      }

      case 'update_crop': {
        const cropId = this.requireString(args, 'cropId');
        const areaValue = this.optionalNumber(args, 'cropAreaValue');
        const areaUnitRaw = this.optionalString(args, 'cropAreaUnit');

        let areaFields = {};
        if (areaValue !== undefined || areaUnitRaw !== undefined) {
          const existing = await this.prisma.crop.findFirst({
            where: { id: cropId, zameen: { profile: { userId } } },
            select: { cropAreaValue: true, cropAreaUnit: true },
          });
          if (!existing) {
            throw new Error('Crop not found.');
          }
          const value = areaValue ?? existing.cropAreaValue;
          const unit = this.normalizeAreaUnit(
            areaUnitRaw ?? existing.cropAreaUnit,
          );
          areaFields = {
            cropAreaValue: value,
            cropAreaUnit: unit,
            cropAreaSqft: this.toSquareFeet(value, unit),
          };
        }

        const crop = await this.cropsService.update(userId, cropId, {
          cropName: this.optionalString(args, 'cropName'),
          startMonth: this.optionalInt(args, 'startMonth'),
          startYear: this.optionalInt(args, 'startYear'),
          expectedEndMonth: this.optionalInt(args, 'expectedEndMonth'),
          expectedEndYear: this.optionalInt(args, 'expectedEndYear'),
          status: this.optionalString(args, 'status'),
          ...areaFields,
        });
        actions.push({
          type: 'updated',
          entity: 'crop',
          id: crop.id,
          label: `Crop "${crop.cropName}" updated`,
        });
        return { crop };
      }

      case 'delete_crop': {
        const cropId = this.requireString(args, 'cropId');
        await this.cropsService.remove(userId, cropId);
        actions.push({
          type: 'deleted',
          entity: 'crop',
          id: cropId,
          label: 'Crop deleted',
        });
        return { deleted: true };
      }

      case 'list_expenses': {
        const cropId = this.optionalString(args, 'cropId');
        const year = this.optionalInt(args, 'year');
        const month = this.optionalInt(args, 'month');

        let expenses = cropId
          ? await this.expensesService.findByCrop(userId, cropId)
          : year !== undefined && month !== undefined
            ? await this.expensesService.findByMonth(userId, year, month)
            : await this.expensesService.findAll(userId);

        if (cropId && year !== undefined) {
          expenses = expenses.filter(
            (expense) =>
              expense.expenseYear === year &&
              (month === undefined || expense.expenseMonth === month),
          );
        }

        return {
          totalCount: expenses.length,
          expenses: expenses.slice(0, MAX_LIST_ITEMS).map((expense) => ({
            id: expense.id,
            cropId: expense.cropId,
            expenseCategory: expense.expenseCategory,
            description: expense.description,
            amount: expense.amount,
            expenseDate: expense.expenseDate.toISOString().slice(0, 10),
            paymentStatus: expense.paymentStatus,
          })),
        };
      }

      case 'create_expense': {
        const expenseDate = this.requireDate(args, 'expenseDate');
        const expense = await this.expensesService.create(userId, {
          cropId: this.requireString(args, 'cropId'),
          expenseCategory: this.requireString(args, 'expenseCategory'),
          description: this.requireString(args, 'description'),
          amount: this.requireNumber(args, 'amount'),
          expenseDate,
          expenseMonth: expenseDate.getUTCMonth() + 1,
          expenseYear: expenseDate.getUTCFullYear(),
          paymentStatus: this.optionalString(args, 'paymentStatus') ?? 'Paid',
        });
        actions.push({
          type: 'created',
          entity: 'expense',
          id: expense.id,
          label: `Expense added: ${expense.expenseCategory} — ${expense.amount}`,
        });
        return { expense };
      }

      case 'update_expense': {
        const expenseId = this.requireString(args, 'expenseId');
        const expenseDate = this.optionalDate(args, 'expenseDate');
        const expense = await this.expensesService.update(userId, expenseId, {
          expenseCategory: this.optionalString(args, 'expenseCategory'),
          description: this.optionalString(args, 'description'),
          amount: this.optionalNumber(args, 'amount'),
          paymentStatus: this.optionalString(args, 'paymentStatus'),
          ...(expenseDate
            ? {
                expenseDate,
                expenseMonth: expenseDate.getUTCMonth() + 1,
                expenseYear: expenseDate.getUTCFullYear(),
              }
            : {}),
        });
        actions.push({
          type: 'updated',
          entity: 'expense',
          id: expense.id,
          label: `Expense updated: ${expense.expenseCategory} — ${expense.amount}`,
        });
        return { expense };
      }

      case 'delete_expense': {
        const expenseId = this.requireString(args, 'expenseId');
        await this.expensesService.remove(userId, expenseId);
        actions.push({
          type: 'deleted',
          entity: 'expense',
          id: expenseId,
          label: 'Expense deleted',
        });
        return { deleted: true };
      }

      case 'list_income': {
        const cropId = this.optionalString(args, 'cropId');
        const year = this.optionalInt(args, 'year');
        const month = this.optionalInt(args, 'month');

        let incomeRecords = cropId
          ? await this.incomeService.findByCrop(userId, cropId)
          : year !== undefined && month !== undefined
            ? await this.incomeService.findByMonth(userId, year, month)
            : await this.incomeService.findAll(userId);

        if (cropId && year !== undefined) {
          incomeRecords = incomeRecords.filter(
            (income) =>
              income.incomeYear === year &&
              (month === undefined || income.incomeMonth === month),
          );
        }

        return {
          totalCount: incomeRecords.length,
          income: incomeRecords.slice(0, MAX_LIST_ITEMS).map((income) => ({
            id: income.id,
            cropId: income.cropId,
            totalAmount: income.totalAmount,
            quantity: income.quantity,
            quantityUnit: income.quantityUnit,
            rate: income.rate,
            incomeDate: income.incomeDate.toISOString().slice(0, 10),
            paymentStatus: income.paymentStatus,
            buyerName: income.buyerName,
          })),
        };
      }

      case 'create_income': {
        const incomeDate = this.requireDate(args, 'incomeDate');
        const income = await this.incomeService.create(userId, {
          cropId: this.requireString(args, 'cropId'),
          totalAmount: this.requireNumber(args, 'totalAmount'),
          incomeDate,
          incomeMonth: incomeDate.getUTCMonth() + 1,
          incomeYear: incomeDate.getUTCFullYear(),
          quantity: this.optionalNumber(args, 'quantity'),
          quantityUnit: this.optionalString(args, 'quantityUnit'),
          rate: this.optionalNumber(args, 'rate'),
          paymentStatus:
            this.optionalString(args, 'paymentStatus') ?? 'Received',
          buyerName: this.optionalString(args, 'buyerName'),
        });
        actions.push({
          type: 'created',
          entity: 'income',
          id: income.id,
          label: `Income added: ${income.totalAmount}`,
        });
        return { income };
      }

      case 'update_income': {
        const incomeId = this.requireString(args, 'incomeId');
        const incomeDate = this.optionalDate(args, 'incomeDate');
        const income = await this.incomeService.update(userId, incomeId, {
          totalAmount: this.optionalNumber(args, 'totalAmount'),
          quantity: this.optionalNumber(args, 'quantity'),
          quantityUnit: this.optionalString(args, 'quantityUnit'),
          rate: this.optionalNumber(args, 'rate'),
          paymentStatus: this.optionalString(args, 'paymentStatus'),
          buyerName: this.optionalString(args, 'buyerName'),
          ...(incomeDate
            ? {
                incomeDate,
                incomeMonth: incomeDate.getUTCMonth() + 1,
                incomeYear: incomeDate.getUTCFullYear(),
              }
            : {}),
        });
        actions.push({
          type: 'updated',
          entity: 'income',
          id: income.id,
          label: `Income updated: ${income.totalAmount}`,
        });
        return { income };
      }

      case 'delete_income': {
        const incomeId = this.requireString(args, 'incomeId');
        await this.incomeService.remove(userId, incomeId);
        actions.push({
          type: 'deleted',
          entity: 'income',
          id: incomeId,
          label: 'Income deleted',
        });
        return { deleted: true };
      }

      case 'get_report_summary': {
        return { summary: await this.reportsService.getSummary(userId) };
      }

      case 'get_crop_profitability': {
        return {
          cropProfitability:
            await this.reportsService.getCropProfitability(userId),
        };
      }

      case 'get_monthly_summary': {
        return {
          monthlySummary: await this.reportsService.getMonthlySummary(userId),
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private normalizeAreaUnit(rawUnit: string): string {
    const canonical = AREA_UNIT_ALIASES[rawUnit.trim().toLowerCase()];
    if (!canonical) {
      throw new Error(
        `Unknown area unit "${rawUnit}". Use one of: Acre, Killa, Murabba, Kanal, Marla, Square feet.`,
      );
    }
    return canonical;
  }

  private toSquareFeet(value: number, canonicalUnit: string): number {
    const factor = AREA_UNIT_TO_SQFT[canonicalUnit];
    if (!factor) {
      throw new Error(`Unknown area unit "${canonicalUnit}".`);
    }
    return value * factor;
  }

  private requireString(args: ToolArgs, key: string): string {
    const value = args[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
    throw new Error(`Missing required field: ${key}`);
  }

  private optionalString(args: ToolArgs, key: string): string | undefined {
    const value = args[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
    return undefined;
  }

  private requireNumber(args: ToolArgs, key: string): number {
    const value = this.optionalNumber(args, key);
    if (value === undefined) {
      throw new Error(`Missing required numeric field: ${key}`);
    }
    return value;
  }

  private optionalNumber(args: ToolArgs, key: string): number | undefined {
    const value = args[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return undefined;
  }

  private optionalInt(args: ToolArgs, key: string): number | undefined {
    const value = this.optionalNumber(args, key);
    return value === undefined ? undefined : Math.trunc(value);
  }

  private requireDate(args: ToolArgs, key: string): Date {
    const date = this.optionalDate(args, key);
    if (!date) {
      throw new Error(`Missing or invalid date field: ${key} (use YYYY-MM-DD)`);
    }
    return date;
  }

  private optionalDate(args: ToolArgs, key: string): Date | undefined {
    const value = args[key];
    if (typeof value !== 'string' || value.trim() === '') {
      return undefined;
    }
    const date = new Date(value.trim());
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }
    return date;
  }
}
