import type { FunctionDeclaration } from '../agent-tools';

/** A tool the model asked to run. */
export type AgentToolCall = {
  /** Provider-supplied id, echoed back with the result when the API needs it. */
  id?: string;
  name: string;
  args: Record<string, unknown>;
};

/** One turn produced by the model. */
export type AgentTurn = {
  text: string;
  toolCalls: AgentToolCall[];
  /**
   * Provider-specific payload for this turn. Gemini requires the original
   * parts (including thought signatures) to be echoed back on the next call,
   * so the loop stores it and hands it straight back.
   */
  raw?: unknown;
};

export type ConversationMessage =
  | { role: 'user'; text: string }
  | {
      role: 'assistant';
      text?: string;
      toolCalls?: AgentToolCall[];
      raw?: unknown;
    }
  | {
      role: 'tool';
      toolCallId?: string;
      name: string;
      result: Record<string, unknown>;
    };

export type CompleteInput = {
  systemPrompt: string;
  messages: ConversationMessage[];
  tools: FunctionDeclaration[];
};

/**
 * A chat model that supports tool calling. Implementations translate the
 * shared conversation shape into whatever wire format the vendor expects.
 */
export interface LlmProvider {
  /** Human-readable name, used in logs. */
  readonly name: string;
  complete(input: CompleteInput): Promise<AgentTurn>;
}

/** Thrown so the service can map failures to user-facing error codes. */
export class LlmRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /**
     * How long the provider asked us to wait, when it says so. Per-minute
     * limits report a few seconds and are worth waiting out; daily quotas
     * report much longer and are not.
     */
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'LlmRequestError';
  }

  /** 5xx usually clears on its own after a short backoff. */
  get isTransient() {
    return [500, 502, 503, 504].includes(this.status);
  }

  get isRateLimit() {
    return this.status === 429;
  }
}

/**
 * Read the wait a provider asks for, from the `retry-after` header or from
 * phrasing like "Please try again in 5.73s" in the error body.
 */
export function parseRetryAfterMs(
  headers: Headers,
  body: string,
): number | undefined {
  const header = headers.get('retry-after');
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) {
      return seconds * 1000;
    }
  }

  const match = /try again in ([\d.]+)\s*(ms|s|m)\b/i.exec(body);
  if (match) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) {
      const unit = match[2].toLowerCase();
      return unit === 'ms'
        ? value
        : unit === 'm'
          ? value * 60_000
          : value * 1000;
    }
  }

  return undefined;
}
