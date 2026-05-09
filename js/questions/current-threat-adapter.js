import { fallbackCurrentTopics } from "../data/fallback-current-topics.js";

const typeAliases = {
  auth: "bruteforce",
  authentication: "bruteforce",
  sql: "sqli",
  web: "sqli",
  mixed: "mixed"
};

export function normaliseType(type = "phishing") {
  const key = String(type).toLowerCase();
  return typeAliases[key] || key;
}

export function topicsForType(type = "mixed", liveTopics = []) {
  const normalisedType = normaliseType(type);
  const combined = [...liveTopics, ...fallbackCurrentTopics]
    .map(topic => ({
      ...topic,
      type: normaliseType(topic.type || normalisedType),
      topic: topic.topic || topic.title || "Current defensive cyber trend",
      summary: topic.summary || topic.description || topic.topic || "A current cyber-awareness pattern.",
      tags: Array.isArray(topic.tags) ? topic.tags : []
    }));

  if (normalisedType === "mixed" || normalisedType === "final") return combined;
  return combined.filter(topic => topic.type === normalisedType);
}
