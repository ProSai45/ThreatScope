export function navigateTo(pageName) {
  return window.navigateTo?.(pageName);
}

export function showPage(pageName) {
  return window.showPage?.(pageName);
}
