import { normaliseType } from "../questions/current-threat-adapter.js";

export async function fetchLiveQuestions({ type = "phishing", difficulty = "easy", count = 5 } = {}) {
  const params = new URLSearchParams({
    type: normaliseType(type),
    difficulty,
    count: String(count)
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(`/api/questions?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`Question API returned ${response.status}`);
    const payload = await response.json();
    return Array.isArray(payload.questions) ? payload.questions : [];
  } finally {
    clearTimeout(timeout);
  }
}
