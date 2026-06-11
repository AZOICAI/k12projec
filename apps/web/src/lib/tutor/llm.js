/**
 * Real LLM backend for the study tutor.
 *
 * Provider is picked from env (first key found wins):
 *   GEMINI_API_KEY  — Google AI Studio (free tier), default model gemini-2.0-flash
 *   GROQ_API_KEY    — Groq (free tier), default model llama-3.3-70b-versatile
 *   OPENAI_API_KEY  — OpenAI, default model gpt-4o-mini
 * Override the model with TUTOR_MODEL.
 */

const SYSTEM_PROMPT = `You are a friendly study tutor inside K12 Planner, helping a middle/high school student with their homework.

Rules:
- Explain concepts clearly, work through SIMILAR examples, and ask guiding questions.
- Help the student understand and make progress, step by step.
- Never write a full essay, full paragraph-for-submission, or hand over a final answer they can copy in. If asked, explain you can't do that, then help them get there themselves.
- Be encouraging and concrete. Keep replies under ~150 words unless the student asks for more depth.
- If an assignment is provided, ground your help in it. If something is unclear, ask one clarifying question.`;

function buildMessages(assignmentText, history, message) {
  const messages = [];
  const context = assignmentText?.trim()
    ? `The student is working on this assignment:\n${assignmentText.trim()}`
    : "The student hasn't picked a specific assignment — give general study help.";

  messages.push({ role: "system", content: `${SYSTEM_PROMPT}\n\n${context}` });

  for (const m of history ?? []) {
    if (!m?.text?.trim()) continue;
    messages.push({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text.trim(),
    });
  }

  messages.push({ role: "user", content: message });
  return messages;
}

async function callOpenAiCompatible({ url, apiKey, model, messages }) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tutor LLM request failed (${res.status})`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Tutor LLM returned an empty reply");
  return text;
}

async function callGemini({ apiKey, model, messages }) {
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Tutor LLM request failed (${res.status})`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Tutor LLM returned an empty reply");
  return text;
}

export function isTutorLlmConfigured() {
  return Boolean(
    process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
  );
}

/**
 * @param {{ assignmentText: string, history: Array<{role: string, text: string}>, message: string }} input
 * @returns {Promise<string>} tutor reply
 */
export async function generateTutorReply({ assignmentText, history, message }) {
  const messages = buildMessages(assignmentText, history, message);

  if (process.env.GEMINI_API_KEY) {
    return callGemini({
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.TUTOR_MODEL || "gemini-2.0-flash",
      messages,
    });
  }

  if (process.env.GROQ_API_KEY) {
    return callOpenAiCompatible({
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.TUTOR_MODEL || "llama-3.3-70b-versatile",
      messages,
    });
  }

  if (process.env.OPENAI_API_KEY) {
    return callOpenAiCompatible({
      url: "https://api.openai.com/v1/chat/completions",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.TUTOR_MODEL || "gpt-4o-mini",
      messages,
    });
  }

  throw new Error("No tutor LLM configured");
}
