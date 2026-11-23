// English UI text. This file is the reference: zh.ts must have exactly the same keys and function shapes.
//
// Plain strings for fixed text; small functions for text with values in it, so each language can put
// the values where its grammar needs them (word order differs between English and Chinese).
export const en = {
  app: {
    tagline: 'Internship tracker and job-description matcher',
    languageLabel: 'Language',
    loading: 'Loading your resume…',
    loadFailed: 'Could not read your saved resume. You can still use the app, but changes may not be saved.',
    saveFailed: 'Could not save your resume (browser storage may be full or disabled).',
    confirmReplaceWithSample: 'Replace your saved resume with the sample resume?',
    footer: 'Everything runs in your browser. Nothing is uploaded.',
  },
  tabs: {
    match: 'Match a job',
    resume: 'My resume',
  },
  match: {
    heroTitle: 'How well does your resume match this job?',
    heroIntro:
      'Paste a job description. JobFit finds the skills it asks for, checks them against your resume, and shows exactly where every point comes from.',
    trySample: 'Try with sample data',
    jdLabel: 'Job description',
    jdPlaceholder: 'Paste the full job description here, including the qualifications sections.',
    jdLanguageNote: 'Only English job descriptions are supported for now.',
    analyze: 'Analyze',
    jdBlankHint: 'Paste a job description to enable Analyze.',
    resumeEmptyTitle: 'Your resume is empty',
    resumeEmptyMessage: 'Add your skills and experience bullets first, so there is something to compare against this JD.',
    addYourResume: 'Add your resume',
    noSkillsTitle: 'No recognizable skills in this JD',
    noSkillsMessage:
      'We could not find any skill from our dictionary in this text. Make sure you pasted the full job description, including the qualifications section.',
    seeExample: 'See an example instead',
    staleNotice: 'You edited the JD since the last analysis. Click Analyze to update the results.',
  },
  score: {
    ariaLabel: 'Match score',
    formula: (earned: string, max: string, score: number) => `${earned} / ${max} points = ${score}%`,
    listedCount: (listed: number, total: number) => `${listed} of ${total} JD skills are in your skills list.`,
    explanation:
      'Each JD skill is worth its weight (Required ×3, Preferred ×1, mentioned elsewhere ×1). You earn the full weight if the skill is in your skills list, half if it only appears in a bullet, and nothing if it is missing.',
    noHeadersNotice: 'This JD has no Required / Preferred headings, so every skill is weighted ×2.',
  },
  importance: {
    required: 'Required',
    preferred: 'Preferred',
    context: 'Mentioned elsewhere',
    unspecified: 'Unspecified',
  },
  status: {
    listed: 'In skills list',
    bulletOnly: 'Only in a bullet',
    missing: 'Missing',
  },
  breakdown: {
    title: 'Score breakdown',
    columnSkill: 'Skill',
    columnFromJd: 'From the JD',
    columnImportance: 'Importance',
    columnResume: 'Your resume',
    columnPoints: 'Points',
  },
  unrecognized: {
    title: 'Skills we could not compare',
    ariaLabel: 'Unrecognized skills',
    message:
      'These skills from your resume are not in the skill dictionary, so they were not scored. Check the spelling or use a common name (for example "Spring Boot" instead of "Spring").',
  },
  gaps: {
    title: 'Suggestions',
    none: 'Every skill in this JD is already in your skills list. Nothing to suggest.',
    kindLabel: {
      addToSkillsList: 'Add to skills list',
      canHighlightInBullet: 'Maybe mention in a bullet',
      trulyMissing: 'Not in your resume',
    },
    addToSkillsList: (skill: string) =>
      `${skill} already appears in one of your bullets but not in your skills list. Add it to the skills list so it is easy to spot.`,
    // Must stay conditional: see docs/DECISIONS.md D6 and tests/ui/i18n.test.ts.
    canHighlightInBullet: (skill: string, keyword: string) =>
      `If you actually used ${skill} in this work, mention it explicitly in this bullet (it mentions "${keyword}", which is often related). If you did not use it, leave the bullet as it is.`,
    trulyMissing: (skill: string) =>
      `${skill} does not appear anywhere in your resume. If you have real experience with it, add it; otherwise treat it as a skill to learn.`,
  },
  resume: {
    title: 'Your resume',
    intro: 'Matching uses your skills list and the text of your experience bullets. Data stays in this browser.',
    skillsHeading: 'Skills',
    experienceHeading: 'Experience',
    noExperiences: 'No experiences yet.',
    addExperience: '+ Add experience',
    save: 'Save resume',
    unsavedChanges: 'Unsaved changes',
    allSaved: 'All changes saved',
  },
  skillEditor: {
    inputLabel: 'Add a skill',
    placeholder: 'e.g. Java, SQL, React',
    add: 'Add',
    empty: 'No skills yet. Add the ones listed on your resume.',
    remove: (skill: string) => `Remove ${skill}`,
  },
  experienceEditor: {
    legend: 'Experience',
    title: 'Title',
    organization: 'Organization',
    bullets: 'Bullets (one per line)',
    bulletsPlaceholder: 'Built a REST API in Java for ...\nCut query time by 80% by ...',
    remove: 'Remove this experience',
  },
};

/** The shape every language must match. Derived from `en`, so adding a key here forces zh.ts to follow. */
export type Messages = typeof en;
