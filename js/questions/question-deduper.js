import { readJSON, writeJSON } from "../storage.js";
import { stripHTML } from "../security-utils.js";

const recentKey = "threatscope_recent_question_fingerprints";

export function fingerprintQuestion(question) {
  const text = [
    question.type,
    question.title,
    question.sender,
    question.attackerGoal,
    stripHTML(question.body || "")
  ].join("|").toLowerCase().replace(/\s+/g, " ").trim();

  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

export function dedupeQuestions(questions = [], options = {}) {
  const recent = new Set(readJSON(recentKey, []));
  const current = new Set();
  const allowRecent = options.allowRecent === true;
  const selected = [];

  questions.forEach(question => {
    const fingerprint = fingerprintQuestion(question);
    if (current.has(fingerprint)) return;
    if (!allowRecent && recent.has(fingerprint)) return;
    current.add(fingerprint);
    selected.push({ ...question, fingerprint });
  });

  writeJSON(recentKey, [...recent, ...current].slice(-800));
  return selected;
}
