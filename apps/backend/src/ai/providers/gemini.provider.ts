import type { FunctionDeclaration } from '../agent-tools';
import {
  LlmRequestError,
  parseRetryAfterMs,
  type AgentToolCall,
  type AgentTurn,
  type CompleteInput,
  type ConversationMessage,
  type LlmProvider,
} from './types';

type GeminiPart = {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
};

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
};

type RequestPart = Record<string, unknown>;
type RequestContent = { role: 'user' | 'model'; parts: RequestPart[] };

/** Google Gemini (generativelanguage.googleapis.com). */
export class GeminiProvider implements LlmProvider {
  readonly name = 'gemini';

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly temperature: number,
  ) {}

  private toContents(messages: ConversationMessage[]): RequestContent[] {
    const contents: RequestContent[] = [];

    for (const message of messages) {
      if (message.role === 'user') {
        contents.push({ role: 'user', parts: [{ text: message.text }] });
        continue;
      }

      if (message.role === 'assistant') {
        // Echo the original parts so thought signatures survive the round trip.
        const parts = Array.isArray(message.raw)
          ? (message.raw as RequestPart[])
          : [{ text: message.text ?? '' }];
        contents.push({ role: 'model', parts });
        continue;
      }

      // Gemini carries tool results as a user turn of functionResponse parts.
      const last = contents[contents.length - 1];
      const part: RequestPart = {
        functionResponse: { name: message.name, response: message.result },
      };

      if (
        last &&
        last.role === 'user' &&
        last.parts.every((p) => 'functionResponse' in p)
      ) {
        last.parts.push(part);
      } else {
        contents.push({ role: 'user', parts: [part] });
      }
    }

    return contents;
  }

  async complete({
    systemPrompt,
    messages,
    tools,
  }: CompleteInput): Promise<AgentTurn> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: this.toContents(messages),
          tools: [
            { functionDeclarations: tools satisfies FunctionDeclaration[] },
          ],
          generationConfig: {
            temperature: this.temperature,
            maxOutputTokens: 1024,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new LlmRequestError(
        `Gemini request failed with status ${response.status}: ${errorText.slice(0, 300)}`,
        response.status,
        parseRetryAfterMs(response.headers, errorText),
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const parts = data.candidates?.[0]?.content?.parts ?? [];

    const toolCalls: AgentToolCall[] = parts
      .filter((part) => part.functionCall?.name)
      .map((part) => ({
        name: part.functionCall!.name,
        args: part.functionCall!.args ?? {},
      }));

    return {
      text: parts
        .map((part) => part.text ?? '')
        .join('')
        .trim(),
      toolCalls,
      raw: parts,
    };
  }
}
