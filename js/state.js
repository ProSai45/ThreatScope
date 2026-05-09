export function getState() {
  return window.store?.getState?.() || null;
}

export function setState(update) {
  return window.store?.setState?.(update);
}

export function resetState() {
  return window.resetProgress?.();
}
