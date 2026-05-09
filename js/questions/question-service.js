import { fetchLiveQuestions } from "../api/live-threat-client.js";
import { desiredCount, normaliseDifficulty } from "./difficulty-engine.js";
import { normaliseType } from "./current-threat-adapter.js";
import { generateStaticFinalAssessment, generateStaticQuestions } from "./static-question-bank.js";
import { filterValidQuestions } from "./question-validator.js";
import { dedupeQuestions } from "./question-deduper.js";
import { readDailyQuestionCache, writeDailyQuestionCache } from "./question-cache.js";

function shuffle(list = []) {
  return [...list]
    .map(item => ({ item, order: crypto.getRandomValues(new Uint32Array(1))[0] }))
    .sort((a, b) => a.order - b.order)
    .map(entry => entry.item);
}

function enough(questions, count) {
  return Array.isArray(questions) && questions.length >= count;
}

async function buildQuestionSet(type, difficulty, count) {
  const normalisedType = normaliseType(type);
  const normalisedDifficulty = normaliseDifficulty(difficulty);
  const targetCount = desiredCount(normalisedDifficulty, count);
  const cached = filterValidQuestions(readDailyQuestionCache(normalisedType, normalisedDifficulty));

  if (enough(cached, targetCount)) {
    return shuffle(dedupeQuestions(cached, { allowRecent: true })).slice(0, targetCount);
  }

  try {
    const live = filterValidQuestions(await fetchLiveQuestions({
      type: normalisedType,
      difficulty: normalisedDifficulty,
      count: targetCount
    }));

    if (live.length) {
      writeDailyQuestionCache(normalisedType, normalisedDifficulty, live);
      const merged = dedupeQuestions([...live, ...cached], { allowRecent: true });
      if (enough(merged, targetCount)) return shuffle(merged).slice(0, targetCount);
    }
  } catch (error) {
    console.info("ThreatScope live questions unavailable; using cache or static fallback.", error.message);
  }

  const fallback = generateStaticQuestions(normalisedType, normalisedDifficulty, targetCount * 2);
  return shuffle(dedupeQuestions([...cached, ...fallback], { allowRecent: true })).slice(0, targetCount);
}

export async function getQuestionsForAttack(type, difficulty = "easy", options = {}) {
  return buildQuestionSet(type, difficulty, options.count);
}

export async function getFinalAssessmentQuestions(options = {}) {
  const count = desiredCount("final", options.count || 12);
  const types = ["phishing", "bruteforce", "sqli", "social"];
  const liveByType = await Promise.all(types.map(type => buildQuestionSet(type, "final", Math.ceil(count / types.length))));
  const mixed = shuffle(liveByType.flat()).slice(0, count);
  if (mixed.length >= count) return mixed;
  return shuffle([...mixed, ...generateStaticFinalAssessment(count)]).slice(0, count);
}

export const QuestionService = {
  getQuestionsForAttack,
  getFinalAssessmentQuestions
};
