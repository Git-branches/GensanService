# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: any resident of General Santos City, on a phone.** They have one government transaction to do and want to know what it takes. They may be on mobile data, and they are often getting ready the night before or on the way to the office. When the needs of different users conflict, this person wins.

They typically arrive with a task in mind ("I need a birth certificate"), sometimes in local words or old names ("sedula", "NSO", "pulis"). They do not know which agency handles it or how the government names it.

**Secondary: the administrator.** For now one person, the project owner, does all the editing, verifying, and publishing. The system supports three roles (super admin, editor, reviewer), but today one person covers all of them.

## Product Purpose

Andam GenSan helps residents arrive at a government office with the right documents the first time. "Andam" is Bisaya for "ready."

It exists because requirements are scattered across agency websites, Facebook pages, and word of mouth, and people often find out what is missing only after waiting in line.

Success means a resident can find their transaction, gather what it needs, and reach the right office without a wasted trip.

## Positioning

**Ready before you go.** The checklist and steps are the heart of the product. Local office details support them, and accuracy makes them worth trusting. A web search or a Facebook post can tell someone what a requirement is. Andam GenSan gets them prepared for a specific office in General Santos City.

## Operating Context

- A resident searches or browses, opens a guide, ticks off a document checklist saved on their device, and then goes to the office. Guides can be shared, copied, and printed.
- Every guide should link to official sources and show when it was last checked.
- Residents report wrong information through a form on each guide.
- The administrator moves guides through Draft, For review, Approved, and Published, and sets verification status separately from publishing. Any edit to a verified guide sets it back to Needs review.

## Capabilities and Constraints

**Never in scope:** resident accounts, payments, appointments, or application processing. The site does not process anything for any agency. It never asks for government account passwords or one-time PINs.

**Content rules:** never invent requirements, fees, processing times, addresses, or contacts. Show "Not yet verified" instead of guessing. Editing must never mark content as verified. Dashboards show real figures only.

**Languages:** the interface is in English, Bisaya, Filipino, and Hiligaynon, and the admin panel is English only. Guide content is in English for now. Blaan, Maguindanaon, and Maranao are hidden until translated. Text length varies by language, so layouts must hold in all four. The Bisaya, Filipino, and Hiligaynon text is a first draft that still needs review by native speakers.

**Stack:** React, Vite, Tailwind CSS, and React Router on the front end; PHP and MariaDB on the back end.

**Planned:** PWA and offline guides, analytics, SEO, and accessibility settings (Stage 4 of the master spec), then security and QA before deployment.

**Undecided:** hosting; the privacy contact email; who reviews the translations. Email alerts are off for now, so admin alerts appear only in the dashboard and sidebar.

**Terminology:** the product is "Andam GenSan". The repository, folder, package, and database keep the older name, *GenSan Service Navigator*. Say "guide" for a service guide, and "agency" for the organization versus "office" for a physical location.

## Brand Commitments

- Name: Andam GenSan. Tagline: "Prepare Today. Transact with Confidence."
- Andam GenSan is independent. It must never look or read like an official government website, and it must state that it is not one.
- The official GenSan city seal must not be used as the app logo. Agency logos appear only to identify the agency.
- Logo files: `frontend/src/assets/gensan-logo.jpg` and `frontend/src/assets/andam-logo-mark.png`.
- Colors stay uniform across the whole system, led by the navbar's navy.
- The design must be original. Reference sites may be blended into something new, but no single site is cloned. The owner has specifically raised looking too much like gensanjobboard.com as a concern, and does not want screens that look AI-generated.

## Evidence on Hand

As of 2026-10-31, the live database holds 6 published guides, 6 agencies with logos, 6 offices, 9 FAQs in 4 languages, and 10 categories. None of it is fully verified yet: 5 guides are marked Needs review, 1 is Unverified, and the agencies and offices are unconfirmed. Do not describe the content as verified.

There are no testimonials, usage figures, press mentions, or partner or government endorsements. Do not imply any of them.

Real assets: agency logos in `docs/agency-logos/`, and photography in `frontend/src/assets/` (`hero-people.webp`, `page-services.webp`, `page-agencies.webp`, `page-offices.webp`).

## Product Principles

1. **Get them ready, not just informed.** Every screen should move someone closer to walking in prepared. If it doesn't help that, it goes.
2. **Say what is known, and how well it is known.** An honest "Not yet verified" beats a confident guess. Sources and dates stay visible.
3. **The phone comes first.** Decisions are made for a small screen and a slow connection, then expanded for larger ones.
4. **Speak like a neighbor, not an agency.** Use plain words and the terms people actually say, and explain government terms the first time they appear.
5. **Stay honest about what this is.** It is an independent guide, not the government, and nothing here replaces the office.

## Accessibility & Inclusion

The master spec targets WCAG 2.2 AA principles where practical, with readable font sizes, clear keyboard focus, sufficient contrast, reduced motion, mobile-friendly navigation, and touch-friendly controls. Accessibility settings are planned for Stage 4 and must not interfere with normal use.

Plain language and multiple languages are part of inclusion here: many residents are more comfortable in Bisaya, Filipino, or Hiligaynon than in English.
