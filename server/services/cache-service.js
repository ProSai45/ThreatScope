const fs = require("fs");
const path = require("path");

const cacheDir = path.resolve(__dirname, "..", ".cache");
const cacheFile = path.join(cacheDir, "questions.json");

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  } catch {
    return {};
  }
}

function writeCache(cache) {
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
}

function getCached(key) {
  const cache = readCache();
  const entry = cache[key];
  if (!entry || entry.date !== new Date().toISOString().slice(0, 10)) return null;
  return entry.questions;
}

function setCached(key, questions) {
  const cache = readCache();
  cache[key] = {
    date: new Date().toISOString().slice(0, 10),
    savedAt: new Date().toISOString(),
    questions
  };
  writeCache(cache);
}

module.exports = { getCached, setCached };
