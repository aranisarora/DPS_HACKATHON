/**
 * ===== Seeded demo dataset =====
 * The transcript uses Recall.ai's exact JSON schema (participants +
 * diarized utterances with timestamps) so live and rehearsal paths share
 * identical code. Persona: founder of a small marketing/creative agency.
 */

export const DEMO_TRANSCRIPT = {
  bot_id: "demo-bot-aurelia-kickoff",
  meeting_metadata: { title: "Aurelia Skincare — Q3 Campaign Kickoff" },
  status: { code: "done" },
  media_shortcuts: {
    transcript: {
      data: {
        provider: "assembly_ai",
        participants: [
          { id: 1, name: "Maya Chen", email: "maya@brightside.agency", is_host: true },
          { id: 2, name: "Sofia Reyes", email: "sofia@aureliaskincare.com", is_host: false },
          { id: 3, name: "Tom Okafor", email: "tom@brightside.agency", is_host: false },
        ],
        utterances: [
          { participant_id: 2, words: [], text: "We love the moodboard direction. The launch window is tight though — we go live September 2nd.", start_ts: 312.4, end_ts: 321.1 },
          { participant_id: 1, words: [], text: "Understood. Tom, can you get the first round of hero visuals to Sofia by next Friday?", start_ts: 322.0, end_ts: 328.9 },
          { participant_id: 3, words: [], text: "Yes — first round by Friday works if we lock the palette today.", start_ts: 329.3, end_ts: 334.7 },
          { participant_id: 2, words: [], text: "Palette's locked, go with option B. Also, can we get weekly check-ins? Let's meet same time next week.", start_ts: 335.1, end_ts: 344.8 },
          { participant_id: 1, words: [], text: "Done, I'll send the invite. And I'll recap all this by email so Priya has it too — shame she couldn't join.", start_ts: 345.2, end_ts: 352.6 },
          { participant_id: 2, words: [], text: "Perfect. One more thing — the influencer briefs need legal review before anything goes out.", start_ts: 353.0, end_ts: 359.4 },
          { participant_id: 1, words: [], text: "Noted, I'll flag that for legal and block time Thursday to prep the briefs.", start_ts: 359.8, end_ts: 365.2 },
        ],
      },
    },
  },
};

export interface DemoAction {
  action_type: string;
  title: string;
  description: string;
  source_quote: string;
  confidence: number;
  blast_radius: "internal" | "team" | "external";
  reversible: boolean;
  minutes_saved: number;
  params: Record<string, unknown>;
}

export const DEMO_ACTIONS: DemoAction[] = [
  {
    action_type: "follow_up_booking",
    title: "Book weekly check-in with Aurelia",
    description: "Recurring slot, same time next week, with Sofia Reyes.",
    source_quote: "Let's meet same time next week.",
    confidence: 0.93,
    blast_radius: "external",
    reversible: false,
    minutes_saved: 10,
    params: {
      summary: "Aurelia × Brightside — weekly check-in",
      start: nextWeekISO(10),
      end: nextWeekISO(10.5),
      attendees: ["sofia@aureliaskincare.com", "tom@brightside.agency"],
    },
  },
  {
    action_type: "recap_email",
    title: "Send meeting recap to Sofia",
    description: "Decisions: palette option B locked, launch Sept 2, first visuals Friday, weekly check-ins, legal review for influencer briefs.",
    source_quote: "I'll recap all this by email so Priya has it too.",
    confidence: 0.95,
    blast_radius: "external",
    reversible: false,
    minutes_saved: 15,
    params: {
      to: ["sofia@aureliaskincare.com"],
      subject: "Recap — Q3 Campaign Kickoff (palette locked, launch Sept 2)",
      body: "Hi Sofia,\n\nGreat kickoff today. Quick recap of what we agreed:\n\n• Palette locked: option B\n• Launch date: September 2nd\n• First round of hero visuals: to you by next Friday (Tom)\n• Weekly check-ins: same time each week — invite coming separately\n• Influencer briefs: routed through legal review before anything goes out\n\nShout if I missed anything.\n\nBest,\nMaya",
    },
  },
  {
    action_type: "task_assignment",
    title: "Assign hero visuals (round 1) to Tom",
    description: "First round of hero visuals for Aurelia Q3, due Friday. Palette option B.",
    source_quote: "Tom, can you get the first round of hero visuals to Sofia by next Friday?",
    confidence: 0.97,
    blast_radius: "team",
    reversible: true,
    minutes_saved: 5,
    params: {
      title: "Hero visuals — round 1 (Aurelia Q3)",
      detail: "Palette option B. Deliver to Sofia by Friday.",
      assignee_name: "Tom Okafor",
      due_date: fridayISO(),
    },
  },
  {
    action_type: "absentee_update",
    title: "Brief Priya on what she missed",
    description: "Personalised update for the absent account manager.",
    source_quote: "Shame she couldn't join.",
    confidence: 0.88,
    blast_radius: "team",
    reversible: false,
    minutes_saved: 10,
    params: {
      to: ["priya@brightside.agency"],
      subject: "Aurelia kickoff — what you missed",
      body: "Hi Priya,\n\nYou missed a good one. Headlines for you as AM:\n\n• Palette locked (option B) — no more revisions\n• Hard launch date: Sept 2 — build the retro-plan back from that\n• Tom owns hero visuals round 1, due Friday\n• Sofia wants weekly check-ins — invite going out today\n• New constraint: influencer briefs must clear legal before send\n\nFull transcript in Donna if you want the detail.\n\nMaya",
    },
  },
  {
    action_type: "calendar_block",
    title: "Block Thursday prep time for influencer briefs",
    description: "Two-hour focus block on the owner's own calendar.",
    source_quote: "I'll flag that for legal and block time Thursday to prep the briefs.",
    confidence: 0.91,
    blast_radius: "internal",
    reversible: true,
    minutes_saved: 3,
    params: {
      summary: "Focus: prep influencer briefs (Aurelia)",
      start: thursdayISO(9),
      end: thursdayISO(11),
      attendees: [],
    },
  },
  {
    action_type: "slack_summary",
    title: "Post kickoff decisions to #aurelia",
    description: "Decision summary for the project channel.",
    source_quote: "Palette's locked, go with option B.",
    confidence: 0.85,
    blast_radius: "team",
    reversible: false,
    minutes_saved: 5,
    params: {
      channel: "#aurelia",
      text: ":art: *Aurelia Q3 kickoff — decisions*\n• Palette locked: *option B*\n• Launch: *Sept 2*\n• Hero visuals r1: Tom, due Friday\n• Weekly client check-ins start next week\n• Influencer briefs need legal review first",
    },
  },
];

export const DEMO_CONTACTS = [
  { email: "tom@brightside.agency", name: "Tom Okafor", inferred_role: "Designer", is_teammate: true, teammate_confirmed: true, interaction_count: 214 },
  { email: "priya@brightside.agency", name: "Priya Sharma", inferred_role: "Account Manager", is_teammate: true, teammate_confirmed: true, interaction_count: 388 },
  { email: "sofia@aureliaskincare.com", name: "Sofia Reyes", inferred_role: "Client — Head of Brand", is_teammate: false, teammate_confirmed: false, interaction_count: 96 },
];

export const DEMO_BUSINESS_PROFILE = {
  questionnaire: {
    what_you_do: "Brightside — a 6-person creative agency doing brand campaigns and content for DTC consumer brands.",
    who_your_clients_are: "DTC skincare, food and lifestyle brands. Key accounts: Aurelia Skincare, Fern & Co, Marlow Coffee.",
    tone_of_voice: "Warm, direct, no fluff. First names. Short sentences.",
  },
  profile: {
    services: ["Brand campaigns", "Content production", "Social strategy"],
    key_clients: ["Aurelia Skincare", "Fern & Co", "Marlow Coffee"],
    team: [
      { name: "Maya Chen", role: "Founder" },
      { name: "Tom Okafor", role: "Designer" },
      { name: "Priya Sharma", role: "Account Manager" },
    ],
    voice: "Warm, direct, no fluff. Short sentences, first names.",
  },
};

// ---- date helpers: always in the future relative to seeding ----
function nextWeekISO(hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
  return d.toISOString();
}
function fridayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
  return d.toISOString().slice(0, 10);
}
function thursdayISO(hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + ((4 - d.getDay() + 7) % 7 || 7));
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
