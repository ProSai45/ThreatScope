import { stripHTML } from "../security-utils.js";

const validTypes = new Set(["phishing", "bruteforce", "sqli", "social"]);
const validAnswers = new Set(["safe", "suspicious", "need-more-info", "unsure"]);
const unsafePatterns = [
  /\bunion\s+select\b/i,
  /\bor\s+['"]?1['"]?\s*=\s*['"]?1/i,
  /\bwaitfor\s+delay\b/i,
  /\bextractvalue\s*\(/i,
  /\bdrop\s+table\b/i,
  /<script/i,
  /\bmalware\b.*\bcode\b/i,
  /\bcredential theft instructions\b/i
];

function normaliseAnswer(answer) {
  return answer === "need-more-info" ? "unsure" : answer;
}

export function validateQuestion(question) {
  const failures = [];
  const bodyText = stripHTML(question.body || "");
  const paragraphCount = (String(question.body || "").match(/<p>/g) || []).length;
  const answer = normaliseAnswer(question.correct || question.correctAnswer);

  ["id", "type", "difficulty", "title", "sender", "senderMeta", "body", "reason", "uniqueID"].forEach(field => {
    if (!question[field]) failures.push(`Missing ${field}`);
  });

  if (!validTypes.has(question.type)) failures.push("Invalid type");
  if (!validAnswers.has(question.correct) && !validAnswers.has(question.correctAnswer)) failures.push("Invalid answer");
  if (!["safe", "suspicious", "unsure"].includes(answer)) failures.push("Invalid legacy answer");
  if (paragraphCount < 3 && bodyText.split(/[.!?]\s+/).filter(Boolean).length < 6) failures.push("Body is not detailed enough");
  if (!Array.isArray(question.takeaways) || question.takeaways.length < 3) failures.push("Missing takeaways");
  if (!Array.isArray(question.clues) || question.clues.length < 3) failures.push("Missing clues");
  if (unsafePatterns.some(pattern => pattern.test(`${question.body} ${question.reason}`))) failures.push("Unsafe offensive detail");

  return { passed: failures.length === 0, failures };
}

export function filterValidQuestions(questions = []) {
  return questions.filter(question => validateQuestion(question).passed);
}
