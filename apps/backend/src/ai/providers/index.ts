import { GeminiProvider } from './gemini.provider';
import { OpenAiCompatibleProvider } from './openai-compatible.provider';
import type { LlmProvider } from './types';

export * from './types';
export { GeminiProvider } from './gemini.provider';
export { OpenAiCompatibleProvider } from './openai-compatible.provider';

/** Low temperature keeps tool calling and instruction-following reliable. */
const DEFAULT_TEMPERATURE = 0.15;

/** Known OpenAI-compatible hosts, so only an API key and model are required. */
const PRESET_BASE_URLS: Record<string, string> = {
  groq: 'https://api.groq.com/openai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  together: 'https://api.together.xyz/v1',
  ollama: 'http://localhost:11434/v1',
};

/**
 * Build the chat provider from environment configuration.
 *
 *   AI_PROVIDER   gemini (default) | groq | openrouter | together | ollama | custom
 *   AI_MODEL      model id for the chosen provider
 *   AI_API_KEY    key for the chosen provider (not needed for ollama)
 *   AI_BASE_URL   required only when AI_PROVIDER=custom
 *
 * The original GEMINI_API_KEY / GEMINI_MODEL variables still work, so existing
 * deployments keep running untouched.
 */
export function createLlmProvider(): LlmProvider | null {
  const provider = (process.env.AI_PROVIDER?.trim() || 'gemini').toLowerCase();
  const temperature = Number(process.env.AI_TEMPERATURE ?? DEFAULT_TEMPERATURE);
  const safeTemperature = Number.isFinite(temperature)
    ? temperature
    : DEFAULT_TEMPERATURE;

  if (provider === 'gemini') {
    const apiKey =
      process.env.GEMINI_API_KEY?.trim() || process.env.AI_API_KEY?.trim();
    if (!apiKey) {
      return null;
    }
    const model =
      process.env.GEMINI_MODEL?.trim() ||
      process.env.AI_MODEL?.trim() ||
      'gemini-flash-lite-latest';
    return new GeminiProvider(apiKey, model, safeTemperature);
  }

  const baseUrl =
    provider === 'custom'
      ? process.env.AI_BASE_URL?.trim()
      : PRESET_BASE_URLS[provider];

  if (!baseUrl) {
    return null;
  }

  const apiKey = process.env.AI_API_KEY?.trim() ?? '';
  // Ollama runs locally and needs no key; hosted providers do.
  if (!apiKey && provider !== 'ollama') {
    return null;
  }

  const model = process.env.AI_MODEL?.trim();
  if (!model) {
    return null;
  }

  return new OpenAiCompatibleProvider(
    baseUrl,
    apiKey,
    model,
    safeTemperature,
    provider,
  );
}
