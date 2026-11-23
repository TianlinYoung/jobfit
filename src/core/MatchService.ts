// The single entry point the UI calls: JD text + resume in, full MatchReport out.
import bundledSkills from './data/skills.json';
import { GapAdvisor } from './GapAdvisor';
import { JdParser } from './JdParser';
import { JdSectionSplitter } from './JdSectionSplitter';
import { ResumeIndex } from './ResumeIndex';
import { ScoreCalculator } from './ScoreCalculator';
import { SkillDictionary } from './SkillDictionary';
import { TextMatcher } from './TextMatcher';
import type { MatchReport, Resume, SkillEntry } from './types';

export class MatchService {
  private readonly matcher: TextMatcher;
  private readonly parser: JdParser;
  private readonly calculator: ScoreCalculator;
  private readonly advisor: GapAdvisor;

  constructor(private readonly dictionary: SkillDictionary) {
    this.matcher = new TextMatcher(dictionary.aliasPatterns());
    this.parser = new JdParser(new JdSectionSplitter(this.matcher), this.matcher);
    this.calculator = new ScoreCalculator(dictionary);
    this.advisor = new GapAdvisor(dictionary);
  }

  /** Uses the skills.json shipped with the app. */
  static createDefault(): MatchService {
    // JSON imports are typed loosely (category becomes plain string), so we assert the type here.
    // tests/core/skillsData.test.ts checks every entry really matches SkillEntry.
    return new MatchService(new SkillDictionary(bundledSkills as SkillEntry[]));
  }

  analyze(jdText: string, resume: Resume): MatchReport {
    const parsed = this.parser.parse(jdText);
    const resumeIndex = new ResumeIndex(resume, this.dictionary, this.matcher);
    const result = this.calculator.calculate(parsed.skills, resumeIndex);
    return {
      ...result,
      gaps: this.advisor.advise(result.breakdown, resumeIndex),
      unrecognizedResumeSkills: resumeIndex.unrecognizedSkills(),
      hasRequirementHeaders: parsed.hasRequirementHeaders,
    };
  }
}
