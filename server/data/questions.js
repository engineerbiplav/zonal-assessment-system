// Default/starter Guiding Questions, sourced from:
// "Zone Chairperson Training - Pre-Assignment: Completing a Zone Assessment"
// (Step 2: Interview Contacts Using Guiding Questions)
//
// NOTE: these are only used as the starting template copied into each
// admin's own editable `Question` documents (see utils/seedDefaultQuestions.js)
// when their account is created. Live assessments are served from the
// database (server/models/Question.js) so zonal heads can edit their own
// wording/categories/questions per assessment type without touching this file.

const GUIDING_QUESTIONS = [
  {
    category: "Membership",
    description: "Focused on growth and the Global Membership Approach",
    questions: [
      { id: "mem_1", text: "What can you tell me about the members of your club (backgrounds, professions, etc.)?" },
      { id: "mem_2", text: "Have you experienced membership growth/decline in the last year? Why?" },
      { id: "mem_3", text: "What does your club do to make new members feel welcome and involved?" },
      { id: "mem_4", text: "Do new members stay with the club? If not, have those members given reasons for leaving?" },
      { id: "mem_5", text: "Is the club actively recruiting new members? If so, what recruitment strategies are being used? If not, why not?" },
      { id: "mem_6", text: "Would you consider your club a 'healthy' club? Why or why not?" },
      { id: "mem_7", text: "What are some of your goals for increasing membership in the coming year?" },
      { id: "mem_8", text: "What are some of your challenges/concerns regarding membership?" },
      { id: "mem_9", text: "How can I best support you (regarding membership)?" },
    ],
  },
  {
    category: "Leadership",
    questions: [
      { id: "lead_1", text: "How do you encourage leadership development in your club?" },
      { id: "lead_2", text: "Are you able to fill leadership positions? Why or why not?" },
      { id: "lead_3", text: "Are newer members encouraged to pursue leadership positions within the club?" },
      { id: "lead_4", text: "What are some of your challenges/concerns regarding leadership?" },
      { id: "lead_5", text: "How can I best support you (regarding leadership)?" },
    ],
  },
  {
    category: "Service",
    questions: [
      { id: "serv_1", text: "What are some of your club's recent service projects? How did they go?" },
      { id: "serv_2", text: "Are your service projects interesting and engaging new members?" },
      { id: "serv_3", text: "How does the club actively involve new members in project planning/implementation?" },
      { id: "serv_4", text: "Are future service projects planned? What are they?" },
      { id: "serv_5", text: "How well are service projects meeting the needs of the community?" },
      { id: "serv_6", text: "What are some of your challenges/concerns regarding service in your club?" },
      { id: "serv_7", text: "How can I support you (regarding service)?" },
    ],
  },
  {
    category: "Communication",
    questions: [
      { id: "comm_1", text: "Have there been any past challenges in communicating with the zone chairperson or with the district?" },
      { id: "comm_2", text: "What is your preferred method of communication?" },
      { id: "comm_3", text: "How often would you like to communicate?" },
    ],
  },
  {
    category: "General",
    questions: [
      { id: "gen_1", text: "Does your club have a long-term plan in place that identifies actions related to club operations, membership growth, service, and leadership development?" },
      { id: "gen_2", text: "Has your club participated in the Club Quality Initiative?" },
      { id: "gen_3", text: "Are there any other issues/challenges that you would like to discuss?" },
      { id: "gen_4", text: "What do you need from me to be successful?" },
    ],
  },
];

// Flat helper: [{id, category, text}, ...]
const FLAT_QUESTIONS = GUIDING_QUESTIONS.flatMap((section) =>
  section.questions.map((q) => ({ ...q, category: section.category }))
);

// --- Immediate Past Zone Chairperson handover questions ---
const ZONE_CHAIR_QUESTIONS = [
  {
    category: "Clubs & Term",
    description: "A look back at the clubs in the zone and the term as a whole",
    questions: [
      { id: "zc_1", text: "How would you briefly describe each club in the zone?" },
      { id: "zc_2", text: "What challenges did you encounter during your term?" },
    ],
  },
  {
    category: "Communication",
    questions: [
      { id: "zc_3", text: "How often did you communicate with the clubs/district governor/other members of the Global Action Team?" },
      { id: "zc_4", text: "Do you have any communication \"best practices\" you would like to share?" },
    ],
  },
  {
    category: "Zone Meetings",
    description: "District Governor Advisory Committee Meetings (Zone Meetings)",
    questions: [
      { id: "zc_5", text: "How many District Governor Advisory Committee Meetings (Zone Meetings) took place during your term?" },
      { id: "zc_6", text: "Was the meeting attendance satisfactory? If not, how could it be improved?" },
      { id: "zc_7", text: "What topics did you discuss at the zone meetings?" },
    ],
  },
  {
    category: "Handover & Best Practices",
    description: "Anything the incoming zone chairperson should carry forward",
    questions: [
      { id: "zc_8", text: "Do you have any other suggestions or best practices you would like to share that we have not already discussed?" },
      { id: "zc_9", text: "Are there any ongoing issues as we start the new fiscal year?" },
      { id: "zc_10", text: "Are there any district projects currently in process that we need to continue to support?" },
      { id: "zc_11", text: "What other obligations and meetings were you asked to participate in?" },
    ],
  },
];
const FLAT_ZONE_CHAIR_QUESTIONS = ZONE_CHAIR_QUESTIONS.flatMap((section) =>
  section.questions.map((q) => ({ ...q, category: section.category }))
);

// --- First Vice District Governor / District Governor Elect questions ---
const DGE_QUESTIONS = [
  {
    category: "District Goals",
    questions: [
      { id: "dge_1", text: "What are the goals for our district?" },
      { id: "dge_2", text: "Are your goals focused on membership growth using the Global Membership Approach?" },
    ],
  },
  {
    category: "Zone Chairperson Role",
    questions: [
      { id: "dge_3", text: "What do you expect from me as zone chairperson?" },
    ],
  },
  {
    category: "Challenges",
    questions: [
      { id: "dge_4", text: "What challenges do you foresee within our district?" },
      { id: "dge_5", text: "How can I assist you in overcoming those challenges?" },
    ],
  },
  {
    category: "Communication",
    questions: [
      { id: "dge_6", text: "How often would you like to communicate about what is happening in my zone?" },
      { id: "dge_7", text: "What is your preferred method of communication?" },
    ],
  },
  {
    category: "Anything Else",
    questions: [
      { id: "dge_8", text: "Is there anything else you would like to discuss?" },
    ],
  },
];
const FLAT_DGE_QUESTIONS = DGE_QUESTIONS.flatMap((section) =>
  section.questions.map((q) => ({ ...q, category: section.category }))
);

// Map of zone-level role -> { label, sections, flat }, used by the public
// controller to serve the right question set for a given ZoneOfficial.
const ZONE_ROLES = {
  ImmediatePastZoneChairperson: {
    label: "Immediate Past Zone Chairperson",
    sections: ZONE_CHAIR_QUESTIONS,
    flat: FLAT_ZONE_CHAIR_QUESTIONS,
  },
  FirstViceDistrictGovernor: {
    label: "First Vice District Governor / District Governor Elect",
    sections: DGE_QUESTIONS,
    flat: FLAT_DGE_QUESTIONS,
  },
};

module.exports = {
  GUIDING_QUESTIONS,
  FLAT_QUESTIONS,
  ZONE_CHAIR_QUESTIONS,
  FLAT_ZONE_CHAIR_QUESTIONS,
  DGE_QUESTIONS,
  FLAT_DGE_QUESTIONS,
  ZONE_ROLES,
};
