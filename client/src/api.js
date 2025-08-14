const DEFAULT_MODEL = "gpt-4o-mini";
// All API calls are proxied through the backend at /api to keep keys server-side
const API_BASE = "/api";

// Inactivity timeout so stalled network connections don't hang forever
const STREAM_TIMEOUT_MS = 30000; // 30 seconds per chunk
async function readWithTimeout(reader, timeout = STREAM_TIMEOUT_MS) {
  let timeoutId;
  try {
    return await Promise.race([
      reader.read(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Stream timeout")), timeout);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ---- Fetch wrapper that yields tokens as they arrive ----*/
export async function* streamCompletion(messages, signal, model) {
  const modelName = model || DEFAULT_MODEL;
  const res = await fetch(`${API_BASE}/openai/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: modelName, stream: true, messages }),
    signal,
  });

  // Surface HTTP errors immediately
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${errorText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await readWithTimeout(reader);
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop(); // keep incomplete line for next read

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.replace("data:", "").trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload);
          const token = json.choices?.[0]?.delta?.content;
          if (token) yield token;
        } catch (_) {
          /* skip malformed line */
        }
      }
    }
  } catch (err) {
    try {
      reader.cancel();
    } catch (_) {
      /* swallow */
    }
    throw err;
  }
}

export async function* streamAnthropicCompletion(messages, signal, model, system) {
  const res = await fetch(`${API_BASE}/anthropic/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system,
      messages,
      stream: true,
      max_tokens: 4096,
    }),
    signal,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${errorText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await readWithTimeout(reader);
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop(); // keep incomplete line for next read

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.replace("data:", "").trim();
        if (!payload) continue;
        try {
          const json = JSON.parse(payload);
          if (json.type === "content_block_delta") {
            const token = json.delta?.text;
            if (token) yield token;
          } else if (json.type === "error") {
            console.error(`Anthropic API error: ${json.error.message}`);
            yield `[ERROR: ${json.error.message}]`;
            return;
          }
        } catch (_) {
          /* skip malformed line */
        }
      }
    }
  } catch (err) {
    try {
      reader.cancel();
    } catch (_) {
      /* swallow */
    }
    throw err;
  }
}

/* ---- Fetch wrapper that yields tokens as they arrive ----*/
export async function* streamGeminiCompletion(messages, signal, model) {
  const modelName = model || "gemini-pro";
  
  // Get the last user message
  const lastMessage = messages[messages.length - 1];
  
  // Prepare the request body
  const contents = {
    contents: [{
      parts: [{ text: lastMessage.content }]
    }]
  };

  const endpoint = `${API_BASE}/gemini/${modelName}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contents),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const streamReader = response.body.getReader();
  const textDecoder = new TextDecoder();
  let textBuffer = "";

  try {
    while (true) {
      const { value, done } = await readWithTimeout(reader);
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.replace("data:", "").trim();
        if (payload === "[DONE]") return;
        if (!payload) continue;
        try {
          const json = JSON.parse(payload);
          const token = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (token) yield token;
        } catch (_) {
          /* ignore malformed */
        }
      }
    }
  } catch (err) {
    try {
      reader.cancel();
    } catch (_) {
      /* swallow */
    }
    throw err;
  }
} 