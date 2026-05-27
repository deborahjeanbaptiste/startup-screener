import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";

// ── ACCESS GATE ──────────────────────────────────────────────────────────────
// Add your Gumroad license codes here. Each Gumroad sale generates a unique key.
// You can also validate against Gumroad's License API for automatic verification.
const VALID_CODES = new Set([
  "VRM-2032-022",       // ← Customer Code
  // "XXXX-XXXX-XXXX",   // ← add real codes from Gumroad here
]);

const accessGate   = document.getElementById("access-gate");
const gateInput    = document.getElementById("access-code-input");
const gateSubmit   = document.getElementById("access-code-submit");
const gateError    = document.getElementById("gate-error");

// Check if already unlocked this session
if (sessionStorage.getItem("vrm_unlocked") === "1") {
  accessGate.style.display = "none";
}

gateSubmit.addEventListener("click", checkCode);
gateInput.addEventListener("keydown", (e) => { if (e.key === "Enter") checkCode(); });

function checkCode() {
  const entered = gateInput.value.trim().toUpperCase();
  if (VALID_CODES.has(entered)) {
    sessionStorage.setItem("vrm_unlocked", "1");
    accessGate.style.opacity = "0";
    accessGate.style.transition = "opacity 0.4s ease";
    setTimeout(() => accessGate.style.display = "none", 400);
  } else {
    gateError.classList.remove("hidden");
    gateInput.style.borderColor = "var(--danger)";
    setTimeout(() => {
      gateError.classList.add("hidden");
      gateInput.style.borderColor = "";
    }, 3000);
  }
}

// ── DOM REFS ─────────────────────────────────────────────────────────────────
const form               = document.getElementById("screening-form");
const deckInput          = document.getElementById("deck");
const fileNameEl         = document.getElementById("file-name");
const apiKeyInput        = document.getElementById("api-key");
const startupNameInput   = document.getElementById("startup-name");
const founderNotesInput  = document.getElementById("founder-notes");
const emptyState         = document.getElementById("empty-state");
const reportContent      = document.getElementById("report-content");
const reportStartup      = document.getElementById("report-startup");
const reportSummary      = document.getElementById("report-summary");
const overallScore       = document.getElementById("overall-score");
const verdictChip        = document.getElementById("verdict-chip");
const kpiGrid            = document.getElementById("kpi-grid");
const marketText         = document.getElementById("market-text");
const defensibilityText  = document.getElementById("defensibility-text");
const tractionText       = document.getElementById("traction-text");
const businessModelText  = document.getElementById("business-model-text");
const swotGrid           = document.getElementById("swot-grid");
const recommendationsList = document.getElementById("recommendations-list");
const demoButton         = document.getElementById("load-demo");
const loadingOverlay     = document.getElementById("loading-overlay");
const loadingLabel       = document.getElementById("loading-label");

// ── LOADING HELPERS ──────────────────────────────────────────────────────────
function showLoading(message = "Analyzing your deck…") {
  loadingLabel.textContent = message;
  loadingOverlay.classList.remove("hidden");
}

function updateLoading(message) {
  loadingLabel.textContent = message;
}

function hideLoading() {
  loadingOverlay.classList.add("hidden");
}

// ── FILE INPUT ────────────────────────────────────────────────────────────────
deckInput.addEventListener("change", () => {
  const file = deckInput.files?.[0];
  fileNameEl.textContent = file ? file.name : "No file selected";
});

// ── DEMO BUTTON ───────────────────────────────────────────────────────────────
const DEMO_REPORT = {
  startupName: "MeadowFlow",
  overall: 74,
  verdict: "Needs proof",
  summary: "MeadowFlow addresses a real and painful inefficiency in independent clinic operations. The business model is credible and the early traction signals are meaningful, but investors will push hard on defensibility and whether workflow data creates a durable moat before this crosses into fundable territory.",
  categories: { marketResearch: 72, swot: 68, defensibility: 58, traction: 76, businessModel: 79 },
  narratives: {
    market: "The US ambulatory care operations software market is large and the pain is documented. However, the deck reads top-down — TAM framing without enough bottom-up evidence of which clinic type converts fastest and why now is the right moment for category creation.",
    defensibility: "Workflow data and implementation playbooks are a reasonable foundation, but neither is a strong moat on its own. The deck needs to show what makes the data proprietary, how switching costs compound over time, and why a well-funded EHR vendor couldn't replicate this inside 18 months.",
    traction: "14 pilots and 5 paid conversions is real traction for an early-stage SaaS. The 91% workflow completion rate is compelling if it holds at scale. Lead with these numbers — they are the best part of the current story.",
    businessModel: "Per-location SaaS with onboarding fees and premium analytics is a coherent model. The question investors will ask is about expansion revenue: what does NRR look like, and how does ARPU grow as clinics deepen usage?",
  },
  swot: [
    { title: "Strengths", body: "AI-enabled automation with measurable workflow completion rates and early paid conversions that demonstrate willingness to pay." },
    { title: "Weaknesses", body: "Defensibility is asserted but not yet proven — the moat depends on data depth and integrations that are still being built." },
    { title: "Opportunities", body: "Expansion into adjacent revenue cycle workflows (billing, denials management) could 3–5x ARPU per clinic without new customer acquisition costs." },
    { title: "Threats", body: "Legacy EHR vendors (Epic, Athena) have existing relationships and could launch competing automation features, especially as AI capabilities commoditize." },
  ],
  recommendations: [
    "Lead the deck with traction: 14 pilots → 5 paid conversions → 91% completion rate is a compelling proof arc — put it on slide two.",
    "Make the moat concrete: name the specific integrations, data types, and switching costs that will be hard to replicate in 24 months.",
    "Add one customer quote or case study that shows measurable revenue impact — dollar amounts retained or staff hours saved.",
    "Tighten the market narrative from TAM to beachhead: name the specific clinic type and size you win first and why.",
    "Show the path to $1M ARR: how many locations, at what ACV, acquired through which channels?",
  ],
};

demoButton.addEventListener("click", () => {
  startupNameInput.value = "MeadowFlow";
  founderNotesInput.value = "Healthcare operations SaaS for independent clinics. Early pilots are converting, but defensibility depends on workflow data depth and integration stickiness.";
  renderReport(DEMO_REPORT);
});

// ── PDF EXTRACTION ────────────────────────────────────────────────────────────
async function extractPdfText(file) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pageTexts = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    pageTexts.push(content.items.map((item) => item.str).join(" "));
  }

  return pageTexts.join("\n");
}

// ── CLAUDE API CALL ───────────────────────────────────────────────────────────
async function analyzeWithClaude(deckText, startupName, founderNotes, apiKey) {
  const systemPrompt = `You are a senior venture analyst conducting a first-pass investor screen on a startup pitch deck. Your job is to deliver honest, specific, actionable analysis — not encouragement. You think like a partner at a top-tier VC: you are looking for reasons to pass as much as reasons to invest.

You must respond ONLY with valid JSON — no markdown, no preamble, no explanation outside the JSON structure.`;

  const userPrompt = `Analyze this startup pitch deck and return a JSON screening report.

STARTUP NAME: ${startupName || "Unknown"}
FOUNDER NOTES: ${founderNotes || "None provided"}

DECK CONTENT:
${deckText || "No deck uploaded — base analysis on founder notes only."}

Return this exact JSON structure (all fields required):
{
  "overall": <integer 0-100>,
  "verdict": <"Promising" | "Needs proof" | "High risk">,
  "summary": <2-3 sentence honest overall assessment — what is compelling and what is missing>,
  "categories": {
    "marketResearch": <integer 0-100>,
    "swot": <integer 0-100>,
    "defensibility": <integer 0-100>,
    "traction": <integer 0-100>,
    "businessModel": <integer 0-100>
  },
  "narratives": {
    "market": <2-3 sentences on market size quality, segmentation clarity, and competitive positioning>,
    "defensibility": <2-3 sentences on moat strength, what makes it hard to copy, what is missing>,
    "traction": <2-3 sentences on evidence of demand, quality of metrics, what is still hypothetical>,
    "businessModel": <2-3 sentences on revenue logic, pricing clarity, path to durability>
  },
  "swot": [
    { "title": "Strengths", "body": <2-3 sentences, specific to this startup> },
    { "title": "Weaknesses", "body": <2-3 sentences, honest about real gaps> },
    { "title": "Opportunities", "body": <2-3 sentences on realistic expansion paths> },
    { "title": "Threats", "body": <2-3 sentences on credible competitive or market risks> }
  ],
  "recommendations": [
    <string: specific, actionable recommendation 1>,
    <string: specific, actionable recommendation 2>,
    <string: specific, actionable recommendation 3>,
    <string: specific, actionable recommendation 4>,
    <string: specific, actionable recommendation 5>
  ]
}

Scoring guidance:
- 80–100: Fundable on first pass, clear evidence, strong moat
- 65–79: Credible idea, needs sharper proof
- 45–64: Real concept, significant gaps remain  
- 0–44: Too early or too weak for institutional capital

Be specific. Name what is missing. Do not inflate scores to be kind.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || `API error ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text || "";

  // Strip markdown fences if present
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

// ── FORM SUBMIT ────────────────────────────────────────────────────────────────
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const apiKey = apiKeyInput.value.trim();
  const startupName = startupNameInput.value.trim() || "Uploaded startup";
  const founderNotes = founderNotesInput.value.trim();
  const file = deckInput.files?.[0];

  if (!apiKey) {
    alert("Please enter your Anthropic API key to generate a report.");
    apiKeyInput.focus();
    return;
  }

  if (!file && !founderNotes.trim()) {
    alert("Upload a deck or add founder notes so Startup Screener has something to evaluate.");
    return;
  }

  let deckText = "";

  try {
    if (file) {
      showLoading("Reading your deck…");
      deckText = await extractPdfText(file);
      updateLoading("Running investor screen with Claude…");
    } else {
      showLoading("Running investor screen with Claude…");
    }
    const report = await analyzeWithClaude(deckText, startupName, founderNotes, apiKey);
    report.startupName = startupName;

    hideLoading();
    renderReport(report);

  } catch (error) {
    hideLoading();
    console.error(error);

    if (error.message.includes("401") || error.message.toLowerCase().includes("authentication")) {
      alert("API key rejected. Double-check your key at console.anthropic.com and try again.");
    } else if (error.message.includes("JSON")) {
      alert("The AI returned an unexpected format. Try again — this is usually a one-time issue.");
    } else {
      alert(`Something went wrong: ${error.message}`);
    }
  }
});

// ── RENDER REPORT ─────────────────────────────────────────────────────────────
function renderReport(report) {
  emptyState.classList.add("hidden");
  reportContent.classList.remove("hidden");
  reportContent.scrollIntoView({ behavior: "smooth", block: "start" });

  reportStartup.textContent = report.startupName;
  reportSummary.textContent = report.summary;
  overallScore.textContent = report.overall;
  verdictChip.textContent = verdictText(report.verdict);
  verdictChip.className = `report__verdict ${verdictClass(report.verdict)}`;

  marketText.textContent = report.narratives.market;
  defensibilityText.textContent = report.narratives.defensibility;
  tractionText.textContent = report.narratives.traction;
  businessModelText.textContent = report.narratives.businessModel;

  kpiGrid.innerHTML = Object.entries(report.categories)
    .map(([key, value]) => `<article class="kpi"><strong>${value}</strong><div>${labelFor(key)}</div></article>`)
    .join("");

  swotGrid.innerHTML = report.swot
    .map((item) => `<div class="swot-card"><strong>${item.title}</strong><p>${item.body}</p></div>`)
    .join("");

  recommendationsList.innerHTML = report.recommendations
    .map((item) => `<li>${item}</li>`)
    .join("");
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function labelFor(key) {
  return {
    marketResearch: "Market",
    swot: "SWOT",
    defensibility: "Defensibility",
    traction: "Traction",
    businessModel: "Business model",
  }[key] || key;
}

function verdictText(verdict) {
  if (verdict === "Promising") return "Promising concept with believable upside";
  if (verdict === "Needs proof") return "Interesting wedge — investors will want stronger proof";
  return "High-risk concept in its current form";
}

function verdictClass(verdict) {
  if (verdict === "Promising") return "verdict--strong";
  if (verdict === "Needs proof") return "verdict--moderate";
  return "verdict--weak";
}
