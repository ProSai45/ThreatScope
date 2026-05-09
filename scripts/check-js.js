const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const jsRoots = ["js", "server"];
const requiredFiles = [
  "index.html",
  "CyberSecurityTutor2.html",
  "js/main.js",
  "js/features/legacy-app.js",
  "js/questions/question-service.js",
  "server/server.js",
  "server/routes/questions.js"
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return entry.isFile() && entry.name.endsWith(".js") ? [fullPath] : [];
  });
}

function relative(filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
}

function checkRequiredFiles() {
  const missing = requiredFiles.filter(file => !fs.existsSync(path.join(root, file)));
  if (missing.length) {
    console.error("Missing required project files:");
    missing.forEach(file => console.error(`- ${file}`));
    process.exit(1);
  }
}

function checkHtmlShell(fileName) {
  const html = fs.readFileSync(path.join(root, fileName), "utf8");
  const hasMainModule = /<script\s+type=["']module["']\s+src=["']js\/main\.js["']><\/script>/i.test(html);
  const inlineScriptCount = (html.match(/<script(?![^>]*\bsrc=)[^>]*>/gi) || []).length;
  const inlineStyleCount = (html.match(/<style\b/gi) || []).length;

  if (!hasMainModule) throw new Error(`${fileName} must load js/main.js as a module.`);
  if (inlineStyleCount > 0) throw new Error(`${fileName} should not contain inline <style> blocks.`);
  if (inlineScriptCount > 0) throw new Error(`${fileName} should not contain inline <script> blocks.`);
}

function syntaxCheck(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const isModule = /^\s*(import|export)\s/m.test(source);
  const result = isModule
    ? spawnSync(process.execPath, ["--input-type=module", "--check"], {
      input: source,
      encoding: "utf8"
    })
    : spawnSync(process.execPath, ["--check", filePath], {
      encoding: "utf8"
    });

  if (result.status !== 0) {
    console.error(`Syntax check failed: ${relative(filePath)}`);
    if (result.stderr) console.error(result.stderr.trim());
    process.exit(result.status || 1);
  }
}

checkRequiredFiles();
checkHtmlShell("index.html");
checkHtmlShell("CyberSecurityTutor2.html");

const files = jsRoots.flatMap(dir => walk(path.join(root, dir))).sort();
files.forEach(syntaxCheck);

console.log(`ThreatScope validation passed (${files.length} JavaScript files checked).`);
