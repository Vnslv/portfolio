# Grill Spec Question Bank

Starting points, not a script. Make each question specific to what the owner already said, and put your recommendation first.

## Users And Roles

- Who is the first user you want delighted, and what do they do right before they open the app?
- Which roles exist (owner, member, admin, guest)? What may each create, see, change, delete?
- Is there anyone who must never see another user's data?

## Core Flows

- What is the one flow that must work on day one? Walk it from first screen to goal.
- What does a brand-new user see with no data (empty state)?
- What happens when that flow fails halfway (network, payment, validation)?

## Data

- What does the app store about a user? What must it never store?
- Who owns each record? Can it be shared, transferred, exported?
- How long is data kept, and what happens on account deletion?

## Auth And Permissions

- Sign-in method (email link, password, OAuth provider)?
- Session length and "remember me"?
- Do any actions need re-confirmation (delete account, change payment)?

## Integrations

- Which outside services are required (payments, email, AI, storage, maps)?
- What does the app do when each is down or slow?
- Which of them bill per use?

## Money

- Free, paid, freemium, or internal? What does a paying user get that a free one does not?
- Monthly budget for running costs at launch?

## Production Limits (each becomes an NFR- ID with a number)

- **Spam protection:** which public forms (sign-up, contact, comments) need it, and what kind (honeypot, CAPTCHA, email verification)?
- **Rate limits:** requests per minute per user and per IP for sign-in, write endpoints, and AI or paid calls.
- **API limits:** per outside provider, the quota you will set.
- **Spending caps:** per paid provider, the monthly cap and alert threshold.
- **Caching:** which reads repeat often, and how stale may each be (seconds, minutes, never)?
- **Concurrent users:** how many at once at launch, and at the next milestone?
- **Page speed:** target Largest Contentful Paint and Lighthouse performance score on phone.
- **Error logging:** which service, and who gets alerted?

## Failure And Edge Cases

- Two users edit the same thing at once: who wins?
- A user double-clicks submit: what happens?
- Very long text, unusual characters, huge files: what are the limits?

## Out Of Scope

- What will people ask for that you are deliberately not building yet?
