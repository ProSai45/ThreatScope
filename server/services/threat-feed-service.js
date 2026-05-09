const fallbackTopics = [
  { type: "phishing", topic: "QR phishing in delivery and payment messages", summary: "Public guidance continues to warn about QR codes hiding untrusted destinations.", tags: ["technical", "urgency"] },
  { type: "phishing", topic: "Cloud document sharing and consent prompts", summary: "Defenders warn users to verify document shares and app-consent requests through trusted routes.", tags: ["credentials", "technical"] },
  { type: "bruteforce", topic: "MFA fatigue and repeated push prompts", summary: "Identity attacks may pressure users to approve repeated MFA notifications.", tags: ["credentials", "urgency"] },
  { type: "bruteforce", topic: "Password spraying across many accounts", summary: "Low-volume attempts across many users can avoid obvious lockouts.", tags: ["credentials", "technical"] },
  { type: "sqli", topic: "Database error leakage in application workflows", summary: "Detailed database errors can indicate unsafe query handling and need defensive triage.", tags: ["technical"] },
  { type: "sqli", topic: "Unsafe report export and data-access shortcuts", summary: "Requests to bypass approved access controls are risky even when framed as reporting work.", tags: ["technical", "authority"] },
  { type: "social", topic: "Deepfake voice and callback verification", summary: "Voice realism can increase pressure, but trusted callback routes remain essential.", tags: ["authority", "urgency"] },
  { type: "social", topic: "Supplier bank-detail change scams", summary: "Invoice redirection fraud often changes the trusted verification route.", tags: ["authority", "social"] }
];

const sources = [
  "https://www.cisa.gov/news-events/cybersecurity-advisories.xml",
  "https://www.ncsc.gov.uk/api/1/services/v1/news-rss-feed.xml"
];

function normaliseType(type) {
  return { auth: "bruteforce", authentication: "bruteforce", sql: "sqli", web: "sqli" }[type] || type;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "ThreatScope/1.0 defensive education" } });
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function extractFeedItems(xml) {
  return [...xml.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?(?:<description><!\[CDATA\[(.*?)\]\]><\/description>)?/gi)]
    .slice(0, 8)
    .map(match => ({
      topic: match[1].replace(/<[^>]+>/g, "").trim(),
      summary: (match[2] || match[1]).replace(/<[^>]+>/g, "").trim(),
      sourceMode: "live"
    }));
}

function classifyTopic(item) {
  const text = `${item.topic} ${item.summary}`.toLowerCase();
  if (/phish|qr|email|scam|invoice|delivery|credential/.test(text)) return { ...item, type: "phishing", tags: ["credentials", "urgency"] };
  if (/password|mfa|identity|login|account|authentication/.test(text)) return { ...item, type: "bruteforce", tags: ["credentials", "technical"] };
  if (/sql|database|web application|injection|server/.test(text)) return { ...item, type: "sqli", tags: ["technical"] };
  if (/social|fraud|impersonat|voice|supplier|payment/.test(text)) return { ...item, type: "social", tags: ["social", "authority"] };
  return { ...item, type: "phishing", tags: ["technical"] };
}

async function fetchThreatTopics(type = "mixed") {
  const normalised = normaliseType(type);
  const live = [];

  await Promise.allSettled(sources.map(async source => {
    const xml = await fetchText(source);
    live.push(...extractFeedItems(xml).map(classifyTopic));
  }));

  const combined = live.length ? live : fallbackTopics;
  if (normalised === "mixed" || normalised === "final") return combined;
  return combined.filter(topic => topic.type === normalised).concat(fallbackTopics.filter(topic => topic.type === normalised));
}

module.exports = { fetchThreatTopics, fallbackTopics };
