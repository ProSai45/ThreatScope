export const decisionOptions = ["safe", "suspicious", "need-more-info"];

export const scenarioContexts = [
  ["Northbridge Finance", "Maya Collins", "finance analyst", "payment approvals", "09:20"],
  ["ApexCloud", "Daniel Reed", "cloud engineer", "identity operations", "14:45"],
  ["Halcyon Health", "Amira Patel", "clinic coordinator", "patient systems", "11:10"],
  ["Riverstone Logistics", "Leah Thompson", "operations manager", "delivery exceptions", "16:05"],
  ["Manchester Digital Labs", "Owen Blake", "student developer", "course platform", "19:30"],
  ["Cedar University", "Priya Shah", "research assistant", "shared documents", "08:55"]
];

export const answerPlans = {
  easy: ["suspicious", "safe", "suspicious", "need-more-info"],
  medium: ["suspicious", "safe", "suspicious", "need-more-info", "suspicious", "safe"],
  hard: ["suspicious", "need-more-info", "safe", "suspicious", "suspicious", "need-more-info", "safe"],
  final: ["suspicious", "safe", "need-more-info"]
};

export const typeLabels = {
  phishing: "phishing/current scam",
  bruteforce: "authentication and MFA",
  sqli: "technical web/database process",
  social: "social engineering/process"
};

export function trustedRouteFor(type) {
  return {
    phishing: "open the service from a saved bookmark or the original account portal",
    bruteforce: "contact the user through the approved helpdesk process and review identity-provider logs",
    sqli: "use the security ticket and application logs without sharing secrets or testing live exploit strings",
    social: "verify through the directory, procurement record, or host contact already on file"
  }[type] || "use a trusted verification route";
}
