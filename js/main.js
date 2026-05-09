import { QuestionService } from "./questions/question-service.js";

window.ThreatScopeQuestionService = QuestionService;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-dynamic-src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.dataset.dynamicSrc = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.body.appendChild(script);
  });
}

function installSupabaseFallback() {
  if (window.supabase) return;

  const skipped = async () => ({ data: null, error: null });
  window.supabase = {
    createClient() {
      return {
        auth: {
          signUp: skipped,
          signInWithPassword: skipped,
          signOut: skipped,
          getSession: async () => ({ data: { session: null }, error: null })
        },
        from() {
          return {
            upsert: skipped,
            select() { return this; },
            eq() { return this; },
            maybeSingle: skipped
          };
        }
      };
    }
  };
}

async function loadSupabase() {
  if (window.supabase) return;
  try {
    await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
  } catch (error) {
    console.info("Supabase CDN unavailable; continuing with local-only progress.", error.message);
    installSupabaseFallback();
  }
}

async function boot() {
  await loadSupabase();
  await loadScript("js/features/legacy-app.js");
  document.documentElement.dataset.threatscopeReady = "true";
}

boot().catch(error => {
  console.error("ThreatScope failed to start.", error);
  const hint = document.getElementById("floatingHint");
  if (hint) {
    hint.textContent = "ThreatScope could not start. Refresh the page or run it through a local server.";
    hint.classList.add("show");
  }
});
