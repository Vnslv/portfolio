# portfolio Product Requirements (PRD)

**Version:** 0.1.0
**Owner:** @Vnslv

## Rules (read first)

1. This file is the **only source of truth** and holds **product requirements only**. Stack, design tokens, and how-to rules live in supporting docs that may only explain how to meet an ID here.
2. **Only the owner changes this file.** Agents propose changes through the `grill-spec` skill; a hook blocks agent edits, and CODEOWNERS requires the owner's review.
3. **Conflicts stop work.** If a plan, ticket, doc, or code disagrees with this file, the agent stops and reports. It never picks a side.
4. **Precedence:** this PRD, then ADRs and standards (for *how* only), then plans and tickets.
5. Every requirement has a stable ID. IDs are never reused after removal.

## Requirement Format

Each requirement is a level-3 heading `ID: title`, followed by a statement, acceptance criteria, and a status (`Proposed`, `Approved`, `Built`, `Removed`). Example:

```md
### AUTH-01: Sign in with email

**Statement:** A registered user signs in with email and password.
**Acceptance:**
- Wrong password shows an error and keeps the email filled in.
- Five failed attempts in 15 minutes lock sign-in for 15 minutes (see NFR-01).
**Status:** Approved
```

`NFR-` IDs hold limits the owner decides: rate limits, API limits, spending caps, page-speed budget, concurrent-user target.

## Users And Roles

<Who uses the product and what each role may do. Filled by grill-spec.>

## Core Flows

<Entry to goal for each primary flow. Filled by grill-spec.>

## Functional Requirements

<Requirements grouped by area. Filled by grill-spec.>

## Non-Functional Requirements

<NFR- IDs. Filled by grill-spec from docs/standards/production-checklist.md.>

## Out Of Scope

<What this product will not do in this version.>

## Changelog

| Version | Date | Change | Approved by |
| --- | --- | --- | --- |
| 0.1.0 | <date> | Template created | @Vnslv |
