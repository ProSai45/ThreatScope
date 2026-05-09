/* ===== Legacy app block 1 extracted from CyberSecurityTutor2.html ===== */
const SUPABASE_URL = "https://xdeqjlkxxmdagacxdlcj.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_qPWr9yDYulkzXn0dSxAlew_v3SdXnqw";

    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let currentUser = null;

    function openAuthModal() {
      const modal = document.getElementById("authModal");
      if (modal) modal.style.display = "flex";
    }

    function closeAuthModal() {
      const modal = document.getElementById("authModal");
      if (modal) modal.style.display = "none";
    }

    function setAuthMessage(message) {
      const el = document.getElementById("authMessage");
      if (el) el.textContent = message;
    }

    async function registerUser() {
      const email = document.getElementById("authEmail").value.trim();
      const password = document.getElementById("authPassword").value.trim();

      if (!email || !password) {
        setAuthMessage("Enter an email and password first.");
        return;
      }

      if (password.length < 6) {
        setAuthMessage("Password must be at least 6 characters.");
        return;
      }

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
      });

      if (error) {
        setAuthMessage(error.message);
        return;
      }

      setAuthMessage("Account created. You can now log in.");
    }

    async function loginUser() {
      const email = document.getElementById("authEmail").value.trim();
      const password = document.getElementById("authPassword").value.trim();

      if (!email || !password) {
        setAuthMessage("Enter your email and password.");
        return;
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setAuthMessage(error.message);
        return;
      }

      currentUser = data.user;
      closeAuthModal();
      updateAuthUI();
      await loadCloudProgress();
      showHint("Logged in. Your cloud progress has loaded.");
    }

    async function logoutUser() {
      await supabaseClient.auth.signOut();
      currentUser = null;
      updateAuthUI();
      showHint("Logged out.");
    }

    function updateAuthUI() {
      const authBtn = document.getElementById("authBtn");
      const accountMenu = document.getElementById("accountMenu");
      const accountInitials = document.getElementById("accountInitials");
      const accountEmail = document.getElementById("accountEmail");
      const startTrainingBtn = document.getElementById("startTrainingBtn");

      if (!authBtn) return;

      if (currentUser) {
        const email = currentUser.email || "Logged in";
        const namePart = email.split("@")[0] || "User";

        const initials = namePart
          .split(/[.\-_ ]+/)
          .filter(Boolean)
          .slice(0, 2)
          .map(part => part[0])
          .join("")
          .toUpperCase() || "U";

        authBtn.classList.add("auth-hidden");
        authBtn.disabled = true;

        if (accountMenu) accountMenu.style.display = "block";
        if (accountInitials) accountInitials.textContent = initials;
        if (accountEmail) accountEmail.textContent = email;
        if (startTrainingBtn) startTrainingBtn.style.display = "none";
      } else {
        authBtn.classList.remove("auth-hidden");
        authBtn.textContent = "Login";
        authBtn.disabled = false;

        if (accountMenu) accountMenu.style.display = "none";
        if (startTrainingBtn) startTrainingBtn.style.display = "inline-flex";
      }
    }

    async function checkExistingSession() {
      const { data } = await supabaseClient.auth.getSession();

      currentUser = data.session?.user || null;
      updateAuthUI();

      if (currentUser) {
        await loadCloudProgress();
      }
    }




    async function saveCloudProgress(progress) {
      if (!currentUser) return;

      const { error } = await supabaseClient
        .from("threatscope_progress")
        .upsert({
          user_id: currentUser.id,
          progress: progress,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error("Cloud save failed:", error.message);
      }
    }

    async function loadCloudProgress() {
      if (!currentUser) return;

      const { data, error } = await supabaseClient
        .from("threatscope_progress")
        .select("progress")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (error) {
        console.error("Cloud load failed:", error.message);
        return;
      }

      if (!data || !data.progress) {
        saveProgress();
        return;
      }

      const cloudProgress = data.progress;
      const defaultBehavior = getCleanDefaultBehaviour ? getCleanDefaultBehaviour() : store.getState().userBehavior;

      store.setState({
        score: Number(cloudProgress.score || 0),
        completedAttacks: Array.isArray(cloudProgress.completedAttacks) ? cloudProgress.completedAttacks : [],
        correctAnswers: Number(cloudProgress.correctAnswers || 0),
        totalAnswers: Number(cloudProgress.totalAnswers || 0),
        currentStreak: Number(cloudProgress.currentStreak || 0),
        bestStreak: Number(cloudProgress.bestStreak || 0),
        finalAssessmentPassed: cloudProgress.finalAssessmentPassed === true,
        finalAssessmentScore: cloudProgress.finalAssessmentScore || null,
        userBehavior: {
          ...defaultBehavior,
          ...(cloudProgress.userBehavior || {}),
          topicStats: {
            ...defaultBehavior.topicStats,
            ...((cloudProgress.userBehavior && cloudProgress.userBehavior.topicStats) || {})
          },
          mistakes: Array.isArray(cloudProgress.userBehavior?.mistakes)
            ? cloudProgress.userBehavior.mistakes
            : []
        }
      });

      localStorage.setItem("threatscopeProgress", JSON.stringify(cloudProgress));

      if (cloudProgress.finalAssessmentPassed) {
        localStorage.setItem("finalAssessmentPassed", "true");
      }

      if (cloudProgress.finalAssessmentScore) {
        localStorage.setItem("finalAssessmentScore", cloudProgress.finalAssessmentScore);
      }

      animateDashboard();
      updateTrainingPath();
    }


    function handleKeyboardCard(event, action) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        action();
      }
    }
    const store = {
      state: {
        currentPage: 'landing',
        currentAttack: null,
        currentStep: 0,
        perspective: 'attacker',

        score: 0,
        completedAttacks: [],
        correctAnswers: 0,
        totalAnswers: 0,
        username: '',
        difficulty: localStorage.getItem("difficulty") || "easy",
        selectedConfidence: "medium",
        currentStreak: Number(localStorage.getItem("currentStreak") || 0),
        bestStreak: Number(localStorage.getItem("bestStreak") || 0),
        finalAssessmentPassed: localStorage.getItem("finalAssessmentPassed") === "true",
        finalAssessmentScore: localStorage.getItem("finalAssessmentScore") || null,
        isFinalAssessment: false,
        userBehavior: {
          hesitations: 0,
          speed: [],
          mistakes: [],
          confidenceMistakes: [],
          topicStats: {
            phishing: { correct: 0, total: 0 },
            bruteforce: { correct: 0, total: 0 },
            sqli: { correct: 0, total: 0 },
            social: { correct: 0, total: 0 }
          }
        }
      },
      listeners: [],
      subscribe(fn) { this.listeners.push(fn); },
      setState(updates) {
        Object.assign(this.state, updates);
        this.listeners.forEach(fn => fn(this.state));
      },
      getState() { return this.state; }
    };

    const savedName = localStorage.getItem("username");


    let savedProgress = null;

    try {
      savedProgress = JSON.parse(localStorage.getItem("threatscopeProgress") || "null");
    } catch (error) {
      console.warn("Saved progress was corrupted and has been reset.", error);
      localStorage.removeItem("threatscopeProgress");
    }

    if (savedProgress && typeof savedProgress === "object") {
      const defaultBehavior = store.getState().userBehavior;

      store.setState({
        score: Number(savedProgress.score || 0),
        completedAttacks: Array.isArray(savedProgress.completedAttacks) ? savedProgress.completedAttacks : [],
        correctAnswers: Number(savedProgress.correctAnswers || 0),
        totalAnswers: Number(savedProgress.totalAnswers || 0),
        currentStreak: Number(savedProgress.currentStreak || localStorage.getItem("currentStreak") || 0),
        bestStreak: Number(savedProgress.bestStreak || localStorage.getItem("bestStreak") || 0),
        finalAssessmentPassed: savedProgress.finalAssessmentPassed ?? (localStorage.getItem("finalAssessmentPassed") === "true"),
        finalAssessmentScore: savedProgress.finalAssessmentScore || localStorage.getItem("finalAssessmentScore") || null,
        userBehavior: {
          ...defaultBehavior,
          ...(savedProgress.userBehavior || {}),
          topicStats: {
            ...defaultBehavior.topicStats,
            ...((savedProgress.userBehavior && savedProgress.userBehavior.topicStats) || {})
          },
          mistakes: Array.isArray(savedProgress.userBehavior?.mistakes)
            ? savedProgress.userBehavior.mistakes
            : []
        }
      });
    }
    function setDifficulty(level) {
      store.setState({ difficulty: level });
      localStorage.setItem("difficulty", level);

      document.querySelectorAll(".difficulty-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.difficulty === level);
      });

      showHint(`Difficulty set to ${level}.`);
    }

    function toggleMobileNav() {
      const navLinks = document.querySelector(".nav-links");
      const navButton = document.getElementById("navHamburger");

      if (!navLinks) return;

      const isOpen = navLinks.classList.toggle("open");

      if (navButton) {
        navButton.setAttribute("aria-expanded", String(isOpen));
        navButton.textContent = isOpen ? "✕" : "☰";
      }
    }

    function setConfidence(level) {
      store.setState({ selectedConfidence: level });

      document.querySelectorAll(".confidence-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.confidence === level);
      });
    }

    function updateTrainingPath() {
      const state = store.getState();

      const pathMap = {
        phishing: "path-phishing",
        bruteforce: "path-bruteforce",
        sqli: "path-sqli",
        social: "path-social"
      };

      Object.entries(pathMap).forEach(([attack, id]) => {
        const card = document.getElementById(id);
        if (!card) return;

        const status = card.querySelector(".path-status");

        if (state.completedAttacks.includes(attack)) {
          card.classList.add("done");
          if (status) status.textContent = "Completed";
        } else {
          card.classList.remove("done");
          if (status) status.textContent = "Start";
        }
      });

      const finalCard = document.getElementById("path-final");

      if (finalCard) {
        const status = finalCard.querySelector(".path-status");
        const unlocked = state.completedAttacks.length >= 4;

        finalCard.classList.toggle("locked", !unlocked);
        finalCard.classList.toggle("done", state.finalAssessmentPassed);

        if (status) {
          if (state.finalAssessmentPassed) status.textContent = "Passed";
          else if (unlocked) status.textContent = "Unlocked";
          else status.textContent = "Locked";
        }
      }

      document.querySelectorAll(".difficulty-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.difficulty === state.difficulty);
      });
    }

    const finalAssessmentQuestionBank = [
      {
        type: "phishing",
        difficulty: "final",
        title: "AI-Written Supplier Portal Request",
        sender: "Procurement Operations",
        senderMeta: "procurement-updates@supplier-verifyportal.net",
        body: buildScenarioBody([
          "A polished email claims your company is moving all supplier payments into a new portal.",
          "The wording is professional, references real invoice processes, and appears to be written by someone who understands procurement.",
          "The link asks you to sign in with your Microsoft account and approve an app that can read files and maintain access."
        ], "OAuth request: read files, read profile, maintain access"),
        correct: "suspicious",
        reason: "This is suspicious because it combines a lookalike supplier domain with excessive OAuth permissions. The user is not just logging in; they may be granting ongoing access.",
        takeaways: [
          "AI-written phishing can sound professional.",
          "OAuth permissions can be more dangerous than a normal password form.",
          "Always verify supplier portal changes through a trusted internal route."
        ]
      },

      {
        type: "phishing",
        difficulty: "final",
        title: "Legitimate Internal Policy Reminder",
        sender: "Security Awareness Team",
        senderMeta: "security@company.co.uk",
        body: buildScenarioBody([
          "The message reminds staff that security training is due this month.",
          "It does not ask for passwords, MFA codes, file downloads, payment details, or new app permissions.",
          "It says users can access the training from the normal company intranet if they do not want to use the link."
        ], "Alternative route: company intranet → Training → Security Awareness"),
        correct: "safe",
        reason: "This is safe because it gives a trusted alternative route, uses the expected domain, and does not request sensitive information or unusual permissions.",
        takeaways: [
          "Not every training email is phishing.",
          "A safe message should be verifiable through normal company systems.",
          "Look at the request, not just the topic."
        ]
      },

      {
        type: "phishing",
        difficulty: "final",
        title: "Deepfake Meeting Follow-Up",
        sender: "Executive Assistant",
        senderMeta: "ea-office@cornpany-board.co.uk",
        body: buildScenarioBody([
          "A voice note appears to come from a senior leader asking you to approve a confidential board document.",
          "The follow-up email says the approval must happen before the meeting starts.",
          "The sender domain uses a subtle spelling trick and the approval page asks for cloud storage access."
        ], "Approve confidential board access"),
        correct: "suspicious",
        reason: "This is suspicious because it uses deepfake-style authority, urgency, a lookalike domain, and a cloud access request.",
        takeaways: [
          "Deepfakes increase pressure but do not remove the need to verify.",
          "Lookalike domains can be extremely subtle.",
          "Confidentiality is often used to stop people from checking."
        ]
      },

      {
        type: "bruteforce",
        difficulty: "final",
        title: "Password Spraying Across Many Users",
        sender: "Identity Monitoring System",
        senderMeta: "identity-alerts@company.local",
        body: buildScenarioBody([
          "A single failed login appears for 280 different users across the organisation.",
          "The attempted password pattern is the same across every account.",
          "No individual user has enough failures to trigger account lockout."
        ], "Pattern: one common password tested across many accounts"),
        correct: "suspicious",
        reason: "This is suspicious because it is password spraying. The attacker avoids lockouts by spreading attempts across many accounts.",
        takeaways: [
          "Low failures per user can still be dangerous.",
          "Patterns across accounts matter.",
          "Password spraying is quieter than classic brute force."
        ]
      },

      {
        type: "bruteforce",
        difficulty: "final",
        title: "Normal Backup Service Login",
        sender: "Directory Monitoring",
        senderMeta: "directory-monitor@company.local",
        body: buildScenarioBody([
          "The account svc_backup logs into the internal backup server at exactly 02:00.",
          "This has happened every night for the last 120 days.",
          "There are no failed attempts, no new device, no new location, and no unusual privilege changes."
        ], "Baseline matched"),
        correct: "safe",
        reason: "This is safe because the login matches a known baseline. Security decisions should consider normal behaviour, not just whether automation is involved.",
        takeaways: [
          "Automation is not automatically malicious.",
          "Baseline behaviour matters.",
          "Security monitoring should compare context."
        ]
      },

      {
        type: "bruteforce",
        difficulty: "final",
        title: "MFA Fatigue Approval",
        sender: "Identity Provider",
        senderMeta: "mfa-alert@company.local",
        body: buildScenarioBody([
          "A user receives 34 MFA push notifications in four minutes.",
          "The password was accepted before the prompts began.",
          "The final prompt was approved, and the login came from a new device."
        ], "MFA approval after repeated prompts"),
        correct: "suspicious",
        reason: "This is suspicious because repeated MFA prompts followed by approval strongly suggests MFA fatigue after password compromise.",
        takeaways: [
          "MFA fatigue usually means the password may already be known.",
          "Approval does not always mean the login is legitimate.",
          "Repeated prompts should be reported immediately."
        ]
      },

      {
        type: "sqli",
        difficulty: "final",
        title: "Second-Order SQL Injection Signal",
        sender: "Database Error Monitor",
        senderMeta: "db-monitor@company.local",
        body: buildScenarioBody([
          "A user profile was created yesterday with unusual SQL comment characters in the display name.",
          "The profile saved successfully at the time.",
          "Today, the reporting job processed that display name and produced a database syntax error."
        ], "Stored value triggered delayed SQL error"),
        correct: "suspicious",
        reason: "This is suspicious because it may be second-order SQL injection. A risky input pattern is stored first and becomes dangerous later when another system processes it unsafely.",
        takeaways: [
          "SQL injection is not always immediate.",
          "Stored input can become dangerous later.",
          "Internal jobs must also handle input safely."
        ]
      },

      {
        type: "sqli",
        difficulty: "final",
        title: "Safe Report Filter Request",
        sender: "API Gateway",
        senderMeta: "gateway@company.local",
        body: buildScenarioBody([
          "The request uses expected report filters: start date, end date, department, and export format.",
          "The parameters match the API schema.",
          "There are no SQL operators, no database errors, no unusual delay, and no unexpected output."
        ], "Schema validation passed"),
        correct: "safe",
        reason: "This is safe because the input matches expected structure and shows no signs of SQL manipulation.",
        takeaways: [
          "Normal filters are not suspicious by themselves.",
          "Schema validation helps reduce risk.",
          "Look for evidence, not fear."
        ]
      },

      {
        type: "sqli",
        difficulty: "final",
        title: "Blind SQL Injection Timing Change",
        sender: "Application Performance Monitor",
        senderMeta: "apm@company.local",
        body: buildScenarioBody([
          "A search request produced no visible database error.",
          "However, after unusual input was submitted, the response time increased from 160ms to 6100ms.",
          "The same delay happens only when database-style timing syntax appears in the input."
        ], "Timing anomaly after unusual input"),
        correct: "suspicious",
        reason: "This is suspicious because blind SQL injection can be detected through response delays even when no error message is shown.",
        takeaways: [
          "SQL injection does not always show visible errors.",
          "Timing changes can reveal backend behaviour.",
          "Performance anomalies can be security signals."
        ]
      },

      {
        type: "social",
        difficulty: "final",
        title: "Executive Payment Pressure",
        sender: "Finance Escalation Transcript",
        senderMeta: "Voice note and message",
        body: buildScenarioBody([
          "A voice note sounds like a senior executive asking for a supplier payment to be released urgently.",
          "The message says not to call back because the matter is confidential.",
          "It asks the employee to skip dual approval because the board deadline is close."
        ], "Request: bypass payment approval"),
        correct: "suspicious",
        reason: "This is suspicious because it uses authority, urgency, secrecy, and a request to bypass financial controls.",
        takeaways: [
          "Control bypass is the biggest warning sign.",
          "Confidentiality should not stop verification.",
          "Deepfake or not, the process must still be followed."
        ]
      },

      {
        type: "social",
        difficulty: "final",
        title: "Verified Visitor Process",
        sender: "Reception Desk",
        senderMeta: "Visitor access log",
        body: buildScenarioBody([
          "A visitor arrives for an interview and gives the name of the employee they are meeting.",
          "Reception checks the calendar, confirms the appointment, prints a temporary badge, and asks the visitor to wait.",
          "The visitor is not allowed into the secure area until the host arrives."
        ], "Visitor held until host arrives"),
        correct: "safe",
        reason: "This is safe because the visitor is verified through the expected process and does not bypass physical access controls.",
        takeaways: [
          "Verification makes a request safer.",
          "Visitors should not enter secure areas alone.",
          "Normal process protects both staff and visitors."
        ]
      },

      {
        type: "social",
        difficulty: "final",
        title: "Contractor Tailgating Attempt",
        sender: "Physical Security Report",
        senderMeta: "Building entrance",
        body: buildScenarioBody([
          "A person wearing a contractor jacket says they are late for a network cabling job.",
          "They are carrying equipment and ask an employee to hold the secure door because their pass is in the van.",
          "They seem polite and believable, but they are trying to enter without scanning a badge."
        ], "Door access requested without badge scan"),
        correct: "suspicious",
        reason: "This is suspicious because it uses helpfulness and time pressure to bypass physical access control.",
        takeaways: [
          "Everyone should badge in individually.",
          "Helpfulness can be manipulated.",
          "Physical security is part of cybersecurity."
        ]
      }
    ];

    function getAllChallenges() {
      return AssessmentService.generateFinalAssessment().map(question => ({
        ...question,
        body: `
      ${question.body}
      <p style="font-size:0.72rem; color:var(--text-tertiary); margin-top:14px;">
        Final assessment unique ID: ${escapeHTML(question.uniqueID || randomReference("FINAL"))}
      </p>
    `
      }));
    }
    async function startFinalAssessment() {
      const state = store.getState();

      if (state.completedAttacks.length < 4) {
        showHint("Complete all 4 modules before starting the final assessment.");
        return;
      }

      const mixed = await getDynamicFinalAssessment();

      store.setState({
        currentAttack: "final",
        currentStep: 0,
        challenges: mixed,
        challengeIndex: 0,
        isFinalAssessment: true,
        finalCorrect: 0,
        finalTotal: 0
      });

      resetScenarioPage();
      navigateTo("scenario");
      showHint("Final assessment started. These are unique mixed questions. You need 75% or higher to unlock the certificate.");
    }


    function resetProgress() {
      const confirmed = confirm("Reset all training progress, scores, mistakes, streaks and certificate status?");

      if (!confirmed) return;

      localStorage.removeItem("currentStreak");
      localStorage.removeItem("bestStreak");
      localStorage.removeItem("finalAssessmentPassed");
      localStorage.removeItem("finalAssessmentScore");
      localStorage.removeItem("certificateReady");
      localStorage.removeItem("certificateDate");
      localStorage.removeItem("certificateID");
      localStorage.removeItem("threatscopeProgress");
      localStorage.removeItem("username");
      const certOverlay = document.getElementById("certificateOverlay");
      const nameModal = document.getElementById("nameEntryModal");

      if (certOverlay) certOverlay.style.display = "none";
      if (nameModal) nameModal.style.display = "none";

      store.setState({
        score: 0,
        completedAttacks: [],
        correctAnswers: 0,
        totalAnswers: 0,
        currentStreak: 0,
        bestStreak: 0,
        finalAssessmentPassed: false,
        finalAssessmentScore: null,
        isFinalAssessment: false,
        userBehavior: {
          hesitations: 0,
          speed: [],
          mistakes: [],
          confidenceMistakes: [],
          topicStats: {
            phishing: { correct: 0, total: 0 },
            bruteforce: { correct: 0, total: 0 },
            sqli: { correct: 0, total: 0 },
            social: { correct: 0, total: 0 }
          }
        }
      });

      const dashCertBtn = document.getElementById("dashCertBtn");
      if (dashCertBtn) dashCertBtn.remove();

      animateDashboard();
      updateTrainingPath();
      showHint("Training progress has been reset.");
    }

    function highlightThreatClues(question) {
      const body = document.getElementById("scenarioMessageBody");
      if (!body || !question) return;

      if (question.correct === "suspicious") {
        body.innerHTML += `
      <div class="clue-breakdown">
        <div class="clue-item">
          <strong>Threat clue:</strong> ${question.reason}
        </div>
      </div>
    `;
      } else {
        body.innerHTML += `
      <div class="clue-breakdown">
        <div class="clue-item">
          <strong>Safe clue:</strong> This scenario is safe because the context, sender and behaviour match expected activity.
        </div>
      </div>
    `;
      }
    }

    function replayMistake(index) {
      const state = store.getState();
      const mistake = state.userBehavior.mistakes[index];

      if (!mistake) return;

      const challenge = {
        title: mistake.question,
        sender: "Replay Mode",
        senderMeta: mistake.attackName,
        body: `<p>This is a replay of a previous mistake.</p><div class="email-link">${mistake.question}</div>`,
        correct: mistake.correctAnswer,
        type: mistake.attack,
        difficulty: "review",
        reason: mistake.reason
      };

      store.setState({
        currentAttack: mistake.attack,
        challenges: [challenge],
        challengeIndex: 0,
        isFinalAssessment: false
      });

      resetScenarioPage();
      navigateTo("scenario");
    }
    if (savedName && savedName.trim() !== "") {
      store.setState({ username: savedName });
    }

    const attackData = {
      phishing: {
        name: 'Phishing Attack',
        icon: '🎣',
        stages: [
          { title: 'Reconnaissance', desc: 'Attacker researches employees and collects email addresses from public sources.', impact: 'Information gathered', impactLevel: 'medium' },
          { title: 'Weaponization', desc: 'A fake IT email and cloned login page are prepared.', impact: 'Attack prepared', impactLevel: 'medium' },
          { title: 'Delivery', desc: 'The phishing email is sent to employees.', impact: 'Users receive malicious email', impactLevel: 'high' },
          { title: 'Credential Capture', desc: 'Victims enter credentials into the fake portal.', impact: 'Credentials stolen', impactLevel: 'high' },
          { title: 'Post-Exploitation', desc: 'Attacker uses stolen credentials to access internal systems.', impact: 'Account compromise', impactLevel: 'high' }
        ],
        defences: [
          { title: 'Email Authentication', icon: '📧', desc: 'Use SPF, DKIM, and DMARC to reduce spoofed email.' },
          { title: 'MFA', icon: '🔐', desc: 'Multi-factor authentication helps protect accounts even if passwords are stolen.' },
          { title: 'Security Training', icon: '🎓', desc: 'Teach users to inspect domains, links, urgency, and sender details.' },
          { title: 'URL Filtering', icon: '🔗', desc: 'Block known malicious domains and suspicious links.' }
        ],
        scenario: {
          title: 'Can You Spot the Phishing Email?',
          desc: 'Analyze this email and decide whether it is safe or suspicious.',
          avatar: '👤',
          sender: 'IT Security Team',
          senderMeta: 'security-alerts@c0mpany-portal.net',
          time: 'Today, 9:42 AM',
          messageTitle: '⚠️ Urgent: Password Expiration Notice',
          body: `
        <p>Dear Employee,</p>
        <p>Your corporate password will expire in <strong>24 hours</strong>. Please update it immediately to avoid losing access.</p>
        <div class="email-link">🔗 https://company-portal-secure.net/reset-password</div>
        <p style="margin-top:16px; font-size:0.8rem; color:var(--text-tertiary);">This is an automated message from IT Security.</p>
      `,
          correctAnswer: 'suspicious',
          correctFeedback: '✅ Correct. This is phishing: suspicious sender domain, urgency, and an external reset link.',
          incorrectFeedback: '❌ Incorrect. This is a phishing attempt using urgency and a fake login link.',
          aiWhat: 'This is a credential harvesting phishing attack.',
          aiHow: 'The attacker uses urgency, authority, and a lookalike domain to make the victim act quickly.',
          aiDefend: 'Check sender domains, avoid email login links, and verify through official channels.',
          takeaways: [
            'Check sender addresses carefully.',
            'Urgency is often used to pressure victims.',
            'Never enter passwords through email links.'
          ]
        }
      },

      bruteforce: {
        name: 'Brute Force Attack',
        icon: '🔓',
        stages: [
          { title: 'Target Identification', desc: 'Login pages and exposed services are identified.', impact: 'Attack surface found', impactLevel: 'medium' },
          { title: 'Credential List Prep', desc: 'Leaked passwords and common password lists are prepared.', impact: 'Attack list ready', impactLevel: 'medium' },
          { title: 'Automated Attempts', desc: 'Bots attempt thousands of username and password combinations.', impact: 'Login system under attack', impactLevel: 'high' },
          { title: 'Account Access', desc: 'Weak or reused passwords allow account compromise.', impact: 'Unauthorized access', impactLevel: 'high' }
        ],
        defences: [
          { title: 'Rate Limiting', icon: '⏱', desc: 'Limit repeated login attempts.' },
          { title: 'Account Lockout', icon: '🔒', desc: 'Temporarily lock accounts after too many failed attempts.' },
          { title: 'Strong Passwords', icon: '🔑', desc: 'Block common and breached passwords.' },
          { title: 'MFA', icon: '🔐', desc: 'Require a second factor after password entry.' }
        ],
        scenario: {
          title: 'Can You Detect the Brute Force Attack?',
          desc: 'Review this login activity and decide whether it is normal or suspicious.',
          avatar: '🔓',
          sender: 'Login Monitoring System',
          senderMeta: 'auth-monitor@threatscope.local',
          time: 'Today, 11:18 AM',
          messageTitle: 'Multiple Failed Login Attempts Detected',
          body: `
        <p>User: admin@company.com</p>
        <p>Failed attempts: <strong>128 attempts in 4 minutes</strong></p>
        <p>Source IPs: Multiple countries, rotating every few seconds.</p>
        <div class="email-link">⚠ Authentication spike detected</div>
      `,
          correctAnswer: 'suspicious',
          correctFeedback: '✅ Correct. Rapid repeated login attempts from rotating IPs strongly indicate brute force or credential stuffing.',
          incorrectFeedback: '❌ Incorrect. This is suspicious because of the high failure rate and rotating IP addresses.',
          aiWhat: 'This is a brute force or credential stuffing attempt.',
          aiHow: 'The attacker automates password attempts using leaked credentials and proxies.',
          aiDefend: 'Use rate limits, lockouts, MFA, and breached password detection.',
          takeaways: [
            'Many failed logins in a short time are suspicious.',
            'Rotating IPs can indicate automation.',
            'MFA reduces damage from stolen passwords.'
          ]
        }
      },

      sqli: {
        name: 'SQL Injection',
        icon: '💉',
        stages: [
          { title: 'Input Discovery', desc: 'Forms and URL parameters are tested for database input.', impact: 'Input points discovered', impactLevel: 'medium' },
          { title: 'Injection Testing', desc: 'Suspicious SQL-like inputs are detected and blocked for defensive validation.', impact: 'Database behaviour exposed', impactLevel: 'high' },
          { title: 'Schema Discovery', desc: 'Unexpected database details are removed from user-facing responses.', impact: 'Database structure leaked', impactLevel: 'high' },
          { title: 'Data Extraction', desc: 'Sensitive records are protected through access control and parameterised queries.', impact: 'Data breach', impactLevel: 'high' },
          { title: 'Privilege Escalation', desc: 'Database access is used to expand compromise.', impact: 'System compromise', impactLevel: 'high' }
        ],
        defences: [
          { title: 'Parameterized Queries', icon: '📝', desc: 'Use prepared statements instead of string concatenation.' },
          { title: 'Input Validation', icon: '✅', desc: 'Validate and restrict user input.' },
          { title: 'Least Privilege', icon: '👤', desc: 'Database users should only have required permissions.' },
          { title: 'WAF', icon: '🧱', desc: 'Detect and block common injection patterns.' }
        ],
        scenario: {
          title: 'Can You Spot SQL Injection?',
          desc: 'Review this login request and decide whether it is safe or suspicious.',
          avatar: '💉',
          sender: 'Web App Firewall',
          senderMeta: 'waf-alert@threatscope.local',
          time: 'Today, 2:05 PM',
          messageTitle: 'Suspicious Login Parameter Detected',
          body: `
        <p>Endpoint: <strong>/login</strong></p>
        <p>Username input received:</p>
        <div class="email-link">[redacted SQL-style login bypass pattern]</div>
        <p>Database error response observed after request.</p>
      `,
          correctAnswer: 'suspicious',
          correctFeedback: '✅ Correct. The input pattern is a classic SQL injection warning sign.',
          incorrectFeedback: '❌ Incorrect. This input is suspicious because it attempts to alter the SQL query logic.',
          aiWhat: 'This is an SQL injection attempt against a login form.',
          aiHow: 'The attacker tries to manipulate the query so the login condition always becomes true.',
          aiDefend: 'Use parameterized queries, validation, least privilege, and safe error handling.',
          takeaways: [
            'Never trust raw user input.',
            'SQL symbols in unexpected places are red flags.',
            'Prepared statements stop most SQL injection attacks.'
          ]
        }
      },

      social: {
        name: 'Social Engineering',
        icon: '🎭',
        stages: [
          { title: 'OSINT Research', desc: 'Public details are collected from social media and websites.', impact: 'Target profile built', impactLevel: 'medium' },
          { title: 'Pretext Creation', desc: 'A believable fake identity or story is prepared.', impact: 'Trust setup', impactLevel: 'medium' },
          { title: 'Engagement', desc: 'The attacker contacts the target pretending to be trusted staff.', impact: 'Trust relationship begins', impactLevel: 'high' },
          { title: 'Information Extraction', desc: 'The victim gives away sensitive information.', impact: 'Information compromised', impactLevel: 'high' }
        ],
        defences: [
          { title: 'Verification Protocols', icon: '☎', desc: 'Verify identity through a separate official channel.' },
          { title: 'Information Classification', icon: '📋', desc: 'Define what information cannot be shared.' },
          { title: 'Social Media Policy', icon: '📱', desc: 'Reduce public information attackers can use.' },
          { title: 'Reporting Culture', icon: '🚨', desc: 'Make suspicious contact easy to report.' }
        ],
        scenario: {
          title: 'Can You Spot Social Engineering?',
          desc: 'Read this request and decide whether it is safe or suspicious.',
          avatar: '🎭',
          sender: 'IT Helpdesk Caller',
          senderMeta: 'Phone call transcript',
          time: 'Today, 3:31 PM',
          messageTitle: 'Account Verification Call',
          body: `
        <p>"Hi, this is Mike from IT. We are fixing VPN access issues."</p>
        <p>"Can you quickly confirm your username, password, and security question answer so we can verify your account?"</p>
        <div class="email-link">☎ Caller asks for sensitive credentials</div>
      `,
          correctAnswer: 'suspicious',
          correctFeedback: '✅ Correct. Legitimate IT should never ask for your password or security answers.',
          incorrectFeedback: '❌ Incorrect. This is social engineering because the caller is using authority and urgency to extract secrets.',
          aiWhat: 'This is a social engineering attempt using impersonation.',
          aiHow: 'The attacker pretends to be IT support to gain trust and extract credentials.',
          aiDefend: 'Refuse to share secrets and verify through official company channels.',
          takeaways: [
            'Never share passwords with anyone.',
            'Verify unexpected requests through official channels.',
            'Authority and urgency are common manipulation tactics.'
          ]
        }
      }
    };


    const learningData = {
      phishing: {
        title: "Phishing & AI Threat Simulation Brief",
        moduleName: "🎣 Phishing & AI Threats",
        intro: "This lesson prepares you for the actual simulation: deciding whether a message is safe, suspicious, or needs more investigation.",
        desc: "In the simulation, you are not just spotting a fake email. You are judging the sender, domain, request, link destination, pressure level, and whether the action is normal.",
        goal: "The attacker wants you to click, sign in, approve access, open a file, or trust a fake message before you verify it.",
        how: "Modern phishing can look polished because attackers use copied branding, real company names, AI-written wording, and realistic login pages.",
        mindset: "Do not ask “does it look real?” Ask “does the request make sense, and can I verify it safely?”",
        trap: "Some safe messages look boring and suspicious. Some dangerous messages look professional and calm.",
        prep: [
          ["🔍", "Sender check", "Check the exact sender domain, not just the display name."],
          ["🔗", "Destination check", "Ask where the link or button really sends the user."],
          ["🧠", "Request check", "Look at what the message wants you to do, not how nice it looks."]
        ],
        decisions: [
          ["Safe", "Use this only when the sender, link, request, and process all make sense."],
          ["Suspicious", "Use this when there is a fake domain, pressure, credential request, strange permission, or process bypass."],
          ["Need More Info", "Use this when the clue is not obvious and you need to inspect the sender, link, or context first."]
        ],
        comparison: {
          safe: "A normal training reminder from the correct company domain that lets you access it through the usual intranet.",
          danger: "A polished security email from a lookalike domain asking you to sign in or approve broad OAuth permissions."
        },
        flow: [
          ["🧠", "You receive a realistic message", "It may look safe or suspicious on purpose."],
          ["🔍", "You inspect the clues", "Sender, domain, link, request, urgency, and permissions."],
          ["⚖️", "You make a decision", "Safe, Suspicious, or Need More Info."],
          ["🤖", "ThreatScope explains it", "The analyst shows what clue mattered and what to improve."]
        ],
        signals: [
          ["Lookalike domain", "A small spelling difference can completely change whether the message is safe."],
          ["OAuth permission trap", "A login page may not steal the password directly. It may ask you to approve access."],
          ["False urgency", "Attackers pressure people so they skip verification."]
        ],
        demoTitle: "Simulation-style example",
        demoBadge: "Decision clue",
        demo: `
      You receive a Microsoft-style email saying your file access will expire today.
      <br><br>
      Sender: <span class="demo-highlight">security@micros0ft-access.net</span>
      <br><br>
      The design is not the clue. The domain and request are.
    `
      },

      bruteforce: {
        title: "Credential Attack Simulation Brief",
        moduleName: "🔓 Credential Attacks",
        intro: "This lesson prepares you to judge login activity, MFA alerts, failed attempts, and account behaviour during the simulation.",
        desc: "In the simulation, you will decide whether login behaviour is normal, suspicious, or needs more investigation.",
        goal: "The attacker wants to gain access using guessed passwords, leaked credentials, reused passwords, or MFA pressure.",
        how: "Credential attacks can be loud, like hundreds of failed logins, or quiet, like one password attempted across many accounts.",
        mindset: "Do not judge one login alone. Look for patterns across users, time, location, device, and MFA behaviour.",
        trap: "A single failed login may be normal. One failed login across 300 users may be password spraying.",
        prep: [
          ["📊", "Pattern check", "Look at volume, timing, affected users, and repeated behaviour."],
          ["🌍", "Context check", "Check location, device, impossible travel, and normal login baseline."],
          ["📲", "MFA check", "Repeated push notifications may mean the password is already compromised."]
        ],
        decisions: [
          ["Safe", "Use this when the login matches normal baseline and has no unusual failure or location pattern."],
          ["Suspicious", "Use this when there are repeated failures, spraying, impossible travel, or MFA fatigue."],
          ["Need More Info", "Use this when the login could be normal but needs baseline, location, or device verification."]
        ],
        comparison: {
          safe: "A backup service account logging in every night at 02:00 from the same internal system.",
          danger: "Hundreds of users each failing once with the same password pattern across a few hours."
        },
        flow: [
          ["🔐", "You receive auth activity", "A login alert, MFA alert, or failed attempt pattern."],
          ["📈", "You analyse behaviour", "Check volume, speed, location, user count, and baseline."],
          ["⚖️", "You choose a response", "Safe, Suspicious, or Need More Info."],
          ["🎯", "Dashboard tracks weakness", "Mistakes reveal if you miss pattern-based attacks."]
        ],
        signals: [
          ["Password spraying", "One password tested across many accounts can avoid lockouts."],
          ["MFA fatigue", "Repeated push prompts followed by approval is a serious warning sign."],
          ["Impossible travel", "Valid password does not mean safe if the login context is impossible."]
        ],
        demoTitle: "Simulation-style example",
        demoBadge: "Pattern clue",
        demo: `
      280 accounts each show one failed login attempt.
      <br><br>
      That does not look dramatic per account, but together it shows
      <span class="demo-highlight">password spraying</span>.
    `
      },

      sqli: {
        title: "Web Exploit Simulation Brief",
        moduleName: "💉 Web Exploits & Data Protection",
        intro: "This lesson prepares you to judge web requests, strange input, database errors, and delayed backend behaviour.",
        desc: "In the simulation, you will decide whether input behaviour is safe, suspicious, or needs deeper investigation.",
        goal: "The attacker wants to make user input affect database logic, reveal records, bypass checks, or expose backend structure.",
        how: "SQL injection happens when unsafe input is treated like part of a database command instead of plain data.",
        mindset: "Ask whether the input belongs there. Normal search filters are fine. SQL-like logic inside a username is not.",
        trap: "Not all SQL injection creates a visible error. Some attacks show through response delays or delayed stored input patterns.",
        prep: [
          ["⌨️", "Input check", "Look for quotes, comments, UNION, SELECT, OR logic, or strange syntax."],
          ["⚠️", "Response check", "Watch for database errors, changed output, or abnormal delay."],
          ["🗃️", "Data check", "Ask whether the input could expose or manipulate stored records."]
        ],
        decisions: [
          ["Safe", "Use this when the request uses expected parameters and returns normal behaviour."],
          ["Suspicious", "Use this when input looks like database logic, triggers errors, or causes abnormal delay."],
          ["Need More Info", "Use this when the request is unusual but you need response behaviour or validation details."]
        ],
        comparison: {
          safe: "A report request using normal filters such as startDate, endDate, department, and export format.",
          danger: "A login field containing SQL-style control characters, database comments, extraction patterns, or timing probes."
        },
        flow: [
          ["🧪", "You inspect input", "A form, URL, API request, or login field."],
          ["⚠️", "You watch behaviour", "Errors, delays, changed output, or unexpected access."],
          ["⚖️", "You classify the risk", "Safe, Suspicious, or Need More Info."],
          ["🛡️", "You learn the defence", "Prepared statements, validation, least privilege, safe errors."]
        ],
        signals: [
          ["SQL-like syntax", "Quotes, comments, UNION, SELECT, OR, and timing commands are not normal user input."],
          ["Database error", "Visible backend errors can leak how the system works."],
          ["Timing anomaly", "A slow response after strange input can reveal blind injection."]
        ],
        demoTitle: "Simulation-style example",
        demoBadge: "Input clue",
        demo: `
      Username submitted:
      <span class="demo-highlight">[redacted SQL-style login bypass pattern]</span>
      <br><br>
      This is not a username. It is trying to change the login query.
    `
      },

      social: {
        title: "Social Engineering Simulation Brief",
        moduleName: "🎭 Social Engineering & Risk",
        intro: "This lesson prepares you to judge human requests, pressure, authority, trust, and process-bypassing behaviour.",
        desc: "In the simulation, you will decide whether a human request is safe, suspicious, or needs verification.",
        goal: "The attacker wants you to share secrets, approve access, hold a door, bypass a process, or trust a fake identity.",
        how: "Social engineering works by making the unsafe action feel helpful, urgent, polite, confidential, or normal.",
        mindset: "Security is not rude. If the request involves access, secrets, payments, or bypassing rules, verify it separately.",
        trap: "A confident, polite person with a believable story can be more dangerous than an obvious scam email.",
        prep: [
          ["🎭", "Identity check", "Does the person prove who they are through a trusted process?"],
          ["🚪", "Access check", "Are they asking to bypass a rule, badge system, approval step, or verification?"],
          ["🧠", "Pressure check", "Are they using urgency, authority, secrecy, or guilt to rush you?"]
        ],
        decisions: [
          ["Safe", "Use this when the request follows normal verification and does not ask for secrets or bypasses."],
          ["Suspicious", "Use this when someone asks for passwords, MFA codes, access, payments, or skipped checks."],
          ["Need More Info", "Use this when the story sounds believable but identity or process still needs verification."]
        ],
        comparison: {
          safe: "Reception checks the visitor calendar, prints a badge, and keeps the visitor waiting until the host arrives.",
          danger: "A contractor says their pass is in the van and asks someone to hold the secure door open."
        },
        flow: [
          ["🕵️", "You receive a human request", "Call, message, visitor, finance request, or IT support claim."],
          ["🔍", "You inspect the pressure", "Authority, urgency, secrecy, helpfulness, or guilt."],
          ["⚖️", "You decide safely", "Safe, Suspicious, or Need More Info."],
          ["📌", "You learn the rule", "Verify through a separate trusted channel."]
        ],
        signals: [
          ["Authority pressure", "The person acts too important or too urgent to be checked."],
          ["Secret request", "Passwords, MFA codes, and security answers should never be shared."],
          ["Process bypass", "Skipping approval, badge scans, callbacks, or checks is the real warning sign."]
        ],
        demoTitle: "Simulation-style example",
        demoBadge: "Human clue",
        demo: `
      “I’m from IT. I need your MFA code now or your account will be disabled.”
      <br><br>
      The voice may sound confident, but the request is the clue:
      <span class="demo-highlight">MFA codes should never be shared</span>.
    `
      }
    };

    function openLearningModule(type) {
      const data = learningData[type];

      if (!data) return;

      store.setState({
        currentAttack: type,
        currentLearningModule: type
      });

      renderLearningModule(type);
      navigateTo("learn");
    }

    function getMissionBrief(type) {
      const briefs = {
        phishing: {
          title: "Phishing Recognition",
          level: "Core Skill",
          summary: "This module trains you to look past professional design and verify the sender, destination, and request.",
          icon: "🎣",
          skillTitle: "Skill being trained",
          skillText: "Spot fake messages by checking domains, links, pressure, and unusual login requests.",
          rule: "Do not trust the appearance. Verify the destination.",
          readiness: 86,
          readinessText: "You are learning the exact clues that appear in the phishing challenge.",
          checklist: [
            ["Domain mismatch", "Lookalike domains, typos, or strange subdomains."],
            ["Urgency pressure", "Messages that push you to act before thinking."],
            ["Fake destination", "Links that do not go where they appear to go."]
          ]
        },

        bruteforce: {
          title: "Credential Attack Defence",
          level: "Auth Security",
          summary: "This module trains you to recognise login abuse patterns instead of judging one login attempt alone.",
          icon: "🔓",
          skillTitle: "Skill being trained",
          skillText: "Detect brute force, password spraying, credential stuffing, and MFA fatigue.",
          rule: "One failed login may be normal. A pattern tells the real story.",
          readiness: 78,
          readinessText: "Focus on volume, timing, repeated failures, and unusual login locations.",
          checklist: [
            ["Repeated failures", "Many attempts against one account in a short time."],
            ["Password spraying", "One password tested across many users."],
            ["MFA fatigue", "Repeated approval prompts sent to wear the user down."]
          ]
        },

        sqli: {
          title: "SQL Injection Awareness",
          level: "Web Security",
          summary: "This module trains you to recognise when input is being used to manipulate backend database logic.",
          icon: "💉",
          skillTitle: "Skill being trained",
          skillText: "Spot unsafe input, SQL-like input patterns, database errors, and suspicious query behaviour.",
          rule: "Treat user input as data, never as trusted code.",
          readiness: 82,
          readinessText: "Focus on strange symbols, database errors, delays, and query manipulation.",
          checklist: [
            ["SQL symbols", "Quotes, comments, UNION, SELECT, OR logic."],
            ["Database errors", "Errors that reveal backend structure."],
            ["Unexpected delay", "Slow responses after strange input can reveal blind injection."]
          ]
        },

        social: {
          title: "Social Engineering Defence",
          level: "Human Risk",
          summary: "This module trains you to recognise manipulation before the attacker gets secrets, access, or trust.",
          icon: "🎭",
          skillTitle: "Skill being trained",
          skillText: "Spot authority pressure, trust abuse, secret requests, and process bypassing.",
          rule: "Security is not rude. Verify through a separate trusted channel.",
          readiness: 80,
          readinessText: "Focus on the request itself, not just how confident or friendly the person sounds.",
          checklist: [
            ["Authority pressure", "Someone acts too important to be verified."],
            ["Secret request", "Passwords, MFA codes, or security answers are requested."],
            ["Process bypass", "You are asked to skip normal security checks."]
          ]
        }
      };

      return briefs[type] || briefs.phishing;
    }

    function renderLearningModule(type) {
      const data = learningData[type];

      if (!data) return;

      const title = document.getElementById("learnTitle");
      const intro = document.getElementById("learnIntro");
      const prepGrid = document.getElementById("learnPrepGrid");
      const decisionRules = document.getElementById("learnDecisionRules");
      const safeExample = document.getElementById("learnSafeExample");
      const dangerExample = document.getElementById("learnDangerExample");
      const moduleName = document.getElementById("learnModuleName");
      const desc = document.getElementById("learnModuleDesc");
      const goal = document.getElementById("learnGoal");
      const how = document.getElementById("learnHow");
      const mindset = document.getElementById("learnMindset");
      const trap = document.getElementById("learnTrap");
      const flow = document.getElementById("learnFlowVisual");
      const signals = document.getElementById("learnSignals");
      const demoTitle = document.getElementById("learnDemoTitle");
      const demoBadge = document.getElementById("learnDemoBadge");
      const demoMessage = document.getElementById("learnDemoMessage");

      if (title) title.textContent = data.title;
      if (intro) intro.textContent = data.intro;
      if (moduleName) moduleName.textContent = data.moduleName;
      if (desc) desc.textContent = data.desc;
      if (goal) goal.textContent = data.goal;
      if (how) how.textContent = data.how;
      if (mindset) mindset.textContent = data.mindset;
      if (trap) trap.textContent = data.trap;
      if (prepGrid) {
        prepGrid.innerHTML = data.prep.map(item => `
    <div class="sim-prep-card">
      <div class="sim-prep-icon">${item[0]}</div>
      <h4>${item[1]}</h4>
      <p>${item[2]}</p>
    </div>
  `).join("");
      }

      if (decisionRules) {
        decisionRules.innerHTML = data.decisions.map(item => `
    <div class="decision-rule">
      <div class="decision-rule-icon">
        ${item[0] === "Safe" ? "✓" : item[0] === "Suspicious" ? "!" : "?"}
      </div>
      <div>
        <strong>${item[0]}</strong>
        <span>${item[1]}</span>
      </div>
    </div>
  `).join("");
      }

      if (safeExample) safeExample.textContent = data.comparison.safe;
      if (dangerExample) dangerExample.textContent = data.comparison.danger;
      if (demoTitle) demoTitle.textContent = data.demoTitle;
      if (demoBadge) demoBadge.textContent = data.demoBadge;
      if (demoMessage) demoMessage.innerHTML = data.demo;

      if (flow) {
        flow.innerHTML = data.flow.map(item => `
      <div class="flow-node">
        <div class="flow-icon">${item[0]}</div>
        <div class="flow-copy">
          <h4>${item[1]}</h4>
          <span>${item[2]}</span>
        </div>
        <div class="flow-status"></div>
      </div>
    `).join("");
      }

      if (signals) {
        signals.innerHTML = data.signals.map(item => `
      <div class="signal-item">
        <div class="signal-dot">!</div>
        <div>
          <strong>${item[0]}</strong>
          <span>${item[1]}</span>
        </div>
      </div>
    `).join("");
      }

      const brief = getMissionBrief(type);

      const briefTitle = document.getElementById("briefTitle");
      const briefLevel = document.getElementById("briefLevel");
      const briefSummary = document.getElementById("briefSummary");
      const briefSkillIcon = document.getElementById("briefSkillIcon");
      const briefSkillTitle = document.getElementById("briefSkillTitle");
      const briefSkillText = document.getElementById("briefSkillText");
      const briefChecklist = document.getElementById("briefChecklist");
      const briefRule = document.getElementById("briefRule");
      const briefReadiness = document.getElementById("briefReadiness");
      const briefReadinessFill = document.getElementById("briefReadinessFill");
      const briefReadinessText = document.getElementById("briefReadinessText");

      if (briefTitle) briefTitle.textContent = brief.title;
      if (briefLevel) briefLevel.textContent = brief.level;
      if (briefSummary) briefSummary.textContent = brief.summary;
      if (briefSkillIcon) briefSkillIcon.textContent = brief.icon;
      if (briefSkillTitle) briefSkillTitle.textContent = brief.skillTitle;
      if (briefSkillText) briefSkillText.textContent = brief.skillText;
      if (briefRule) briefRule.textContent = brief.rule;
      if (briefReadiness) briefReadiness.textContent = `${brief.readiness}%`;
      if (briefReadinessFill) briefReadinessFill.style.width = `${brief.readiness}%`;
      if (briefReadinessText) briefReadinessText.textContent = brief.readinessText;

      if (briefChecklist) {
        briefChecklist.innerHTML = brief.checklist.map(item => `
      <div class="brief-check-item">
        <div class="brief-check-mark">!</div>
        <div>
          <strong>${item[0]}</strong>
          <span>${item[1]}</span>
        </div>
      </div>
    `).join("");
      }

      document.querySelectorAll(".learning-tab").forEach(tab => {
        tab.classList.toggle("active", tab.dataset.learnTab === type);
      });
    }

    function startLearningSimulation() {
      const state = store.getState();
      const type = state.currentLearningModule || state.currentAttack || "phishing";

      startSimulation(type);
    }

    function getModuleTitle(type) {
      const names = {
        phishing: "Phishing & AI-Generated Threats",
        bruteforce: "Credential Attacks & Access Control",
        sqli: "Web Exploits & Data Protection",
        social: "Social Engineering & Risk Awareness",
        final: "Final Cyber Awareness Assessment"
      };

      return names[type] || "Cybersecurity Scenario";
    }

    function getUsedChallengeFingerprints() {
      try {
        return JSON.parse(localStorage.getItem("usedChallengeFingerprints") || "[]");
      } catch {
        localStorage.removeItem("usedChallengeFingerprints");
        return [];
      }
    }

    function saveUsedChallengeFingerprints(list) {
      localStorage.setItem("usedChallengeFingerprints", JSON.stringify(list.slice(-600)));
    }

    function createSimpleHash(text) {
      let hash = 0;

      for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
      }

      return String(Math.abs(hash));
    }

    function makeChallengeFingerprint(challenge) {
      return createSimpleHash([
        challenge.type,
        challenge.difficulty,
        challenge.title,
        challenge.sender,
        challenge.senderMeta,
        challenge.body,
        challenge.correct
      ].join("|"));
    }

    function pickRandom(list) {
      return list[Math.floor(Math.random() * list.length)];
    }

    function randomNumber(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    function cleanTitle(title) {
      return String(title)
        .replace(/\s+—\s+(PHISH|AUTH|WEB|HUMAN|FINAL|CASE|V|ASSESS)-[A-Z0-9-]+/gi, "")
        .replace(/\s+—\s+Final Variant\s+[A-Z0-9-]+/gi, "")
        .replace(/\s+—\s+Variant\s+[A-Z0-9-]+/gi, "")
        .replace(/\s+—\s+[A-Z]+-[A-Z0-9-]+/gi, "")
        .replace(/\s+-\s+[A-Z]+-[A-Z0-9-]+/gi, "")
        .replace(/\s+—\s*$/g, "")
        .replace(/\s+-\s*$/g, "")
        .trim();
    }


    function randomReference(prefix) {
      return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    }



    function buildScenarioBody(paragraphs, signal) {
      return `
    ${paragraphs.map(p => `<p>${p}</p>`).join("")}
    ${signal ? `<div class="email-link">${signal}</div>` : ""}
  `;
    }

    function makePhishingChallenge(difficulty) {
      const companies = ["Northbridge Finance", "ApexCloud", "Halcyon Health", "Riverstone Logistics", "Manchester Digital Labs"];
      const tools = ["Microsoft 365", "Google Workspace", "Slack", "DocuSign", "Okta", "GitHub"];
      const departments = ["IT Security", "People Operations", "Finance", "Cloud Support", "Compliance"];
      const names = ["Amira Patel", "Daniel Reed", "Sophie Carter", "Marcus Hill", "Leah Thompson"];

      const company = pickRandom(companies);
      const tool = pickRandom(tools);
      const department = pickRandom(departments);
      const name = pickRandom(names);
      const ref = randomReference("PHISH");

      const templates = {
        easy: [
          () => ({
            title: "Password Reset Request",
            sender: `${department}`,
            senderMeta: `support@${company.toLowerCase().replaceAll(" ", "-")}-secure-login.com`,
            body: buildScenarioBody([
              `Your ${tool} password is due to expire today.`,
              `To avoid being locked out, you must confirm your username and password using the secure reset portal below.`,
              `The message looks professional, but the domain does not match the organisation's normal login domain.`
            ], `Reset password at ${company.toLowerCase().replaceAll(" ", "")}-secure-login.com`),
            correct: "suspicious",
            reason: "This is suspicious because it uses urgency, a fake login route, and a lookalike domain instead of a trusted internal route.",
            attackerGoal: "Steal credentials by making the user act before checking the source.",
            saferAction: "Go directly to the official company login page or contact IT through a trusted channel.",
            triggerTags: ["urgency", "credentials", "technical"],
            clues: [
              "The sender domain is not official.",
              "The message uses urgency.",
              "The request involves credentials."
            ]
          })
        ],

        hard: [
          () => ({
            title: `AI-Written Supplier Portal Update — ${ref}`,
            sender: "Procurement Operations",
            senderMeta: `procurement-alerts@${company.toLowerCase().replaceAll(" ", "")}-accessverify.net`,
            body: buildScenarioBody([
              "A polished message claims supplier payments are moving to a new portal.",
              "The message uses correct business language, mentions invoice workflows, and sounds professionally written.",
              "The link asks the user to sign in with Microsoft and approve an app that can read files and maintain access."
            ], "OAuth permissions requested: read files, read profile, maintain access"),
            correct: "suspicious",
            reason: "This is suspicious because the attack is not only asking for a login. It is asking for broad OAuth permissions through an external supplier-style domain.",
            attackerGoal: "Gain persistent cloud access without relying only on a stolen password.",
            saferAction: "Verify the supplier change through the internal procurement system or a trusted contact before approving anything.",
            triggerTags: ["authority", "technical", "credentials"],
            clues: [
              "The message asks for broad app permissions.",
              "The domain is not a normal company or supplier domain.",
              "The wording being professional does not make the request safe."
            ]
          }),

          () => ({
            title: `Safe Internal Training Reminder — ${ref}`,
            sender: "Security Awareness Team",
            senderMeta: `security@${company.toLowerCase().replaceAll(" ", "")}.co.uk`,
            body: buildScenarioBody([
              "The message reminds staff that annual security training is due this month.",
              "It does not ask for passwords, MFA codes, file downloads, payment details, or new app permissions.",
              "It says users can access the training through the normal company intranet if they prefer not to click the link."
            ], "Alternative route: Company intranet → Training → Security Awareness"),
            correct: "safe",
            reason: "This is safe because the sender, request, and verification route are consistent with normal company process.",
            attackerGoal: "No attacker behaviour is present in this scenario.",
            saferAction: "Use the intranet route if unsure.",
            triggerTags: [],
            clues: [
              "The sender domain is expected.",
              "No sensitive information is requested.",
              "The message gives a trusted alternative route."
            ]
          })
        ],

        expert: [
          () => ({
            title: `Deepfake Voice Follow-Up Email — ${ref}`,
            sender: `${name}, Executive Assistant`,
            senderMeta: `${name.toLowerCase().replaceAll(" ", ".")}@${company.toLowerCase().replaceAll(" ", "")}.co`,
            body: buildScenarioBody([
              "A senior manager appears to have left a voice note asking for urgent approval of a confidential file transfer.",
              "Minutes later, this email arrives saying: “As discussed on the call, approve the secure transfer before the 4pm board deadline.”",
              "The wording refers to a real meeting on the calendar, but the email comes from a slightly shortened domain and links to a consent page asking for access to cloud storage."
            ], "Approve encrypted board transfer"),
            correct: "suspicious",
            reason: "This is suspicious because it combines deepfake-style voice pressure, authority, urgency, a lookalike domain, and a cloud permission request.",
            attackerGoal: "Use voice realism and authority to make the victim skip verification.",
            saferAction: "Verify through a separate trusted channel before approving access.",
            triggerTags: ["authority", "urgency", "technical", "credentials"],
            clues: []
          }),

          () => ({
            title: `Legitimate Supplier Portal Change — ${ref}`,
            sender: "Procurement Operations",
            senderMeta: `procurement@${company.toLowerCase().replaceAll(" ", "")}.co.uk`,
            body: buildScenarioBody([
              "The procurement team announces that supplier invoices will now be submitted through a new internal portal.",
              "The message references a policy already announced in last week’s company newsletter.",
              "The link uses the official company domain, does not request passwords inside the email, and tells employees to access the portal through the normal company intranet if unsure."
            ], `Portal: intranet.${company.toLowerCase().replaceAll(" ", "")}.co.uk/procurement`),
            correct: "safe",
            reason: "This is safe because it gives a verifiable route through the intranet, uses the official domain, and does not pressure the user into bypassing normal process.",
            attackerGoal: "No attacker behaviour is present in this scenario.",
            saferAction: "Use the intranet route if unsure.",
            triggerTags: [],
            clues: []
          })
        ]
      };

      const challenge = pickRandom(templates[difficulty] || templates.hard)();

      return {
        ...challenge,
        type: "phishing",
        difficulty,
        takeaways: challenge.takeaways || [
          "AI-written phishing can sound professional.",
          "Check the domain, request, and permissions.",
          "Do not trust appearance alone."
        ]
      };
    }

    function makeCredentialChallenge(difficulty) {
      const users = ["alex.morgan", "sarah.khan", "dev.admin", "finance.ops", "svc_backup", "leah.thompson"];
      const locations = ["Manchester", "London", "Berlin", "Singapore", "São Paulo", "Toronto", "Mumbai"];
      const systems = ["VPN", "Okta", "Microsoft 365", "GitHub Enterprise", "Payroll Portal", "AWS Console"];
      const user = pickRandom(users);
      const system = pickRandom(systems);
      const ref = randomReference("AUTH");

      const templates = {
        easy: [
          () => ({
            title: `Repeated Login Failures — ${ref}`,
            sender: "Identity Monitoring System",
            senderMeta: "auth-monitor@company.local",
            body: buildScenarioBody([
              `User account: ${user}@company.com`,
              `System: ${system}`,
              `Failed login attempts: ${randomNumber(35, 90)} attempts in ${randomNumber(2, 6)} minutes.`,
              `The same account is being tested repeatedly from the same source.`
            ], "Authentication spike detected"),
            correct: "suspicious",
            type: "bruteforce",
            difficulty,
            reason: "This is suspicious because many failed login attempts against one account in a short time strongly suggests brute force activity.",
            clues: [
              "High number of failures.",
              "Short time window.",
              "Same account repeatedly targeted."
            ]
          })
        ],

        hard: [
          () => ({
            title: `Low-and-Slow Password Spraying — ${ref}`,
            sender: "SIEM Alert",
            senderMeta: "siem@company.local",
            body: buildScenarioBody([
              `Across the last 14 hours, ${randomNumber(180, 420)} users each had one failed login attempt.`,
              `The same password pattern was attempted across many accounts.`,
              `No single user triggered account lockout, but the pattern is spread across the organisation.`
            ], "Distributed login pattern detected"),
            correct: "suspicious",
            type: "bruteforce",
            difficulty,
            reason: "This is password spraying. The attacker avoids locking accounts by trying one or two common passwords across many users instead of attacking one account loudly.",
            clues: [
              "Many users are affected.",
              "Each user only has a small number of failures.",
              "The repeated password pattern matters more than the individual account activity."
            ]
          }),

          () => ({
            title: `Scheduled Service Account Login — ${ref}`,
            sender: "Directory Monitoring",
            senderMeta: "ad-monitor@company.local",
            body: buildScenarioBody([
              `Account: svc_backup`,
              `System: Internal File Backup Server`,
              `Login time: 02:00 AM exactly.`,
              `The same account has authenticated at this exact time every night for the last 90 days.`
            ], "Baseline matched"),
            correct: "safe",
            type: "bruteforce",
            difficulty,
            reason: "This is safe because it matches a normal scheduled service account pattern. Security monitoring should compare behaviour against baseline, not treat every automated login as malicious.",
            clues: [
              "The behaviour matches historical baseline.",
              "The login is scheduled.",
              "There are no failed attempts or unusual locations."
            ]
          })
        ],

        expert: [
          () => ({
            title: `MFA Fatigue With Successful Approval — ${ref}`,
            sender: "Identity Provider",
            senderMeta: "idp-alert@company.local",
            body: buildScenarioBody([
              `User: ${user}@company.com`,
              `Password accepted successfully from a new device.`,
              `${randomNumber(18, 52)} MFA push notifications were sent within ${randomNumber(2, 7)} minutes.`,
              `The final push was approved at ${randomNumber(22, 58)} seconds past the minute.`,
              `The user later reports they clicked approve because the prompts would not stop.`
            ], "MFA approval after repeated prompts"),
            correct: "suspicious",
            type: "bruteforce",
            difficulty,
            reason: "This is suspicious because the password may already be compromised. Repeated push notifications followed by approval is a classic MFA fatigue attack.",
            clues: []
          }),

          () => ({
            title: `Impossible Travel Session — ${ref}`,
            sender: "Conditional Access Monitor",
            senderMeta: "access-alert@company.local",
            body: buildScenarioBody([
              `User: ${user}@company.com`,
              `Successful ${system} login from ${pickRandom(locations)}.`,
              `A second successful login happened ${randomNumber(12, 28)} minutes later from ${pickRandom(locations)}.`,
              `Both sessions used valid passwords, but the physical travel time is impossible.`
            ], "Impossible travel detected"),
            correct: "suspicious",
            type: "bruteforce",
            difficulty,
            reason: "This is suspicious because valid credentials were used from impossible locations. That usually means credential compromise, session theft, or proxy-based account takeover.",
            clues: []
          })
        ]
      };

      const challenge = pickRandom(templates[difficulty] || templates.hard)();
      challenge.type = "bruteforce";
      challenge.difficulty = difficulty;
      return challenge;
    }

    function makeSQLIChallenge(difficulty) {
      const endpoints = ["/login", "/api/orders", "/product?id=", "/api/users/profile", "/search", "/account/reports"];
      const inputPatterns = [
        "Pseudo example: quote characters followed by always-true database logic (redacted)",
        "Pseudo example: union-style database enumeration attempt (redacted)",
        "Pseudo example: timing-based database probe (redacted)",
        "Pseudo example: comment-marker login bypass attempt (redacted)",
        "Pseudo example: error-based database fingerprinting attempt (redacted)",
        "Pseudo example: wildcard search manipulation attempt (redacted)"
      ];

      const endpoint = pickRandom(endpoints);
      const inputPattern = pickRandom(inputPatterns);
      const ref = randomReference("WEB");

      const templates = {
        easy: [
          () => ({
            title: `Suspicious Login Input — ${ref}`,
            sender: "Web Application Firewall",
            senderMeta: "waf-alert@company.local",
            body: buildScenarioBody([
              `Endpoint: ${endpoint}`,
              `The username field received input that does not look like a real username.`,
              `The input contains quote characters and logic operators commonly used to alter a database query.`
            ], inputPattern),
            correct: "suspicious",
            type: "sqli",
            difficulty,
            reason: "This is suspicious because the input is trying to change the SQL query logic rather than behave like normal user data.",
            clues: [
              "The input includes SQL-style symbols.",
              "The input does not look like normal user data.",
              "The input pattern tries to make a condition always true."
            ]
          })
        ],

        hard: [
          () => ({
            title: `Blind SQL Injection Timing Test — ${ref}`,
            sender: "Application Performance Monitor",
            senderMeta: "apm@company.local",
            body: buildScenarioBody([
              `Endpoint: ${endpoint}`,
              `The request produced no visible database error.`,
              `However, the response time increased from 180ms to ${randomNumber(4800, 6200)}ms immediately after a strange database-style input was submitted.`,
              `The attacker may be testing whether the database executes injected timing commands.`
            ], inputPattern),
            correct: "suspicious",
            type: "sqli",
            difficulty,
            reason: "This is suspicious because time-based SQL injection does not need visible errors. The attacker uses response delay to confirm whether injected SQL is being executed.",
            clues: [
              "The delay happens after unusual input.",
              "No visible error is required for blind SQL injection.",
              "Timing can reveal backend behaviour."
            ]
          }),

          () => ({
            title: `Normal Product Search Query — ${ref}`,
            sender: "Application Monitor",
            senderMeta: "app-monitor@company.local",
            body: buildScenarioBody([
              `Endpoint: /api/products/search`,
              `Query: category=electronics&sort=price_asc&limit=50`,
              `The request returned 200 OK with no database errors, no suspicious symbols, and no unusual timing change.`
            ], "Standard filtered search request"),
            correct: "safe",
            type: "sqli",
            difficulty,
            reason: "This is safe because the query uses normal parameters and does not contain SQL operators, comments, injected logic, database errors, or timing anomalies.",
            clues: [
              "The parameters are expected.",
              "There are no SQL metacharacters.",
              "The response is normal."
            ]
          })
        ],

        expert: [
          () => ({
            title: `Second-Order SQL Injection Indicator — ${ref}`,
            sender: "Database Error Monitor",
            senderMeta: "db-monitor@company.local",
            body: buildScenarioBody([
              `A user registered yesterday with a strange display name containing SQL comment syntax.`,
              `The registration completed without error because the value was stored as text.`,
              `Today, the weekly reporting job processed that display name and triggered a database syntax error.`,
              `The error appears delayed and disconnected from the original input.`
            ], `Stored value later triggered SQL error: [redacted SQL-style input pattern]${inputPattern}`),
            correct: "suspicious",
            type: "sqli",
            difficulty,
            reason: "This is suspicious because it suggests second-order SQL injection. The input pattern is stored harmlessly at first, then becomes dangerous later when another system processes it unsafely.",
            clues: []
          }),

          () => ({
            title: `Safe API Filter With Strict Parameters — ${ref}`,
            sender: "API Gateway",
            senderMeta: "gateway@company.local",
            body: buildScenarioBody([
              `Endpoint: /api/reports`,
              `Parameters: startDate=2026-04-01&endDate=2026-04-30&department=finance`,
              `The request passed schema validation, used expected parameter names, and did not produce database errors or timing anomalies.`
            ], "Schema validation passed"),
            correct: "safe",
            type: "sqli",
            difficulty,
            reason: "This is safe because the input matches expected schema and does not contain signs of SQL manipulation.",
            clues: []
          })
        ]
      };

      return pickRandom(templates[difficulty] || templates.hard)();
    }

    function makeSocialChallenge(difficulty) {
      const roles = ["IT engineer", "finance manager", "building contractor", "CEO assistant", "external auditor", "new starter"];
      const names = ["Owen Blake", "Priya Shah", "Maya Collins", "Harvey Stone", "Nadia Hussain"];
      const channels = ["phone call", "Teams message", "front desk conversation", "email follow-up", "reception request"];
      const role = pickRandom(roles);
      const name = pickRandom(names);
      const channel = pickRandom(channels);
      const ref = randomReference("HUMAN");

      const templates = {
        easy: [
          () => ({
            title: `Password Request From “IT” — ${ref}`,
            sender: "Helpdesk Conversation",
            senderMeta: channel,
            body: buildScenarioBody([
              `"Hi, this is ${name} from IT. We are fixing account access issues."`,
              `"Can you quickly confirm your password so I can test whether your account is syncing correctly?"`,
              `The person sounds confident and helpful, but the request breaks basic security rules.`
            ], "Caller requests password"),
            correct: "suspicious",
            type: "social",
            difficulty,
            reason: "This is suspicious because legitimate IT staff should never ask for a user's password.",
            clues: [
              "The person asks for a password.",
              "They use authority.",
              "They make the request sound routine."
            ]
          })
        ],

        hard: [
          () => ({
            title: `Tailgating Attempt At Reception — ${ref}`,
            sender: "Physical Security Report",
            senderMeta: "Building entrance log",
            body: buildScenarioBody([
              `A person wearing a contractor badge says they are late for a network cabling job.`,
              `They are carrying heavy equipment and ask an employee to hold the secure door open because their pass is “in the van”.`,
              `The request feels polite and believable, but it bypasses access control.`
            ], "Door access requested without badge scan"),
            correct: "suspicious",
            type: "social",
            difficulty,
            reason: "This is suspicious because the attacker is using helpfulness and time pressure to bypass physical access controls. Everyone should badge in individually.",
            clues: [
              "The person wants entry without scanning a badge.",
              "They use inconvenience to create sympathy.",
              "The normal access process is being bypassed."
            ]
          }),

          () => ({
            title: `Authorised Social Engineering Test Notice — ${ref}`,
            sender: "Security Team",
            senderMeta: "security@company.co.uk",
            body: buildScenarioBody([
              `The security team announces that an authorised awareness exercise will happen this week.`,
              `The message does not ask for credentials, files, MFA codes, or access approvals.`,
              `It simply explains that staff should follow normal verification rules and report anything suspicious.`
            ], "Awareness exercise notice"),
            correct: "safe",
            type: "social",
            difficulty,
            reason: "This is safe because it is a general awareness notice from the security team and does not ask users to bypass controls or reveal sensitive information.",
            clues: [
              "No secret information is requested.",
              "The instruction is to follow normal process.",
              "The sender context is appropriate."
            ]
          })
        ],

        expert: [
          () => ({
            title: `Deepfake Executive Payment Pressure — ${ref}`,
            sender: "Finance Escalation Transcript",
            senderMeta: "Voice note and follow-up message",
            body: buildScenarioBody([
              `A voice note appears to come from a senior executive.`,
              `"I am about to enter a confidential meeting. I need this supplier payment released now. Do not call me because this is sensitive."`,
              `A follow-up message asks the finance employee to skip the usual dual approval because the board deadline is approaching.`,
              `The voice sounds realistic and references a real supplier, but the request bypasses financial controls.`
            ], "Request: bypass dual approval"),
            correct: "suspicious",
            type: "social",
            difficulty,
            reason: "This is suspicious because it uses authority, urgency, confidentiality, and a request to bypass process. Deepfake or not, the control bypass is the real warning sign.",
            clues: []
          }),

          () => ({
            title: `Legitimate Visitor Verification — ${ref}`,
            sender: "Reception Desk",
            senderMeta: "Visitor access process",
            body: buildScenarioBody([
              `A visitor says they are here for an interview and provides the name of the employee they are meeting.`,
              `Reception checks the calendar, verifies the appointment, prints a temporary badge, and asks the visitor to wait until the host arrives.`,
              `The visitor is not allowed through the secure area alone.`
            ], "Visitor held until host arrives"),
            correct: "safe",
            type: "social",
            difficulty,
            reason: "This is safe because the visitor is verified through the expected process and is not allowed to bypass physical access controls.",
            clues: []
          })
        ]
      };

      return pickRandom(templates[difficulty] || templates.hard)();
    }

    function getQuestionSeed() {
      const now = new Date();

      return [
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
        Math.random().toString(36).slice(2),
        performance.now()
      ].join("-");
    }

    function makeUniqueScenarioID(type, difficulty, index) {
      return `${type.toUpperCase()}-${difficulty.toUpperCase()}-${index + 1}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }

    function shuffleArray(array) {
      return [...array].sort(() => Math.random() - 0.5);
    }

    function makeUniqueQuestionFromTemplate(type, difficulty, index) {
      const id = makeUniqueScenarioID(type, difficulty, index);

      const companyPool = [
        "Northbridge Finance",
        "ApexCloud Systems",
        "Halcyon Health",
        "Riverstone Logistics",
        "Manchester Digital Labs",
        "BrightForge Studios",
        "Crownwell Education",
        "Atlas Retail Group",
        "Oakline Energy",
        "Silvergate Housing"
      ];

      const peoplePool = [
        "Amira Patel",
        "Daniel Reed",
        "Sophie Carter",
        "Marcus Hill",
        "Leah Thompson",
        "Priya Shah",
        "Owen Blake",
        "Nadia Hussain",
        "Maya Collins",
        "Harvey Stone"
      ];

      const company = companyPool[index % companyPool.length];
      const person = peoplePool[index % peoplePool.length];

      const questionSets = {
        phishing: [
          {
            title: "Fake Password Expiry Portal",
            sender: "IT Security Desk",
            senderMeta: `security-alerts@${company.toLowerCase().replaceAll(" ", "-")}-login.net`,
            body: buildScenarioBody([
              `A message claims your ${company} account password will expire today.`,
              "It asks you to use a link inside the email to keep access.",
              "The page looks branded, but the sender domain does not match the real company domain."
            ], "Action requested: sign in through external reset portal"),
            correct: "suspicious",
            reason: "This is suspicious because it uses urgency, a lookalike domain, and an external login route.",
            attackerGoal: "Steal the user's login details through a fake password reset page.",
            saferAction: "Go directly to the official login page or contact IT through a trusted route.",
            triggerTags: ["urgency", "credentials", "technical"],
            clues: ["Check the sender domain.", "The reset link is external.", "The message creates urgency."]
          },
          {
            title: "Normal Security Training Reminder",
            sender: "Security Awareness Team",
            senderMeta: `security@${company.toLowerCase().replaceAll(" ", "")}.co.uk`,
            body: buildScenarioBody([
              "The message reminds employees to complete annual awareness training.",
              "It does not ask for passwords, MFA codes, payments, downloads, or new permissions.",
              "It says the same training can be reached through the normal company intranet."
            ], "Alternative route: intranet → training → security awareness"),
            correct: "safe",
            reason: "This is safe because it uses a normal sender, makes a normal request, and provides a trusted alternative route.",
            attackerGoal: "No attacker behaviour is present.",
            saferAction: "Use the intranet route if unsure.",
            triggerTags: [],
            clues: ["Correct sender context.", "No sensitive request.", "Trusted alternative route is provided."]
          },
          {
            title: "OAuth Consent Trap",
            sender: "Document Sharing Service",
            senderMeta: `documents@${company.toLowerCase().replaceAll(" ", "")}-fileshare.app`,
            body: buildScenarioBody([
              `${person} appears to have shared a document with you.`,
              "The link opens a Microsoft-style consent page rather than a normal document preview.",
              "The requested app permissions include reading files and maintaining access."
            ], "OAuth request: read files, read profile, maintain access"),
            correct: "suspicious",
            reason: "This is suspicious because the user may be granting cloud access, not just opening a document.",
            attackerGoal: "Gain persistent access through malicious OAuth permissions.",
            saferAction: "Do not approve the app. Verify the document through a trusted internal channel.",
            triggerTags: ["technical", "credentials"],
            clues: ["The risk is in the permissions.", "The domain is not clearly trusted.", "The app asks to maintain access."]
          },
          {
            title: "Invoice Attachment With Safe Process",
            sender: "Finance Operations",
            senderMeta: `finance@${company.toLowerCase().replaceAll(" ", "")}.co.uk`,
            body: buildScenarioBody([
              "Finance sends a monthly invoice reminder.",
              "The message says invoices must be viewed through the existing finance portal.",
              "It does not include an attachment, password request, or external sign-in page."
            ], "Use existing finance portal"),
            correct: "safe",
            reason: "This is safe because it follows the existing process and avoids risky shortcuts.",
            attackerGoal: "No attacker behaviour is present.",
            saferAction: "Access the finance portal directly.",
            triggerTags: [],
            clues: ["Normal internal process.", "No external login.", "No attachment pressure."]
          },
          {
            title: "AI-Written Executive File Request",
            sender: `${person}, Executive Office`,
            senderMeta: `${person.toLowerCase().replaceAll(" ", ".")}@${company.toLowerCase().replaceAll(" ", "")}.co`,
            body: buildScenarioBody([
              "The email is polished and refers to a real meeting.",
              "It asks you to approve access to a confidential board folder before the meeting starts.",
              "The sender domain is slightly shortened and the approval page requests cloud storage access."
            ], "Approve confidential folder access"),
            correct: "suspicious",
            reason: "This is suspicious because it combines authority, urgency, a subtle domain mismatch, and a permission request.",
            attackerGoal: "Use authority and realistic wording to make the victim approve cloud access.",
            saferAction: "Verify with the executive office through a separate trusted channel.",
            triggerTags: ["authority", "urgency", "technical"],
            clues: ["Subtle domain mismatch.", "Authority pressure.", "Cloud access request."]
          },
          {
            title: "Delivery Notification With No Sensitive Request",
            sender: "Facilities Desk",
            senderMeta: `facilities@${company.toLowerCase().replaceAll(" ", "")}.co.uk`,
            body: buildScenarioBody([
              "Facilities says a parcel has arrived at reception.",
              "The message tells the employee to collect it with their staff ID.",
              "It does not ask for login details, payment, file download, or external verification."
            ], "Collect from reception with staff ID"),
            correct: "safe",
            reason: "This is safe because the request is physical, simple, and follows a normal workplace process.",
            attackerGoal: "No attacker behaviour is present.",
            saferAction: "Collect it through reception as normal.",
            triggerTags: [],
            clues: ["No credential request.", "Normal workplace process.", "No external link."]
          },
          {
            title: "Fake Shared Payroll Document",
            sender: "Payroll Department",
            senderMeta: `payroll@${company.toLowerCase().replaceAll(" ", "")}-secure-docs.net`,
            body: buildScenarioBody([
              "The email says your payslip correction is ready.",
              "It asks you to sign in through a secure document portal.",
              "The sender domain includes the company name but is not the official company domain."
            ], "Open payroll correction document"),
            correct: "suspicious",
            reason: "This is suspicious because payroll is used as bait and the link goes through a lookalike external document portal.",
            attackerGoal: "Steal credentials using a fake payroll document.",
            saferAction: "Use the official HR or payroll portal directly.",
            triggerTags: ["credentials", "technical"],
            clues: ["External payroll domain.", "Sensitive payroll topic.", "Login requested."]
          }
        ],

        bruteforce: [
          {
            title: "Single User Brute Force Spike",
            sender: "Identity Monitoring System",
            senderMeta: "auth-monitor@company.local",
            body: buildScenarioBody([
              `Account: ${person.toLowerCase().replaceAll(" ", ".")}@company.com`,
              `There were ${randomNumber(45, 120)} failed login attempts in ${randomNumber(3, 8)} minutes.`,
              "The attempts target the same account repeatedly."
            ], "Authentication spike detected"),
            correct: "suspicious",
            reason: "This is suspicious because repeated failures against one account in a short time suggest brute force activity.",
            attackerGoal: "Guess the password through repeated automated attempts.",
            saferAction: "Temporarily lock the account, alert the user, and review source IPs.",
            triggerTags: ["credentials", "technical"],
            clues: ["High failure count.", "Short time period.", "Same account targeted."]
          },
          {
            title: "Normal Backup Service Login",
            sender: "Directory Monitor",
            senderMeta: "directory-monitor@company.local",
            body: buildScenarioBody([
              "The service account svc_backup logged in at exactly 02:00.",
              "This has happened every night for the last 120 days.",
              "There are no failed attempts, new locations, new devices, or permission changes."
            ], "Baseline matched"),
            correct: "safe",
            reason: "This is safe because it matches a known scheduled service account baseline.",
            attackerGoal: "No attacker behaviour is present.",
            saferAction: "Continue monitoring baseline behaviour.",
            triggerTags: [],
            clues: ["Known service account.", "Scheduled login.", "No unusual changes."]
          },
          {
            title: "Password Spraying Across Staff",
            sender: "SIEM Alert",
            senderMeta: "siem@company.local",
            body: buildScenarioBody([
              `${randomNumber(180, 420)} users each had one failed login attempt.`,
              "The same password pattern was tried across many accounts.",
              "No single user triggered account lockout."
            ], "One password pattern across many accounts"),
            correct: "suspicious",
            reason: "This is suspicious because it is password spraying, where the attacker avoids lockouts by spreading attempts across many users.",
            attackerGoal: "Find one user using a weak or common password.",
            saferAction: "Block the source, force password review, and check for exposed credentials.",
            triggerTags: ["credentials", "technical"],
            clues: ["Many users affected.", "Low failures per user.", "Same password pattern."]
          },
          {
            title: "Expected New Device Login",
            sender: "Conditional Access Monitor",
            senderMeta: "access-monitor@company.local",
            body: buildScenarioBody([
              `${person} logged in from a new laptop.`,
              "The device was enrolled through the normal company device setup process.",
              "MFA was completed once and the location matches the employee's office."
            ], "Device enrolment confirmed"),
            correct: "safe",
            reason: "This is safe because the new device login is backed by expected enrolment, MFA, and location context.",
            attackerGoal: "No attacker behaviour is present.",
            saferAction: "Keep the device in normal monitoring.",
            triggerTags: [],
            clues: ["Device enrolment confirmed.", "Location matches.", "MFA was normal."]
          },
          {
            title: "MFA Fatigue Pattern",
            sender: "Identity Provider",
            senderMeta: "mfa-alert@company.local",
            body: buildScenarioBody([
              `${person} received ${randomNumber(20, 50)} MFA push notifications in a few minutes.`,
              "The password was accepted before the prompts began.",
              "The final prompt was approved from a new device."
            ], "MFA approval after repeated prompts"),
            correct: "suspicious",
            reason: "This is suspicious because repeated MFA prompts followed by approval strongly suggests MFA fatigue.",
            attackerGoal: "Annoy the user into approving a login they did not start.",
            saferAction: "Revoke sessions, reset password, and investigate the accepted password event.",
            triggerTags: ["urgency", "credentials"],
            clues: ["Repeated MFA prompts.", "New device.", "Approval after pressure."]
          },
          {
            title: "Impossible Travel Login",
            sender: "Access Control Monitor",
            senderMeta: "access-alert@company.local",
            body: buildScenarioBody([
              `${person} logged in successfully from Manchester.`,
              "Nineteen minutes later, the same account logged in from Singapore.",
              "Both logins used the correct password."
            ], "Impossible travel detected"),
            correct: "suspicious",
            reason: "This is suspicious because valid credentials from impossible locations can indicate account compromise.",
            attackerGoal: "Use stolen credentials while appearing like a real login.",
            saferAction: "Block the session, require password reset, and check token/session theft.",
            triggerTags: ["credentials", "technical"],
            clues: ["Valid password does not prove safety.", "Locations are impossible.", "Session could be stolen."]
          },
          {
            title: "One Failed Login From Known User",
            sender: "Login Monitor",
            senderMeta: "login-monitor@company.local",
            body: buildScenarioBody([
              `${person} entered a wrong password once.`,
              "The second attempt succeeded with MFA.",
              "The device, IP address, and location match their normal pattern."
            ], "One failed attempt followed by normal MFA"),
            correct: "safe",
            reason: "This is safe because one failed login followed by normal MFA and matching context is usually normal user error.",
            attackerGoal: "No attacker behaviour is present.",
            saferAction: "No urgent action needed unless the pattern repeats.",
            triggerTags: [],
            clues: ["Only one failure.", "Normal location.", "MFA completed normally."]
          }
        ],

        sqli: [
          {
            title: "Classic Login Injection",
            sender: "Web Application Firewall",
            senderMeta: "waf-alert@company.local",
            body: buildScenarioBody([
              "A login form received input that does not look like a username.",
              "The input contains quotes and SQL-style logic.",
              "A database error appeared after submission."
            ], "[redacted SQL-style login bypass pattern]"),
            correct: "suspicious",
            reason: "This is suspicious because the input is trying to alter SQL logic rather than act as normal user data.",
            attackerGoal: "Bypass authentication or test whether the login query is vulnerable.",
            saferAction: "Use parameterised queries and review the endpoint logs.",
            triggerTags: ["technical"],
            clues: ["SQL symbols.", "Database error.", "Input is not normal user data."]
          },
          {
            title: "Normal Report Filter",
            sender: "API Gateway",
            senderMeta: "gateway@company.local",
            body: buildScenarioBody([
              "A report request uses startDate, endDate, department, and export format.",
              "The parameters match the expected API schema.",
              "There are no SQL operators, no database errors, and no abnormal delays."
            ], "Schema validation passed"),
            correct: "safe",
            reason: "This is safe because the request uses expected parameters and normal application behaviour.",
            attackerGoal: "No attacker behaviour is present.",
            saferAction: "Continue normal logging and validation.",
            triggerTags: [],
            clues: ["Expected parameters.", "No SQL symbols.", "Normal response."]
          },
          {
            title: "Blind Timing Injection",
            sender: "Application Performance Monitor",
            senderMeta: "apm@company.local",
            body: buildScenarioBody([
              "A search request produced no visible error.",
              `After unusual input was submitted, response time increased from 180ms to ${randomNumber(4800, 6500)}ms.`,
              "The delay only appears when database-style timing syntax is included."
            ], "Timing anomaly after unusual input"),
            correct: "suspicious",
            reason: "This is suspicious because blind SQL injection can be detected through timing even without visible errors.",
            attackerGoal: "Confirm backend SQL execution without triggering obvious errors.",
            saferAction: "Investigate query handling and use prepared statements.",
            triggerTags: ["technical"],
            clues: ["No visible error needed.", "Timing changed.", "Database-style input caused delay."]
          },
          {
            title: "Safe Product Search",
            sender: "Application Monitor",
            senderMeta: "app-monitor@company.local",
            body: buildScenarioBody([
              "A product search request uses category, sort order, and limit.",
              "The request returns 200 OK.",
              "No SQL-like input, unexpected output, or abnormal timing appears."
            ], "category=electronics&sort=price_asc&limit=50"),
            correct: "safe",
            reason: "This is safe because the input matches expected product search behaviour.",
            attackerGoal: "No attacker behaviour is present.",
            saferAction: "Keep schema validation and normal logging.",
            triggerTags: [],
            clues: ["Normal filter values.", "No database error.", "Expected response."]
          },
          {
            title: "Second-Order Injection",
            sender: "Database Error Monitor",
            senderMeta: "db-monitor@company.local",
            body: buildScenarioBody([
              "A user profile was created yesterday with strange SQL comment characters in the display name.",
              "The profile saved successfully at the time.",
              "Today, a reporting job processed that stored value and triggered a database syntax error."
            ], "Stored value caused delayed SQL error"),
            correct: "suspicious",
            reason: "This is suspicious because stored input may become dangerous later when another system processes it unsafely.",
            attackerGoal: "Plant an unsafe input pattern that triggers later inside a different backend process.",
            saferAction: "Sanitise output contexts and use prepared statements everywhere.",
            triggerTags: ["technical"],
            clues: ["Delayed error.", "Stored value.", "Backend job triggered the issue."]
          },
          {
            title: "Expected Form Validation Failure",
            sender: "Form Validator",
            senderMeta: "validator@company.local",
            body: buildScenarioBody([
              "A user typed letters into a field that expects a number.",
              "The application rejected the input with a normal validation message.",
              "No database error, SQL syntax, or abnormal delay occurred."
            ], "Validation message: please enter a number"),
            correct: "safe",
            reason: "This is safe because the application rejected invalid input normally and did not expose backend behaviour.",
            attackerGoal: "No attacker behaviour is present.",
            saferAction: "Continue enforcing validation.",
            triggerTags: [],
            clues: ["Normal validation.", "No SQL-style suspicious input.", "No backend error."]
          },
          {
            title: "UNION Data Extraction Attempt",
            sender: "Web Application Firewall",
            senderMeta: "waf-alert@company.local",
            body: buildScenarioBody([
              "An API request contains a redacted database-extraction pattern inside a query parameter.",
              "The request appears to probe sensitive account fields.",
              "The endpoint is not supposed to accept raw database logic."
            ], "[redacted database extraction pattern]"),
            correct: "suspicious",
            reason: "This is suspicious because the redacted input pattern appears to attempt database extraction.",
            attackerGoal: "Extract sensitive records from the database.",
            saferAction: "Block the request, review logs, and check query parameterisation.",
            triggerTags: ["technical"],
            clues: ["Database-extraction pattern.", "Sensitive account fields.", "Query parameter abuse."]
          }
        ],

        social: [
          {
            title: "IT Password Request",
            sender: "Helpdesk Conversation",
            senderMeta: "Phone call transcript",
            body: buildScenarioBody([
              `"Hi, this is ${person} from IT."`,
              "\"We are fixing account access issues.\"",
              "\"Can you confirm your password so I can test the account sync?\""
            ], "Caller asks for password"),
            correct: "suspicious",
            reason: "This is suspicious because legitimate IT staff should never ask for a user's password.",
            attackerGoal: "Trick the user into revealing credentials.",
            saferAction: "Refuse and contact IT through the official helpdesk route.",
            triggerTags: ["authority", "credentials", "social"],
            clues: ["Password requested.", "Authority used.", "Request breaks policy."]
          },
          {
            title: "Verified Visitor Process",
            sender: "Reception Desk",
            senderMeta: "Visitor access log",
            body: buildScenarioBody([
              "A visitor arrives for an interview.",
              "Reception checks the calendar, prints a temporary badge, and asks them to wait.",
              "The visitor is not allowed into the secure area until the host arrives."
            ], "Visitor held until host arrives"),
            correct: "safe",
            reason: "This is safe because the visitor is verified and does not bypass access controls.",
            attackerGoal: "No attacker behaviour is present.",
            saferAction: "Continue following the visitor process.",
            triggerTags: [],
            clues: ["Calendar checked.", "Badge issued.", "No secure access alone."]
          },
          {
            title: "Contractor Tailgating Attempt",
            sender: "Physical Security Report",
            senderMeta: "Building entrance",
            body: buildScenarioBody([
              "A person wearing a contractor jacket says they are late for a cabling job.",
              "They ask an employee to hold the secure door because their pass is in the van.",
              "They seem polite and believable, but they are trying to enter without scanning a badge."
            ], "Door access requested without badge scan"),
            correct: "suspicious",
            reason: "This is suspicious because the person is trying to bypass physical access control.",
            attackerGoal: "Enter a secure area without authorisation.",
            saferAction: "Do not hold the door. Send them to reception or security.",
            triggerTags: ["social", "urgency"],
            clues: ["No badge scan.", "Time pressure.", "Physical access bypass."]
          },
          {
            title: "Normal Access Request Through Ticket",
            sender: "IT Service Desk",
            senderMeta: "ticket-system@company.co.uk",
            body: buildScenarioBody([
              `${person} requests access to a shared folder.`,
              "The request is submitted through the official ticket system.",
              "Manager approval is attached and the access level matches their role."
            ], "Ticket approved by manager"),
            correct: "safe",
            reason: "This is safe because the request follows the expected approval process.",
            attackerGoal: "No attacker behaviour is present.",
            saferAction: "Process the ticket normally.",
            triggerTags: [],
            clues: ["Official ticket.", "Manager approval.", "Role-appropriate access."]
          },
          {
            title: "Executive Payment Pressure",
            sender: "Finance Escalation Transcript",
            senderMeta: "Voice note and message",
            body: buildScenarioBody([
              "A voice note appears to come from a senior executive.",
              "\"I need this supplier payment released now. Do not call me because this is confidential.\"",
              "The follow-up message asks finance to skip dual approval."
            ], "Request: bypass payment approval"),
            correct: "suspicious",
            reason: "This is suspicious because it uses authority, urgency, secrecy, and asks for process bypass.",
            attackerGoal: "Force a payment by making the user skip controls.",
            saferAction: "Follow the payment approval process and verify through a separate trusted channel.",
            triggerTags: ["authority", "urgency", "social"],
            clues: ["Do not call back.", "Dual approval bypass.", "Executive pressure."]
          },
          {
            title: "Security Awareness Drill Notice",
            sender: "Security Team",
            senderMeta: "security@company.co.uk",
            body: buildScenarioBody([
              "The security team announces an awareness exercise this week.",
              "The message does not ask for credentials, files, MFA codes, or access approvals.",
              "It reminds staff to report anything suspicious through the normal channel."
            ], "Report suspicious activity through normal channel"),
            correct: "safe",
            reason: "This is safe because it gives general awareness guidance and does not ask users to bypass controls.",
            attackerGoal: "No attacker behaviour is present.",
            saferAction: "Follow the reporting process.",
            triggerTags: [],
            clues: ["No secrets requested.", "Normal reporting channel.", "No process bypass."]
          },
          {
            title: "MFA Code Request Over Chat",
            sender: `${person} from IT Support`,
            senderMeta: "Teams message",
            body: buildScenarioBody([
              "\"We are checking sign-in issues on your account.\"",
              "\"You will receive a six-digit code now.\"",
              "\"Please send it to me so I can confirm the fix worked.\""
            ], "Request: share MFA code"),
            correct: "suspicious",
            reason: "This is suspicious because MFA codes must never be shared with another person.",
            attackerGoal: "Use the victim's MFA code to complete an attacker-controlled login.",
            saferAction: "Do not share the code. Report the message to IT security.",
            triggerTags: ["authority", "credentials", "social"],
            clues: ["MFA code requested.", "IT authority used.", "External confirmation is unsafe."]
          }
        ]
      };

      const pool = questionSets[type] || questionSets.phishing;
      const base = pool[index % pool.length];

      return {
        ...base,
        type,
        difficulty,
        title: `${base.title} — ${id}`,
        uniqueID: id,
        takeaways: base.takeaways || [
          "Check the source, request, behaviour, and verification route.",
          "Professional wording does not automatically make something safe.",
          "A safe decision comes from evidence, not appearance."
        ]
      };
    }

    function generateOneChallenge(type, difficulty, attempt = 0) {
      return makeUniqueQuestionFromTemplate(type, difficulty, attempt);
    }

    function generateChallenges(type) {
      const selectedDifficulty = store.getState().difficulty || "easy";

      const difficulty =
        selectedDifficulty === "expert"
          ? "expert"
          : selectedDifficulty === "hard"
            ? "hard"
            : "easy";

      const questionCount =
        difficulty === "easy" ? 4 :
          difficulty === "hard" ? 6 :
            7;

      const selected = [];
      const fingerprints = new Set();

      let attempt = 0;

      while (selected.length < questionCount && attempt < 100) {
        const challenge = generateOneChallenge(type, difficulty, attempt);
        const fingerprint = makeChallengeFingerprint(challenge);

        if (!fingerprints.has(fingerprint)) {
          fingerprints.add(fingerprint);
          selected.push(challenge);
        }

        attempt++;
      }

      return shuffleArray(selected).map((challenge, index) => {
        const cleaned = {
          ...challenge,
          title: challenge.title,
          body: `
        ${challenge.body}
        <p style="font-size:0.72rem; color:var(--text-tertiary); margin-top:14px;">
          Unique scenario ID: ${escapeHTML(challenge.uniqueID || randomReference("CASE"))}
        </p>
      `
        };

        if (difficulty === "easy") {
          return {
            ...cleaned,
            clues: cleaned.clues && cleaned.clues.length > 0
              ? cleaned.clues
              : [
                "Check the sender or source carefully.",
                "Look at the link, request, or behaviour.",
                "Ask whether the action follows normal process."
              ]
          };
        }

        if (difficulty === "hard") {
          return {
            ...cleaned,
            clues: cleaned.clues && cleaned.clues.length > 0
              ? cleaned.clues.slice(0, 2)
              : [
                "Look for a mismatch between appearance and behaviour.",
                "Check whether normal process is being bypassed."
              ]
          };
        }

        return {
          ...cleaned,
          clues: []
        };
      });
    }

    function generateChallenges(type) {
      const selectedDifficulty = store.getState().difficulty || "easy";

      const difficulty = selectedDifficulty === "expert"
        ? "expert"
        : selectedDifficulty === "hard"
          ? "hard"
          : "easy";

      const questionCount =
        difficulty === "easy" ? 4 :
          difficulty === "hard" ? 6 :
            7;

      const used = getUsedChallengeFingerprints();
      const usedSet = new Set(used);
      const selected = [];

      let attempts = 0;

      while (selected.length < questionCount && attempts < 140) {
        const challenge = generateOneChallenge(type, difficulty, attempts);
        const fingerprint = makeChallengeFingerprint(challenge);

        const alreadySelected = selected.some(item => makeChallengeFingerprint(item) === fingerprint);

        if (!usedSet.has(fingerprint) && !alreadySelected) {
          selected.push(challenge);
          usedSet.add(fingerprint);
          used.push(fingerprint);
        }

        attempts++;
      }

      while (selected.length < questionCount) {
        const fallback = generateOneChallenge(type, difficulty, attempts);

        fallback.title = `${fallback.title} — Variant ${randomReference("V")}`;
        fallback.body += `
      <p style="font-size:0.78rem; color:var(--text-tertiary);">
        Scenario variant ID: ${randomReference("CASE")}
      </p>
    `;

        selected.push(fallback);
        used.push(makeChallengeFingerprint(fallback));
        attempts++;
      }

      saveUsedChallengeFingerprints(used);

      return selected.map(challenge => {
        if (difficulty === "easy") {
          return {
            ...challenge,
            clues: challenge.clues && challenge.clues.length > 0
              ? challenge.clues
              : [
                "Check the sender or source carefully.",
                "Look at the link, request, or behaviour.",
                "Ask whether the action follows normal process."
              ]
          };
        }

        if (difficulty === "hard") {
          return {
            ...challenge,
            clues: challenge.clues && challenge.clues.length > 0
              ? challenge.clues.slice(0, 2)
              : [
                "Look for a mismatch between appearance and behaviour.",
                "Check whether normal process is being bypassed."
              ]
          };
        }

        return {
          ...challenge,
          clues: []
        };
      });
    }


    const DifficultyProfileService = {
      profiles: {
        easy: { name: "easy", minBody: 350, minClues: 2, maxClues: 3, needsRedHerring: false },
        medium: { name: "medium", minBody: 500, minClues: 3, maxClues: 5, needsRedHerring: false },
        hard: { name: "hard", minBody: 700, minClues: 4, maxClues: 7, needsRedHerring: true },
        final: { name: "final", minBody: 750, minClues: 4, maxClues: 7, needsRedHerring: true }
      },
      normalise(level) {
        if (level === "expert") return "hard";
        if (level === "hard") return "medium";
        return this.profiles[level] ? level : "easy";
      },
      get(level) {
        return this.profiles[this.normalise(level)] || this.profiles.easy;
      }
    };

    const QuestionBankService = {
      topics: ["phishing", "bruteforce", "sqli", "social"],
      labels: {
        phishing: "phishing and AI threat",
        bruteforce: "credential attack",
        sqli: "SQL injection awareness",
        social: "social engineering"
      },
      contexts: [
        ["Northbridge Finance", "Amira Patel", "finance assistant", "Finance Operations", "4:42 PM before month-end close", "northbridgefinance.co.uk"],
        ["ApexCloud Systems", "Daniel Reed", "cloud support analyst", "Platform Support", "9:15 AM during service desk handover", "apexcloudsystems.com"],
        ["Halcyon Health", "Sophie Carter", "clinic coordinator", "Patient Services", "11:08 AM between appointments", "halcyonhealth.org"],
        ["Riverstone Logistics", "Marcus Hill", "warehouse supervisor", "Logistics Control", "6:05 PM during shift change", "riverstonelogistics.net"],
        ["Manchester Digital Labs", "Leah Thompson", "junior developer", "Product Engineering", "2:20 PM after a release meeting", "manchesterdigitallabs.io"],
        ["BrightForge Studios", "Priya Shah", "project coordinator", "Client Delivery", "3:35 PM before a client review", "brightforgestudios.co.uk"],
        ["Crownwell Education", "Owen Blake", "student services officer", "Student Support", "10:50 AM during enrolment week", "crownwelleducation.edu"],
        ["Atlas Retail Group", "Nadia Hussain", "store operations lead", "Retail Operations", "7:30 AM before stores open", "atlasretailgroup.com"],
        ["Oakline Energy", "Maya Collins", "procurement analyst", "Supplier Management", "5:18 PM before a contract deadline", "oaklineenergy.co.uk"],
        ["Silvergate Housing", "Harvey Stone", "case worker", "Resident Services", "1:12 PM after a tenant call", "silvergatehousing.org"]
      ],
      patternData: {
        phishing: [
          ["password-expiry", "suspicious", "Password Expiry Portal", "IT Security Desk", "security-alerts@{lookalike}-login.net", "confirm the account password through an external reset page before access is removed", "The message uses the right product name and a polished security tone.", "the sender domain is a lookalike, the request asks for credentials, and the deadline rushes the user", "open the normal identity portal directly or call the service desk using the published number", "Reset access portal", "Lookalike sender domain|Credential request inside a message|Urgent deadline pressure", "The wording sounds like a normal IT notice", "high", "domain and credential verification"],
          ["oauth-consent", "suspicious", "Shared Document Consent Request", "Document Sharing Service", "documents@{slug}-fileshare.app", "approve a cloud app so a shared document can be viewed", "The sender name matches a real colleague and the file title mentions a current project.", "the page asks for broad file access and ongoing account permission instead of simply opening a document", "ask the colleague in the existing chat thread or open files from the trusted company drive", "OAuth permissions requested", "Broad app permissions|External file sharing domain|Access persists beyond this one document", "A real project name is mentioned", "critical", "OAuth consent risk"],
          ["supplier-bank-change", "suspicious", "Supplier Payment Account Update", "Procurement Operations", "procurement-updates@{slug}-supplier-verify.net", "approve new supplier bank details before end of day", "The supplier name and invoice number match a real purchase order.", "payment details changed, the sender domain is not official, and the message discourages normal supplier verification", "verify using the supplier record already in the finance system", "Review payment portal", "Payment details changed unexpectedly|Verification is discouraged|External supplier-style domain", "The invoice number is real", "critical", "payment fraud recognition"],
          ["qr-login", "suspicious", "QR Code Login Check", "Collaboration Security", "security@{slug}-devicecheck.com", "scan a QR code to keep mobile access active", "The email copies company branding and mentions mobile device policy.", "the QR route hides the destination and bypasses the normal sign-in page", "use the device management portal from the intranet", "Scan QR to validate device", "QR destination is hidden|External domain|Account access pressure", "The branding looks familiar", "high", "QR phishing recognition"],
          ["deepfake-followup", "suspicious", "Voice Note Follow-Up", "Executive Assistant", "ea-office@{lookalike}.co", "approve confidential board folder access after a voice note from a senior leader", "The voice sounds convincing and the meeting exists on the calendar.", "the domain is subtly wrong, the request is urgent, and the approval asks for cloud storage access", "call the executive office from the directory before approving access", "Approve confidential folder access", "Subtle domain mismatch|Authority pressure|Cloud storage permission request", "The meeting is real|The voice sounds familiar", "critical", "deepfake pressure handling"],
          ["payroll-doc", "suspicious", "Payroll Correction Document", "Payroll Department", "payroll@{slug}-secure-docs.net", "sign in to view a corrected payslip document", "Payroll corrections are believable near the end of the month.", "the portal is not the official HR system and asks for a fresh login from an email link", "use the HR portal bookmark or payroll helpdesk contact", "Open payroll correction", "Sensitive payroll bait|External document portal|Login requested from email", "The topic is believable", "high", "sensitive-topic phishing"],
          ["training-reminder", "safe", "Security Training Reminder", "Security Awareness Team", "security@{domain}", "complete annual awareness training this month", "The message names the normal training platform and links to the intranet route.", "there is no password request, file download, payment instruction, or new app permission", "access the same training from the intranet if unsure", "Alternative route: intranet training page", "Official sender domain|No sensitive request|Trusted alternative route", "Security training emails can look urgent", "low", "safe notification recognition"],
          ["finance-portal", "safe", "Monthly Invoice Portal Notice", "Finance Operations", "finance@{domain}", "review invoices through the existing finance portal", "The message matches the monthly finance calendar and does not attach files.", "it points users to the existing portal rather than asking them to sign in through a new page", "open the finance portal directly from bookmarks", "Use existing finance portal", "Existing process|No attachment pressure|No external sign-in", "The topic involves money", "low", "safe process recognition"],
          ["ambiguous-shared-file", "unsure", "Unexpected Shared File Alert", "Project Workspace", "workspace-notify@collab.example", "open a shared project folder from a partner organisation", "The partner name is known, but this exact folder was not discussed in the project channel.", "the notification alone does not prove risk or safety because the sender route and permission scope need checking", "verify in the active project channel before opening or approving anything", "Shared folder invitation", "Known partner but unexpected folder|Permission scope is not visible|Needs out-of-band confirmation", "The partner is legitimate", "medium", "uncertainty handling"],
          ["ambiguous-calendar", "unsure", "Calendar Login Prompt", "Calendar Service", "calendar-alerts@external-scheduler.example", "sign in to view an updated interview schedule", "The interview really exists, but the scheduler is not one the team normally uses.", "there is not enough context to decide until the organiser confirms the platform and link", "check the original invite or contact the organiser through the directory", "View updated schedule", "Real event but unusual platform|Login required|Confirmation path exists", "The timing matches a real meeting", "medium", "verification under uncertainty"]
        ],
        bruteforce: [
          ["single-account-spike", "suspicious", "Single Account Login Spike", "Identity Monitoring System", "auth-monitor@company.local", "review repeated failed sign-ins against {person}'s account", "The account is active and normally signs in from one managed device.", "dozens of failures arrive in minutes from the same source, which is not normal user error", "pause risky sessions, notify the user, and review identity logs", "Authentication spike detected", "High failure count|Short time window|Same account repeatedly targeted", "The account itself is a real employee", "high", "brute-force pattern recognition"],
          ["password-spraying", "suspicious", "Password Spraying Across Staff", "SIEM Alert", "siem@company.local", "review one failed login across hundreds of users", "No individual account locks, so the alert looks quiet at first.", "the same password pattern is tried broadly, which indicates spraying rather than normal mistakes", "block the source and check exposed credentials", "One password pattern across many accounts", "Many users affected|Low failures per user|Repeated password pattern", "No user has many failures", "high", "credential-stuffing pattern recognition"],
          ["mfa-fatigue", "suspicious", "Repeated MFA Push Approval", "Identity Provider", "mfa-alert@company.local", "investigate repeated MFA prompts followed by one approval", "The password was accepted before the prompts and the final approval looks successful.", "repeated prompts can pressure a user into approving a login they did not start", "revoke the session, reset the password, and contact the user", "MFA approval after repeated prompts", "Many MFA prompts|New device|Approval after pressure", "MFA was technically approved", "critical", "MFA fatigue recognition"],
          ["impossible-travel", "suspicious", "Impossible Travel Session", "Conditional Access Monitor", "access-alert@company.local", "review two successful sign-ins for the same user", "Both sign-ins used a valid password and one came from a normal city.", "the second location appears minutes later from a region the user could not physically reach", "block active sessions and validate with the user", "Impossible travel detected", "Valid password does not prove safety|Travel time is impossible|New session location", "One location is familiar", "high", "account takeover reasoning"],
          ["reset-storm", "suspicious", "Password Reset Storm", "Service Desk Queue", "helpdesk-monitor@company.local", "review repeated password reset requests for a privileged account", "The requests use the normal reset page, not a strange link.", "the volume and timing are abnormal and target an account with elevated access", "freeze the reset workflow and verify with the account owner", "Repeated reset attempts", "Privileged account targeted|Repeated reset attempts|Timing is abnormal", "The reset page is legitimate", "high", "reset abuse recognition"],
          ["new-device-token", "suspicious", "New Device With Token Reuse", "Session Monitor", "session-alert@company.local", "review a new device session that did not complete normal enrolment", "The login does not show repeated password failures.", "the session appears with a reused token and skips the expected device compliance check", "revoke the token and require fresh trusted-device sign-in", "Session token anomaly", "New unmanaged device|Expected compliance check missing|Token reuse signal", "No password failure spike", "critical", "session compromise awareness"],
          ["backup-service", "safe", "Scheduled Backup Service Login", "Directory Monitor", "directory-monitor@company.local", "review svc_backup signing in to the internal backup server", "The login occurs at exactly the same time as the nightly backup job.", "there are no failures, new locations, privilege changes, or unusual resources accessed", "keep monitoring the known baseline", "Baseline matched", "Known service account|Scheduled login|No unusual changes", "Automated logins can look unusual", "low", "baseline comparison"],
          ["new-laptop", "safe", "Expected New Device Login", "Conditional Access Monitor", "access-monitor@company.local", "review {person}'s first sign-in from a replacement laptop", "The asset tag matches the device issued by IT this morning.", "MFA was completed once, the location matches the office, and device enrolment is complete", "continue normal monitoring", "Device enrolment confirmed", "Device enrolment confirmed|Location matches|MFA was normal", "It is a new device", "low", "legitimate access recognition"],
          ["one-failed-login", "safe", "Single Mistyped Password", "Login Monitor", "login-monitor@company.local", "review one failed password entry followed by success", "The user reports mistyping after a password manager update.", "the second sign-in completes MFA from the usual device and usual location", "no action needed unless the pattern repeats", "One failure followed by normal MFA", "Only one failure|Known device|Normal MFA", "A failure happened", "low", "noise filtering"],
          ["ambiguous-admin-maintenance", "unsure", "Admin Maintenance Login", "Privileged Access Monitor", "pam-alert@company.local", "review an administrator login outside normal business hours", "A change window exists, but the ticket does not list this exact server.", "the event could be legitimate maintenance or unauthorised admin access without more ticket context", "confirm against the approved change record and admin on-call rota", "Privileged login needs verification", "Change window exists|Server is not in ticket|Privileged account involved", "There is a maintenance window", "medium", "privileged access verification"]
        ],
        sqli: [
          ["login-logic-input", "suspicious", "Login Form Logic Input", "Web Application Firewall", "waf-alert@company.local", "review an unusual value submitted to the login username field", "The request comes from the public login page and receives a validation response.", "the input contains quote characters and database-style logic rather than a human username", "review logs and confirm the login query uses parameterised handling", "Database-style input pattern", "Input is not normal user data|SQL-style symbols appear|Login flow is targeted", "The request was blocked", "high", "SQLi signal recognition"],
          ["search-timing", "suspicious", "Search Timing Anomaly", "Application Performance Monitor", "apm@company.local", "review a search request with no visible database error", "The search page stays online and returns a normal-looking response.", "only inputs containing database-style timing language cause a multi-second delay", "raise the event for application security review", "Timing anomaly after unusual input", "No visible error needed|Timing changed|Database-style input caused delay", "The page did not crash", "high", "blind SQLi awareness"],
          ["stored-value-error", "suspicious", "Stored Profile Value Error", "Database Error Monitor", "db-monitor@company.local", "review a report job that failed while processing saved profile data", "The profile was created yesterday and looked harmless in the user interface.", "the stored display name includes comment-like database characters and triggers an error later", "treat stored input as untrusted and review safe query handling", "Stored value triggered delayed error", "Delayed error|Stored value|Backend job triggered the issue", "The original save succeeded", "high", "second-order SQLi recognition"],
          ["admin-filter", "suspicious", "Admin Filter Output Change", "Admin Panel Monitor", "app-monitor@company.local", "review an admin search filter that returns far more rows than expected", "The user is authenticated and the request uses an internal admin panel.", "a strange filter value changes the result count and exposes records outside the intended department", "disable the risky filter path and review query construction", "Unexpected records returned", "Result count changed unexpectedly|Internal tools still need validation|Department boundary was bypassed", "The user is authenticated", "critical", "unsafe filter recognition"],
          ["error-exposure", "suspicious", "Database Error Disclosure", "Error Monitor", "error-monitor@company.local", "review an application error after malformed search text", "The user-facing page still shows a friendly error banner.", "logs expose database table and column names after unusual input, which helps an attacker map behaviour", "hide detailed errors and review input handling", "Detailed database error in logs", "Database details exposed|Malformed input caused it|Backend behaviour leaked", "The public page hides most of the error", "medium", "error handling awareness"],
          ["api-parameter-abuse", "suspicious", "API Parameter Abuse", "API Gateway", "gateway@company.local", "review a product API request with database keywords in a filter value", "The endpoint normally accepts category and sort fields.", "the filter contains database command words where a category name should be", "block the request and review parameter validation", "Unexpected database keywords in filter", "Database words in a normal field|Endpoint should not accept query logic|Input shape is abnormal", "The endpoint is a normal product API", "high", "input-shape reasoning"],
          ["report-filter", "safe", "Normal Report Filter Request", "API Gateway", "gateway@company.local", "review report filters for date range, department, and export type", "The parameters match the API schema and the user is allowed to run the report.", "there are no SQL operators, database errors, abnormal delays, or unexpected records", "continue normal logging and validation", "Schema validation passed", "Expected parameters|No SQL-like symbols|Normal response", "The report accesses business data", "low", "safe input recognition"],
          ["product-search", "safe", "Standard Product Search", "Application Monitor", "app-monitor@company.local", "review a product search using category, sort order, and item limit", "The search uses values already allowed by the user interface.", "it returns a normal response with no error disclosure, odd timing, or unexpected output", "keep schema validation and monitoring in place", "Standard filtered search request", "Normal filter values|No database error|Expected response", "The request has several parameters", "low", "normal web request recognition"],
          ["validation-failure", "safe", "Expected Validation Failure", "Form Validator", "validator@company.local", "review a user typing letters into a numeric field", "The validation message appears before the value reaches deeper application logic.", "no backend error, SQL-style syntax, unusual delay, or unexpected output appears", "continue enforcing server-side validation", "Validation message: please enter a number", "Normal validation|No backend error|No SQL-like input", "Invalid input happened", "low", "validation behaviour"],
          ["ambiguous-user-report", "unsure", "User Reports Strange Search Output", "Support Ticket", "support-ticket@company.local", "review a ticket saying search results looked strange after a pasted value", "The ticket does not include the actual input or server logs.", "the report could be user confusion or a security signal, so the evidence is incomplete", "collect the request ID and logs before deciding", "More evidence required", "Actual input missing|Logs missing|Potential unexpected output", "The user may simply be confused", "medium", "evidence gathering"]
        ],
        social: [
          ["password-call", "suspicious", "Helpdesk Password Request", "Helpdesk Conversation", "Phone call transcript", "confirm a password so IT can test account sync", "The caller knows the employee's name and mentions a real ticket category.", "legitimate support should never ask for the user's password or security answers", "refuse and call the service desk number from the intranet", "Caller asks for password", "Password requested|Authority used|Request breaks policy", "The caller knows the employee name", "critical", "secret sharing refusal"],
          ["mfa-chat", "suspicious", "MFA Code Request Over Chat", "IT Support Chat", "Teams message", "send a six-digit code so support can confirm a fix", "The chat uses the company tool and the message is polite.", "MFA codes are secrets and should not be shared with another person", "deny the request and report the chat to security", "Request: share MFA code", "MFA code requested|IT authority used|External confirmation is unsafe", "The chat is inside a familiar app", "critical", "MFA secret protection"],
          ["tailgating", "suspicious", "Contractor Tailgating Attempt", "Physical Security Report", "Building entrance", "hold a secure door because a contractor pass is in the van", "The person wears a contractor jacket and knows the project floor.", "they are trying to enter without badge verification", "send them to reception or security for normal access", "Door access requested without badge scan", "No badge scan|Time pressure|Physical access bypass", "They know a real project detail", "high", "physical access control"],
          ["payment-voice", "suspicious", "Executive Payment Voice Note", "Finance Escalation Transcript", "Voice note and chat", "release a supplier payment and skip dual approval", "The voice sounds senior and the supplier name is real.", "the request combines authority, secrecy, urgency, and a control bypass", "follow payment approval and verify through a known number", "Request: bypass payment approval", "Dual approval bypass|Do not call back|Executive pressure", "The supplier name is real|The voice sounds convincing", "critical", "authority pressure resistance"],
          ["supplier-pretext", "suspicious", "Supplier Contact Detail Change", "Supplier Desk Call", "Phone call transcript", "update a supplier contact email during an urgent delivery issue", "The caller knows an open purchase order and uses calm professional language.", "changing contact details over an unverified call can reroute future approvals or invoices", "call the supplier using the number already in the supplier record", "Update supplier contact details", "Supplier record change|Unverified caller|Urgent delivery pretext", "The purchase order is real", "high", "pretext verification"],
          ["usb-courier", "suspicious", "Couriered USB Drive", "Reception Note", "Front desk", "plug in a delivered USB drive labelled contract documents", "The package is addressed to the right team and looks professionally labelled.", "unknown removable media should not be connected to a work device", "ask security or IT to handle the device safely", "USB drive marked urgent", "Unknown USB media|Urgent label|No verified sender", "The package has the right team name", "high", "media handling"],
          ["visitor-process", "safe", "Verified Visitor Process", "Reception Desk", "Visitor access log", "allow a scheduled visitor to wait in reception until the host arrives", "Reception checks the calendar, confirms the host, and prints a temporary badge.", "the visitor is not allowed into secure space alone and no process is bypassed", "continue the visitor process", "Visitor held until host arrives", "Calendar checked|Badge issued|No secure access alone", "The visitor is new to the building", "low", "safe physical process"],
          ["access-ticket", "safe", "Access Request Through Ticket", "IT Service Desk", "ticket-system@company.co.uk", "grant folder access for a new team member", "The request is in the official ticket system with manager approval attached.", "the access level matches the role and nobody asks for passwords or MFA codes", "process the ticket normally", "Ticket approved by manager", "Official ticket|Manager approval|Role-appropriate access", "Access is being granted", "low", "safe approval process"],
          ["awareness-drill", "safe", "Security Awareness Drill Notice", "Security Team", "security@company.co.uk", "read an awareness drill notice and report anything suspicious normally", "The message does not ask for credentials, files, codes, payment, or access approval.", "it reinforces the existing reporting route instead of bypassing it", "follow the normal reporting channel", "Report suspicious activity through normal channel", "No secrets requested|Normal reporting channel|No process bypass", "Security drills can be unexpected", "low", "safe awareness message"],
          ["ambiguous-callback", "unsure", "Supplier Callback Request", "Procurement Voicemail", "Voicemail transcript", "call a supplier back about a delayed shipment using a number left in voicemail", "A delayed shipment exists, but the callback number is not in the supplier record.", "the request may be legitimate, but the provided number needs verification first", "use the supplier phone number already stored in procurement records", "Callback number needs verification", "Real shipment exists|New callback number|Verification route is available", "The delay is real", "medium", "callback verification"]
        ]
      },
      getSeeds(topic) {
        return (this.patternData[topic] || this.patternData.phishing).flatMap((pattern, patternIndex) =>
          this.contexts.map((context, contextIndex) => this.buildSeed(topic, pattern, context, patternIndex, contextIndex))
        );
      },
      buildSeed(topic, pattern, context, patternIndex, contextIndex) {
        const [company, person, role, team, time, domain] = context;
        const slug = company.toLowerCase().replaceAll(" ", "");
        const lookalike = slug.replace(/[o]/, "0").replace(/[l]/, "1");
        const fill = value => String(value).replaceAll("{company}", company).replaceAll("{person}", person).replaceAll("{role}", role).replaceAll("{team}", team).replaceAll("{time}", time).replaceAll("{domain}", domain).replaceAll("{slug}", slug).replaceAll("{lookalike}", lookalike);
        const [scenarioType, correctAnswer, title, sender, senderMeta, request, normalDetail, riskDetail, verification, signal, clues, redHerrings, riskLevel, skillTested] = pattern;

        return {
          topic,
          scenarioType,
          correctAnswer,
          title: fill(title),
          sender: fill(sender),
          senderMeta: fill(senderMeta),
          request: fill(request),
          normalDetail: fill(normalDetail),
          riskDetail: fill(riskDetail),
          verification: fill(verification),
          signal: fill(signal),
          clues: clues.split("|").map(fill),
          redHerrings: redHerrings.split("|").map(fill),
          riskLevel,
          skillTested,
          company,
          person,
          role,
          team,
          time,
          index: patternIndex * this.contexts.length + contextIndex
        };
      }
    };

    const UniquenessService = {
      ids: new Set(),
      signatures: new Set(),
      titles: new Set(),
      bodies: [],
      reset() {
        this.ids.clear();
        this.signatures.clear();
        this.titles.clear();
        this.bodies = [];
      },
      signature(seed, difficulty) {
        return [seed.topic, difficulty, seed.scenarioType, seed.sender, seed.clues.slice(0, 2).join("+"), seed.request].join("|").toLowerCase();
      },
      accept(question) {
        const words = new Set(question.body.toLowerCase().replace(/<[^>]+>/g, " ").split(/\W+/).filter(Boolean));
        const similar = this.bodies.some(previous => {
          const overlap = [...words].filter(word => previous.has(word)).length;
          return overlap / Math.max(words.size, previous.size, 1) > 0.84;
        });

        if (this.ids.has(question.id) || this.signatures.has(question.signature) || this.titles.has(question.messageTitle) || similar) return false;
        this.ids.add(question.id);
        this.signatures.add(question.signature);
        this.titles.add(question.messageTitle);
        this.bodies.push(words);
        return true;
      }
    };

    const FeedbackService = {
      scenarioText(question, seed) {
        const label = seed.correctAnswer === "unsure" ? "needs more information" : seed.correctAnswer;
        const reason = `This scenario is ${label} because ${seed.riskDetail}. The requested action should be checked by using the trusted route: ${seed.verification}.`;
        return {
          reason,
          attackerGoal: seed.correctAnswer === "suspicious" ? `Influence the user into taking the unsafe action: ${seed.request}.` : seed.correctAnswer === "safe" ? "No attacker behaviour is present; the goal is to recognise normal process evidence." : "Create uncertainty where acting without verification could cause harm.",
          saferAction: `Verify by ${seed.verification}.`,
          correctFeedback: `Correct. The right decision is ${label}. ${reason} In real life, use the verification path before taking any irreversible action.`,
          incorrectFeedback: `Incorrect. The better reasoning is that ${seed.riskDetail}. You likely gave too much weight to appearance or missed the verification route. Compare source, request, process, and consequence before deciding.`,
          unsureFeedback: seed.correctAnswer === "unsure" ? `Need More Info is correct here because the evidence is incomplete. Resolve it by ${seed.verification}.` : `More investigation can help, but this scenario already has enough evidence to classify it as ${label}.`,
          aiWhat: `This is a ${QuestionBankService.labels[seed.topic]} decision involving ${seed.person} and the ${seed.team} workflow.`,
          aiHow: seed.correctAnswer === "safe" ? `The scenario is safe because ${seed.riskDetail}.` : seed.correctAnswer === "unsure" ? `The risk is uncertainty: a believable detail is present, but missing verification could lead to trusting an unconfirmed request.` : `The risk works by making a harmful request look normal enough to pass quickly: ${seed.riskDetail}.`,
          aiDefend: `Defend by slowing down and using the trusted path: ${seed.verification}. Do not bypass process because a message, alert, or caller sounds polished.`
        };
      },
      answerHTML(question, validation) {
        const clues = Array.isArray(question.clues) ? question.clues.slice(0, 5).map(escapeHTML).join(" | ") : "";
        if (validation.isCorrect) {
          return {
            className: "scenario-feedback feedback-correct",
            html: `✅ Correct<br><br><div class="clue-breakdown"><div class="clue-item"><strong>Why:</strong> ${escapeHTML(question.correctFeedback)}</div><div class="clue-item"><strong>Best defender action:</strong> ${escapeHTML(question.saferAction || question.aiDefend)}</div><div class="clue-item"><strong>Key clues:</strong> ${clues}</div></div>`
          };
        }
        return {
          className: "scenario-feedback feedback-incorrect",
          html: `❌ Incorrect<br><br><div class="clue-breakdown"><div class="clue-item"><strong>Your answer:</strong> ${escapeHTML(validation.userAnswer === "timeout" ? "time ran out" : validation.userAnswer)}</div><div class="clue-item"><strong>What you missed:</strong> ${escapeHTML(question.incorrectFeedback)}</div><div class="clue-item"><strong>Correct answer:</strong> ${escapeHTML(question.correctAnswer)}</div><div class="clue-item"><strong>Safer action:</strong> ${escapeHTML(question.saferAction || question.aiDefend)}</div><div class="clue-item"><strong>Key clues:</strong> ${clues}</div></div>`
        };
      }
    };

    const ScenarioComposerService = {
      avatars: { phishing: "📧", bruteforce: "🔐", sqli: "💉", social: "🎭" },
      compose(topic, difficulty, seed, attempt = 0) {
        const profile = DifficultyProfileService.get(difficulty);
        const id = `${({ phishing: "PHISH", bruteforce: "AUTH", sqli: "WEB", social: "HUMAN" }[topic] || "CASE")}-${profile.name.toUpperCase()}-${seed.index + 1}-${attempt + 1}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
        const redHerrings = profile.needsRedHerring ? seed.redHerrings.slice(0, 2) : seed.redHerrings.slice(0, 1);
        const detail = profile.name === "easy"
          ? "The decision is direct, but it still depends on checking the source, request, and verification route."
          : profile.name === "medium"
            ? `A normal-looking detail is present: ${seed.normalDetail} That detail matters, but it does not settle the decision by itself.`
            : `This is deliberately realistic: ${seed.normalDetail} Possible red herring: ${redHerrings.join(" ")} The best answer depends on weighing the request against the verification path.`;
        const body = buildScenarioBody([
          `You are reviewing a ${QuestionBankService.labels[topic]} event for ${seed.person}, a ${seed.role} at ${seed.company}, at ${seed.time}.`,
          `The source appears as ${seed.sender} (${seed.senderMeta}) and is connected to the ${seed.team} workflow.`,
          `The requested action is to ${seed.request}. ${detail}`,
          `${seed.riskDetail.charAt(0).toUpperCase()}${seed.riskDetail.slice(1)}.`,
          `If the wrong decision is made, the likely consequence is lost access, exposed data, unauthorised payment, or a missed security incident depending on the context.`,
          `A safer path is to ${seed.verification}; this gives evidence without following pressure from the message, alert, or caller alone.`
        ], seed.signal);
        const signature = UniquenessService.signature(seed, profile.name);
        const question = {
          id,
          topic,
          type: topic,
          difficulty: profile.name,
          title: `${seed.title} - ${id}`,
          desc: "Review the scenario and decide whether it is safe, suspicious, or needs more information.",
          avatar: this.avatars[topic] || "🛡",
          sender: seed.sender,
          senderMeta: seed.senderMeta,
          time: seed.time,
          messageTitle: `${seed.title} - ${id}`,
          body,
          correctAnswer: seed.correctAnswer,
          correct: seed.correctAnswer,
          clues: [...seed.clues, `Requested action: ${seed.request}.`, `Verification path: ${seed.verification}.`].slice(0, profile.maxClues),
          redHerrings,
          riskLevel: seed.riskLevel,
          skillTested: seed.skillTested,
          takeaways: [
            seed.correctAnswer === "unsure" ? "When evidence is incomplete, verify before acting." : "Judge the request by evidence, not by polish or familiarity.",
            `Focus on ${seed.skillTested} in this scenario.`,
            `Use the trusted route: ${seed.verification}.`
          ],
          uniqueID: id,
          signature,
          triggerTags: this.tags(seed)
        };

        return { ...question, ...FeedbackService.scenarioText(question, seed) };
      },
      tags(seed) {
        const text = `${seed.request} ${seed.riskDetail}`.toLowerCase();
        return [
          /urgent|deadline|rush|pressure|before/.test(text) && "urgency",
          /password|mfa|login|account|credential/.test(text) && "credentials",
          /executive|manager|support|supplier|authority/.test(text) && "authority",
          /domain|permission|database|token|device|api|oauth/.test(text) && "technical",
          seed.topic === "social" && "social"
        ].filter(Boolean);
      }
    };

    const QuestionQualityGate = {
      fields: ["id", "topic", "difficulty", "title", "desc", "avatar", "sender", "senderMeta", "time", "messageTitle", "body", "correctAnswer", "clues", "redHerrings", "riskLevel", "skillTested", "correctFeedback", "incorrectFeedback", "unsureFeedback", "aiWhat", "aiHow", "aiDefend", "takeaways", "uniqueID", "signature"],
      validate(question) {
        const profile = DifficultyProfileService.get(question.difficulty);
        const failures = [];
        this.fields.forEach(field => {
          if (question[field] === undefined || question[field] === null || question[field] === "") failures.push(`Missing ${field}`);
        });
        const bodyText = String(question.body || "").replace(/<[^>]+>/g, " ");
        const paragraphCount = (String(question.body || "").match(/<p>/g) || []).length;
        if (!["safe", "suspicious", "unsure"].includes(question.correctAnswer)) failures.push("Invalid answer");
        if (bodyText.length < profile.minBody) failures.push("Body too short");
        if (paragraphCount < 3) failures.push("Not enough paragraphs");
        if (!Array.isArray(question.clues) || question.clues.length < profile.minClues) failures.push("Not enough clues");
        if (profile.needsRedHerring && (!question.redHerrings || question.redHerrings.length < 1)) failures.push("Missing red herring");
        if (!Array.isArray(question.takeaways) || question.takeaways.length < 3) failures.push("Not enough takeaways");
        if (String(question.correctFeedback || "").length < 80) failures.push("Correct feedback too short");
        if (String(question.incorrectFeedback || "").length < 80) failures.push("Incorrect feedback too short");
        return { passed: failures.length === 0, failures };
      }
    };

    const AnswerValidationService = {
      validate(userAnswer, question, confidence = "medium") {
        const answer = userAnswer === "timeout" ? "timeout" : String(userAnswer || "").toLowerCase();
        const correctAnswer = question.correctAnswer || question.correct;
        return { userAnswer: answer, correctAnswer, confidence, isCorrect: answer === correctAnswer };
      }
    };

    const AssessmentService = {
      modulePlan: {
        easy: ["suspicious", "safe", "suspicious", "unsure"],
        medium: ["suspicious", "safe", "suspicious", "suspicious", "unsure", "safe"],
        hard: ["suspicious", "safe", "suspicious", "suspicious", "unsure", "safe", "suspicious"]
      },
      finalPlan: {
        phishing: ["suspicious", "safe", "suspicious"],
        bruteforce: ["suspicious", "safe", "unsure"],
        sqli: ["suspicious", "safe", "suspicious"],
        social: ["suspicious", "unsure", "suspicious"]
      },
      generateQuestion(topic, difficulty, options = {}) {
        const seeds = QuestionBankService.getSeeds(topic).filter(seed => !options.answer || seed.correctAnswer === options.answer);
        const normalDifficulty = DifficultyProfileService.get(difficulty).name;
        let lastQuestion = null;
        for (let attempt = 0; attempt < 100; attempt++) {
          const seed = seeds[(attempt + (options.offset || 0)) % seeds.length];
          const question = ScenarioComposerService.compose(topic, normalDifficulty, seed, attempt);
          lastQuestion = question;
          if (QuestionQualityGate.validate(question).passed && UniquenessService.accept(question)) return question;
        }
        return { ...lastQuestion, id: randomReference("CASE"), uniqueID: randomReference("CASE"), signature: `${lastQuestion.signature}|fallback|${Date.now()}` };
      },
      generateModuleChallenges(topic, selectedDifficulty) {
        const difficulty = DifficultyProfileService.normalise(selectedDifficulty || "easy");
        const questions = (this.modulePlan[difficulty] || this.modulePlan.easy).map((answer, index) => this.generateQuestion(topic, difficulty, { answer, offset: index }));
        return shuffleArray(questions).map(question => ({
          ...question,
          body: `${question.body}<p style="font-size:0.72rem; color:var(--text-tertiary); margin-top:14px;">Unique scenario ID: ${escapeHTML(question.uniqueID || randomReference("CASE"))}</p>`
        }));
      },
      generatePracticeSet(topic) {
        return ["easy", "medium", "hard"].flatMap(difficulty => ["suspicious", "safe", "suspicious"].map((answer, index) => this.generateQuestion(topic, difficulty, { answer, offset: index })));
      },
      generateFinalAssessment() {
        UniquenessService.reset();
        return shuffleArray(Object.entries(this.finalPlan).flatMap(([topic, answers]) => answers.map((answer, index) => this.generateQuestion(topic, "final", { answer, offset: index })))).slice(0, 12);
      }
    };

    function makeUniqueQuestionFromTemplate(type, difficulty, index) {
      return AssessmentService.generateQuestion(type, DifficultyProfileService.normalise(difficulty), { offset: index });
    }

    function generateOneChallenge(type, difficulty, attempt = 0) {
      return AssessmentService.generateQuestion(type, DifficultyProfileService.normalise(difficulty), { offset: attempt });
    }

    function generateChallenges(type) {
      const selectedDifficulty = store.getState().difficulty || "easy";
      const challenges = AssessmentService.generateModuleChallenges(type, selectedDifficulty);
      const used = getUsedChallengeFingerprints();
      challenges.forEach(challenge => used.push(makeChallengeFingerprint(challenge)));
      saveUsedChallengeFingerprints(used);
      return challenges;
    }

    function runQuestionGeneratorSelfTest() {
      const finalQuestions = AssessmentService.generateFinalAssessment();
      const failures = [];
      const ids = new Set();
      const signatures = new Set();
      const topics = new Set();

      if (finalQuestions.length !== 12) failures.push("Final assessment did not generate 12 questions.");
      finalQuestions.forEach(question => {
        const quality = QuestionQualityGate.validate(question);
        if (!quality.passed) failures.push(`${question.id}: ${quality.failures.join(", ")}`);
        if (ids.has(question.id)) failures.push(`Duplicate ID: ${question.id}`);
        if (signatures.has(question.signature)) failures.push(`Duplicate signature: ${question.signature}`);
        if (!["safe", "suspicious", "unsure"].includes(question.correctAnswer)) failures.push(`Invalid answer: ${question.id}`);
        ids.add(question.id);
        signatures.add(question.signature);
        topics.add(question.topic);
      });
      QuestionBankService.topics.forEach(topic => {
        if (!topics.has(topic)) failures.push(`Missing final topic: ${topic}`);
        if (QuestionBankService.getSeeds(topic).length < 20) failures.push(`Seed pool too small: ${topic}`);
      });

      const result = { passed: failures.length === 0, totalFinalQuestions: finalQuestions.length, topics: [...topics], failures };
      console.table(finalQuestions.map(q => ({ id: q.id, topic: q.topic, difficulty: q.difficulty, answer: q.correctAnswer, clues: q.clues.length, bodyLength: q.body.replace(/<[^>]+>/g, " ").length })));
      console[failures.length ? "warn" : "log"]("ThreatScope question generator self-test", result);
      return result;
    }

    const canvas = document.getElementById("bg-canvas");
    const ctx = canvas ? canvas.getContext("2d") : null;

    let particles = [];
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    function resizeCanvas() {
      if (!canvas || !ctx) return;

      const dpr = window.devicePixelRatio || 1;

      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    function initParticles() {
      if (!canvas || !ctx) return;

      particles = [];

      const count = Math.min(80, Math.floor(window.innerWidth / 20));

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.4 + 0.1,
          color: Math.random() > 0.5 ? "192,132,252" : "245,158,11"
        });
      }
    }

    function animateParticles() {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particles.forEach(p => {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 200) {
          p.vx += dx * 0.00003;
          p.vy += dy * 0.00003;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = window.innerWidth;
        if (p.x > window.innerWidth) p.x = 0;

        if (p.y < 0) p.y = window.innerHeight;
        if (p.y > window.innerHeight) p.y = 0;

        p.vx *= 0.98;
        p.vy *= 0.98;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
        ctx.fill();
      });

      requestAnimationFrame(animateParticles);
    }

    resizeCanvas();
    initParticles();
    animateParticles();

    window.addEventListener("resize", () => {
      resizeCanvas();
      initParticles();
    });



    function navigateTo(page) {

      const navLinks = document.querySelector(".nav-links");
      const navButton = document.getElementById("navHamburger");

      if (navLinks) navLinks.classList.remove("open");

      if (navButton) {
        navButton.setAttribute("aria-expanded", "false");
        navButton.textContent = "☰";
      }
      if (store.getState().currentPage === "scenario" && page !== "scenario") {
        clearInterval(scenarioTimer);
      }
      const currentPage = document.querySelector('.page.active');

      if (currentPage) {
        currentPage.classList.add('exiting');

        setTimeout(() => {
          currentPage.classList.remove('active', 'exiting');
          showPage(page);
        }, 300);
      } else {
        showPage(page);
      }

      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

      const navLink = document.querySelector(`.nav-link[data-page="${page}"]`);
      if (navLink) navLink.classList.add('active');

      store.setState({ currentPage: page });
    }

    function showPage(page) {
      const el = document.getElementById(`page-${page}`);

      if (!el) return;

      el.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'auto' });

      setTimeout(() => triggerAnimations(), 100);

      if (page === 'dashboard') animateDashboard();

      if (page === 'path') {
        updateTrainingPath();
      }

      if (page === 'learn') {
        renderLearningModule(store.getState().currentLearningModule || store.getState().currentAttack || "phishing");
      }

      if (page === 'report') {
        updateReportPage();
        animateAttackChain();
      }

      if (page === 'scenario') {
        updateScenarioPage();
      }
    }

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const navbar = document.getElementById('navbar');

      if (navbar) {
        if (scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
      }

      const orb1 = document.querySelector('.gradient-orb-1');
      const orb2 = document.querySelector('.gradient-orb-2');

      if (orb1) orb1.style.transform = `translate(${scrollY * 0.02}px, ${scrollY * 0.05}px)`;
      if (orb2) orb2.style.transform = `translate(${scrollY * -0.03}px, ${scrollY * -0.04}px)`;
    });

    function triggerAnimations() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.anim-in').forEach(el => {
        el.classList.remove('visible');
        observer.observe(el);
      });
    }

    function nextChallenge() {
      const state = store.getState();

      if (state.challengeIndex < state.challenges.length - 1) {
        store.setState({ challengeIndex: state.challengeIndex + 1 });
        resetScenarioPage();
        updateScenarioPage();
      } else {
        if (state.isFinalAssessment) {
          finishFinalAssessment();
        } else {
          completeSimulation();
        }
      }
    }

    function finishFinalAssessment() {
      const state = store.getState();

      const finalTotal = state.finalTotal || 0;
      const finalCorrect = state.finalCorrect || 0;

      const percent = finalTotal > 0 ? Math.round((finalCorrect / finalTotal) * 100) : 0;
      const passed = percent >= 75;

      localStorage.setItem("finalAssessmentScore", `${percent}%`);
      localStorage.setItem("finalAssessmentPassed", passed ? "true" : "false");

      store.setState({
        finalAssessmentScore: `${percent}%`,
        finalAssessmentPassed: passed,
        isFinalAssessment: false
      });

      saveProgress();

      navigateTo("dashboard");

      setTimeout(() => {
        animateDashboard();

        if (passed) {
          showHint("Final assessment passed. Your certificate is unlocked.");
          openCertificateClaim();
        } else {
          showHint("Final assessment not passed. Review your mistakes and try again.");
        }
      }, 500);
    }

    setTimeout(() => {
      document.querySelectorAll('.mockup-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.width;
      });
      animateCountUps();
    }, 1500);

    function animateCountUps() {
      document.querySelectorAll('.count-up').forEach(el => {
        const target = parseInt(el.dataset.target || "0");
        const duration = 1500;
        const start = performance.now();

        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(target * eased);

          if (progress < 1) requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
      });
    }


    function normaliseDynamicQuestionForLegacy(question) {
      const answer = question.correct === "need-more-info" ? "unsure" : (question.correct || question.correctAnswer || "unsure");
      const type = question.type || question.topic || "phishing";
      const avatars = { phishing: "📧", bruteforce: "🔐", sqli: "🛡️", social: "🎭", final: "🛡️" };
      const safeTitle = question.messageTitle || question.title || "Cybersecurity Decision";
      const reason = question.reason || question.defensiveLesson || "Use trusted verification before acting.";
      const saferAction = question.saferAction || question.defensiveLesson || "Verify through a trusted route before taking action.";
      return {
        ...question,
        id: question.id || question.uniqueID || randomReference("LIVE"),
        uniqueID: question.uniqueID || question.id || randomReference("LIVE"),
        topic: type,
        type,
        difficulty: question.difficulty || store.getState().difficulty || "easy",
        sourceMode: question.sourceMode || "static-fallback",
        title: safeTitle,
        messageTitle: safeTitle,
        desc: question.desc || "Review the scenario and decide whether it is safe, suspicious, or needs more information.",
        avatar: question.avatar || avatars[type] || "🛡️",
        sender: question.sender || "Security Scenario",
        senderMeta: question.senderMeta || "Awareness training",
        time: question.time || "Today",
        body: question.body || "<p>Review the available evidence before making a decision.</p>",
        correct: answer,
        correctAnswer: answer,
        reason,
        saferAction,
        clues: Array.isArray(question.clues) ? question.clues : [reason],
        takeaways: Array.isArray(question.takeaways) ? question.takeaways : ["Verify the source.", "Check the requested action.", "Use a trusted route."],
        triggerTags: Array.isArray(question.triggerTags) ? question.triggerTags : [],
        attackerGoal: question.attackerGoal || (answer === "suspicious" ? "Influence the user into taking a risky action." : "No confirmed attacker goal."),
        correctFeedback: question.correctFeedback || `Correct. ${reason} Best defender action: ${saferAction}`,
        incorrectFeedback: question.incorrectFeedback || `Incorrect. ${reason} Best defender action: ${saferAction}`,
        unsureFeedback: question.unsureFeedback || (answer === "unsure" ? `Need More Info is correct. ${saferAction}` : `More checking can help, but the scenario has enough evidence to classify it as ${answer}.`),
        aiWhat: question.aiWhat || `This is a ${type} awareness scenario based on ${question.sourceTopic || "a defensive training pattern"}.`,
        aiHow: question.aiHow || reason,
        aiDefend: question.aiDefend || saferAction
      };
    }

    async function getDynamicChallengesForAttack(attackType, difficulty) {
      const fallback = () => generateChallenges(attackType).map(normaliseDynamicQuestionForLegacy);
      const service = window.ThreatScopeQuestionService;
      if (!service || typeof service.getQuestionsForAttack !== "function") return fallback();
      try {
        const plan = AssessmentService?.modulePlan?.[DifficultyProfileService.normalise(difficulty)] || AssessmentService?.modulePlan?.easy || [];
        const questions = await service.getQuestionsForAttack(attackType, difficulty, { count: plan.length || 5 });
        if (Array.isArray(questions) && questions.length) return questions.map(normaliseDynamicQuestionForLegacy);
      } catch (error) {
        console.warn("ThreatScope dynamic questions unavailable; using local fallback.", error);
      }
      return fallback();
    }

    async function getDynamicFinalAssessment() {
      const fallback = () => (window.getAllChallenges ? window.getAllChallenges() : []).map(normaliseDynamicQuestionForLegacy);
      const service = window.ThreatScopeQuestionService;
      if (!service || typeof service.getFinalAssessmentQuestions !== "function") return fallback();
      try {
        const questions = await service.getFinalAssessmentQuestions({ count: 12 });
        if (Array.isArray(questions) && questions.length >= 12) return questions.slice(0, 12).map(normaliseDynamicQuestionForLegacy);
      } catch (error) {
        console.warn("ThreatScope dynamic final assessment unavailable; using local fallback.", error);
      }
      return fallback();
    }
    async function startSimulation(attackType) {
      const data = attackData[attackType];
      if (!data) return;

      const difficulty = store.getState().difficulty || "easy";
      showHint("Preparing fresh scenario set...");

      let challenges = await getDynamicChallengesForAttack(attackType, difficulty);

      store.setState({
        currentAttack: attackType,
        currentStep: 0,
        isPaused: false,
        challenges,
        challengeIndex: 0,
        isFinalAssessment: false
      });

      resetScenarioPage();
      buildTimeline(attackType);
      buildDefenceCards(attackType);
      navigateTo('simulation');
      updateStageIndicator();
      updateTimelineProgress();

      showHint(`You selected ${data.name}. Difficulty: ${difficulty}.`);
    }

    function buildTimeline(attackType) {
      const data = attackData[attackType];
      const timeline = document.getElementById('timeline');
      const progressLine = document.getElementById('timelineProgress');

      if (!data || !timeline || !progressLine) return;

      timeline.innerHTML = '';
      timeline.appendChild(progressLine);

      data.stages.forEach((stage, i) => {
        const step = document.createElement('div');
        step.className = `timeline-step ${i === 0 ? 'active' : ''}`;
        step.dataset.index = i;

        step.onclick = () => goToStep(i);

        step.innerHTML = `
      <h4>${stage.title}</h4>
      <p>${stage.desc}</p>
      <div class="step-impact ${stage.impactLevel === 'high' ? 'impact-high' : 'impact-medium'}">
        ⚠ ${stage.impact}
      </div>
    `;

        timeline.appendChild(step);
      });
    }

    function buildDefenceCards(attackType) {
      const data = attackData[attackType];
      const container = document.getElementById('defenceCards');

      if (!data || !container) return;

      container.innerHTML = '';

      data.defences.forEach(def => {
        const card = document.createElement('div');
        card.className = 'defence-card';

        card.onclick = e => {
          e.stopPropagation();
          card.classList.toggle('expanded');
        };

        card.innerHTML = `
      <div class="defence-card-header">
        <h4>${def.icon} ${def.title}</h4>
        <span class="chevron">▼</span>
      </div>
      <div class="defence-card-body">
        <p>${def.desc}</p>
      </div>
    `;

        container.appendChild(card);
      });
    }

    function goToStep(index) {
      const state = store.getState();

      if (!state.challenges || state.challenges.length === 0) return;

      const data = attackData[state.currentAttack];

      if (!data || index < 0 || index >= data.stages.length) return;

      store.setState({ currentStep: index });

      document.querySelectorAll('.timeline-step').forEach((step, i) => {
        step.classList.toggle('active', i === index);
        step.classList.toggle('completed', i < index);
      });

      updateTimelineProgress();
      updateStageIndicator();

      if (index === data.stages.length - 1) {
        showHint("Simulation complete. Start the interactive challenge next.");
      }
    }

    function nextStep() {
      const state = store.getState();
      const data = attackData[state.currentAttack];

      if (!data) return;

      if (state.currentStep >= data.stages.length - 1) {
        navigateTo('scenario');
        return;
      }

      goToStep(state.currentStep + 1);
    }

    function prevStep() {
      const state = store.getState();

      if (state.currentStep > 0) {
        goToStep(state.currentStep - 1);
      }
    }



    function updateTimelineProgress() {
      const state = store.getState();
      const data = attackData[state.currentAttack];
      const line = document.getElementById('timelineProgress');
      const timeline = document.getElementById('timeline');

      if (!data || !line || !timeline) return;

      const progress = ((state.currentStep + 1) / data.stages.length) * 100;
      const totalHeight = timeline.offsetHeight;

      line.style.height = `${(progress / 100) * totalHeight}px`;
    }

    function updateStageIndicator() {
      const state = store.getState();
      const data = attackData[state.currentAttack];

      if (!data) return;

      const stage = data.stages[state.currentStep];
      const stageText = document.getElementById('stageText');
      const nextBtn = document.getElementById('nextStepBtn');

      if (stageText) {
        stageText.textContent = `Stage ${state.currentStep + 1} of ${data.stages.length}: ${stage.title}`;
      }

      if (nextBtn) {
        nextBtn.textContent = state.currentStep >= data.stages.length - 1 ? 'Start Challenge →' : 'Next Step →';
      }
    }

    function setPerspective(mode) {
      store.setState({ perspective: mode });

      const attackerView = document.getElementById('attackerView');
      const defenderView = document.getElementById('defenderView');
      const title = document.querySelector('.timeline-panel h3');

      if (attackerView) attackerView.classList.toggle('active', mode === 'attacker');
      if (defenderView) defenderView.classList.toggle('active', mode === 'defender');

      if (title) {
        title.innerHTML = mode === 'attacker' ? '⚡ Attack Timeline' : '🔍 Threat Analysis';
      }
    }

    function cleanTitle(title) {
      return String(title)
        .replace(/\s+—\s+(PHISH|AUTH|WEB|HUMAN|FINAL|CASE|V|ASSESS)-[A-Z0-9-]+/gi, "")
        .replace(/\s+—\s+Final Variant\s+[A-Z0-9-]+/gi, "")
        .replace(/\s+—\s+Variant\s+[A-Z0-9-]+/gi, "")
        .replace(/\s+—\s+[A-Z]+-[A-Z0-9-]+/gi, "")
        .replace(/\s+-\s+[A-Z]+-[A-Z0-9-]+/gi, "")
        .replace(/\s+—\s*$/g, "")
        .replace(/\s+-\s*$/g, "")
        .trim();
    }

    function updateScenarioPage() {
      const state = store.getState();

      if (!state.challenges || state.challenges.length === 0) return;

      const c = state.challenges[state.challengeIndex];

      const totalQuestions = state.challenges.length;
      const questionNumber = state.challengeIndex + 1;
      const displayTitle = cleanTitle(c.title);

      document.getElementById('scenarioTitle').textContent =
        state.isFinalAssessment
          ? `Final Assessment ${questionNumber} of ${totalQuestions} — ${displayTitle}`
          : `Question ${questionNumber} of ${totalQuestions} — ${displayTitle}`;

      document.getElementById('scenarioDesc').textContent =
        `Difficulty: ${c.difficulty || store.getState().difficulty} — decide whether this is safe, suspicious, or needs investigation.`;

      document.getElementById('scenarioAvatar').textContent =
        c.type === "sqli" ? "💉" :
          c.type === "bruteforce" ? "🔓" :
            c.type === "social" ? "🎭" :
              "📧";

      document.getElementById('scenarioSender').textContent = c.sender;
      document.getElementById('scenarioSenderMeta').textContent = c.senderMeta;
      document.getElementById('scenarioTime').textContent = c.time || "Now";

      document.getElementById('scenarioMessageTitle').textContent = cleanTitle(c.messageTitle || displayTitle);
      document.getElementById('scenarioMessageBody').innerHTML = c.body;

      document.getElementById('aiWhat').textContent = c.aiWhat || "This is a security decision-making scenario.";
      document.getElementById('aiHow').textContent = c.aiHow || c.reason;
      document.getElementById('aiDefend').textContent = c.aiDefend || "Slow down, verify context, inspect technical clues, and avoid reacting only to urgency or appearance.";

      const takeawayList = document.getElementById('takeawayList');
      takeawayList.innerHTML = '';

      const tips = c.takeaways || [
        "Check the exact sender and domain.",
        "Do not judge only by professional wording.",
        "Look for technical behaviour, not just appearance."
      ];

      tips.forEach((text, i) => {
        takeawayList.innerHTML += `
      <div class="takeaway-item">
        <div class="takeaway-num">${i + 1}</div>
        <div class="takeaway-text">${text}</div>
      </div>
    `;
      });

      setConfidence("medium");
      startScenarioTimer();
    }




    function resetScenarioPage() {

      const nextBtn = document.getElementById('nextQuestionContainer');
      if (nextBtn) nextBtn.style.display = 'none';
      const cluePanel = document.getElementById("cluePanel");
      if (cluePanel) cluePanel.style.display = "none";
      const feedback = document.getElementById('scenarioFeedback');
      const mockup = document.getElementById('emailMockup');
      const aiTrigger = document.getElementById('aiTrigger');
      const aiPanel = document.getElementById('aiPanel');
      const takeaways = document.getElementById('takeaways');
      const reportBtn = document.getElementById('reportBtnContainer');

      if (feedback) {
        feedback.style.display = 'none';
        feedback.className = 'scenario-feedback';
        feedback.innerHTML = '';
      }

      if (mockup) {
        mockup.style.borderColor = '';
        mockup.style.boxShadow = '';
        mockup.classList.remove('shake');
      }

      if (aiTrigger) aiTrigger.style.display = 'none';

      if (aiPanel) {
        aiPanel.classList.remove('visible');
        aiPanel.querySelectorAll('.ai-section p').forEach(p => {
          p.dataset.typed = 'false';
        });
      }

      if (takeaways) takeaways.style.display = 'none';
      if (reportBtn) reportBtn.remove();

      document.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';

        if (btn.textContent.includes("Clues Revealed")) {
          btn.textContent = "🤔 Need More Info";
        }
      });
    }

    function scenarioAnswer(answer) {
      const state = store.getState();

      if (!state.challenges || !state.challenges[state.challengeIndex]) return;

      if ([...document.querySelectorAll('.scenario-btn')]
        .every(btn => btn.style.pointerEvents === 'none')) return;


      const nextBtn = document.getElementById('nextQuestionContainer');

      const c = state.challenges[state.challengeIndex];
      const currentAttack = c.type;
      const data = attackData[currentAttack];

      if (!data) {
        showHint("Question data could not be loaded. Please restart the assessment.");
        return;
      }

      if (answer === "unsure" && !(c.correctAnswer || c.correct)) {
        clearInterval(scenarioTimer);

        const timerEl = document.getElementById("timer");
        if (timerEl) timerEl.textContent = "🔍 Investigation mode";

        const feedback = document.getElementById("scenarioFeedback");
        const cluePanel = document.getElementById("cluePanel");
        const clueContent = document.getElementById("clueContent");

        if (!feedback || !cluePanel || !clueContent) return;

        cluePanel.style.display = "block";

        if (Array.isArray(c.clues) && c.clues.length > 0) {
          clueContent.innerHTML = c.clues.map(clue => `• ${clue}`).join("<br>");
        } else {
          clueContent.innerHTML = `
      • Check the sender carefully.<br>
      • Look at the domain or source.<br>
      • Ask whether the request matches normal behaviour.<br>
      • Do not decide only from how professional it looks.
    `;
        }

        feedback.className = "scenario-feedback";
        feedback.innerHTML = "🧠 Good investigation. Use the clues, then make your final decision.";
        feedback.style.display = "block";

        store.setState({
          score: Math.max(0, store.getState().score - 5)
        });
        saveProgress();

        const unsureBtn = [...document.querySelectorAll(".scenario-btn")]
          .find(btn => btn.textContent.includes("Need More Info"));

        if (unsureBtn) {
          unsureBtn.style.pointerEvents = "none";
          unsureBtn.style.opacity = "0.45";
          unsureBtn.textContent = "Clues Revealed";
        }

        return;
      }

      clearInterval(scenarioTimer);

      const feedback = document.getElementById('scenarioFeedback');
      const mockup = document.getElementById('emailMockup');

      const validation = AnswerValidationService.validate(answer, c, state.selectedConfidence);
      const isCorrect = validation.isCorrect;

      let updatedCurrentStreak = state.currentStreak || 0;
      let updatedBestStreak = state.bestStreak || 0;

      if (isCorrect) {
        updatedCurrentStreak += 1;
        updatedBestStreak = Math.max(updatedBestStreak, updatedCurrentStreak);
      } else {
        updatedCurrentStreak = 0;
      }

      localStorage.setItem("currentStreak", updatedCurrentStreak);
      localStorage.setItem("bestStreak", updatedBestStreak);

      store.setState({
        currentStreak: updatedCurrentStreak,
        bestStreak: updatedBestStreak
      });


      if (state.isFinalAssessment) {
        store.setState({
          finalCorrect: (state.finalCorrect || 0) + (isCorrect ? 1 : 0),
          finalTotal: (state.finalTotal || 0) + 1
        });
      }

      const updatedTopicStats = {
        ...state.userBehavior.topicStats,
        [currentAttack]: {
          correct: state.userBehavior.topicStats[currentAttack].correct + (isCorrect ? 1 : 0),
          total: state.userBehavior.topicStats[currentAttack].total + 1
        }
      };

      store.setState({
        totalAnswers: state.totalAnswers + 1,
        correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
        userBehavior: {
          ...state.userBehavior,
          topicStats: updatedTopicStats
        }
      });

      const newState = store.getState();

      if (isCorrect) {
        store.setState({
          score: newState.score + 25
        });

        feedback.className = 'scenario-feedback feedback-correct';
        feedback.innerHTML = `
  ✅ Correct<br><br>

  <div class="clue-breakdown">
    <div class="clue-item">
      <strong>Why:</strong> ${c.reason}
    </div>

    <div class="clue-item">
      <strong>Best defender action:</strong> ${c.saferAction || "Continue verifying source, request, and behaviour before acting."}
    </div>
  </div>
`;

        mockup.style.borderColor = 'rgba(34,197,94,0.4)';
        mockup.style.boxShadow = '0 0 40px rgba(34,197,94,0.15)';
      } else {
        const mistakeObject = {
          attack: currentAttack,
          attackName: attackData[currentAttack].name,
          question: c.title,
          userAnswer: answer === "timeout" ? "time ran out" : answer,
          correctAnswer: c.correctAnswer || c.correct,
          reason: c.reason,
          confidence: state.selectedConfidence,
          triggerTags: Array.isArray(c.triggerTags) ? c.triggerTags : [],
          attackerGoal: c.attackerGoal || "The attacker wanted to influence the user into making an unsafe decision.",
          saferAction: c.saferAction || "Pause, verify through a trusted route, and avoid bypassing normal process.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        store.setState({
          score: Math.max(0, newState.score - 10),
          userBehavior: {
            ...store.getState().userBehavior,
            mistakes: [
              ...(store.getState().userBehavior.mistakes || []),
              mistakeObject
            ]
          }
        });

        feedback.className = 'scenario-feedback feedback-incorrect';
        feedback.innerHTML = `
  ❌ Incorrect<br><br>

  <div class="clue-breakdown">
    <div class="clue-item">
      <strong>What you missed:</strong> ${c.reason}
    </div>

    <div class="clue-item">
      <strong>Attacker goal:</strong> ${c.attackerGoal || "The attacker wanted to influence the user into making an unsafe decision."}
    </div>

    <div class="clue-item">
      <strong>Safer action:</strong> ${c.saferAction || "Pause, verify through a trusted route, and avoid bypassing normal process."}
    </div>

    <div class="clue-item">
      <strong>Learning point:</strong> Do not judge the scenario only by how professional it looks. Check the source, behaviour, request, and verification route.
    </div>
  </div>
`;

        mockup.classList.add('shake');
        mockup.style.borderColor = 'rgba(239,68,68,0.4)';
        mockup.style.boxShadow = '0 0 40px rgba(239,68,68,0.15)';
        setTimeout(() => mockup.classList.remove('shake'), 500);
      }

      const answerFeedback = FeedbackService.answerHTML(c, validation);
      feedback.className = answerFeedback.className;
      feedback.innerHTML = answerFeedback.html;

      if (answer === "unsure") {
        const cluePanel = document.getElementById("cluePanel");
        const clueContent = document.getElementById("clueContent");
        if (cluePanel && clueContent) {
          cluePanel.style.display = "block";
          clueContent.innerHTML = Array.isArray(c.clues) && c.clues.length
            ? c.clues.map(clue => `&bull; ${escapeHTML(clue)}`).join("<br>")
            : "&bull; Check the sender or source.<br>&bull; Check whether the request follows normal process.";
        }
      }

      if (nextBtn) nextBtn.style.display = 'block';

      feedback.style.display = 'block';

      feedback.style.animation = 'fadeSlideUp 0.5s forwards';

      document.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.5';
      });

      setTimeout(() => {
        const aiTrigger = document.getElementById('aiTrigger');
        if (aiTrigger) {
          aiTrigger.style.display = 'flex';
          aiTrigger.style.animation = 'fadeSlideUp 0.5s forwards';
        }
      }, 800);

      setTimeout(() => {
        const takeaways = document.getElementById('takeaways');
        if (takeaways) {
          takeaways.style.display = 'block';
          takeaways.style.animation = 'fadeSlideUp 0.5s forwards';
        }
      }, 1200);

      saveProgress();
    }



    function showAIPanel() {
      const panel = document.getElementById('aiPanel');
      const aiTrigger = document.getElementById('aiTrigger');

      if (!panel) return;

      panel.classList.add('visible');

      panel.querySelectorAll('.ai-section p').forEach((p, i) => {
        if (p.dataset.typed === 'true') return;

        const text = p.textContent;
        p.textContent = '';
        p.dataset.typed = 'true';

        let charIndex = 0;

        setTimeout(() => {
          const interval = setInterval(() => {
            p.textContent += text[charIndex];
            charIndex++;

            if (charIndex >= text.length) {
              clearInterval(interval);
            }
          }, 12);
        }, i * 600);
      });

      if (aiTrigger) aiTrigger.style.display = 'none';
    }

    function completeSimulation() {
      const state = store.getState();

      if (state.currentAttack && !state.completedAttacks.includes(state.currentAttack)) {
        store.setState({
          completedAttacks: [...state.completedAttacks, state.currentAttack]
        });
      }
      saveProgress();

      updateTrainingPath();
      navigateTo('report');
      animateDashboard();

      const updatedState = store.getState();

      if (updatedState.completedAttacks.length >= 4 && !updatedState.finalAssessmentPassed) {
        showHint("All modules complete. Now pass the final assessment to unlock your certificate.");
      }

      if (updatedState.finalAssessmentPassed) {
        store.setState({ certificateUnlocked: true });

        const banner = document.getElementById('reportCertBanner');

        if (banner) {
          banner.style.display = 'block';
          banner.style.animation = 'fadeSlideUp 0.8s ease forwards';
        }

        showHint("Certificate unlocked.");
      }
    }


    function getCertificateDashboardState() {
      const state = store.getState();

      const completedAll = state.completedAttacks.length >= 4;

      const passedFinal =
        state.finalAssessmentPassed === true ||
        localStorage.getItem("finalAssessmentPassed") === "true";

      const certificateReady =
        localStorage.getItem("certificateReady") === "true" &&
        !!localStorage.getItem("username");

      return {
        completedAll,
        passedFinal,
        certificateReady
      };
    }


    function handleDashboardCertificateAction() {
      const certState = getCertificateDashboardState();

      if (!certState.completedAll) {
        showHint("Complete all 4 simulations before claiming your certificate.");
        return;
      }

      if (!certState.passedFinal) {
        showHint("Pass the final assessment with 75% or higher before claiming your certificate.");
        return;
      }

      if (certState.certificateReady) {
        openCertificateOverlay();
      } else {
        openCertificateClaim();
      }
    }

    function updateCertificateDashboardCard() {
      const state = store.getState();
      const certState = getCertificateDashboardState();

      const card = document.getElementById("certificateDashboardCard");
      const title = document.getElementById("certificateCardTitle");
      const text = document.getElementById("certificateCardText");
      const status = document.getElementById("certificateCardStatus");
      const previewName = document.getElementById("certificatePreviewName");
      const previewScore = document.getElementById("certificatePreviewScore");
      const previewDate = document.getElementById("certificatePreviewDate");
      const previewID = document.getElementById("certificatePreviewID");
      const actionBtn = document.getElementById("dashCertificateActionBtn");
      const downloadBtn = document.getElementById("dashCertificateDownloadBtn");

      if (!card || !title || !text || !status || !previewName || !previewScore || !previewDate || !previewID || !actionBtn || !downloadBtn) {
        console.warn("Certificate dashboard card elements are missing.");
        return;
      }

      actionBtn.onclick = handleDashboardCertificateAction;

      if (!certState.completedAll) {
        card.classList.add("locked");

        title.textContent = "Certificate Locked";
        text.textContent = "Complete all 4 training modules before the final assessment unlocks.";
        status.textContent = "Locked";

        previewName.textContent = "Not unlocked yet";
        previewScore.textContent = "Final Score: —";
        previewDate.textContent = "Date: —";
        previewID.textContent = "ID: —";

        actionBtn.textContent = "Complete Training First";
        actionBtn.disabled = false;

        downloadBtn.disabled = true;

        return;
      }

      if (!certState.passedFinal) {
        card.classList.add("locked");

        title.textContent = "Final Assessment Required";
        text.textContent = "You have completed the modules. Pass the final assessment with 75% or higher to unlock your certificate.";
        status.textContent = "Final Required";

        previewName.textContent = "Almost there";
        previewScore.textContent = "Final Score: —";
        previewDate.textContent = "Date: —";
        previewID.textContent = "ID: —";

        actionBtn.textContent = "Start Final Assessment";
        actionBtn.disabled = false;
        actionBtn.onclick = function () {
          startFinalAssessment();
        };

        downloadBtn.disabled = true;

        return;
      }

      card.classList.remove("locked");

      const savedName = localStorage.getItem("username");
      const certificateReady = certState.certificateReady;

      if (certificateReady) {
        const certData = getCertificateData();

        title.textContent = "Certificate Ready";
        text.textContent = "Your ThreatScope certificate has been prepared. You can view it, download it, print it, or share it.";
        status.textContent = "Unlocked";

        previewName.textContent = certData.name;
        previewScore.textContent = `Final Score: ${certData.score}`;
        previewDate.textContent = `Date: ${certData.dateStr}`;
        previewID.textContent = `ID: ${certData.certID}`;

        actionBtn.textContent = "🏆 View Certificate";
        actionBtn.disabled = false;
        actionBtn.onclick = function () {
          openCertificateOverlay();
        };

        downloadBtn.disabled = false;
      } else {
        title.textContent = "Certificate Unlocked";
        text.textContent = "You passed the final assessment. Enter your name to prepare your personalised certificate.";
        status.textContent = "Ready to Claim";

        previewName.textContent = savedName || "Your name will appear here";
        previewScore.textContent = `Final Score: ${state.finalAssessmentScore || localStorage.getItem("finalAssessmentScore") || "—"}`;
        previewDate.textContent = "Date: generated when claimed";
        previewID.textContent = "ID: generated when claimed";

        actionBtn.textContent = "🏆 Claim Certificate";
        actionBtn.disabled = false;
        actionBtn.onclick = function () {
          openCertificateClaim();
        };

        downloadBtn.disabled = true;
      }
    }


    function getDashboardScore() {
      const state = store.getState();

      if (state.totalAnswers <= 0) return 0;

      return Math.round((state.correctAnswers / state.totalAnswers) * 100);
    }

    function getWeakestTopic() {
      const state = store.getState();
      const stats = state.userBehavior.topicStats;

      let weakest = null;

      Object.entries(stats).forEach(([topic, value]) => {
        if (value.total === 0) return;

        const accuracy = value.correct / value.total;

        if (!weakest || accuracy < weakest.accuracy) {
          weakest = {
            topic,
            correct: value.correct,
            total: value.total,
            accuracy
          };
        }
      });

      return weakest;
    }

    function getBehaviourFocusTopic() {
      const weakest = getWeakestTopic();
      return weakest?.topic || "phishing";
    }

    function getBehaviourPatternAnalysis() {
      const state = store.getState();
      const mistakes = state.userBehavior.mistakes || [];

      const triggers = {
        urgency: {
          name: "Urgency Pressure",
          short: "Urgency",
          count: 0,
          desc: "You are more likely to make mistakes when the scenario pushes you to act quickly.",
          rule: "Pause when a message creates pressure. Urgency is often used to stop careful thinking."
        },
        authority: {
          name: "Authority Bias",
          short: "Authority",
          count: 0,
          desc: "You are more likely to trust requests that sound official, senior, or IT-related.",
          rule: "Authority does not remove the need for verification. Check the source through a separate trusted channel."
        },
        technical: {
          name: "Technical Signal Missed",
          short: "Technical",
          count: 0,
          desc: "You are missing technical clues such as domains, login patterns, input patterns, or suspicious input.",
          rule: "Look at the evidence, not the wording. Domains, suspicious input patterns, login patterns, and source behaviour matter."
        },
        credentials: {
          name: "Credential Trust",
          short: "Credentials",
          count: 0,
          desc: "You are more vulnerable when the scenario involves passwords, login pages, MFA, or account access.",
          rule: "Never treat credential requests as normal until the sender, destination, and process are verified."
        },
        social: {
          name: "Trust Manipulation",
          short: "Social",
          count: 0,
          desc: "You are more likely to miss attacks that rely on helpfulness, politeness, or believable human pressure.",
          rule: "Being helpful should not mean bypassing security. Verify before sharing access or information."
        }
      };

      mistakes.forEach(mistake => {
        const text = `${mistake.question || ""} ${mistake.reason || ""} ${mistake.attackName || ""}`.toLowerCase();

        if (
          text.includes("urgent") ||
          text.includes("urgency") ||
          text.includes("quickly") ||
          text.includes("expire") ||
          text.includes("deadline") ||
          text.includes("pressure") ||
          text.includes("immediately")
        ) {
          triggers.urgency.count++;
        }

        if (
          text.includes("authority") ||
          text.includes("ceo") ||
          text.includes("it") ||
          text.includes("admin") ||
          text.includes("support") ||
          text.includes("manager") ||
          text.includes("board") ||
          text.includes("official")
        ) {
          triggers.authority.count++;
        }

        if (
          text.includes("domain") ||
          text.includes("sql") ||
          text.includes("injection") ||
          text.includes("input pattern") ||
          text.includes("ip") ||
          text.includes("login") ||
          text.includes("waf") ||
          text.includes("database") ||
          text.includes("oauth")
        ) {
          triggers.technical.count++;
        }

        if (
          text.includes("password") ||
          text.includes("credential") ||
          text.includes("mfa") ||
          text.includes("login") ||
          text.includes("account") ||
          text.includes("token")
        ) {
          triggers.credentials.count++;
        }

        if (
          text.includes("social") ||
          text.includes("caller") ||
          text.includes("trust") ||
          text.includes("helpful") ||
          text.includes("impersonation") ||
          text.includes("tailgating") ||
          text.includes("verify")
        ) {
          triggers.social.count++;
        }
      });

      const sorted = Object.values(triggers).sort((a, b) => b.count - a.count);
      const top = sorted[0];

      return {
        totalMistakes: mistakes.length,
        top,
        sorted
      };
    }

    function updateBehaviourPatternCard() {
      const state = store.getState();
      const analysis = getBehaviourPatternAnalysis();

      const status = document.getElementById("behaviourPatternStatus");
      const mainValue = document.getElementById("behaviourMainValue");
      const mainDesc = document.getElementById("behaviourMainDesc");
      const triggerGrid = document.getElementById("behaviourTriggerGrid");
      const rule = document.getElementById("behaviourRule");
      const actionBtn = document.getElementById("behaviourActionBtn");

      if (!status || !mainValue || !mainDesc || !triggerGrid || !rule || !actionBtn) return;

      if (state.totalAnswers === 0) {
        status.textContent = "Waiting";
        mainValue.textContent = "Not enough data";
        mainDesc.textContent = "Complete more challenge questions so ThreatScope can detect what kind of manipulation affects your decisions.";

        triggerGrid.innerHTML = ["Urgency", "Authority", "Technical"].map(name => `
      <div class="behaviour-trigger-row">
        <div class="behaviour-trigger-name">${name}</div>
        <div class="behaviour-trigger-bar">
          <div class="behaviour-trigger-fill" style="width:0%"></div>
        </div>
        <div class="behaviour-trigger-count">0</div>
      </div>
    `).join("");

        rule.innerHTML = `<strong>Defender rule:</strong> Do not judge the scenario by how professional it looks. Verify the request, source, and behaviour.`;
        actionBtn.textContent = "Start First Drill";
        actionBtn.onclick = () => openLearningModule("phishing");

        return;
      }

      if (analysis.totalMistakes === 0) {
        status.textContent = "Stable";
        mainValue.textContent = "No weak trigger yet";
        mainDesc.textContent = "You have not missed a question yet. Keep testing harder scenarios to reveal whether your awareness holds under pressure.";

        triggerGrid.innerHTML = ["Urgency", "Authority", "Technical"].map(name => `
      <div class="behaviour-trigger-row">
        <div class="behaviour-trigger-name">${name}</div>
        <div class="behaviour-trigger-bar">
          <div class="behaviour-trigger-fill" style="width:0%"></div>
        </div>
        <div class="behaviour-trigger-count">0</div>
      </div>
    `).join("");

        rule.innerHTML = `<strong>Defender rule:</strong> Strong performance means nothing unless it works across every attack type. Keep testing edge cases.`;
        actionBtn.textContent = "Try Harder Scenario";
        actionBtn.onclick = () => openLearningModule(getBehaviourFocusTopic());

        return;
      }

      const top = analysis.top;
      const maxCount = Math.max(...analysis.sorted.map(item => item.count), 1);

      status.textContent = `${analysis.totalMistakes} signal${analysis.totalMistakes === 1 ? "" : "s"}`;
      mainValue.textContent = top.name;
      mainDesc.textContent = top.desc;

      triggerGrid.innerHTML = analysis.sorted.slice(0, 3).map(item => {
        const width = Math.round((item.count / maxCount) * 100);

        return `
      <div class="behaviour-trigger-row">
        <div class="behaviour-trigger-name">${item.short}</div>
        <div class="behaviour-trigger-bar">
          <div class="behaviour-trigger-fill" style="width:${width}%"></div>
        </div>
        <div class="behaviour-trigger-count">${item.count}</div>
      </div>
    `;
      }).join("");

      rule.innerHTML = `<strong>Defender rule:</strong> ${top.rule}`;

      const focusTopic = getBehaviourFocusTopic();
      const focusName = attackData[focusTopic]?.name || "Training";

      actionBtn.textContent = `Drill ${focusName}`;
      actionBtn.onclick = () => openLearningModule(focusTopic);
    }

    function buildAIDashboardAnalysis() {
      const state = store.getState();
      const mistakes = state.userBehavior.mistakes || [];
      const score = getDashboardScore();
      const weakest = getWeakestTopic();

      const summary = document.getElementById("aiDashboardSummary");
      const learningList = document.getElementById("aiLearningList");
      const confidence = document.getElementById("aiConfidence");
      const heroTitle = document.getElementById("dashHeroTitle");
      const heroText = document.getElementById("dashHeroText");
      const heroScore = document.getElementById("dashHeroScore");

      if (heroScore) heroScore.textContent = score;

      if (!summary || !learningList || !confidence) return;

      if (state.totalAnswers === 0) {
        confidence.textContent = "Waiting for data";
        summary.textContent = "Complete some challenge questions first. Once you make mistakes, the AI analyst will explain the pattern and what you need to learn.";

        learningList.innerHTML = `
      <div class="empty-state">
        No weaknesses detected yet. Start a simulation to build your learning profile.
      </div>
    `;

        if (heroTitle) heroTitle.textContent = "Your cyber awareness profile is being built.";
        if (heroText) heroText.textContent = "Complete simulations and answer challenge questions. ThreatScope will analyse your mistakes and show exactly what you need to learn next.";

        return;
      }

      if (mistakes.length === 0) {
        confidence.textContent = "Strong performance";

        summary.textContent = `You have answered ${state.totalAnswers} question${state.totalAnswers === 1 ? "" : "s"} with no wrong answers so far. Your threat recognition is strong, but you should continue across all attack types to prove consistency.`;

        learningList.innerHTML = `
      <div class="ai-learning-item">
        <div class="ai-learning-icon">🧠</div>
        <div>
          <h5>Keep testing edge cases</h5>
          <p>You are doing well. Now focus on harder scenarios where safe messages look suspicious and malicious messages look professional.</p>
        </div>
      </div>
      <div class="ai-learning-item">
        <div class="ai-learning-icon">🛡</div>
        <div>
          <h5>Complete every module</h5>
          <p>A strong score in one area is good, but real cyber awareness means recognising threats across phishing, authentication, databases, and human manipulation.</p>
        </div>
      </div>
    `;

        if (heroTitle) heroTitle.textContent = "Strong threat recognition detected.";
        if (heroText) heroText.textContent = "You have not missed a challenge yet. Keep going across all modules to prove your awareness is not just topic-specific.";

        return;
      }

      confidence.textContent = `${mistakes.length} weakness${mistakes.length === 1 ? "" : "es"} found`;

      const triggerCounts = {
        urgency: 0,
        authority: 0,
        technical: 0,
        credentials: 0,
        social: 0
      };

      mistakes.forEach(mistake => {
        const tags = Array.isArray(mistake.triggerTags) ? mistake.triggerTags : [];

        tags.forEach(tag => {
          if (triggerCounts[tag] !== undefined) {
            triggerCounts[tag]++;
          }
        });
      });

      const strongestPattern = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0];

      const patternLabels = {
        urgency: "urgency pressure",
        authority: "authority bias",
        technical: "technical clue detection",
        credentials: "credential trust",
        social: "human manipulation"
      };

      if (strongestPattern && strongestPattern[1] > 0) {
        confidence.textContent = `Pattern found: ${patternLabels[strongestPattern[0]]}`;

        summary.textContent = `ThreatScope noticed your repeated mistakes are most connected to ${patternLabels[strongestPattern[0]]}. Your next improvement should focus on that exact manipulation pattern, not just doing random extra questions.`;
      }

      const mistakeTopics = {};
      mistakes.forEach(m => {
        mistakeTopics[m.attack] = (mistakeTopics[m.attack] || 0) + 1;
      });

      const mostMissedTopic = Object.entries(mistakeTopics).sort((a, b) => b[1] - a[1])[0];
      const topicName = mostMissedTopic ? attackData[mostMissedTopic[0]].name : "cybersecurity";

      if (score >= 75) {
        summary.textContent = `Your overall score is strong, but ThreatScope noticed repeated weakness around ${topicName}. This means you understand the basics, but some subtle threat signals are still being missed under pressure.`;
      } else if (score >= 45) {
        summary.textContent = `Your performance shows partial awareness, but you are missing important warning signs. The biggest issue appears around ${topicName}, so you should review the clues behind those mistakes before moving on.`;
      } else {
        summary.textContent = `Your risk level is high because several suspicious situations were misread. The AI recommends slowing down and learning how attackers hide malicious intent inside professional-looking messages and normal-looking system activity.`;
      }

      const learningItems = [];

      mistakes.slice(-4).reverse().forEach(m => {
        const cleanQuestion = cleanTitle(m.question || "Previous mistake");

        learningItems.push(`
    <div class="ai-learning-item">
      <div class="ai-learning-icon">⚠</div>
      <div>
        <h5>${escapeHTML(m.attackName)}: ${escapeHTML(cleanQuestion)}</h5>
        <p>${escapeHTML(m.reason)}</p>
      </div>
    </div>
  `);
      });

      if (weakest) {
        learningItems.unshift(`
      <div class="ai-learning-item">
        <div class="ai-learning-icon">🎯</div>
        <div>
          <h5>Priority focus: ${attackData[weakest.topic].name}</h5>
          <p>Your weakest topic is ${attackData[weakest.topic].name}, with ${weakest.correct} correct out of ${weakest.total}. Review this topic before attempting harder scenarios.</p>
        </div>
      </div>
    `);
      }

      learningList.innerHTML = learningItems.join("");

      if (heroTitle) {
        if (score >= 80) heroTitle.textContent = "You are building strong cyber awareness.";
        else if (score >= 50) heroTitle.textContent = "Your awareness is improving, but there are gaps.";
        else heroTitle.textContent = "High-risk behaviour detected in your answers.";
      }

      if (heroText) {
        if (weakest) {
          heroText.textContent = `Your current weakest area is ${attackData[weakest.topic].name}. The dashboard has turned your mistakes into a focused learning path.`;
        } else {
          heroText.textContent = "Keep completing simulations so ThreatScope can build a more accurate learning profile.";
        }
      }
    }

    function updateTopicPerformance() {
      const state = store.getState();
      const stats = state.userBehavior.topicStats;

      Object.entries(stats).forEach(([topic, value]) => {
        const scoreEl = document.getElementById(`topicScore-${topic}`);
        const fillEl = document.getElementById(`topicFill-${topic}`);

        const percent = value.total > 0
          ? Math.round((value.correct / value.total) * 100)
          : 0;

        if (scoreEl) {
          scoreEl.textContent = `${value.correct} / ${value.total}`;
          scoreEl.style.color =
            value.total === 0 ? "var(--text-tertiary)" :
              percent >= 80 ? "#22c55e" :
                percent >= 50 ? "#f59e0b" :
                  "#ef4444";
        }

        if (fillEl) {
          fillEl.style.width = `${percent}%`;
        }
      });
    }


    function updateMistakeLog() {
      const state = store.getState();
      const mistakes = state.userBehavior.mistakes || [];
      const log = document.getElementById("mistakeLog");

      if (!log) return;

      if (mistakes.length === 0) {
        log.innerHTML = `
      <div class="empty-state">
        No wrong answers yet. When you miss a question, it will appear here with the reason and topic.
      </div>
    `;
        return;
      }

      const uniqueMistakes = [];
      const seen = new Set();

      mistakes.forEach((mistake, index) => {
        const cleanQuestion = cleanTitle(mistake.question);
        const key = `${mistake.attack}-${cleanQuestion}-${mistake.correctAnswer}`;

        if (!seen.has(key)) {
          seen.add(key);
          uniqueMistakes.push({
            ...mistake,
            question: cleanQuestion,
            originalIndex: index
          });
        }
      });

      log.innerHTML = uniqueMistakes.slice().reverse().map(m => {
        return `
      <div class="mistake-item">
        <strong>${escapeHTML(m.attackName)} — ${escapeHTML(cleanTitle(m.question))}</strong>
       <span>
  You answered <b>${escapeHTML(m.userAnswer)}</b>, but the correct answer was <b>${escapeHTML(m.correctAnswer)}</b>.<br>
  Confidence: <b>${escapeHTML(m.confidence || "medium")}</b><br><br>

  <b>What you missed:</b> ${escapeHTML(m.reason)}<br><br>

  <b>Attacker goal:</b> ${escapeHTML(m.attackerGoal || "Manipulate the user into making an unsafe decision.")}<br><br>

  <b>Improve next time:</b> ${escapeHTML(m.saferAction || "Verify source, request, behaviour, and normal process before acting.")}
</span>
        <button class="review-btn" onclick="replayMistake(${m.originalIndex})">Replay this mistake</button>
      </div>
    `;
      }).join("");
    }
    function scrollToMistakes() {
      const el = document.getElementById("mistakeReviewCard");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function animateDashboard() {
      const state = store.getState();

      let score = 0;

      if (state.totalAnswers > 0) {
        score = Math.round((state.correctAnswers / state.totalAnswers) * 100);
      }

      const scoreEl = document.getElementById("awarenessScore");
      if (scoreEl) scoreEl.textContent = score;

      const heroScore = document.getElementById("dashHeroScore");
      if (heroScore) heroScore.textContent = score;

      const ring = document.querySelector(".progress-ring");

      if (ring) {
        const circumference = 2 * Math.PI * 52;
        ring.style.strokeDashoffset = circumference - (score / 100) * circumference;
      }

      const completed = state.completedAttacks.length;

      const simEl = document.getElementById("simCompleted");
      if (simEl) simEl.textContent = completed;

      const simBar = document.getElementById("simBar");
      if (simBar) simBar.style.width = `${(completed / 4) * 100}%`;

      const riskEl = document.getElementById("riskLevel");
      const riskBar = document.getElementById("riskBar");
      const riskExplanation = document.getElementById("riskExplanation");

      if (riskEl && riskBar) {
        if (state.totalAnswers === 0) {
          riskEl.textContent = "Not Assessed";
          riskEl.style.color = "var(--text-secondary)";
          riskBar.style.width = "0%";

          if (riskExplanation) {
            riskExplanation.textContent = "Complete challenge questions first so ThreatScope can estimate your risk level.";
          }
        } else if (score >= 80) {
          riskEl.textContent = "Low";
          riskEl.style.color = "#22c55e";
          riskBar.style.width = "22%";

          if (riskExplanation) {
            riskExplanation.textContent = "You are recognising most threat signals correctly. Keep testing harder scenarios to prove consistency.";
          }
        } else if (score >= 50) {
          riskEl.textContent = "Medium";
          riskEl.style.color = "#f59e0b";
          riskBar.style.width = "58%";

          if (riskExplanation) {
            riskExplanation.textContent = "You understand some warning signs, but missed signals still create risk under pressure.";
          }
        } else {
          riskEl.textContent = "High";
          riskEl.style.color = "#ef4444";
          riskBar.style.width = "92%";

          if (riskExplanation) {
            riskExplanation.textContent = "Several suspicious situations were misread. Review your mistakes before attempting the final assessment.";
          }
        }
      }

      const badgeMap = {
        phishing: "badge-phishing",
        bruteforce: "badge-bruteforce",
        sqli: "badge-sqli",
        social: "badge-social"
      };

      Object.entries(badgeMap).forEach(([attack, id]) => {
        const badge = document.getElementById(id);
        if (!badge) return;

        const status = badge.querySelector(".badge-status");

        if (state.completedAttacks.includes(attack)) {
          badge.classList.remove("locked");
          badge.classList.add("earned");
          if (status) status.textContent = "Earned";
        } else {
          badge.classList.remove("earned");
          badge.classList.add("locked");
          if (status) status.textContent = "Locked";
        }
      });

      const champion = document.getElementById("badge-champion");

      if (champion) {
        const status = champion.querySelector(".badge-status");

        if (state.completedAttacks.length >= 4 && state.finalAssessmentPassed) {
          champion.classList.remove("locked");
          champion.classList.add("earned");
          if (status) status.textContent = "Earned";
        } else if (state.completedAttacks.length >= 4) {
          champion.classList.remove("earned");
          champion.classList.add("locked");
          if (status) status.textContent = "Final Required";
        } else {
          champion.classList.remove("earned");
          champion.classList.add("locked");
          if (status) status.textContent = "Locked";
        }
      }

      const currentStreakEl = document.getElementById("currentStreak");
      const bestStreakEl = document.getElementById("bestStreak");
      const finalScoreEl = document.getElementById("finalAssessmentScore");

      if (currentStreakEl) currentStreakEl.textContent = state.currentStreak || 0;
      if (bestStreakEl) bestStreakEl.textContent = state.bestStreak || 0;
      if (finalScoreEl) finalScoreEl.textContent = state.finalAssessmentScore || "—";

      const finalAssessmentText = document.getElementById("finalAssessmentText");
      const finalAssessmentBtn = document.getElementById("finalAssessmentBtn");
      const claimCertificateBtn = document.getElementById("claimCertificateBtn");
      const assessmentStatusPill = document.getElementById("assessmentStatusPill");

      if (finalAssessmentText && finalAssessmentBtn && claimCertificateBtn) {
        if (state.completedAttacks.length < 4) {
          finalAssessmentText.textContent = "Complete all 4 modules before starting the final assessment.";

          finalAssessmentBtn.style.display = "inline-block";
          finalAssessmentBtn.textContent = "Final Assessment Locked";
          finalAssessmentBtn.disabled = true;
          finalAssessmentBtn.style.opacity = "0.45";

          claimCertificateBtn.style.display = "none";

          if (assessmentStatusPill) {
            assessmentStatusPill.textContent = "Locked";
            assessmentStatusPill.style.color = "var(--text-secondary)";
          }
        } else if (state.finalAssessmentPassed) {
          const certificateReady = localStorage.getItem("certificateReady") === "true";

          finalAssessmentText.textContent = certificateReady
            ? `You passed the final assessment with ${state.finalAssessmentScore}. Your certificate is ready to view.`
            : `You passed the final assessment with ${state.finalAssessmentScore}. Claim your certificate when ready.`;

          finalAssessmentBtn.style.display = "none";
          finalAssessmentBtn.disabled = false;

          claimCertificateBtn.style.display = "inline-block";
          claimCertificateBtn.textContent = certificateReady ? "🏆 View Certificate" : "🏆 Claim Certificate";
          claimCertificateBtn.onclick = certificateReady ? openCertificateOverlay : openCertificateClaim;

          if (assessmentStatusPill) {
            assessmentStatusPill.textContent = "Passed";
            assessmentStatusPill.style.color = "#86efac";
          }
        } else {
          finalAssessmentText.textContent = "All modules are complete. Pass the final mixed assessment with at least 75% to unlock your certificate.";

          finalAssessmentBtn.style.display = "inline-block";
          finalAssessmentBtn.textContent = "Start Final Assessment";
          finalAssessmentBtn.disabled = false;
          finalAssessmentBtn.style.opacity = "1";

          claimCertificateBtn.style.display = "none";

          if (assessmentStatusPill) {
            assessmentStatusPill.textContent = "Unlocked";
            assessmentStatusPill.style.color = "#fcd34d";
          }
        }
      }

      updateCertificateDashboardCard();
      buildAIDashboardAnalysis();
      updateTopicPerformance();
      updateMistakeLog();
      updateBehaviourPatternCard();
      updateTrainingPath();
    }


    function updateReportPage() {
      const state = store.getState();
      const data = attackData[state.currentAttack];

      const title = document.querySelector("#page-report .section-title");
      const desc = document.querySelector("#page-report .section-desc");
      const banner = document.getElementById("reportCertBanner");

      const reportContent = {
        phishing: {
          wentWrong: "The victim trusted the message because it looked professional, used familiar branding, and created pressure to act quickly.",
          attacker: "The attacker used urgency, a lookalike domain, and a fake login flow to make credential theft feel like a normal security process.",
          prevent: "Verify sender domains, avoid login links inside unexpected emails, report suspicious messages, and use MFA or hardware security keys."
        },
        bruteforce: {
          wentWrong: "The account was exposed because suspicious login behaviour was not recognised early enough.",
          attacker: "The attacker used repeated login attempts, leaked credentials, password spraying, or MFA fatigue to gain access.",
          prevent: "Use rate limiting, breached password checks, MFA, lockout rules, and alerts for impossible travel or repeated authentication failures."
        },
        sqli: {
          wentWrong: "Unsafe input handling allowed user-supplied data to affect database logic.",
          attacker: "The attacker tested inputs with SQL-like input patterns, watched for errors or delays, and tried to extract or manipulate data.",
          prevent: "Use parameterised queries, input validation, least-privilege database accounts, safe error handling, and application monitoring."
        },
        social: {
          wentWrong: "The attacker exploited trust, urgency, authority, or helpfulness to bypass normal security checks.",
          attacker: "The attacker created a believable story and pushed the target to reveal information, approve access, or skip verification.",
          prevent: "Verify identity through a separate trusted channel, never share passwords or MFA codes, and follow access-control procedures every time."
        }
      };

      const content = reportContent[state.currentAttack] || reportContent.phishing;

      if (data) {
        if (title) title.textContent = `${data.name} Analysis`;
        if (desc) desc.textContent = `Full breakdown of the ${data.name.toLowerCase()} path and your response.`;
      }

      const cards = document.querySelectorAll("#page-report .insight-body p");

      if (cards[0]) cards[0].textContent = content.wentWrong;
      if (cards[1]) cards[1].textContent = content.attacker;
      if (cards[2]) cards[2].textContent = content.prevent;

      if (banner) {
        const canShowCertificate =
          state.completedAttacks.length >= 4 && state.finalAssessmentPassed;

        banner.style.display = canShowCertificate ? "block" : "none";

        if (canShowCertificate) {
          banner.style.animation = "fadeSlideUp 0.8s ease forwards";
        }
      }
    }

    function animateAttackChain() {
      const nodes = document.querySelectorAll('.chain-node');
      const arrows = document.querySelectorAll('.chain-arrow');
      let delay = 200;

      nodes.forEach((node, i) => {
        node.style.opacity = '0';
        node.style.transform = 'translateX(-20px)';

        setTimeout(() => {
          node.style.transition = 'all 0.5s cubic-bezier(0.4,0,0.2,1)';
          node.style.opacity = '1';
          node.style.transform = 'translateX(0)';
        }, delay);

        delay += 300;

        if (arrows[i]) {
          arrows[i].style.opacity = '0';
          setTimeout(() => {
            arrows[i].style.transition = 'all 0.3s ease';
            arrows[i].style.opacity = '1';
          }, delay);
          delay += 150;
        }
      });
    }

    function toggleInsight(card) {
      card.classList.toggle('expanded');
    }

    let hintTimeout;
    let scenarioTimer;

    function startScenarioTimer() {
      const state = store.getState();

      const difficulty = state.isFinalAssessment
        ? "hard"
        : state.difficulty;

      const timeByDifficulty = {
        easy: 70,
        hard: 45,
        expert: 30
      };

      let time = timeByDifficulty[difficulty] || 45;
      const el = document.getElementById("timer");

      if (el) {
        const label =
          difficulty === "easy" ? "Guided decision time" :
            difficulty === "hard" ? "Challenge decision time" :
              "Expert pressure timer";

        el.textContent = `⏳ ${label}: ${time}s`;
      }

      clearInterval(scenarioTimer);

      scenarioTimer = setInterval(() => {
        time--;

        if (el) {
          const label =
            difficulty === "easy" ? "Guided decision time" :
              difficulty === "hard" ? "Challenge decision time" :
                "Expert pressure timer";

          el.textContent = `⏳ ${label}: ${time}s`;
        }

        if (time <= 0) {
          clearInterval(scenarioTimer);
          scenarioAnswer("timeout");
        }
      }, 1000);
    }

    function showHint(text) {
      clearTimeout(hintTimeout);

      const hint = document.getElementById('floatingHint');
      const hintText = document.getElementById('hintText');

      if (!hint || !hintText) return;

      hintText.textContent = text;
      hint.classList.add('visible');

      hintTimeout = setTimeout(() => {
        hint.classList.remove('visible');
      }, 5000);
    }

    document.addEventListener('click', e => {
      const btn = e.target.closest('button, .attack-card, .sim-btn');

      if (!btn) return;

      const ripple = document.createElement('span');
      ripple.className = 'ripple';

      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);

      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';

      btn.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });

    function getAttackCards() {
      return document.querySelectorAll('.attack-card');
    }
    let ticking = false;
    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!ticking) {
        requestAnimationFrame(() => {
          getAttackCards().forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
              const rotateX = ((y - rect.height / 2) / rect.height) * -6;
              const rotateY = ((x - rect.width / 2) / rect.width) * 6;

              card.style.transform =
                `translateY(-8px) scale(1.02) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            } else {
              card.style.transform = '';
            }
          });
          ticking = false;
        });
        ticking = true;
      }
    });

    function setupCardHover() {
      getAttackCards().forEach(card => {
        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
          card.style.transition = 'all 0.4s cubic-bezier(0.4,0,0.2,1)';
        });
      });
    }

    setupCardHover();

    setTimeout(() => {
      setupCardHover();
    }, 500);


    // CERTIFICATE GENERATION LOGIC

    function getFinalScore() {
      const savedFinalScore = localStorage.getItem("finalAssessmentScore");

      if (savedFinalScore) {
        return savedFinalScore.replace("%", "");
      }

      const state = store.getState();

      if (state.finalAssessmentScore) {
        return String(state.finalAssessmentScore).replace("%", "");
      }

      return 0;
    }

    function createCertificateID() {
      const state = store.getState();

      const existingFromState = state.certificateID;
      const existingFromLocal = localStorage.getItem("certificateID");

      if (existingFromState && existingFromState.trim() !== "") {
        localStorage.setItem("certificateID", existingFromState);
        return existingFromState;
      }

      if (existingFromLocal && existingFromLocal.trim() !== "") {
        store.setState({ certificateID: existingFromLocal });
        return existingFromLocal;
      }

      const now = new Date();
      const id =
        "TS-" +
        now.getFullYear() +
        "-" +
        Math.random().toString(36).substring(2, 8).toUpperCase();

      localStorage.setItem("certificateID", id);
      store.setState({ certificateID: id });

      return id;
    }

    function getCertificateData() {
      const state = store.getState();

      const name =
        localStorage.getItem("username") ||
        state.username ||
        "Learner";

      const score =
        state.finalAssessmentScore ||
        localStorage.getItem("finalAssessmentScore") ||
        "0%";

      let dateStr =
        localStorage.getItem("certificateDate") ||
        state.certificateDate;

      if (!dateStr) {
        const now = new Date();

        dateStr = now.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric"
        });

        localStorage.setItem("certificateDate", dateStr);
        store.setState({ certificateDate: dateStr });
      }

      const certID = createCertificateID();
      return {
        name: name.trim() || "Learner",
        score: String(score).includes("%") ? score : score + "%",
        dateStr,
        certID
      };
    }
    function saveProgress() {
      const state = store.getState();

      const progress = {
        score: state.score,
        completedAttacks: state.completedAttacks,
        correctAnswers: state.correctAnswers,
        totalAnswers: state.totalAnswers,
        currentStreak: state.currentStreak,
        bestStreak: state.bestStreak,
        finalAssessmentPassed: state.finalAssessmentPassed,
        finalAssessmentScore: state.finalAssessmentScore,
        userBehavior: state.userBehavior
      };

      localStorage.setItem("threatscopeProgress", JSON.stringify(progress));
    }

    function openCertificateClaim() {
      const state = store.getState();

      const hasCompletedAllModules = state.completedAttacks.length >= 4;
      const hasPassedFinal =
        state.finalAssessmentPassed === true ||
        localStorage.getItem("finalAssessmentPassed") === "true";

      if (!hasCompletedAllModules) {
        showHint("Complete all 4 simulations before claiming your certificate.");
        return;
      }

      if (!hasPassedFinal) {
        showHint("Pass the final assessment with 75% or higher before claiming your certificate.");
        return;
      }

      const modal = document.getElementById("nameEntryModal");
      const modalBox = document.querySelector("#nameEntryModal > div");

      if (!modal || !modalBox) return;

      const savedName = localStorage.getItem("username") || "";

      modalBox.innerHTML = `
    <button onclick="closeCertificateClaim()" style="position:absolute; top:14px; right:14px; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); color:#fff; width:34px; height:34px; border-radius:10px; cursor:pointer;">
      ✕
    </button>

    <div style="font-size:3rem; margin-bottom:16px;">🎓</div>

    <h3 style="font-family:'Space Grotesk', sans-serif; font-size:1.55rem; margin-bottom:8px;">
      Claim Your Certificate
    </h3>

    <p style="color:var(--text-secondary); font-size:0.9rem; line-height:1.7; margin-bottom:24px;">
      You completed all 4 simulations. Enter your name first, then you can choose when to display your certificate.
    </p>

    <input
      type="text"
      id="certNameInput"
      value="${escapeHTML(savedName)}"
      placeholder="e.g. Jane Doe"
      style="width:100%; padding:14px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.5); color:white; font-size:1rem; margin-bottom:18px; text-align:center; font-family:'Inter', sans-serif; outline:none;"
    >

    <button class="btn-primary" onclick="generateMyCertificate()" style="width:100%; padding:14px;">
      Prepare Certificate
    </button>

    <p style="font-size:0.72rem; color:var(--text-tertiary); line-height:1.6; margin-top:16px;">
      Your name is saved locally in this browser so you can reopen and download the certificate later.
    </p>
  `;

      modal.style.display = "flex";

      const input = document.getElementById("certNameInput");
      if (input) input.focus();
    }

    function generateMyCertificate() {
      const input = document.getElementById("certNameInput");
      const modalBox = document.querySelector("#nameEntryModal > div");

      if (!input || !modalBox) return;

      const name = input.value.trim();

      if (!name) {
        alert("Please enter a valid name to generate your certificate.");
        return;
      }

      localStorage.setItem("username", name);
      localStorage.setItem("certificateReady", "true");

      if (!localStorage.getItem("certificateDate")) {
        const now = new Date();

        localStorage.setItem(
          "certificateDate",
          now.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
          })
        );
      }

      createCertificateID();

      store.setState({
        username: name,
        certificateReady: true
      });

      const certData = getCertificateData();

      modalBox.innerHTML = `
    <div style="font-size:3rem; margin-bottom:16px;">✅</div>

    <h3 style="font-family:'Space Grotesk', sans-serif; font-size:1.5rem; margin-bottom:8px;">
      Certificate Ready
    </h3>

    <p style="color:var(--text-secondary); font-size:0.9rem; line-height:1.7; margin-bottom:24px;">
      Your certificate has been prepared for
      <strong style="color:var(--text-primary);">${escapeHTML(certData.name)}</strong>.
      You can display it, download it, or return to it later from the dashboard.
    </p>

    <button class="btn-primary" onclick="displayPreparedCertificate()" style="width:100%; padding:14px; margin-bottom:12px;">
      Display Certificate
    </button>

    <button onclick="downloadCertificate()" style="width:100%; padding:13px; margin-bottom:12px; background:linear-gradient(135deg,#c084fc,#a855f7); border:none; border-radius:12px; color:white; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif;">
      ⬇ Download PNG
    </button>

    <button onclick="closeCertificateClaim(); animateDashboard();" style="width:100%; padding:12px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:rgba(241,241,245,0.75); cursor:pointer; font-family:'Inter',sans-serif;">
      Not Now
    </button>
  `;


      saveProgress();
      saveCertificateToSupabase();
      updateCertificateDashboardCard();
      animateDashboard();




    }
    function displayPreparedCertificate() {
      const name = localStorage.getItem("username");

      if (!name || name.trim() === "") {
        openCertificateClaim();
        return;
      }

      localStorage.setItem("certificateReady", "true");

      closeCertificateClaim();
      showCertificate(name.trim());
      animateDashboard();
    }

    function closeCertificateClaim() {
      const modal = document.getElementById("nameEntryModal");
      if (modal) modal.style.display = "none";
    }

    window.openCertificateOverlay = async function () {
      const certState = getCertificateDashboardState();

      if (!certState.completedAll) {
        showHint("Complete all 4 simulations before viewing your certificate.");
        return;
      }

      if (!certState.passedFinal) {
        showHint("Pass the final assessment before viewing your certificate.");
        return;
      }

      const name = localStorage.getItem("username");

      if (!name || name.trim() === "") {
        openCertificateClaim();
        return;
      }

      localStorage.setItem("certificateReady", "true");

      showCertificate(name.trim());

      if (currentUser) {
        saveCertificateToSupabase().catch(error => {
          console.error("Certificate background save failed:", error);
        });
      }
    };



    function printPhysicalCertificate() {
      window.print();
    }

    function showCertificate(name) {
      const overlay = document.getElementById("certificateOverlay");
      if (!overlay) return;

      localStorage.setItem("username", name);

      const certData = getCertificateData();

      document.getElementById("certName").innerText = certData.name;
      document.getElementById("certScore").innerText = certData.score;
      document.getElementById("certDate").innerText = certData.dateStr;
      document.getElementById("certID").innerText = certData.certID;

      overlay.style.display = "block";
      overlay.scrollTop = 0;
    }

    function roundRect(ctx, x, y, width, height, radius) {
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        return;
      }

      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    }

    function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
      const words = text.split(" ");
      let line = "";
      const lines = [];

      words.forEach(word => {
        const testLine = line + word + " ";
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > maxWidth && line !== "") {
          lines.push(line.trim());
          line = word + " ";
        } else {
          line = testLine;
        }
      });

      lines.push(line.trim());

      lines.forEach((lineText, index) => {
        ctx.fillText(lineText, x, y + index * lineHeight);
      });

      return lines.length;
    }


    function escapeHTML(text) {
      return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function safeFileName(text) {
      return text
        .trim()
        .replace(/[^a-z0-9\- ]/gi, "")
        .replace(/\s+/g, "-")
        .substring(0, 60) || "Learner";
    }

    function triggerCanvasDownload(canvas, filename) {
      if (canvas.toBlob) {
        canvas.toBlob(blob => {
          if (!blob) {
            const fallbackLink = document.createElement("a");
            fallbackLink.download = filename;
            fallbackLink.href = canvas.toDataURL("image/png");
            document.body.appendChild(fallbackLink);
            fallbackLink.click();
            fallbackLink.remove();
            return;
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");

          link.download = filename;
          link.href = url;

          document.body.appendChild(link);
          link.click();
          link.remove();

          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, "image/png");
      } else {
        const link = document.createElement("a");
        link.download = filename;
        link.href = canvas.toDataURL("image/png");

        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    }

    async function downloadCertificate() {
      const state = store.getState();


      const savedProgressForCertificate = JSON.parse(localStorage.getItem("threatscopeProgress") || "{}");

      const completedCount = Array.isArray(state.completedAttacks)
        ? state.completedAttacks.length
        : 0;

      const savedCompletedCount = Array.isArray(savedProgressForCertificate.completedAttacks)
        ? savedProgressForCertificate.completedAttacks.length
        : 0;

      if (Math.max(completedCount, savedCompletedCount) < 4) {
        showHint("Complete all 4 simulations before downloading your certificate.");
        return;
      }

      const hasPassedFinal =
        state.finalAssessmentPassed === true ||
        localStorage.getItem("finalAssessmentPassed") === "true";

      if (!hasPassedFinal) {
        showHint("Pass the final assessment before downloading your certificate.");
        return;
      }

      const savedName = localStorage.getItem("username");

      if (!savedName || savedName.trim() === "") {
        openCertificateClaim();
        return;
      }

      const certData = getCertificateData();

      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch (error) {
          console.warn("Fonts were not fully ready before canvas export.", error);
        }
      }

      const W = 1600;
      const H = 1100;

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;

      const c = canvas.getContext("2d");

      if (!c) {
        alert("Your browser could not create the certificate image. Try again in a modern browser.");
        return;
      }

      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = "high";

      const bg = c.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#0d0d22");
      bg.addColorStop(0.55, "#111827");
      bg.addColorStop(1, "#0a0f1e");

      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);

      const glow1 = c.createRadialGradient(180, 120, 0, 180, 120, 520);
      glow1.addColorStop(0, "rgba(192,132,252,0.20)");
      glow1.addColorStop(1, "rgba(192,132,252,0)");
      c.fillStyle = glow1;
      c.fillRect(0, 0, W, H);

      const glow2 = c.createRadialGradient(W - 180, H - 120, 0, W - 180, H - 120, 520);
      glow2.addColorStop(0, "rgba(245,158,11,0.16)");
      glow2.addColorStop(1, "rgba(245,158,11,0)");
      c.fillStyle = glow2;
      c.fillRect(0, 0, W, H);

      const topBar = c.createLinearGradient(0, 0, W, 0);
      topBar.addColorStop(0, "#c084fc");
      topBar.addColorStop(0.5, "#f59e0b");
      topBar.addColorStop(1, "#c084fc");

      c.fillStyle = topBar;
      c.fillRect(0, 0, W, 10);

      c.globalAlpha = 1;
      c.strokeStyle = "rgba(192,132,252,0.35)";
      c.lineWidth = 3;
      c.strokeRect(24, 24, W - 48, H - 48);

      const bracket = 78;

      c.strokeStyle = "rgba(192,132,252,0.62)";
      c.lineWidth = 4;

      c.beginPath();
      c.moveTo(58, 58 + bracket);
      c.lineTo(58, 58);
      c.lineTo(58 + bracket, 58);
      c.stroke();

      c.beginPath();
      c.moveTo(W - 58 - bracket, 58);
      c.lineTo(W - 58, 58);
      c.lineTo(W - 58, 58 + bracket);
      c.stroke();

      c.beginPath();
      c.moveTo(58, H - 58 - bracket);
      c.lineTo(58, H - 58);
      c.lineTo(58 + bracket, H - 58);
      c.stroke();

      c.beginPath();
      c.moveTo(W - 58 - bracket, H - 58);
      c.lineTo(W - 58, H - 58);
      c.lineTo(W - 58, H - 58 - bracket);
      c.stroke();

      c.textAlign = "center";
      c.textBaseline = "middle";

      c.font = "76px serif";
      c.fillStyle = "#f1f1f5";
      c.fillText("🛡", W / 2, 145);

      c.font = "700 18px Arial";
      c.fillStyle = "#c084fc";
      c.fillText("THREATSCOPE — CYBER DEFENCE TRAINING", W / 2, 215);

      c.font = "700 64px Arial";
      c.fillStyle = "#f1f1f5";
      c.fillText("Certificate of Completion", W / 2, 305);

      const divider = c.createLinearGradient(W / 2 - 170, 0, W / 2 + 170, 0);
      divider.addColorStop(0, "rgba(192,132,252,0)");
      divider.addColorStop(0.5, "rgba(192,132,252,0.8)");
      divider.addColorStop(1, "rgba(192,132,252,0)");

      c.strokeStyle = divider;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(W / 2 - 170, 360);
      c.lineTo(W / 2 + 170, 360);
      c.stroke();

      c.font = "24px Arial";
      c.fillStyle = "rgba(241,241,245,0.55)";
      c.fillText("This is to certify that", W / 2, 415);

      let nameFontSize = 78;

      if (certData.name.length > 22) nameFontSize = 62;
      if (certData.name.length > 32) nameFontSize = 52;

      const nameGradient = c.createLinearGradient(W / 2 - 330, 0, W / 2 + 330, 0);
      nameGradient.addColorStop(0, "#c084fc");
      nameGradient.addColorStop(1, "#f59e0b");

      c.font = `700 ${nameFontSize}px Arial`;
      c.fillStyle = nameGradient;
      c.fillText(certData.name, W / 2, 505);

      c.font = "25px Arial";
      c.fillStyle = "rgba(241,241,245,0.74)";

      const desc = "has successfully completed the ThreatScope Cyber Awareness Training Programme, demonstrating knowledge across phishing and AI-generated threats, credential attacks, access control, web exploits, data protection, social engineering, and risk awareness.";

      wrapCanvasText(c, desc, W / 2, 590, 920, 38);

      const stats = [
        ["Final Score", certData.score, "#22c55e"],
        ["Modules", "4 / 4", "#c084fc"],
        ["Date Issued", certData.dateStr, "#f59e0b"]
      ];

      const boxW = 250;
      const boxH = 96;
      const gap = 34;
      const totalW = stats.length * boxW + (stats.length - 1) * gap;
      let x = W / 2 - totalW / 2;
      const y = 720;

      stats.forEach(([label, value, colour]) => {
        c.fillStyle = "rgba(255,255,255,0.045)";
        c.strokeStyle = "rgba(255,255,255,0.12)";
        c.lineWidth = 1.5;

        roundRect(c, x, y, boxW, boxH, 18);
        c.fill();
        c.stroke();

        c.font = "700 13px Arial";
        c.fillStyle = "rgba(241,241,245,0.42)";
        c.fillText(label.toUpperCase(), x + boxW / 2, y + 30);

        c.font = "700 30px Arial";
        c.fillStyle = colour;
        c.fillText(value, x + boxW / 2, y + 65);

        x += boxW + gap;
      });

      c.strokeStyle = "rgba(255,255,255,0.08)";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(120, 870);
      c.lineTo(W - 120, 870);
      c.stroke();

      c.font = "italic 700 34px Georgia";
      c.fillStyle = "#f1f1f5";
      c.fillText("Shivam Jambagi", W / 2 - 260, 940);

      c.strokeStyle = "rgba(255,255,255,0.22)";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(W / 2 - 430, 970);
      c.lineTo(W / 2 - 90, 970);
      c.stroke();

      c.font = "700 13px Arial";
      c.fillStyle = "rgba(241,241,245,0.42)";
      c.fillText("ISSUED BY", W / 2 - 260, 1000);

      c.font = "700 18px monospace";
      c.fillStyle = "rgba(192,132,252,0.82)";
      c.fillText(certData.certID, W / 2 + 260, 940);

      c.strokeStyle = "rgba(255,255,255,0.22)";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(W / 2 + 90, 970);
      c.lineTo(W / 2 + 430, 970);
      c.stroke();

      c.font = "700 13px Arial";
      c.fillStyle = "rgba(241,241,245,0.42)";
      c.fillText("CERTIFICATE ID", W / 2 + 260, 1000);

      const bottomBar = c.createLinearGradient(0, 0, W, 0);
      bottomBar.addColorStop(0, "#c084fc");
      bottomBar.addColorStop(0.5, "#f59e0b");
      bottomBar.addColorStop(1, "#c084fc");

      c.globalAlpha = 0.55;
      c.fillStyle = bottomBar;
      c.fillRect(0, H - 8, W, 8);
      c.globalAlpha = 1;

      const filename = `ThreatScope-Certificate-${safeFileName(certData.name)}.png`;

      triggerCanvasDownload(canvas, filename);
    }

    function shareOnLinkedIn() {
      const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }

    triggerAnimations();
    updateTrainingPath();
    animateDashboard();

    document.querySelectorAll('.circular-progress svg').forEach((svg, index) => {
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');

      gradient.id = `circGrad${index}`;
      gradient.innerHTML = `
    <stop offset="0%" stop-color="#c084fc"/>
    <stop offset="100%" stop-color="#f59e0b"/>
  `;

      defs.appendChild(gradient);
      svg.prepend(defs);

      const ring = svg.querySelector('.progress-ring');
      if (ring) ring.setAttribute('stroke', `url(#circGrad${index})`);

    });

/* ===== Legacy app block 2 extracted from CyberSecurityTutor2.html ===== */
(() => {
      "use strict";

      const TS = {
        progressKey: "threatscopeProgress",
        certReadyKey: "certificateReady",
        finalPassedKey: "finalAssessmentPassed",
        finalScoreKey: "finalAssessmentScore",
        usernameKey: "username",
        certDateKey: "certificateDate",
        certIdKey: "certificateID",
        minPassPercent: 75,
        totalModules: 4,
        cloudReady: false,
        cloudLoading: false,
        suppressCloudSave: false,
        saveTimer: null
      };

      const appStore = typeof store !== "undefined" ? store : window.store;

      function byId(id) {
        return document.getElementById(id);
      }

      function safeJSON(value, fallback = null) {
        try {
          return JSON.parse(value);
        } catch {
          return fallback;
        }
      }

      function clampNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
        const number = Number(value || 0);
        if (!Number.isFinite(number)) return min;
        return Math.min(max, Math.max(min, number));
      }

      function uniqueList(list) {
        return [...new Set(Array.isArray(list) ? list.filter(Boolean) : [])];
      }

      function stripVariantNoise(title) {
        return String(title || "")
          .replace(/\s+—\s+(PHISH|AUTH|WEB|HUMAN|FINAL|CASE|V|ASSESS)-[A-Z0-9-]+/gi, "")
          .replace(/\s+—\s+Final Variant\s+[A-Z0-9-]+/gi, "")
          .replace(/\s+—\s+Variant\s+[A-Z0-9-]+/gi, "")
          .replace(/\s+—\s+[A-Z]+-[A-Z0-9-]+/gi, "")
          .replace(/\s+-\s+[A-Z]+-[A-Z0-9-]+/gi, "")
          .replace(/\s+—\s*$/g, "")
          .replace(/\s+-\s*$/g, "")
          .trim();
      }

      function escapeText(value) {
        return String(value ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
      }

      function defaultBehaviour() {
        return {
          hesitations: 0,
          speed: [],
          mistakes: [],
          confidenceMistakes: [],
          topicStats: {
            phishing: { correct: 0, total: 0 },
            bruteforce: { correct: 0, total: 0 },
            sqli: { correct: 0, total: 0 },
            social: { correct: 0, total: 0 }
          }
        };
      }

      function getStateSafe() {
        return appStore.getState();
      }

      function setStateSafe(update) {
        appStore.setState(update);
      }

      function getSavedProgress() {
        const saved = safeJSON(localStorage.getItem(TS.progressKey), null);
        if (!saved || typeof saved !== "object") return null;
        return saved;
      }

      function normaliseProgress(raw = {}) {
        const clean = defaultBehaviour();
        const behaviour = raw.userBehavior || {};
        const topicStats = behaviour.topicStats || {};

        const normalisedTopics = { ...clean.topicStats };

        Object.keys(normalisedTopics).forEach(topic => {
          normalisedTopics[topic] = {
            correct: clampNumber(topicStats[topic]?.correct, 0, 9999),
            total: clampNumber(topicStats[topic]?.total, 0, 9999)
          };

          if (normalisedTopics[topic].correct > normalisedTopics[topic].total) {
            normalisedTopics[topic].correct = normalisedTopics[topic].total;
          }
        });

        const totalAnswers = clampNumber(raw.totalAnswers, 0, 99999);
        let correctAnswers = clampNumber(raw.correctAnswers, 0, 99999);

        if (correctAnswers > totalAnswers) correctAnswers = totalAnswers;

        const completedAttacks = uniqueList(raw.completedAttacks).filter(type =>
          ["phishing", "bruteforce", "sqli", "social"].includes(type)
        );

        const finalAssessmentScore = raw.finalAssessmentScore || localStorage.getItem(TS.finalScoreKey) || null;
        const scoreNumber = Number(String(finalAssessmentScore || "0").replace("%", ""));

        const finalAssessmentPassed =
          raw.finalAssessmentPassed === true ||
          localStorage.getItem(TS.finalPassedKey) === "true" ||
          scoreNumber >= TS.minPassPercent;

        return {
          score: clampNumber(raw.score, 0, 999999),
          completedAttacks,
          correctAnswers,
          totalAnswers,
          currentStreak: clampNumber(raw.currentStreak, 0, 9999),
          bestStreak: clampNumber(raw.bestStreak, 0, 9999),
          finalAssessmentPassed,
          finalAssessmentScore,
          username: String(raw.username || localStorage.getItem(TS.usernameKey) || "").trim(),
          certificateReady: raw.certificateReady === true || localStorage.getItem(TS.certReadyKey) === "true",
          certificateDate: raw.certificateDate || localStorage.getItem(TS.certDateKey) || null,
          certificateID: raw.certificateID || localStorage.getItem(TS.certIdKey) || null,
          userBehavior: {
            ...clean,
            ...behaviour,
            topicStats: normalisedTopics,
            mistakes: Array.isArray(behaviour.mistakes)
              ? behaviour.mistakes.slice(-80).map(m => ({
                ...m,
                attack: String(m.attack || ""),
                attackName: String(m.attackName || "Unknown"),
                question: stripVariantNoise(m.question || "Previous mistake"),
                userAnswer: String(m.userAnswer || "unknown"),
                correctAnswer: String(m.correctAnswer || "unknown"),
                reason: String(m.reason || "No reason saved."),
                confidence: String(m.confidence || "medium"),
                time: String(m.time || "")
              }))
              : []
          }
        };
      }

      function buildProgressPayload() {
        const state = normaliseProgress(getStateSafe());

        return {
          ...state,
          username: localStorage.getItem(TS.usernameKey) || state.username || "",
          certificateReady: localStorage.getItem(TS.certReadyKey) === "true" || state.certificateReady,
          certificateDate: localStorage.getItem(TS.certDateKey) || state.certificateDate,
          certificateID: localStorage.getItem(TS.certIdKey) || state.certificateID
        };
      }

      function syncLocalFlags(progress) {
        localStorage.setItem(TS.progressKey, JSON.stringify(progress));

        if (progress.finalAssessmentPassed) localStorage.setItem(TS.finalPassedKey, "true");
        else localStorage.removeItem(TS.finalPassedKey);

        if (progress.finalAssessmentScore) localStorage.setItem(TS.finalScoreKey, progress.finalAssessmentScore);
        else localStorage.removeItem(TS.finalScoreKey);

        if (progress.username) localStorage.setItem(TS.usernameKey, progress.username);
        if (progress.certificateReady) localStorage.setItem(TS.certReadyKey, "true");
        if (progress.certificateDate) localStorage.setItem(TS.certDateKey, progress.certificateDate);
        if (progress.certificateID) localStorage.setItem(TS.certIdKey, progress.certificateID);
      }

      function completedAllModules() {
        const stateCount = uniqueList(getStateSafe().completedAttacks).length;
        const savedCount = uniqueList(getSavedProgress()?.completedAttacks).length;
        return Math.max(stateCount, savedCount) >= TS.totalModules;
      }

      function passedFinalAssessment() {
        const state = getStateSafe();
        const score = Number(String(state.finalAssessmentScore || localStorage.getItem(TS.finalScoreKey) || "0").replace("%", ""));

        return (
          state.finalAssessmentPassed === true ||
          localStorage.getItem(TS.finalPassedKey) === "true" ||
          score >= TS.minPassPercent
        );
      }

      async function writeCloudProgress(progress) {
        if (!currentUser || !supabaseClient) return;
        if (!TS.cloudReady || TS.cloudLoading || TS.suppressCloudSave) return;

        const { error } = await supabaseClient
          .from("threatscope_progress")
          .upsert({
            user_id: currentUser.id,
            progress,
            updated_at: new Date().toISOString()
          });

        if (error) console.error("ThreatScope cloud save failed:", error.message);
      }

      window.saveProgress = function () {
        const progress = buildProgressPayload();
        syncLocalFlags(progress);

        clearTimeout(TS.saveTimer);

        TS.saveTimer = setTimeout(() => {
          writeCloudProgress(progress);
        }, 350);
      };

      window.loadCloudProgress = async function () {
        if (!currentUser || !supabaseClient) return;

        TS.cloudLoading = true;
        TS.cloudReady = false;
        TS.suppressCloudSave = false;

        const { data, error } = await supabaseClient
          .from("threatscope_progress")
          .select("progress")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (error) {
          console.error("ThreatScope cloud load failed:", error.message);
          TS.cloudLoading = false;
          return;
        }

        const progress = normaliseProgress(data?.progress || getSavedProgress() || {});

        setStateSafe(progress);
        syncLocalFlags(progress);

        TS.cloudLoading = false;
        TS.cloudReady = true;

        if (!data?.progress) window.saveProgress();

        window.animateDashboard?.();
        window.updateTrainingPath?.();
        window.showHint?.("Your saved progress has loaded.");
      };

      window.getCertificateDashboardState = function () {
        const state = store.getState();

        let savedProgress = null;

        try {
          savedProgress = JSON.parse(localStorage.getItem("threatscopeProgress") || "null");
        } catch {
          savedProgress = null;
        }

        const stateCompleted = Array.isArray(state.completedAttacks)
          ? state.completedAttacks.length
          : 0;

        const savedCompleted = Array.isArray(savedProgress?.completedAttacks)
          ? savedProgress.completedAttacks.length
          : 0;

        const completedAll = Math.max(stateCompleted, savedCompleted) >= 4;

        const stateScore = Number(String(state.finalAssessmentScore || "0").replace("%", ""));
        const localScore = Number(String(localStorage.getItem("finalAssessmentScore") || "0").replace("%", ""));
        const savedScore = Number(String(savedProgress?.finalAssessmentScore || "0").replace("%", ""));

        const passedFinal =
          state.finalAssessmentPassed === true ||
          savedProgress?.finalAssessmentPassed === true ||
          localStorage.getItem("finalAssessmentPassed") === "true" ||
          stateScore >= 75 ||
          localScore >= 75 ||
          savedScore >= 75;

        const certificateReady =
          localStorage.getItem("certificateReady") === "true" &&
          !!localStorage.getItem("username");

        return {
          completedAll,
          passedFinal,
          certificateReady
        };
      };

      window.startFinalAssessment = async function () {
        if (!completedAllModules()) {
          window.showHint?.("Complete all 4 modules before starting the final assessment.");
          return;
        }

        const mixed = await getDynamicFinalAssessment();

        if (!Array.isArray(mixed) || mixed.length === 0) {
          window.showHint?.("Final assessment questions could not be loaded.");
          return;
        }

        setStateSafe({
          currentAttack: "final",
          currentStep: 0,
          challenges: mixed,
          challengeIndex: 0,
          isFinalAssessment: true,
          finalCorrect: 0,
          finalTotal: 0
        });

        window.resetScenarioPage?.();
        window.navigateTo?.("scenario");
        window.showHint?.("Final assessment started. You need 75% or higher to unlock the certificate.");
      };

      window.finishFinalAssessment = function () {
        const state = getStateSafe();

        const total = clampNumber(state.finalTotal, 0, 1000);
        const correct = clampNumber(state.finalCorrect, 0, total);
        const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
        const passed = percent >= TS.minPassPercent;

        localStorage.setItem(TS.finalScoreKey, `${percent}%`);
        localStorage.setItem(TS.finalPassedKey, passed ? "true" : "false");

        setStateSafe({
          finalAssessmentScore: `${percent}%`,
          finalAssessmentPassed: passed,
          isFinalAssessment: false
        });

        TS.suppressCloudSave = false;

        window.saveProgress();
        window.navigateTo?.("dashboard");

        setTimeout(() => {
          window.animateDashboard?.();

          if (passed) {
            window.showHint?.("Final assessment passed. Your certificate is unlocked.");
            window.openCertificateClaim?.();
          } else {
            window.showHint?.("Final assessment not passed. Review your mistakes and try again.");
          }
        }, 350);
      };

      window.openCertificateClaim = function () {
        if (!completedAllModules()) {
          window.showHint?.("Complete all 4 simulations before claiming your certificate.");
          return;
        }

        if (!passedFinalAssessment()) {
          window.showHint?.("Pass the final assessment with 75% or higher before claiming your certificate.");
          return;
        }

        const modal = byId("nameEntryModal");
        const modalBox = document.querySelector("#nameEntryModal > div");

        if (!modal || !modalBox) return;

        const savedName = localStorage.getItem(TS.usernameKey) || "";

        modalBox.innerHTML = `
      <button onclick="closeCertificateClaim()" style="position:absolute; top:14px; right:14px; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); color:#fff; width:34px; height:34px; border-radius:10px; cursor:pointer;">✕</button>
      <div style="font-size:3rem; margin-bottom:16px;">🎓</div>
      <h3 style="font-family:'Space Grotesk', sans-serif; font-size:1.55rem; margin-bottom:8px;">Claim Your Certificate</h3>
      <p style="color:var(--text-secondary); font-size:0.9rem; line-height:1.7; margin-bottom:24px;">Enter your name exactly how you want it to appear.</p>
      <input type="text" id="certNameInput" value="${escapeText(savedName)}" placeholder="e.g. Jane Doe" maxlength="60" autocomplete="name" style="width:100%; padding:14px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.5); color:white; font-size:1rem; margin-bottom:18px; text-align:center; font-family:'Inter', sans-serif; outline:none;">
      <button class="btn-primary" onclick="generateMyCertificate()" style="width:100%; padding:14px;">Prepare Certificate</button>
    `;

        modal.style.display = "flex";
        byId("certNameInput")?.focus();
      };

      window.generateMyCertificate = async function () {
        const input = document.getElementById("certNameInput");
        const modalBox = document.querySelector("#nameEntryModal > div");

        if (!input || !modalBox) return;

        const name = input.value.trim().replace(/\s+/g, " ");

        if (name.length < 2 || name.length > 60) {
          alert("Please enter a valid name between 2 and 60 characters.");
          return;
        }

        localStorage.setItem("username", name);
        localStorage.setItem("certificateReady", "true");

        if (!localStorage.getItem("certificateDate")) {
          localStorage.setItem(
            "certificateDate",
            new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric"
            })
          );
        }

        createCertificateID();

        const certData = getCertificateData();

        store.setState({
          username: certData.name,
          certificateReady: true,
          certificateDate: certData.dateStr,
          certificateID: certData.certID
        });

        localStorage.setItem("username", certData.name);
        localStorage.setItem("certificateReady", "true");
        localStorage.setItem("certificateDate", certData.dateStr);
        localStorage.setItem("certificateID", certData.certID);

        saveProgress();

        if (currentUser) {
          await saveCloudProgressFast();
          await saveCertificateToSupabase();
        }

        modalBox.innerHTML = `
    <div style="font-size:3rem; margin-bottom:16px;">✅</div>

    <h3 style="font-family:'Space Grotesk', sans-serif; font-size:1.5rem; margin-bottom:8px;">
      Certificate Ready
    </h3>

    <p style="color:var(--text-secondary); font-size:0.9rem; line-height:1.7; margin-bottom:24px;">
      Your certificate has been prepared for
      <strong style="color:var(--text-primary);">${escapeHTML(name)}</strong>.
      You can display it, download it, or return to it later from the dashboard.
    </p>

    <button class="btn-primary" onclick="displayPreparedCertificate()" style="width:100%; padding:14px; margin-bottom:12px;">
      Display Certificate
    </button>

    <button onclick="downloadCertificate()" style="width:100%; padding:13px; margin-bottom:12px; background:linear-gradient(135deg,#c084fc,#a855f7); border:none; border-radius:12px; color:white; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif;">
      ⬇ Download PNG
    </button>

    <button onclick="closeCertificateClaim(); animateDashboard();" style="width:100%; padding:12px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:rgba(241,241,245,0.75); cursor:pointer; font-family:'Inter',sans-serif;">
      Not Now
    </button>
  `;

        animateDashboard();
      };

      const originalDownloadCertificate = window.downloadCertificate;

      window.downloadCertificate = async function () {
        const certState = getCertificateDashboardState();

        if (!certState.completedAll) {
          showHint("Complete all 4 simulations before downloading your certificate.");
          return;
        }

        if (!certState.passedFinal) {
          showHint("Pass the final assessment before downloading your certificate.");
          return;
        }

        const savedName = localStorage.getItem("username");

        if (!savedName || savedName.trim().length < 2) {
          openCertificateClaim();
          return;
        }

        localStorage.setItem("certificateReady", "true");
        saveProgress();

        if (typeof originalDownloadCertificate === "function") {
          await originalDownloadCertificate();
        }
      };

      window.resetProgress = function () {
        const confirmed = confirm(
          currentUser
            ? "You are logged in. This resets this browser only and will not overwrite your cloud progress. Continue?"
            : "Reset all local training progress on this browser?"
        );

        if (!confirmed) return;

        [
          TS.progressKey,
          TS.certReadyKey,
          TS.finalPassedKey,
          TS.finalScoreKey,
          TS.usernameKey,
          TS.certDateKey,
          TS.certIdKey,
          "currentStreak",
          "bestStreak",
          "usedChallengeFingerprints"
        ].forEach(key => localStorage.removeItem(key));

        if (byId("certificateOverlay")) byId("certificateOverlay").style.display = "none";
        if (byId("nameEntryModal")) byId("nameEntryModal").style.display = "none";

        setStateSafe({
          currentAttack: null,
          currentStep: 0,
          challengeIndex: 0,
          challenges: [],
          score: 0,
          completedAttacks: [],
          correctAnswers: 0,
          totalAnswers: 0,
          username: "",
          selectedConfidence: "medium",
          currentStreak: 0,
          bestStreak: 0,
          finalAssessmentPassed: false,
          finalAssessmentScore: null,
          isFinalAssessment: false,
          finalCorrect: 0,
          finalTotal: 0,
          userBehavior: defaultBehaviour()
        });

        TS.suppressCloudSave = !!currentUser;

        window.updateTrainingPath?.();
        window.animateDashboard?.();

        window.showHint?.(
          currentUser
            ? "Local progress reset. Cloud progress has not been overwritten."
            : "Training progress reset."
        );
      };

      window.cleanTitle = stripVariantNoise;
      window.escapeHTML = escapeText;
      window.getCleanDefaultBehaviour = defaultBehaviour;

      document.querySelectorAll(".attack-card, .path-card").forEach(card => {
        if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");
        if (!card.hasAttribute("role")) card.setAttribute("role", "button");

        card.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            card.click();
          }
        });
      });

      const bootProgress = normaliseProgress(getSavedProgress() || getStateSafe());

      setStateSafe(bootProgress);
      syncLocalFlags(bootProgress);

      window.updateTrainingPath?.();
      window.animateDashboard?.();
    })();

/* ===== Legacy app block 3 extracted from CyberSecurityTutor2.html ===== */
/* ==========================================================
       FINAL CLEAN AUTH PATCH — REPLACE ALL OLD AUTH PATCHES WITH THIS
       Fixes stuck "Saving..." / "Logging out..." state
       ========================================================== */

    let authBusy = false;

    const EMPTY_PROGRESS = {
      score: 0,
      completedAttacks: [],
      correctAnswers: 0,
      totalAnswers: 0,
      username: "",
      selectedConfidence: "medium",
      currentStreak: 0,
      bestStreak: 0,
      finalAssessmentPassed: false,
      finalAssessmentScore: null,
      certificateReady: false,
      isFinalAssessment: false,
      finalCorrect: 0,
      finalTotal: 0,
      challenges: [],
      challengeIndex: 0,
      userBehavior: {
        hesitations: 0,
        speed: [],
        mistakes: [],
        confidenceMistakes: [],
        topicStats: {
          phishing: { correct: 0, total: 0 },
          bruteforce: { correct: 0, total: 0 },
          sqli: { correct: 0, total: 0 },
          social: { correct: 0, total: 0 }
        }
      }
    };

    function cloneEmptyProgress() {
      return JSON.parse(JSON.stringify(EMPTY_PROGRESS));
    }

    function withTimeout(promise, ms, label) {
      return Promise.race([
        promise,
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error(label + " timed out")), ms);
        })
      ]);
    }

    function clearLocalProgress() {
      [
        "threatscopeProgress",
        "currentStreak",
        "bestStreak",
        "finalAssessmentPassed",
        "finalAssessmentScore",
        "certificateReady",
        "certificateDate",
        "certificateID",
        "username",
        "usedChallengeFingerprints"
      ].forEach(key => localStorage.removeItem(key));
    }

    function resetAppToGuest() {
      clearLocalProgress();

      store.setState(cloneEmptyProgress());

      const certOverlay = document.getElementById("certificateOverlay");
      const nameModal = document.getElementById("nameEntryModal");
      const authModal = document.getElementById("authModal");

      if (certOverlay) certOverlay.style.display = "none";
      if (nameModal) nameModal.style.display = "none";
      if (authModal) authModal.style.display = "none";

      if (typeof updateTrainingPath === "function") updateTrainingPath();
      if (typeof animateDashboard === "function") animateDashboard();
    }

    function buildProgressForSave() {
      const state = store.getState();

      return {
        score: Number(state.score || 0),
        completedAttacks: Array.isArray(state.completedAttacks) ? state.completedAttacks : [],
        correctAnswers: Number(state.correctAnswers || 0),
        totalAnswers: Number(state.totalAnswers || 0),
        currentStreak: Number(state.currentStreak || 0),
        bestStreak: Number(state.bestStreak || 0),
        finalAssessmentPassed:
          state.finalAssessmentPassed === true ||
          localStorage.getItem("finalAssessmentPassed") === "true",
        finalAssessmentScore:
          state.finalAssessmentScore ||
          localStorage.getItem("finalAssessmentScore") ||
          null,
        username: localStorage.getItem("username") || state.username || "",
        certificateReady:
          localStorage.getItem("certificateReady") === "true" ||
          state.certificateReady === true,

        certificateDate:
          localStorage.getItem("certificateDate") ||
          state.certificateDate ||
          null,

        certificateID:
          localStorage.getItem("certificateID") ||
          state.certificateID ||
          null,
        userBehavior: state.userBehavior || cloneEmptyProgress().userBehavior
      };
    }

    async function saveCloudProgressFast() {
      if (!currentUser) return true;

      const progress = buildProgressForSave();

      localStorage.setItem("threatscopeProgress", JSON.stringify(progress));

      const request = supabaseClient
        .from("threatscope_progress")
        .upsert(
          {
            user_id: currentUser.id,
            progress,
            updated_at: new Date().toISOString()
          },
          { onConflict: "user_id" }
        );

      const { error } = await withTimeout(request, 3500, "Cloud save");

      if (error) {
        console.error("Cloud save failed:", error.message);
        return false;
      }

      return true;
    }
    window.saveProgress = function () {
      const state = store.getState();

      const progress = {
        score: Number(state.score || 0),
        completedAttacks: Array.isArray(state.completedAttacks) ? state.completedAttacks : [],
        correctAnswers: Number(state.correctAnswers || 0),
        totalAnswers: Number(state.totalAnswers || 0),
        currentStreak: Number(state.currentStreak || 0),
        bestStreak: Number(state.bestStreak || 0),

        finalAssessmentPassed:
          state.finalAssessmentPassed === true ||
          localStorage.getItem("finalAssessmentPassed") === "true",

        finalAssessmentScore:
          state.finalAssessmentScore ||
          localStorage.getItem("finalAssessmentScore") ||
          null,

        username:
          localStorage.getItem("username") ||
          state.username ||
          "",

        certificateReady:
          localStorage.getItem("certificateReady") === "true" ||
          state.certificateReady === true,

        certificateDate:
          localStorage.getItem("certificateDate") ||
          state.certificateDate ||
          null,

        certificateID:
          localStorage.getItem("certificateID") ||
          state.certificateID ||
          null,

        userBehavior: state.userBehavior || cloneEmptyProgress().userBehavior
      };

      localStorage.setItem("threatscopeProgress", JSON.stringify(progress));

      if (!currentUser) return;

      clearTimeout(window.threatscopeSaveTimer);

      window.threatscopeSaveTimer = setTimeout(() => {
        saveCloudProgressFast().catch(err => {
          console.error("Background save failed:", err);
        });
      }, 500);
    };

    window.updateAuthUI = function () {
      const authBtn = document.getElementById("authBtn");
      const accountMenu = document.getElementById("accountMenu");
      const accountInitials = document.getElementById("accountInitials");
      const accountEmail = document.getElementById("accountEmail");
      const startTrainingBtn = document.getElementById("startTrainingBtn");

      if (!authBtn || !accountMenu || !accountInitials || !accountEmail) return;

      if (currentUser) {
        const email = currentUser.email || "Logged in";
        const namePart = email.split("@")[0] || "User";

        const initials = namePart
          .split(/[.\-_ ]+/)
          .filter(Boolean)
          .slice(0, 2)
          .map(part => part[0])
          .join("")
          .toUpperCase() || "U";

        authBtn.classList.add("auth-hidden");
        authBtn.disabled = true;

        accountMenu.style.display = "block";
        accountInitials.textContent = initials;
        accountEmail.textContent = email;

        if (startTrainingBtn) {
          startTrainingBtn.style.display = "none";
        }
      } else {
        authBtn.classList.remove("auth-hidden");
        authBtn.textContent = "Login";
        authBtn.disabled = false;

        accountMenu.style.display = "none";

        if (typeof closeAccountMenu === "function") {
          closeAccountMenu();
        }

        if (startTrainingBtn) {
          startTrainingBtn.style.display = "inline-flex";
        }
      }
    };

    window.loadCloudProgress = async function () {
      if (!currentUser) return;

      try {
        const request = supabaseClient
          .from("threatscope_progress")
          .select("progress")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        const { data, error } = await withTimeout(request, 5000, "Cloud load");

        if (error) {
          console.error("Cloud load failed:", error.message);
          showHint("Could not load cloud progress.");
          return;
        }

        if (!data || !data.progress) {
          await saveCloudProgressFast();
          showHint("Logged in. New cloud progress profile created.");
          return;
        }

        const cloudProgress = data.progress;
        const blank = cloneEmptyProgress();

        store.setState({
          ...blank,
          score: Number(cloudProgress.score || 0),
          completedAttacks: Array.isArray(cloudProgress.completedAttacks) ? cloudProgress.completedAttacks : [],
          correctAnswers: Number(cloudProgress.correctAnswers || 0),
          totalAnswers: Number(cloudProgress.totalAnswers || 0),
          currentStreak: Number(cloudProgress.currentStreak || 0),
          bestStreak: Number(cloudProgress.bestStreak || 0),
          finalAssessmentPassed: cloudProgress.finalAssessmentPassed === true,
          finalAssessmentScore: cloudProgress.finalAssessmentScore || null,
          username: cloudProgress.username || "",
          certificateReady: cloudProgress.certificateReady === true,
          certificateDate: cloudProgress.certificateDate || null,
          certificateID: cloudProgress.certificateID || null,
          userBehavior: {
            ...blank.userBehavior,
            ...(cloudProgress.userBehavior || {}),
            topicStats: {
              ...blank.userBehavior.topicStats,
              ...((cloudProgress.userBehavior && cloudProgress.userBehavior.topicStats) || {})
            },
            mistakes: Array.isArray(cloudProgress.userBehavior?.mistakes)
              ? cloudProgress.userBehavior.mistakes
              : []
          }
        });

        localStorage.setItem("threatscopeProgress", JSON.stringify(cloudProgress));

        if (cloudProgress.finalAssessmentPassed) {
          localStorage.setItem("finalAssessmentPassed", "true");
        }

        if (cloudProgress.finalAssessmentScore) {
          localStorage.setItem("finalAssessmentScore", cloudProgress.finalAssessmentScore);
        }

        if (cloudProgress.username) {
          localStorage.setItem("username", cloudProgress.username);
        }

        if (cloudProgress.certificateReady) {
          localStorage.setItem("certificateReady", "true");
        }

        if (cloudProgress.username) {
          localStorage.setItem("username", cloudProgress.username);
        }

        if (cloudProgress.certificateReady) {
          localStorage.setItem("certificateReady", "true");
        }

        if (cloudProgress.certificateID) {
          localStorage.setItem("certificateID", cloudProgress.certificateID);
        }

        if (cloudProgress.certificateDate) {
          localStorage.setItem("certificateDate", cloudProgress.certificateDate);
        }

        if (cloudProgress.certificateDate) {
          localStorage.setItem("certificateDate", cloudProgress.certificateDate);
        }

        if (cloudProgress.certificateID) {
          localStorage.setItem("certificateID", cloudProgress.certificateID);
        }

        if (typeof updateTrainingPath === "function") updateTrainingPath();
        if (typeof animateDashboard === "function") animateDashboard();

        showHint("Logged in. Your saved progress has loaded.");
      } catch (err) {
        console.error("Cloud load error:", err);
        showHint("Cloud progress took too long to load.");
      }
    };

    window.loginUser = async function () {
      if (authBusy) return;

      const emailInput = document.getElementById("authEmail");
      const passwordInput = document.getElementById("authPassword");

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password) {
        setAuthMessage("Enter your email and password.");
        return;
      }

      authBusy = true;
      setAuthMessage("Logging in...");

      try {
        const request = supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        const { data, error } = await withTimeout(request, 7000, "Login");

        if (error) {
          setAuthMessage(error.message);
          return;
        }

        currentUser = data.user;

        closeAuthModal();
        updateAuthUI();

        await loadCloudProgress();
      } catch (err) {
        console.error("Login error:", err);
        setAuthMessage("Login took too long. Please try again.");
      } finally {
        authBusy = false;
        updateAuthUI();
      }
    };

    window.registerUser = async function () {
      if (authBusy) return;

      const emailInput = document.getElementById("authEmail");
      const passwordInput = document.getElementById("authPassword");

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password) {
        setAuthMessage("Enter an email and password first.");
        return;
      }

      if (password.length < 6) {
        setAuthMessage("Password must be at least 6 characters.");
        return;
      }

      authBusy = true;
      setAuthMessage("Creating account...");

      try {
        const request = supabaseClient.auth.signUp({
          email,
          password
        });

        const { error } = await withTimeout(request, 7000, "Register");

        if (error) {
          setAuthMessage(error.message);
          return;
        }

        setAuthMessage("Account created. Log in now.");
      } catch (err) {
        console.error("Register error:", err);
        setAuthMessage("Account creation took too long. Please try again.");
      } finally {
        authBusy = false;
        updateAuthUI();
      }
    };

    window.logoutUser = async function () {
      if (authBusy) return;

      authBusy = true;
      updateAuthUI();

      try {
        try {
          await saveCloudProgressFast();
        } catch (err) {
          console.error("Save before logout failed:", err);
        }

        try {
          await withTimeout(
            supabaseClient.auth.signOut({ scope: "local" }),
            5000,
            "Logout"
          );
        } catch (err) {
          console.error("Supabase logout timeout/error:", err);
        }

        currentUser = null;

        resetAppToGuest();
        updateAuthUI();

        showHint("Logged out.");
      } finally {
        authBusy = false;
        currentUser = null;
        updateAuthUI();
      }
    };

    window.checkExistingSession = async function () {
      try {
        const { data } = await withTimeout(
          supabaseClient.auth.getSession(),
          5000,
          "Session check"
        );

        currentUser = data.session?.user || null;
        updateAuthUI();

        if (currentUser) {
          await loadCloudProgress();
        } else {
          const saved = JSON.parse(localStorage.getItem("threatscopeProgress") || "null");

          if (saved && typeof saved === "object") {
            const blank = cloneEmptyProgress();

            store.setState({
              ...blank,
              score: Number(saved.score || 0),
              completedAttacks: Array.isArray(saved.completedAttacks) ? saved.completedAttacks : [],
              correctAnswers: Number(saved.correctAnswers || 0),
              totalAnswers: Number(saved.totalAnswers || 0),
              currentStreak: Number(saved.currentStreak || 0),
              bestStreak: Number(saved.bestStreak || 0),
              finalAssessmentPassed:
                saved.finalAssessmentPassed === true ||
                localStorage.getItem("finalAssessmentPassed") === "true",
              finalAssessmentScore:
                saved.finalAssessmentScore ||
                localStorage.getItem("finalAssessmentScore") ||
                null,
              username: saved.username || localStorage.getItem("username") || "",
              certificateReady:
                saved.certificateReady === true ||
                localStorage.getItem("certificateReady") === "true",
              userBehavior: {
                ...blank.userBehavior,
                ...(saved.userBehavior || {}),
                topicStats: {
                  ...blank.userBehavior.topicStats,
                  ...((saved.userBehavior && saved.userBehavior.topicStats) || {})
                },
                mistakes: Array.isArray(saved.userBehavior?.mistakes)
                  ? saved.userBehavior.mistakes
                  : []
              }
            });
          }

          updateTrainingPath();
          animateDashboard();
          updateAuthUI();
        }
      } catch (err) {
        console.error("Session check failed:", err);

        currentUser = null;
        updateAuthUI();

        const saved = JSON.parse(localStorage.getItem("threatscopeProgress") || "null");

        if (saved && typeof saved === "object") {
          store.setState({
            ...store.getState(),
            ...saved
          });
        }

        updateTrainingPath();
        animateDashboard();
      }
    };

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (authBusy) return;

      currentUser = session?.user || null;
      updateAuthUI();

      if (event === "SIGNED_IN" && currentUser) {
        await loadCloudProgress();
      }

      if (event === "SIGNED_OUT") {
        currentUser = null;
        resetAppToGuest();
        updateAuthUI();
      }
    });

    // checkExistingSession();



    function buildFullUserReport() {
      const state = store.getState();

      const score = state.totalAnswers > 0
        ? Math.round((state.correctAnswers / state.totalAnswers) * 100)
        : 0;

      const topicStats = state.userBehavior?.topicStats || {};
      const mistakes = state.userBehavior?.mistakes || [];

      return {
        awarenessScore: score,
        correctAnswers: state.correctAnswers || 0,
        totalAnswers: state.totalAnswers || 0,
        completedModules: state.completedAttacks || [],
        finalAssessmentPassed: state.finalAssessmentPassed === true,
        finalAssessmentScore: state.finalAssessmentScore || localStorage.getItem("finalAssessmentScore") || null,
        currentStreak: state.currentStreak || 0,
        bestStreak: state.bestStreak || 0,
        topicStats,
        mistakes: mistakes.slice(-50),
        generatedAt: new Date().toISOString()
      };
    }

    async function saveCertificateToSupabase() {
      const { data: sessionData } = await supabaseClient.auth.getSession();
      const user = sessionData?.session?.user || currentUser;

      if (!user) {
        console.warn("Certificate not saved because user is not logged in.");
        showHint("Log in first, then prepare the certificate again so it can be verified online.");
        return false;
      }

      currentUser = user;

      const certData = getCertificateData();

      const inputPattern = {
        certificate_id: certData.certID,
        user_id: user.id,
        learner_name: certData.name,
        final_score: certData.score,
        modules_completed: 4,
        status: "valid",
        issued_by: "Shivam Jambagi",
        report: buildFullUserReport()
      };

      console.log("Saving certificate to Supabase:", inputPattern);

      const { data, error } = await supabaseClient
        .from("threatscope_certificates")
        .upsert(inputPattern, {
          onConflict: "certificate_id"
        })
        .select()
        .single();

      if (error) {
        console.error("Certificate cloud save failed:", error.message);
        showHint("Certificate prepared locally, but Supabase save failed: " + error.message);
        return false;
      }

      console.log("Certificate saved successfully:", data);
      showHint("Certificate saved. It can now be verified using its certificate ID.");
      return true;
    }

    async function verifyCertificateByID() {
      const input = document.getElementById("verifyCertificateInput");
      const result = document.getElementById("verifyCertificateResult");

      if (!input || !result) return;

      const certificateID = input.value.trim().toUpperCase();

      if (!certificateID) {
        result.innerHTML = `
      <div class="mistake-item">
        <strong>Certificate ID required</strong>
        <span>Please enter a certificate ID first.</span>
      </div>
    `;
        return;
      }

      result.innerHTML = `
    <div class="dash-card">
      <h4>Checking Certificate</h4>
      <p style="color:var(--text-secondary); font-size:0.9rem;">
        Searching certificate records...
      </p>
    </div>
  `;

      const localCertificateID = (localStorage.getItem("certificateID") || "").trim().toUpperCase();
      const localName = localStorage.getItem("username") || "Learner";
      const localScore = localStorage.getItem("finalAssessmentScore") || "—";
      const localDate = localStorage.getItem("certificateDate") || "Unknown";
      const localReady = localStorage.getItem("certificateReady") === "true";

      if (localReady && localCertificateID === certificateID) {
        result.innerHTML = `
      <div class="empty-state" style="text-align:left;">
        <strong style="display:block; font-size:1rem; margin-bottom:12px;">
          ✅ Valid Local ThreatScope Certificate
        </strong>

        <span style="display:block; line-height:1.8;">
          <b>Learner:</b> ${escapeHTML(localName)}<br>
          <b>Certificate ID:</b> ${escapeHTML(localCertificateID)}<br>
          <b>Final Score:</b> ${escapeHTML(localScore)}<br>
          <b>Modules Completed:</b> 4 / 4<br>
          <b>Issued By:</b> Shivam Jambagi<br>
          <b>Date Issued:</b> ${escapeHTML(localDate)}
        </span>

        <p style="margin-top:14px; color:var(--text-secondary); font-size:0.82rem; line-height:1.6;">
          This certificate matches the one saved in this browser. For online verification, it must also be saved to Supabase.
        </p>
      </div>
    `;
        return;
      }

      try {
        const { data, error } = await supabaseClient
          .from("threatscope_certificates")
          .select("certificate_id, learner_name, final_score, modules_completed, status, issued_by, created_at")
          .eq("certificate_id", certificateID)
          .maybeSingle();

        if (error) {
          console.error("Certificate verification failed:", error.message);

          result.innerHTML = `
        <div class="mistake-item">
          <strong>Verification Error</strong>
          <span>${escapeHTML(error.message)}</span>
        </div>
      `;

          return;
        }

        if (!data) {
          result.innerHTML = `
        <div class="mistake-item">
          <strong>Certificate Not Found</strong>
          <span>
            No ThreatScope certificate was found with this ID in Supabase.
            If you just generated this certificate, it may only be saved locally or you may not have been logged in when it was created.
          </span>
        </div>
      `;

          return;
        }

        const issuedDate = data.created_at
          ? new Date(data.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
          })
          : "Unknown";

        const isValid = data.status === "valid";

        result.innerHTML = `
      <div class="${isValid ? "empty-state" : "mistake-item"}" style="text-align:left;">
        <strong style="display:block; font-size:1rem; margin-bottom:12px;">
          ${isValid ? "✅ Valid ThreatScope Certificate" : "⚠ Certificate Status: " + escapeHTML(data.status)}
        </strong>

        <span style="display:block; line-height:1.8;">
          <b>Learner:</b> ${escapeHTML(data.learner_name)}<br>
          <b>Certificate ID:</b> ${escapeHTML(data.certificate_id)}<br>
          <b>Final Score:</b> ${escapeHTML(data.final_score)}<br>
          <b>Modules Completed:</b> ${escapeHTML(data.modules_completed)} / 4<br>
          <b>Issued By:</b> ${escapeHTML(data.issued_by)}<br>
          <b>Date Issued:</b> ${escapeHTML(issuedDate)}
        </span>
      </div>
    `;
      } catch (error) {
        console.error("Certificate verify crash:", error);

        result.innerHTML = `
      <div class="mistake-item">
        <strong>Verification Failed</strong>
        <span>Something went wrong while checking this certificate.</span>
      </div>
    `;
      }
    }

/* ===== Legacy app block 4 extracted from CyberSecurityTutor2.html ===== */
function toggleAccountMenu() {
      const dropdown = document.getElementById("accountDropdown");
      const trigger = document.getElementById("accountTrigger");

      if (!dropdown) return;

      const isOpen = dropdown.classList.toggle("open");

      if (trigger) {
        trigger.setAttribute("aria-expanded", String(isOpen));
      }
    }

    function closeAccountMenu() {
      const dropdown = document.getElementById("accountDropdown");
      const trigger = document.getElementById("accountTrigger");

      if (dropdown) {
        dropdown.classList.remove("open");
      }

      if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
      }
    }

    document.addEventListener("click", function (event) {
      const accountMenu = document.getElementById("accountMenu");

      if (!accountMenu) return;

      if (!accountMenu.contains(event.target)) {
        closeAccountMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeAccountMenu();
      }
    });

/* ===== Legacy app block 5 extracted from CyberSecurityTutor2.html ===== */
function forceNavbarScrollState() {
      const navbar = document.getElementById("navbar");
      if (!navbar) return;

      if (window.scrollY > 8) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }

    window.addEventListener("scroll", forceNavbarScrollState, { passive: true });
    window.addEventListener("load", forceNavbarScrollState);
    window.addEventListener("resize", forceNavbarScrollState);
    document.addEventListener("DOMContentLoaded", forceNavbarScrollState);

    forceNavbarScrollState();

/* ===== Legacy app block 6 extracted from CyberSecurityTutor2.html ===== */
/* ==========================================================
       SUPABASE TIMEOUT CLEANUP PATCH
       Fixes red console errors:
       - Session check timed out
       - Cloud load timed out
       ========================================================== */

    function softTimeout(promise, ms, label) {
      return Promise.race([
        promise,
        new Promise(resolve => {
          setTimeout(() => {
            console.warn(label + " took too long, continuing in local mode.");
            resolve({ data: null, error: null, timedOut: true });
          }, ms);
        })
      ]);
    }

    window.checkExistingSession = async function () {
      try {
        const result = await softTimeout(
          supabaseClient.auth.getSession(),
          12000,
          "Session check"
        );

        if (result.timedOut) {
          currentUser = null;
          updateAuthUI();

          const saved = JSON.parse(localStorage.getItem("threatscopeProgress") || "null");

          if (saved && typeof saved === "object") {
            store.setState({
              ...store.getState(),
              ...saved
            });
          }

          updateTrainingPath();
          animateDashboard();
          return;
        }

        const session = result.data?.session || null;

        currentUser = session?.user || null;
        updateAuthUI();

        if (currentUser) {
          await loadCloudProgress();
        } else {
          const saved = JSON.parse(localStorage.getItem("threatscopeProgress") || "null");

          if (saved && typeof saved === "object") {
            store.setState({
              ...store.getState(),
              ...saved
            });
          }

          updateTrainingPath();
          animateDashboard();
        }

      } catch (err) {
        console.warn("Session check skipped:", err.message);

        currentUser = null;
        updateAuthUI();

        const saved = JSON.parse(localStorage.getItem("threatscopeProgress") || "null");

        if (saved && typeof saved === "object") {
          store.setState({
            ...store.getState(),
            ...saved
          });
        }

        updateTrainingPath();
        animateDashboard();
      }
    };


    window.loadCloudProgress = async function () {
      if (!currentUser) return;

      try {
        const request = supabaseClient
          .from("threatscope_progress")
          .select("progress")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        const result = await softTimeout(
          request,
          12000,
          "Cloud load"
        );

        if (result.timedOut) {
          showHint("Cloud progress is slow. Local progress loaded instead.");
          return;
        }

        const { data, error } = result;

        if (error) {
          console.warn("Cloud load skipped:", error.message);
          showHint("Could not load cloud progress. Local progress is being used.");
          return;
        }

        if (!data || !data.progress) {
          saveProgress();
          showHint("Logged in. New cloud progress profile created.");
          return;
        }

        const cloudProgress = data.progress;
        const blank = cloneEmptyProgress();

        store.setState({
          ...blank,
          score: Number(cloudProgress.score || 0),
          completedAttacks: Array.isArray(cloudProgress.completedAttacks) ? cloudProgress.completedAttacks : [],
          correctAnswers: Number(cloudProgress.correctAnswers || 0),
          totalAnswers: Number(cloudProgress.totalAnswers || 0),
          currentStreak: Number(cloudProgress.currentStreak || 0),
          bestStreak: Number(cloudProgress.bestStreak || 0),
          finalAssessmentPassed: cloudProgress.finalAssessmentPassed === true,
          finalAssessmentScore: cloudProgress.finalAssessmentScore || null,
          username: cloudProgress.username || "",
          certificateReady: cloudProgress.certificateReady === true,
          userBehavior: {
            ...blank.userBehavior,
            ...(cloudProgress.userBehavior || {}),
            topicStats: {
              ...blank.userBehavior.topicStats,
              ...((cloudProgress.userBehavior && cloudProgress.userBehavior.topicStats) || {})
            },
            mistakes: Array.isArray(cloudProgress.userBehavior?.mistakes)
              ? cloudProgress.userBehavior.mistakes
              : []
          }
        });

        localStorage.setItem("threatscopeProgress", JSON.stringify(cloudProgress));

        if (cloudProgress.finalAssessmentPassed) {
          localStorage.setItem("finalAssessmentPassed", "true");
        }

        if (cloudProgress.finalAssessmentScore) {
          localStorage.setItem("finalAssessmentScore", cloudProgress.finalAssessmentScore);
        }

        if (cloudProgress.username) {
          localStorage.setItem("username", cloudProgress.username);
        }

        if (cloudProgress.certificateReady) {
          localStorage.setItem("certificateReady", "true");
        }

        if (cloudProgress.certificateDate) {
          localStorage.setItem("certificateDate", cloudProgress.certificateDate);
        }

        if (cloudProgress.certificateID) {
          localStorage.setItem("certificateID", cloudProgress.certificateID);
        }

        updateTrainingPath();
        animateDashboard();

        showHint("Logged in. Your saved progress has loaded.");

      } catch (err) {
        console.warn("Cloud load skipped:", err.message);
        showHint("Cloud progress could not load. Local progress is being used.");
      }
    };

    checkExistingSession();
