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

type ChatToolCall = {
  id?: string;
  type?: string;
  function?: { name?: string; arguments?: string };
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: { content?: string | null; tool_calls?: ChatToolCall[] };
  }>;
};

type ChatMessage = Record<string, unknown>;

/**
 * The tool schemas are written in Gemini's shape (uppercase types). The
 * OpenAI-style APIs expect standard JSON Schema, so lower-case the types.
 */
function toJsonSchema(declaration: FunctionDeclaration) {
  const parameters = declaration.parameters;

  if (!parameters) {
    return { type: 'object', properties: {} };
  }

  const properties: Record<string, unknown> = {};
  for (const [key, property] of Object.entries(parameters.properties)) {
    properties[key] = {
      type:
        property.type.toLowerCase() === 'integer'
          ? 'integer'
          : property.type.toLowerCase() === 'number'
            ? 'number'
            : 'string',
      ...(property.description ? { description: property.description } : {}),
      ...(property.enum ? { enum: property.enum } : {}),
    };
  }

  return {
    type: 'object',
    properties,
    ...(parameters.required?.length ? { required: parameters.required } : {}),
  };
}

/**
 * Any OpenAI-compatible chat-completions endpoint that supports tool calling:
 * Groq, OpenRouter, Together, DeepInfra, or a self-hosted Ollama / vLLM.
 */
export class OpenAiCompatibleProvider implements LlmProvider {
  readonly name: string;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly model: string,
    private readonly temperature: number,
    label = 'openai-compatible',
  ) {
    this.name = label;
  }

  private toMessages(
    systemPrompt: string,
    messages: ConversationMessage[],
  ): ChatMessage[] {
    const out: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

    for (const message of messages) {
      if (message.role === 'user') {
        out.push({ role: 'user', content: message.text });
        continue;
      }

      if (message.role === 'assistant') {
        const hasToolCalls = Boolean(message.toolCalls?.length);
        out.push({
          role: 'assistant',
          // The spec expects null content on a tool-call turn; some providers
          // reject an empty string there.
          content: message.text || (hasToolCalls ? null : ''),
          ...(message.toolCalls?.length
            ? {
                tool_calls: message.toolCalls.map((call, index) => ({
                  id: call.id ?? `call_${index}`,
                  type: 'function',
                  function: {
                    name: call.name,
                    arguments: JSON.stringify(call.args ?? {}),
                  },
                })),
              }
            : {}),
        });
        continue;
      }

      out.push({
        role: 'tool',
        tool_call_id: message.toolCallId ?? `call_${message.name}`,
        content: JSON.stringify(message.result),
      });
    }

    return out;
  }

  async complete({
    systemPrompt,
    messages,
    tools,
  }: CompleteInput): Promise<AgentTurn> {
    const response = await fetch(
      `${this.baseUrl.replace(/\/$/, '')}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: this.model,
          messages: this.toMessages(systemPrompt, messages),
          tools: tools.map((declaration) => ({
            type: 'function',
            function: {
              name: declaration.name,
              description: declaration.description,
              parameters: toJsonSchema(declaration),
            },
          })),
          tool_choice: 'auto',
          temperature: this.temperature,
          max_tokens: 1024,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new LlmRequestError(
        `${this.name} request failed with status ${response.status}: ${errorText.slice(0, 300)}`,
        response.status,
        parseRetryAfterMs(response.headers, errorText),
      );
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const message = data.choices?.[0]?.message;

    const toolCalls: AgentToolCall[] = (message?.tool_calls ?? [])
      .filter((call) => call.function?.name)
      .map((call) => {
        let args: Record<string, unknown> = {};
        try {
          const parsed: unknown = call.function?.arguments
            ? JSON.parse(call.function.arguments)
            : {};
          // Models sometimes send the literal "null" for a no-argument tool.
          args =
            parsed && typeof parsed === 'object' && !Array.isArray(parsed)
              ? (parsed as Record<string, unknown>)
              : {};
        } catch {
          args = {};
        }
        return { id: call.id, name: call.function!.name!, args };
      });

    return {
      text: (message?.content ?? '').trim(),
      toolCalls,
    };
  }
}
