const { fallbackTopics } = require("./threat-feed-service");

const plans = {
  easy: ["suspicious", "safe", "suspicious", "need-more-info"],
  medium: ["suspicious", "safe", "suspicious", "need-more-info", "suspicious", "safe"],
  hard: ["suspicious", "need-more-info", "safe", "suspicious", "suspicious", "need-more-info", "safe"],
  final: ["suspicious", "safe", "need-more-info"]
};

const routes = {
  phishing: "open the original account, app, or saved bookmark instead of using the message link",
  bruteforce: "review identity-provider logs and contact the user through the helpdesk route",
  sqli: "triage through the security ticket and logs without testing live exploit strings",
  social: "verify through the directory, procurement record, or host contact already on file"
};

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function idFor(parts) {
  let hash = 0;
  const text = parts.join("|");
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).toUpperCase();
}

function buildQuestion(topic, difficulty, answer, index) {
  const route = routes[topic.type] || routes.phishing;
  const id = `${topic.type.toUpperCase()}-${difficulty.toUpperCase()}-${idFor([topic.topic, difficulty, answer, index])}`;
  const paragraphs = answer === "safe"
    ? [
      `A learner is reviewing a ${topic.type} scenario linked to ${topic.topic}.`,
      `The message or event arrives through the expected workflow and gives a trusted alternative route.`,
      `It does not ask for passwords, MFA codes, payment-card details, private keys, broad app consent, or a process bypass.`,
      `The request may still look unusual at first, but the source and route match the normal procedure.`,
      `The safest decision is to treat it as safe while still using the trusted route if there is any doubt.`
    ]
    : answer === "need-more-info"
      ? [
        `A learner is reviewing a realistic ${topic.type} scenario linked to ${topic.topic}.`,
        `Some details are believable and match the user's current work, so rejecting it immediately may interrupt a legitimate task.`,
        `A key detail is still unverified, such as a new callback number, changed approval path, unfamiliar sender, or unexpected consent request.`,
        `The learner should not approve, enter information, or change access until the request is checked through ${route}.`,
        `The safest decision is Need More Info because evidence is incomplete and the next step is verification.`
      ]
      : [
        `A learner is reviewing a realistic ${topic.type} scenario linked to ${topic.topic}.`,
        `The message is polished and includes believable context from a current defensive trend: ${topic.summary}`,
        `The risky part is that it pushes the user away from the trusted route and toward a link, QR code, prompt, callback, attachment, or approval shortcut.`,
        `The user is asked to act before verifying source, process, and consequence.`,
        `The safest decision is suspicious because a normal-looking request is being used to bypass the approved process.`
      ];
  const reason = answer === "safe"
    ? "The source, request, and verification route match expected process and no sensitive shortcut is requested."
    : answer === "need-more-info"
      ? `The context is plausible, but the learner must verify through ${route} before acting.`
      : `The request is suspicious because it uses ${topic.topic.toLowerCase()} to make a risky shortcut feel normal.`;

  return {
    id,
    type: topic.type,
    difficulty,
    sourceMode: topic.sourceMode || "live",
    sourceTopic: topic.topic,
    sourceDate: new Date().toISOString().slice(0, 10),
    title: `${topic.topic} Decision`,
    messageTitle: `${topic.topic} Decision`,
    sender: answer === "safe" ? "Verified Workflow" : "Unverified Security Notice",
    senderMeta: answer === "safe" ? "trusted-process.example" : "verification-needed.example",
    time: "Today",
    body: paragraphs.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join("") + `<div class="email-link">${escapeHTML(route)}</div>`,
    decisionOptions: ["safe", "suspicious", "need-more-info"],
    correct: answer,
    correctAnswer: answer === "need-more-info" ? "unsure" : answer,
    reason,
    takeaways: ["Check source, request, and route.", "Use trusted verification before sensitive action.", "Professional wording is not proof of safety."],
    clues: ["Review the trusted route", "Look for process bypass", "Check whether sensitive action is requested"],
    triggerTags: topic.tags || [],
    attackerGoal: answer === "suspicious" ? "Make the learner take a risky action before verification." : "No confirmed attacker goal unless verification fails.",
    defensiveLesson: `Use ${route}.`,
    saferAction: `Use ${route}.`,
    uniqueID: id,
    avatar: { phishing: "📧", bruteforce: "🔐", sqli: "🛡️", social: "🎭" }[topic.type] || "🛡️",
    desc: "Analyze the situation and choose the safest response.",
    correctFeedback: `Correct. ${reason}`,
    incorrectFeedback: `Incorrect. ${reason}`,
    unsureFeedback: answer === "need-more-info" ? `Need More Info is correct. Use ${route}.` : `More checking can help, but this scenario has enough evidence to classify it as ${answer}.`,
    aiWhat: `This is a defensive awareness scenario about ${topic.topic}.`,
    aiHow: reason,
    aiDefend: `Use ${route}.`
  };
}

function generateQuestions({ type, difficulty = "easy", count = 5, topics = [] }) {
  const usableTopics = topics.length ? topics : fallbackTopics;
  const plan = plans[difficulty] || plans.easy;
  return Array.from({ length: count }, (_, index) => {
    const topic = usableTopics[index % usableTopics.length];
    return buildQuestion(topic, difficulty, plan[index % plan.length], index);
  });
}

module.exports = { generateQuestions };
