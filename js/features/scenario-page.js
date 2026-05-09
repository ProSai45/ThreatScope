export function nextChallenge() {
  return window.nextChallenge?.();
}

export function scenarioAnswer(answer) {
  return window.scenarioAnswer?.(answer);
}
