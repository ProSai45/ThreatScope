import { escapeHTML, safeIdPart, safeParagraphs, todayISO } from "../security-utils.js";
import { normaliseDifficulty } from "./difficulty-engine.js";
import { decisionOptions, scenarioContexts, trustedRouteFor, typeLabels } from "./question-templates.js";

function hash(text) {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value += (value << 1) + (value << 4) + (value << 7) + (value << 8) + (value << 24);
  }
  return Math.abs(value >>> 0).toString(36).toUpperCase();
}

function contextFor(index) {
  return scenarioContexts[index % scenarioContexts.length];
}

function titleFor(type, topic, answer, difficulty) {
  const prefix = {
    phishing: ["Delivery Fee Verification", "Cloud Sharing Notice", "Account Reset Message"],
    bruteforce: ["Identity Alert Review", "MFA Approval Pattern", "Access Log Decision"],
    sqli: ["Application Security Triage", "Report Export Review", "Database Error Notice"],
    social: ["Callback Verification", "Supplier Request Review", "Support Desk Interaction"]
  }[type] || ["Security Decision"];
  const label = prefix[hash(`${topic}${answer}`).charCodeAt(0) % prefix.length];
  return `${label} (${difficulty})`;
}

function paragraphsFor({ type, topic, summary, answer, difficulty, context }) {
  const [company, person, role, workflow, time] = context;
  const route = trustedRouteFor(type);
  const subtlety = difficulty === "hard"
    ? "Several details look normal, so the safest decision depends on comparing the request with the approved process."
    : difficulty === "medium"
      ? "The message is professional enough that one clue alone is not enough; the decision needs context."
      : "The warning signs are fairly visible, but the user still needs to slow down and check the route.";

  if (answer === "safe") {
    return [
      `${person}, a ${role} at ${company}, is reviewing a ${typeLabels[type] || "security"} event at ${time}. The topic behind the scenario is ${topic.toLowerCase()}.`,
      `The request appears in the normal ${workflow} workflow, uses the expected sender identity, and does not ask for passwords, MFA codes, payment cards, private keys, or unusual app permissions.`,
      `The message also gives a trusted alternative: ${route}. ${subtlety}`,
      `A cautious user may still verify, but the evidence matches the organisation's normal process and no shortcut is being forced.`,
      `The decision is safe because the source, requested action, and verification route line up with expected behaviour.`
    ];
  }

  if (answer === "need-more-info") {
    return [
      `${person}, a ${role} at ${company}, receives a realistic request connected to ${workflow}. The wider trend is ${summary.toLowerCase()}`,
      `Some details are believable: the timing makes sense, the wording is professional, and there is a plausible business reason for the request.`,
      `One important detail is missing or unconfirmed, such as a new callback number, a changed approval route, an unexpected consent page, or a sender identity that cannot be matched to the trusted record.`,
      `${subtlety} The user should not approve or reject purely from appearance; the correct move is to verify through ${route}.`,
      `The decision needs more information because acting now could either block legitimate work or approve an untrusted request.`
    ];
  }

  return [
    `${person}, a ${role} at ${company}, is asked to act on a message or alert tied to ${workflow}. The scenario reflects ${summary.toLowerCase()}`,
    `The sender looks polished and uses familiar business language, but it pushes the user toward a shortcut instead of the trusted route.`,
    `The request involves at least one risky action: approving access, entering sensitive information, trusting a hidden destination, accepting repeated MFA pressure, or bypassing a normal security ticket.`,
    `${subtlety} The best response is to stop and use ${route} rather than follow the provided link, callback, QR code, prompt, or attachment path.`,
    `The decision is suspicious because the scenario combines realism with a process bypass that could expose accounts, data, payments, or access.`
  ];
}

function cluesFor(type, answer, topic) {
  const route = trustedRouteFor(type);
  if (answer === "safe") {
    return ["Expected sender and process", "No secrets or unusual permissions requested", `Trusted verification route available: ${route}`];
  }
  if (answer === "need-more-info") {
    return ["Believable context is present", "One key source or process detail is unverified", `Resolve by using: ${route}`];
  }
  return [`Current pattern: ${topic}`, "Request bypasses a normal trusted process", "Sensitive action or access would happen before verification"];
}

export function composeQuestion(seed, options = {}) {
  const type = seed.type || "phishing";
  const difficulty = normaliseDifficulty(options.difficulty || seed.difficulty || "easy");
  const answer = options.answer || seed.correct || "suspicious";
  const index = Number(options.index || 0);
  const context = contextFor(index + hash(seed.topic || "").length);
  const topic = seed.topic || "Current defensive cyber trend";
  const sourceDate = seed.sourceDate || todayISO();
  const id = `${type.toUpperCase()}-${difficulty.toUpperCase()}-${safeIdPart(topic)}-${hash(`${topic}|${answer}|${index}|${sourceDate}`).slice(0, 8)}`;
  const paragraphs = paragraphsFor({ type, topic, summary: seed.summary || topic, answer, difficulty, context });
  const reason = answer === "safe"
    ? `This is safe because the sender, route, and requested action match the expected process for ${context[3]}.`
    : answer === "need-more-info"
      ? `This needs more information because the context is plausible, but a key detail must be verified through ${trustedRouteFor(type)} before acting.`
      : `This is suspicious because it uses a realistic ${topic.toLowerCase()} context while pushing the user away from the trusted process.`;
  const saferAction = `Use ${trustedRouteFor(type)} before approving, entering information, or changing access.`;

  return {
    id,
    type,
    difficulty,
    sourceMode: seed.sourceMode || "static-fallback",
    sourceTopic: topic,
    sourceDate,
    title: titleFor(type, topic, answer, difficulty),
    messageTitle: titleFor(type, topic, answer, difficulty),
    sender: answer === "safe" ? "Verified Internal Workflow" : type === "social" ? "Unverified Contact" : "Security Notification",
    senderMeta: answer === "safe" ? `${safeIdPart(context[0])}.trusted.example` : "verification-needed.example",
    time: context[4],
    body: `${safeParagraphs(paragraphs)}<div class="email-link">${escapeHTML(saferAction)}</div>`,
    decisionOptions,
    correct: answer,
    correctAnswer: answer === "need-more-info" ? "unsure" : answer,
    reason,
    takeaways: [
      "Real context does not automatically make a request safe.",
      "Compare the source, requested action, and verification route.",
      "Use trusted channels before taking sensitive action."
    ],
    clues: cluesFor(type, answer, topic),
    triggerTags: seed.tags || [],
    attackerGoal: answer === "suspicious" ? "Make the user bypass normal verification and take a risky action." : "No confirmed attacker action unless verification fails.",
    defensiveLesson: saferAction,
    saferAction,
    uniqueID: id,
    avatar: { phishing: "📧", bruteforce: "🔐", sqli: "🛡️", social: "🎭" }[type] || "🛡️",
    desc: "Analyze the situation and choose the safest response.",
    correctFeedback: `Correct. ${reason} ${saferAction}`,
    incorrectFeedback: `Incorrect. ${reason} ${saferAction}`,
    unsureFeedback: answer === "need-more-info" ? `Need More Info is correct. ${saferAction}` : `More investigation can help, but this scenario has enough evidence to classify it as ${answer}.`,
    aiWhat: `This is a ${typeLabels[type] || "cybersecurity"} scenario based on ${topic}.`,
    aiHow: reason,
    aiDefend: saferAction
  };
}
