import { Injectable } from '@nestjs/common';
import { ChatMessageDto } from './dto/chat-message.dto';

type GeminiPart = {
  text?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
};

const SYSTEM_PROMPT = `
You are Zamindar AI, the assistant inside Zamindar Plus.
Only answer questions about Zamindar Plus and farm ledger work: profiles, zameen, crops, expenses, income, reports, account settings, record keeping, profit/loss, and practical farming record suggestions.
If the user asks about anything outside Zamindar Plus or farm record management, politely say you can only help with Zamindar Plus and farm ledger questions.
Keep answers concise, practical, and action-oriented. Do not claim you changed records unless the user uses the app controls.
`;

@Injectable()
export class AiService {
  async chat(chatMessageDto: ChatMessageDto) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return {
        reply: this.createLocalReply(chatMessageDto.message),
      };
    }

    const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: SYSTEM_PROMPT,
                },
              ],
            },
            contents: [
              ...(chatMessageDto.history ?? []).map((message) => ({
                role: message.role === 'assistant' ? 'model' : 'user',
                parts: [
                  {
                    text: message.text,
                  },
                ],
              })),
              {
                role: 'user',
                parts: [
                  {
                    text: chatMessageDto.message,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: 520,
            },
          }),
        },
      );

      if (!response.ok) {
        return {
          reply: this.createLocalReply(chatMessageDto.message),
        };
      }

      const data = (await response.json()) as GeminiResponse;
      const reply =
        data.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? '')
          .join('')
          .trim() || this.createLocalReply(chatMessageDto.message);

      return {
        reply,
      };
    } catch {
      return {
        reply: this.createLocalReply(chatMessageDto.message),
      };
    }
  }

  private createLocalReply(message: string) {
    const normalizedMessage = message.toLowerCase();
    const projectKeywords = [
      'zamindar',
      'profile',
      'zameen',
      'land',
      'crop',
      'expense',
      'income',
      'report',
      'profit',
      'loss',
      'ledger',
      'farm',
      'setting',
      'account',
      'record',
    ];

    if (
      !projectKeywords.some((keyword) => normalizedMessage.includes(keyword))
    ) {
      return 'I can only help with Zamindar Plus and farm ledger questions. Ask me about profiles, zameen, crops, expenses, income, reports, or account settings.';
    }

    return 'For Zamindar Plus, keep the workflow simple: create a profile, add zameen under it, create crop cycles, then record expenses and income against each crop. Use Reports to compare income, expenses, net profit, and monthly movement. Tell me which section you are working on and I can guide the next step.';
  }
}
