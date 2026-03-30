const pptxgen = require("pptxgenjs");

// Meroka brand colors
const DARK    = "18212d";
const ORANGE  = "9b420f";
const CREAM   = "F7F5F2";
const WARM    = "FBF5EB";
const WHITE   = "FFFFFF";
const MUTED   = "8A9BB0";
const SOFT    = "4A5568";

const makeShadow = () => ({ type: "outer", blur: 5, offset: 2, angle: 135, color: "000000", opacity: 0.09 });

let pres = new pptxgen();
pres.layout  = "LAYOUT_16x9";
pres.author  = "Antoine Bertrand";
pres.title   = "Quality Stream — Weekly Updates";

// ─────────────────────────────────────────
// SLIDE 1: COVER
// ─────────────────────────────────────────
let s1 = pres.addSlide();
s1.background = { color: DARK };

// Left accent bar
s1.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 0.14, h: 5.625,
  fill: { color: ORANGE }, line: { color: ORANGE },
});

// Meroka wordmark
s1.addText("MEROKA", {
  x: 0.55, y: 0.38, w: 9, h: 0.35,
  fontSize: 11, fontFace: "Calibri", bold: true, charSpacing: 5,
  color: ORANGE, align: "right", margin: 0,
});

// Main title
s1.addText("Quality Stream", {
  x: 0.55, y: 1.55, w: 9, h: 1.3,
  fontSize: 58, fontFace: "Calibri", bold: true,
  color: WHITE, margin: 0,
});

// Subtitle
s1.addText("Weekly Updates", {
  x: 0.55, y: 2.9, w: 6, h: 0.6,
  fontSize: 22, fontFace: "Calibri",
  color: "7A9BB5", margin: 0,
});

// Thin orange rule
s1.addShape(pres.shapes.RECTANGLE, {
  x: 0.55, y: 3.65, w: 2.0, h: 0.04,
  fill: { color: ORANGE }, line: { color: ORANGE },
});

// Date
s1.addText("March 18, 2026", {
  x: 0.55, y: 3.85, w: 4, h: 0.35,
  fontSize: 13, fontFace: "Calibri",
  color: "5E7A8F", margin: 0,
});


// ─────────────────────────────────────────
// SLIDE 2: THE TREASURE MAP
// ─────────────────────────────────────────
let s2 = pres.addSlide();
s2.background = { color: CREAM };

// Header band
s2.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.72,
  fill: { color: DARK }, line: { color: DARK },
});
s2.addText("THE TREASURE MAP", {
  x: 0.4, y: 0, w: 7, h: 0.72,
  fontSize: 14, fontFace: "Calibri", bold: true, charSpacing: 3,
  color: WHITE, valign: "middle", margin: 0,
});
s2.addText("provider quality scoring pipeline", {
  x: 6.5, y: 0, w: 3.15, h: 0.72,
  fontSize: 10, fontFace: "Calibri", italic: true,
  color: MUTED, align: "right", valign: "middle", margin: 0,
});

// Card grid: 4 top / 3 bottom
const steps = [
  { num: "1",  label: "Safety Gate",           desc: "OIG LEIE, state boards,\nNPDB, PECOS",                 badge: "GATE",    phase: "now"  },
  { num: "2",  label: "Credentials",           desc: "Board cert, med school,\nresidency via NPPES, ABMS",   badge: "25%",     phase: "now"  },
  { num: "3",  label: "Patient Experience",    desc: "Normalized review scores\nGoogle, Healthgrades, Doximity", badge: "25%", phase: "now"  },
  { num: "4",  label: "Access & Availability", desc: "Hours, wait times,\ntelehealth, languages",            badge: "15%",     phase: "now"  },
  { num: "5",  label: "Clinical Quality",      desc: "MIPS / QPP scores\nfrom CMS",                          badge: "20%",     phase: "now"  },
  { num: "5b", label: "Utilization & Bundles", desc: "Procedure-level data\nmapped to care bundles",         badge: "15%",     phase: "now"  },
  { num: "6",  label: "Clinical Outcomes",     desc: "Claims-based metrics\nfrom employer data",             badge: "PHASE 2", phase: "later"},
];

const cW = 2.18;
const cH = 1.82;
const gap = 0.09;
const row1Y = 0.88;
const row2Y = 2.86;

// Top row (4 cards)
const topStart = (10 - (4 * cW + 3 * gap)) / 2; // 0.465

steps.slice(0, 4).forEach((step, i) => {
  const x = topStart + i * (cW + gap);
  const later = step.phase === "later";
  const isGate = step.badge === "GATE";

  s2.addShape(pres.shapes.RECTANGLE, {
    x, y: row1Y, w: cW, h: cH,
    fill: { color: later ? "E9E5E0" : WHITE },
    shadow: later ? undefined : makeShadow(),
    line: { color: later ? "CECCCA" : "E0DBD5", width: 0.5 },
  });

  if (!later) {
    s2.addShape(pres.shapes.RECTANGLE, {
      x, y: row1Y, w: cW, h: 0.065,
      fill: { color: ORANGE }, line: { color: ORANGE },
    });
  }

  // Step number
  s2.addText(step.num, {
    x: x + 0.13, y: row1Y + 0.1, w: 0.55, h: 0.42,
    fontSize: 22, fontFace: "Calibri", bold: true,
    color: later ? "BBBBBB" : ORANGE, margin: 0,
  });

  // Badge
  const badgeBg = isGate ? ORANGE : (later ? "BBBBBB" : DARK);
  s2.addShape(pres.shapes.RECTANGLE, {
    x: x + cW - 0.62, y: row1Y + 0.16, w: 0.55, h: 0.26,
    fill: { color: badgeBg }, line: { color: badgeBg },
  });
  s2.addText(step.badge, {
    x: x + cW - 0.62, y: row1Y + 0.16, w: 0.55, h: 0.26,
    fontSize: 7.5, fontFace: "Calibri", bold: true,
    color: WHITE, align: "center", valign: "middle", margin: 0,
  });

  // Label
  s2.addText(step.label, {
    x: x + 0.13, y: row1Y + 0.62, w: cW - 0.2, h: 0.35,
    fontSize: 11.5, fontFace: "Calibri", bold: true,
    color: later ? "888888" : DARK, margin: 0,
  });

  // Description
  s2.addText(step.desc, {
    x: x + 0.13, y: row1Y + 1.03, w: cW - 0.2, h: 0.65,
    fontSize: 9, fontFace: "Calibri",
    color: later ? "AAAAAA" : SOFT, margin: 0,
  });
});

// Bottom row (3 cards, centered)
const botStart = (10 - (3 * cW + 2 * gap)) / 2;

steps.slice(4).forEach((step, i) => {
  const x = botStart + i * (cW + gap);
  const later = step.phase === "later";

  s2.addShape(pres.shapes.RECTANGLE, {
    x, y: row2Y, w: cW, h: cH,
    fill: { color: later ? "E9E5E0" : WHITE },
    shadow: later ? undefined : makeShadow(),
    line: { color: later ? "CECCCA" : "E0DBD5", width: 0.5 },
  });

  if (!later) {
    s2.addShape(pres.shapes.RECTANGLE, {
      x, y: row2Y, w: cW, h: 0.065,
      fill: { color: ORANGE }, line: { color: ORANGE },
    });
  }

  s2.addText(step.num, {
    x: x + 0.13, y: row2Y + 0.1, w: 0.55, h: 0.42,
    fontSize: 22, fontFace: "Calibri", bold: true,
    color: later ? "BBBBBB" : ORANGE, margin: 0,
  });

  const badgeBg = later ? "BBBBBB" : DARK;
  s2.addShape(pres.shapes.RECTANGLE, {
    x: x + cW - 0.62, y: row2Y + 0.16, w: 0.55, h: 0.26,
    fill: { color: badgeBg }, line: { color: badgeBg },
  });
  s2.addText(step.badge, {
    x: x + cW - 0.62, y: row2Y + 0.16, w: 0.55, h: 0.26,
    fontSize: 7.5, fontFace: "Calibri", bold: true,
    color: WHITE, align: "center", valign: "middle", margin: 0,
  });

  s2.addText(step.label, {
    x: x + 0.13, y: row2Y + 0.62, w: cW - 0.2, h: 0.35,
    fontSize: 11.5, fontFace: "Calibri", bold: true,
    color: later ? "888888" : DARK, margin: 0,
  });

  s2.addText(step.desc, {
    x: x + 0.13, y: row2Y + 1.03, w: cW - 0.2, h: 0.65,
    fontSize: 9, fontFace: "Calibri",
    color: later ? "AAAAAA" : SOFT, margin: 0,
  });
});

// Timeline legend
s2.addText("30-day: steps 1-4     60-day: steps 5 + 5b     phase 2: clinical outcomes", {
  x: 0, y: 5.22, w: 10, h: 0.35,
  fontSize: 9, fontFace: "Calibri", italic: true,
  color: MUTED, align: "center", margin: 0,
});


// ─────────────────────────────────────────
// SLIDE 3: WEEK 1 — MARCH 18
// ─────────────────────────────────────────
let s3 = pres.addSlide();
s3.background = { color: CREAM };

// Header band
s3.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.72,
  fill: { color: DARK }, line: { color: DARK },
});
s3.addText("WEEK 1   |   MARCH 18, 2026", {
  x: 0.4, y: 0, w: 6, h: 0.72,
  fontSize: 13, fontFace: "Calibri", bold: true, charSpacing: 2,
  color: WHITE, valign: "middle", margin: 0,
});

// Step badge (top right)
s3.addShape(pres.shapes.RECTANGLE, {
  x: 7.1, y: 0.14, w: 2.55, h: 0.42,
  fill: { color: ORANGE }, line: { color: ORANGE },
});
s3.addText("STEP 1: SAFETY GATE", {
  x: 7.1, y: 0.14, w: 2.55, h: 0.42,
  fontSize: 9, fontFace: "Calibri", bold: true,
  color: WHITE, align: "center", valign: "middle", margin: 0,
});

// Column layout
const c1x = 0.4;
const c2x = 5.35;
const cw  = 4.45;
const yt  = 0.92; // content top

// ── LEFT COLUMN: what got done ──

s3.addText("what got done", {
  x: c1x, y: yt, w: cw, h: 0.32,
  fontSize: 10, fontFace: "Calibri", bold: true, charSpacing: 1,
  color: ORANGE, margin: 0,
});

const bullets = [
  "mapped the full treasure map: 7 steps, weights, 30/60/90-day targets",
  "oig leie: 2-tier match (npi + name/dob), covers 98.9% of 82k exclusion records",
  "pecos: 2.9m enrollment records loaded, scoped as informational only (absence doesn't fail the gate)",
  "wv state board: npi resolution via nppes api, disciplinary flags built and working",
  "validation: all 10 known-excluded test providers correctly flagged as fail",
];

bullets.forEach((b, i) => {
  const y = yt + 0.42 + i * 0.67;
  // Dot
  s3.addShape(pres.shapes.OVAL, {
    x: c1x, y: y + 0.11, w: 0.1, h: 0.1,
    fill: { color: ORANGE }, line: { color: ORANGE },
  });
  // Text
  s3.addText(b, {
    x: c1x + 0.2, y: y, w: cw - 0.22, h: 0.58,
    fontSize: 10, fontFace: "Calibri",
    color: DARK, margin: 0,
  });
});

// Vertical divider
s3.addShape(pres.shapes.RECTANGLE, {
  x: c2x - 0.18, y: 0.82, w: 0.04, h: 4.6,
  fill: { color: "D4CFC9" }, line: { color: "D4CFC9" },
});

// ── RIGHT COLUMN: step 1 status ──

s3.addText("step 1 status", {
  x: c2x, y: yt, w: cw, h: 0.32,
  fontSize: 10, fontFace: "Calibri", bold: true, charSpacing: 1,
  color: ORANGE, margin: 0,
});

// 80% card (compact)
s3.addShape(pres.shapes.RECTANGLE, {
  x: c2x, y: yt + 0.4, w: cw, h: 0.72,
  fill: { color: WARM }, line: { color: "D4CFC9", width: 0.5 },
  shadow: makeShadow(),
});
s3.addText("80%", {
  x: c2x + 0.16, y: yt + 0.42, w: 1.1, h: 0.66,
  fontSize: 34, fontFace: "Calibri", bold: true,
  color: ORANGE, margin: 0,
});
s3.addText("done", {
  x: c2x + 1.32, y: yt + 0.62, w: 0.7, h: 0.34,
  fontSize: 13, fontFace: "Calibri",
  color: DARK, margin: 0,
});
s3.addText("98.9% of 82k exclusion records now matchable", {
  x: c2x + 2.1, y: yt + 0.6, w: cw - 2.18, h: 0.36,
  fontSize: 8.5, fontFace: "Calibri", italic: true,
  color: "6A7D90", margin: 0,
});

// Hard problems
s3.addText("hard problems", {
  x: c2x, y: yt + 1.28, w: cw, h: 0.3,
  fontSize: 10, fontFace: "Calibri", bold: true,
  color: DARK, margin: 0,
});

const hardProblems = [
  ["NPDB",       "enterprise registration timeline unknown, could take months"],
  ["FSMB",       "no contract in place, cost and access path still unclear"],
  ["state scale","direct pulls work but each state is a manual effort"],
];

hardProblems.forEach(([label, desc], i) => {
  const y = yt + 1.65 + i * 0.56;
  s3.addShape(pres.shapes.RECTANGLE, {
    x: c2x, y: y, w: 0.72, h: 0.27,
    fill: { color: DARK }, line: { color: DARK },
  });
  s3.addText(label, {
    x: c2x, y: y, w: 0.72, h: 0.27,
    fontSize: 7.5, fontFace: "Calibri", bold: true,
    color: WHITE, align: "center", valign: "middle", margin: 0,
  });
  s3.addText(desc, {
    x: c2x + 0.8, y: y + 0.02, w: cw - 0.85, h: 0.25,
    fontSize: 9, fontFace: "Calibri",
    color: SOFT, margin: 0,
  });
});

// Next week
s3.addText("next week", {
  x: c2x, y: yt + 3.38, w: cw, h: 0.3,
  fontSize: 10, fontFace: "Calibri", bold: true,
  color: DARK, margin: 0,
});

const nextWeek = [
  "start step 2: credentials (ABMS, NPPES enrichment)",
  "follow up on NPDB registration, await MA board data",
];

nextWeek.forEach((item, i) => {
  const y = yt + 3.75 + i * 0.46;
  s3.addShape(pres.shapes.OVAL, {
    x: c2x, y: y + 0.09, w: 0.1, h: 0.1,
    fill: { color: DARK }, line: { color: DARK },
  });
  s3.addText(item, {
    x: c2x + 0.2, y: y, w: cw - 0.22, h: 0.38,
    fontSize: 9.5, fontFace: "Calibri",
    color: SOFT, margin: 0,
  });
});


// ─────────────────────────────────────────
pres.writeFile({ fileName: "quality-stream-weekly.pptx" });
console.log("Done: quality-stream-weekly.pptx");
