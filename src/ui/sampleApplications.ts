// Fictional applications for the board demo. Dates are relative to "today", so the demo always
// shows one overdue, one due-today and one upcoming reminder.
import { ApplicationRules } from '../core/ApplicationRules';
import { CalendarDate } from '../core/CalendarDate';
import type { Application, ApplicationStatus } from '../core/types';
import { SAMPLE_JD } from './sampleData';

interface SampleSpec {
  company: string;
  role: string;
  status: ApplicationStatus;
  /** Days relative to today; null for no date. */
  appliedDaysAgo: number | null;
  followUpInDays: number | null;
  notes: string;
  lastScore: number | null;
  jdText?: string;
}

const SPECS: SampleSpec[] = [
  {
    company: 'Brightpath Labs',
    role: 'Software Engineering Intern',
    status: 'Applied',
    appliedDaysAgo: 9,
    followUpInDays: -2,
    notes: 'Referred by a TA. Email the recruiter if no reply.',
    lastScore: 67,
    jdText: SAMPLE_JD,
  },
  {
    company: 'Northpine Analytics',
    role: 'Data Engineering Intern',
    status: 'OA',
    appliedDaysAgo: 12,
    followUpInDays: 0,
    notes: 'OA link expires in 5 days. SQL + one Python question.',
    lastScore: 58,
  },
  {
    company: 'Cascade Robotics',
    role: 'Embedded Software Intern',
    status: 'Interview',
    appliedDaysAgo: 20,
    followUpInDays: 2,
    notes: 'Second round: C++ and a systems design chat.',
    lastScore: 44,
  },
  {
    company: 'Tidewater Maps',
    role: 'Mobile Developer Intern',
    status: 'Applied',
    appliedDaysAgo: 2,
    followUpInDays: 5,
    notes: '',
    lastScore: null,
  },
  {
    company: 'Lumen Health',
    role: 'Backend Intern',
    status: 'Saved',
    appliedDaysAgo: null,
    followUpInDays: null,
    notes: 'Applications open in January.',
    lastScore: 72,
  },
  {
    company: 'Evergreen Games',
    role: 'Gameplay Programmer Intern',
    status: 'Offer',
    appliedDaysAgo: 40,
    followUpInDays: null,
    notes: 'Decision deadline in two weeks.',
    lastScore: null,
  },
  {
    company: 'Harbor Pay',
    role: 'Full-Stack Intern',
    status: 'Rejected',
    appliedDaysAgo: 30,
    followUpInDays: null,
    notes: 'Ask for feedback next cycle.',
    lastScore: 51,
  },
];

export function createSampleApplications(now: Date): Application[] {
  const today = CalendarDate.today(now);
  const relative = (days: number | null) => (days === null ? null : CalendarDate.addDays(today, days));
  return SPECS.map((spec, index) =>
    ApplicationRules.create(
      {
        company: spec.company,
        role: spec.role,
        status: spec.status,
        appliedDate: relative(spec.appliedDaysAgo === null ? null : -spec.appliedDaysAgo),
        followUpDate: relative(spec.followUpInDays),
        notes: spec.notes,
        jdText: spec.jdText ?? '',
        lastScore: spec.lastScore,
      },
      `sample-application-${index + 1}`,
      now,
    ),
  );
}
