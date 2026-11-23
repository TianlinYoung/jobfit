// Size limits for imported data, also used as maxLength on form inputs so the app never
// produces data its own importer would reject.
export const LIMITS = {
  id: 100,
  company: 200,
  role: 200,
  notes: 10_000,
  jdText: 100_000,
  skill: 100,
  skills: 300,
  experienceTitle: 200,
  organization: 200,
  experiences: 50,
  bulletsPerExperience: 50,
  bulletText: 2_000,
  timestamp: 40,
  applications: 2_000,
  /** Whole import file, in characters (about bytes for JSON). */
  importFile: 5_000_000,
} as const;
