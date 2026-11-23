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
    board: 'Applications',
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
  applicationStatus: {
    Saved: 'Saved',
    Applied: 'Applied',
    OA: 'Online assessment',
    Interview: 'Interview',
    Offer: 'Offer',
    Rejected: 'Rejected',
  },
  board: {
    title: 'Applications',
    intro: 'Track each application and when to follow up. Data stays in this browser.',
    add: '+ Add application',
    emptyTitle: 'No applications yet',
    emptyMessage: 'Add one by hand, or analyze a JD on the Match tab and save the result.',
    loadSample: 'Load sample applications',
    columnEmpty: 'None',
    statusLabel: 'Status',
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: (role: string, company: string) => `Delete "${role}" at ${company}? This cannot be undone.`,
    appliedOn: (date: string) => `Applied ${date}`,
    followUpOn: (date: string) => `Follow up ${date}`,
    matchScore: (score: number) => `Match ${score}/100`,
    saveFailed: 'Could not save your applications (browser storage may be full or disabled).',
  },
  reminder: {
    bannerTitle: (count: number) =>
      count === 1 ? '1 application needs a follow-up' : `${count} applications need a follow-up`,
    overdue: (days: number) => `Follow-up overdue by ${days} ${days === 1 ? 'day' : 'days'}`,
    dueToday: 'Follow up today',
    upcoming: (days: number) => `Follow up in ${days} ${days === 1 ? 'day' : 'days'}`,
  },
  applicationForm: {
    addTitle: 'New application',
    editTitle: 'Edit application',
    company: 'Company',
    role: 'Role',
    status: 'Status',
    appliedDate: 'Applied on',
    followUpDate: 'Follow up on',
    followUpHint: 'Leave empty for no reminder. Filled in automatically (7 days after applying) when the status moves to Applied, Online assessment or Interview.',
    notes: 'Notes',
    jdText: 'Job description',
    lastScore: (score: number) => `Last match score: ${score}/100`,
    save: 'Save',
    cancel: 'Cancel',
    required: 'Company and role are required.',
  },
  saveApplication: {
    button: 'Save as application',
    title: 'Save this job to your applications',
    save: 'Save to Applications',
    saved: (role: string, company: string) => `Saved "${role}" at ${company} to Applications.`,
    openBoard: 'Open Applications',
  },
  dataTransfer: {
    title: 'Backup',
    hint: 'Export everything (resume and applications) to a JSON file, or import one. Importing replaces all current data.',
    export: 'Export JSON',
    import: 'Import JSON…',
    confirmImport: (applications: number, hasResume: boolean) =>
      `Replace ALL current data with this file (${applications} ${applications === 1 ? 'application' : 'applications'}${
        hasResume ? ' and a resume' : ', no resume'
      })? This cannot be undone.`,
    imported: (applications: number) =>
      `Imported ${applications} ${applications === 1 ? 'application' : 'applications'}.`,
    rejected: 'Nothing was imported. The file has these problems:',
    moreIssues: (count: number) => `…and ${count} more.`,
    readFailed: 'Could not read that file.',
    saveFailed: 'The file is valid, but saving it failed (browser storage may be full).',
  },
  // One message per validation problem. `path` points at the field, e.g. "applications[2].status".
  importIssue: {
    invalidJson: (_path: string, _limit: number) => 'The file is not valid JSON.',
    fileTooLarge: (_path: string, limit: number) => `The file is larger than ${Math.round(limit / 1_000_000)} MB.`,
    unsupportedVersion: (path: string, _limit: number) => `${path}: unsupported file version (expected 1).`,
    notAnObject: (path: string, _limit: number) => `${path}: expected an object.`,
    notAList: (path: string, _limit: number) => `${path}: expected a list.`,
    notText: (path: string, _limit: number) => `${path}: expected text.`,
    emptyRequired: (path: string, _limit: number) => `${path}: must not be empty.`,
    invalidStatus: (path: string, _limit: number) =>
      `${path}: not a valid status (Saved, Applied, OA, Interview, Offer, Rejected).`,
    invalidDate: (path: string, _limit: number) => `${path}: expected a date like 2026-11-23, or null.`,
    invalidTimestamp: (path: string, _limit: number) => `${path}: expected a date-time like 2026-11-23T18:00:00.000Z.`,
    invalidScore: (path: string, _limit: number) => `${path}: expected a whole number from 0 to 100, or null.`,
    tooLong: (path: string, limit: number) => `${path}: longer than ${limit} characters.`,
    tooMany: (path: string, limit: number) => `${path}: more than ${limit} items.`,
    duplicateId: (path: string, _limit: number) => `${path}: this id is used more than once.`,
  },
};

/** The shape every language must match. Derived from `en`, so adding a key here forces zh.ts to follow. */
export type Messages = typeof en;
