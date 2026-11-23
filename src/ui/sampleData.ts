// A fictional but realistic resume and JD, so a visitor can see a full result with one click.
// The company, school and numbers are made up.
import type { Resume } from '../core/types';

export const SAMPLE_JD = `Brightpath Labs — Software Engineering Intern (Summer 2027)

Brightpath Labs builds scheduling software for community health clinics. Our R&D team ships small, frequent releases, and we go above and beyond for the clinics we serve.

What you'll do
- Build and maintain REST APIs for our appointment service
- Write unit tests and take part in code reviews
- Work with our platform team on services written in Go

Minimum Qualifications
- Currently pursuing a degree in Computer Science or a related field
- Proficiency in Java or Python
- Experience with SQL and relational databases
- Solid understanding of data structures and algorithms
- Familiarity with Git

Preferred Qualifications
- Experience with React and TypeScript
- Docker or other container tools
- Exposure to AWS or another cloud platform
- CI/CD experience is a plus

Benefits
- Mentorship from senior engineers
- Hybrid schedule in Seattle, WA`;

export const SAMPLE_RESUME: Resume = {
  // "Spring" and "LaTeX" are deliberately not in the dictionary, to show the unrecognized-skills notice.
  skills: ['Java', 'Python', 'SQL', 'Git', 'JavaScript', 'React', 'Linux', 'Spring', 'LaTeX'],
  experiences: [
    {
      id: 'sample-maple',
      title: 'Software Developer Intern',
      organization: 'Maple Freight Co.',
      bullets: [
        { id: 'sample-maple-b1', text: 'Built a REST API in Java to track shipment status for 3 internal teams' },
        { id: 'sample-maple-b2', text: 'Rewrote slow SQL queries, cutting report generation time from 40s to 6s' },
        { id: 'sample-maple-b3', text: 'Deployed the service to a Linux staging server and automated nightly builds' },
      ],
    },
    {
      id: 'sample-ta',
      title: 'Undergraduate Teaching Assistant, Data Structures',
      organization: 'Lakeshore University',
      bullets: [
        { id: 'sample-ta-b1', text: 'Held weekly office hours for 120 students on data structures and algorithm design' },
        { id: 'sample-ta-b2', text: 'Wrote Python scripts to automate grading for 400+ submissions' },
      ],
    },
    {
      id: 'sample-planner',
      title: 'Course Planner (personal project)',
      organization: 'Personal project',
      bullets: [
        { id: 'sample-planner-b1', text: 'Built a course planning web app in React and TypeScript used by 50 classmates' },
        { id: 'sample-planner-b2', text: 'Added unit tests with Jest, reaching 85% line coverage' },
      ],
    },
  ],
};
