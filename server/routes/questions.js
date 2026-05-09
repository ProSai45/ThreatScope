const { getCached, setCached } = require("../services/cache-service");
const { fetchThreatTopics } = require("../services/threat-feed-service");
const { filterSafeTopics } = require("../services/source-safety-service");
const { generateQuestions } = require("../services/question-ai-service");

function sendJSON(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

async function handleQuestionsRoute(req, res, url) {
  try {
    const type = url.searchParams.get("type") || "phishing";
    const difficulty = url.searchParams.get("difficulty") || "easy";
    const count = Math.min(24, Math.max(1, Number(url.searchParams.get("count") || 5)));
    const cacheKey = `${new Date().toISOString().slice(0, 10)}:${type}:${difficulty}:${count}`;
    const cached = getCached(cacheKey);

    if (cached) {
      sendJSON(res, 200, { source: "cached-live", questions: cached });
      return;
    }

    const topics = filterSafeTopics(await fetchThreatTopics(type));
    const questions = generateQuestions({ type, difficulty, count, topics });
    setCached(cacheKey, questions);
    sendJSON(res, 200, { source: "live", questions });
  } catch (error) {
    sendJSON(res, 200, { source: "static-fallback", error: "live-question-generation-unavailable", questions: [] });
  }
}

module.exports = { handleQuestionsRoute };
