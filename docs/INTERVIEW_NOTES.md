# Interview Notes

> Draft: the project pitches, the full algorithm script, the 10 Q&As and the resume bullets are completed in stage 4.
> Entries below are written as they come up.

## Questions & answers

### Q: Why does a skill that only appears in a bullet get half credit? Isn't a bullet stronger evidence than a skills list?

**Answer.**
"That's a fair challenge, and I went back and forth on it. You're right that a bullet is stronger *evidence*: it shows I actually used the skill, while the skills list is just a claim. But the score isn't measuring how good the candidate is. It measures how easy the match is to *see*. Recruiters and keyword filters often scan the skills section first, so a skill buried in a bullet is easy to miss. Half credit captures that, and the tool pairs it with a concrete fix: 'this already appears in your bullet, add it to your skills list.' The breakdown still shows the bullet as evidence, so nothing is hidden. And it's a single constant, so if I had data showing recruiters weigh bullets more, it's a one-line change plus a test update."

**If pushed further.** "If the goal were ranking candidates rather than coaching one, I'd flip it. Bullet evidence would count at least as much as a listed skill, and maybe listed-plus-bullet would score highest. The right weight depends on what question the score answers."

中文要点：分数衡量的是"匹配是否容易被看到"，不是"候选人能力强不强"。承认 bullet 是更可信的证据；明细里照样展示这条 bullet；0.5 只是一个常量，改起来成本很低。
