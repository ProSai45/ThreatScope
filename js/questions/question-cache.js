import { readJSON, writeJSON } from "../storage.js";
import { todayISO } from "../security-utils.js";

function cacheKey(type, difficulty, date = todayISO()) {
  return `threatscope_daily_question_cache_${date}_${type}_${difficulty}`;
}

export function readDailyQuestionCache(type, difficulty) {
  const entry = readJSON(cacheKey(type, difficulty), null);
  if (!entry || entry.date !== todayISO() || !Array.isArray(entry.questions)) return [];
  return entry.questions.map(question => ({ ...question, sourceMode: question.sourceMode === "live" ? "cached-live" : question.sourceMode }));
}

export function writeDailyQuestionCache(type, difficulty, questions) {
  writeJSON(cacheKey(type, difficulty), {
    date: todayISO(),
    savedAt: new Date().toISOString(),
    questions
  });
}
