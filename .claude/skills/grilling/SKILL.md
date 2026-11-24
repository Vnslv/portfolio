---
name: grilling
description: The shared interview method that keeps the owner in the loop. Use from grill-spec, grill-with-design, and plan, or when the owner says "grill me" or wants a plan, decision, or idea stress-tested.
---

# Grilling

Adapted from [Matt Pocock's grilling skill](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md) (MIT, see [LICENSE](LICENSE)). Interview the owner relentlessly until you share one understanding.

## Method

1. **Map a design tree.** Each decision branches into the decisions that depend on it.
2. **Find the frontier:** every decision whose prerequisites are settled, so it can be asked without guessing an answer you have not heard.
3. **Ask the frontier as a round.** Use AskUserQuestion, up to 4 questions per call. If the frontier is larger, ask the rest in further calls before moving on. If that tool is unavailable, number the questions in chat. Put the recommended answer first, marked "(Recommended)", with what each option trades off. Each option is one single choice; never join alternatives with "or".
4. **Wait.** Never answer for the owner or continue past an unanswered question.
5. **Recompute** the frontier from the answers and ask the next round. A question that depends on one still open belongs to a later round.
6. **Confirm.** When the frontier is empty, summarize every decision and who made it, then ask whether this is the shared understanding. Do not act until the owner says yes.

## Facts And Decisions

- **Facts are yours to find.** Look in the repository, tools, or official docs and cite the source. Use a read-only subagent for broad searches when available; only questions that depend on it wait.
- **Decisions are the owner's.** Put each to them, with a recommendation, and wait.
- Never reopen a recorded decision unless new facts contradict it; say what changed.
- No silent assumptions. An unknown becomes a question or a labeled placeholder.
