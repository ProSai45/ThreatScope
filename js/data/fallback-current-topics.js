export const fallbackCurrentTopics = [
  {
    type: "phishing",
    topic: "QR phishing in delivery and payment notifications",
    summary: "Scams increasingly combine real delivery context with QR codes that hide the destination URL.",
    tags: ["urgency", "credentials", "technical"]
  },
  {
    type: "phishing",
    topic: "Fake cloud document sharing alerts",
    summary: "Professional-looking cloud sharing messages request sign-in or app consent outside the trusted route.",
    tags: ["authority", "credentials", "technical"]
  },
  {
    type: "bruteforce",
    topic: "MFA fatigue and push approval pressure",
    summary: "Attackers use repeated push notifications after a password is known to pressure users into approval.",
    tags: ["urgency", "credentials"]
  },
  {
    type: "bruteforce",
    topic: "Low-and-slow password spraying",
    summary: "Distributed login attempts avoid lockouts by trying a small number of guesses across many accounts.",
    tags: ["technical", "credentials"]
  },
  {
    type: "sqli",
    topic: "Detailed database errors in web applications",
    summary: "Unexpected database error detail can reveal unsafe query handling and should be treated as a defensive signal.",
    tags: ["technical"]
  },
  {
    type: "sqli",
    topic: "Unsafe report filters and database-backed exports",
    summary: "Risk appears when a workflow asks staff to paste database credentials or bypass normal access controls.",
    tags: ["technical", "authority"]
  },
  {
    type: "social",
    topic: "Deepfake voice callback pressure",
    summary: "Voice realism can be paired with email follow-ups and urgency to make staff skip trusted verification.",
    tags: ["authority", "urgency", "social"]
  },
  {
    type: "social",
    topic: "Fake IT support and remote access requests",
    summary: "Support impersonation often asks users to approve access, reveal codes, or install tools outside the ticket flow.",
    tags: ["authority", "credentials", "social"]
  },
  {
    type: "social",
    topic: "Invoice redirection and supplier bank-detail changes",
    summary: "Payment fraud often looks routine but changes callback details, bank information, or approval paths.",
    tags: ["authority", "urgency", "social"]
  },
  {
    type: "phishing",
    topic: "Data breach notification scams",
    summary: "Attackers use fear after public breach news to push users into fake reset portals.",
    tags: ["urgency", "credentials"]
  }
];
