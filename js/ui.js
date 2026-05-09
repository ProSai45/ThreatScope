import { escapeHTML } from "./security-utils.js";

export function showHint(message) {
  return window.showHint?.(message);
}

export function byId(id) {
  return document.getElementById(id);
}

export function renderSafeHTML(element, html) {
  if (!element) return;
  element.innerHTML = escapeHTML(html);
}
