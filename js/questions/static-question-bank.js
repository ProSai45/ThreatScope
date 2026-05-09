import { fallbackCurrentTopics } from "../data/fallback-current-topics.js";
import { composeQuestion } from "./question-generator.js";
import { answerPlans } from "./question-templates.js";
import { desiredCount, normaliseDifficulty } from "./difficulty-engine.js";
import { normaliseType, topicsForType } from "./current-threat-adapter.js";

export function generateStaticQuestions(type, difficulty = "easy", count) {
  const normalisedType = normaliseType(type);
  const normalisedDifficulty = normaliseDifficulty(difficulty);
  const total = desiredCount(normalisedDifficulty, count);
  const topics = topicsForType(normalisedType, fallbackCurrentTopics);
  const plan = answerPlans[normalisedDifficulty] || answerPlans.easy;

  return Array.from({ length: total }, (_, index) => {
    const seed = topics[index % topics.length] || fallbackCurrentTopics[index % fallbackCurrentTopics.length];
    return composeQuestion(
      { ...seed, sourceMode: "static-fallback" },
      { difficulty: normalisedDifficulty, answer: plan[index % plan.length], index }
    );
  });
}

export function generateStaticFinalAssessment(count = 12) {
  const types = ["phishing", "bruteforce", "sqli", "social"];
  return types.flatMap(type =>
    generateStaticQuestions(type, "final", Math.ceil(count / types.length)).slice(0, 3)
  ).slice(0, count);
}
