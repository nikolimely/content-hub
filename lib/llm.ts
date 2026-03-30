/**
 * Unified LLM streaming helper.
 * Routes to Anthropic or OpenAI based on model string prefix.
 *   claude-*  → Anthropic Messages API
 *   gpt-*     → OpenAI Chat Completions API
 */

export type LLMModel =
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5-20251001"
  | "gpt-4o"
  | "gpt-4o-mini";

export const MODELS: { value: LLMModel; label: string; provider: "anthropic" | "openai" }[] = [
  { value: "claude-sonnet-4-6",        label: "Claude Sonnet 4.6",  provider: "anthropic" },
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5",   provider: "anthropic" },
  { value: "gpt-4o",                   label: "GPT-4o",             provider: "openai" },
  { value: "gpt-4o-mini",              label: "GPT-4o Mini",        provider: "openai" },
];

export async function streamText(
  model: string,
  prompt: string,
  maxTokens: number,
  onChunk: (text: string) => void
): Promise<void> {
  if (model.startsWith("claude-")) {
    await streamAnthropic(model, prompt, maxTokens, onChunk);
  } else {
    await streamOpenAI(model, prompt, maxTokens, onChunk);
  }
}

async function streamAnthropic(
  model: string,
  prompt: string,
  maxTokens: number,
  onChunk: (text: string) => void
): Promise<void> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") continue;
      try {
        const evt = JSON.parse(raw);
        if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
          onChunk(evt.delta.text);
        }
      } catch {}
    }
  }
}

async function streamOpenAI(
  model: string,
  prompt: string,
  maxTokens: number,
  onChunk: (text: string) => void
): Promise<void> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") continue;
      try {
        const evt = JSON.parse(raw);
        const text = evt.choices?.[0]?.delta?.content;
        if (text) onChunk(text);
      } catch {}
    }
  }
}
