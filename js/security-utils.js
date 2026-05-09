export function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function stripHTML(value = "") {
  const template = document.createElement("template");
  template.innerHTML = String(value);
  return template.content.textContent || "";
}

export function safeParagraphs(paragraphs = []) {
  return paragraphs
    .filter(Boolean)
    .map(paragraph => `<p>${escapeHTML(paragraph)}</p>`)
    .join("");
}

export function todayISO(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function safeIdPart(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "case";
}
