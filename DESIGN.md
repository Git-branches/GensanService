---
name: Andam GenSan
description: Prepare Today. Transact with Confidence.
colors:
  deep-bay-navy: "#102f54"
  deep-bay-ink: "#0a1f3a"
  action-blue: "#194b80"
  action-blue-deep: "#153d69"
  bay-tint: "#eef5fb"
  bay-edge: "#d9e8f5"
  yellowfin-gold: "#f5b301"
  yellowfin-light: "#f5c451"
  yellowfin-tint: "#fffaeb"
  yellowfin-text: "#925f08"
  reef-blue: "#55c7f2"
  bay-mist: "#f3f8fb"
  paper: "#ffffff"
  body-ink: "#1c1917"
  quiet-ink: "#57534e"
  chart-line: "#d9e3ec"
  card-edge: "#e7e5e4"
  ready-green: "#047857"
  ready-green-tint: "#ecfdf5"
  outdated-rose: "#9f1239"
  outdated-rose-tint: "#fff1f2"
typography:
  display:
    fontFamily: "Plus Jakarta Sans Variable, Jakarta Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Plus Jakarta Sans Variable, Jakarta Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Plus Jakarta Sans Variable, Jakarta Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.375
  body:
    fontFamily: "Plus Jakarta Sans Variable, Jakarta Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: "Plus Jakarta Sans Variable, Jakarta Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Plus Jakarta Sans Variable, Jakarta Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.333
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "56px"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.action-blue-deep}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.quiet-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.body-ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.body-ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  callout:
    backgroundColor: "{colors.yellowfin-tint}"
    textColor: "{colors.deep-bay-ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  nav-link-active:
    backgroundColor: "{colors.deep-bay-navy}"
    textColor: "{colors.yellowfin-light}"
  badge-verified:
    backgroundColor: "{colors.ready-green-tint}"
    textColor: "{colors.ready-green}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
---

# Design System: Andam GenSan

## Overview

**Creative North Star: "The Ready Folder"**

Andam GenSan looks and behaves like a well-kept folder you carry to a government office: everything labeled, in order, and ticked off. A resident arrives with a stressful errand, on a phone, possibly on mobile data. The design's job is to lower that stress, so it stays calm and capable. Nothing competes with the question "what do I bring, and where do I go?"

Controls are sturdy and obvious. Someone unsure of technology should never have to guess what can be tapped. Familiar patterns are a strength here. Personality comes from the deep navy, the yellowfin gold, and quiet local touches such as the Sarangani Bay contour lines, not from effects.

The design must never pass as an official government website. It must not clone a reference site, including gensanjobboard.com, and screens must not look machine-generated.

**Key Characteristics:**

- One family of navy blues from the header to the buttons, with gold used sparingly as a marker
- A light Bay Mist page with flat white surfaces and thin borders
- One typeface, with hierarchy built from weight and size
- Status always shown with an icon and words, never color alone
- The same structure in English, Bisaya, Filipino, and Hiligaynon, whichever runs longest

## Colors

A restrained palette of deep navy on a cool, light ground, with one warm accent that carries meaning.

### Primary

- **Deep Bay Navy** (#102f54): The header, footer, and the sections that anchor a page. The system's identity color.
- **Deep Bay Ink** (#0a1f3a): Headings on light surfaces.
- **Action Blue** (#194b80): Primary buttons and links. Deepens to #153d69 on hover.
- **Bay Tint** (#eef5fb) and **Bay Edge** (#d9e8f5): Soft fills and edges for progress panels and the page-header wash.

### Secondary

- **Yellowfin Gold** (#f5b301): The accent line above the header and footer, checklist progress, numbered tiles, and callout accents.
- **Yellowfin Light** (#f5c451): Active navigation and text on navy, where it reads as a highlight.
- **Yellowfin Tint** (#fffaeb): The soft fill of callouts and "not yet verified" notices.
- **Yellowfin Text** (#925f08): Gold's readable form for small text on white, such as agency names on cards.

### Tertiary

- **Reef Blue** (#55c7f2): "GenSan" in the logo on navy. Only there.

### Neutral

- **Bay Mist** (#f3f8fb): The page background.
- **Paper** (#ffffff): Cards, panels, and inputs.
- **Body Ink** (#1c1917): Body text.
- **Quiet Ink** (#57534e): Secondary text and descriptions.
- **Chart Line** (#d9e3ec) and **Card Edge** (#e7e5e4): Dividers and card borders.

### Status

- **Ready Green** (#047857, tint #ecfdf5): Verified information and a finished checklist.
- **Yellowfin** (text #784d0d on #fffaeb): Needs review, not yet verified.
- **Stone** (text #44403c on #f5f5f4): Unverified.
- **Outdated Rose** (#9f1239, tint #fff1f2): Outdated information, and destructive actions in the admin panel.

### Named Rules

**The Uniform Navy Rule.** The header, footer, buttons, and links all come from the same navy family. No section introduces its own hue.

**The Gold Marks Rule.** Gold marks position, progress, or attention. It is never the fill of a primary button, and it is never the color of small text on white; use Yellowfin Text there.

**The Status Has Words Rule.** Every status carries its own icon and wording, so it never depends on color alone.

## Typography

**Display Font:** Plus Jakarta Sans (with a matched fallback, then ui-sans-serif, system-ui, sans-serif)
**Body Font:** Plus Jakarta Sans
**Label/Mono Font:** None. Tabular numerals are used where digits need to line up.

**Character:** One friendly, sturdy sans carries everything, served from the site itself as a variable font. Hierarchy comes from weight and size, with extra-bold headings set slightly tight. A fallback font sized to match it keeps text from jumping when the real font arrives.

### Hierarchy

- **Display** (800, 2.25rem on phones, 3rem from the small breakpoint, line height 1.1, tracking -0.025em): The home page headline only.
- **Headline** (800, 1.875rem to 2.25rem for page titles, 1.5rem to 1.875rem for section titles, tracking -0.025em): Page and section headings.
- **Title** (700, 1.125rem, line height 1.375): Card titles such as guide and office names.
- **Body** (400, 1rem, line height 1.5): Reading text. Keep the measure near 65 to 75 characters (max-w-2xl to max-w-3xl).
- **Body Small** (400, 0.875rem, line height 1.625): Secondary text only: card summaries, metadata, and supporting notes.
- **Label** (600 to 700, 0.75rem): Badges and metadata.
- **Meta** (600, 1rem, Action Blue): Supporting details directly below a page title, such as the agency.

### Named Rules

**The Sixteen Rule.** Anything a resident must read to act, such as requirements, steps, and instructions, is at least 16px on a phone.

**The Bold Lead-In Rule.** Items in a reminder or callout list start with a bold key takeaway, such as "**Protect your accounts:** Never share..."

## Layout

Pages sit in a centered container up to 72rem (max-w-6xl) with 16px gutters on phones and 24px from the small breakpoint. Long reading uses 42rem to 48rem. Page sections are separated by 56px to 80px of vertical space, and related items sit 8px to 16px apart, on Tailwind's 4px base.

Layouts are designed at phone width first and expand with Tailwind's default breakpoints. Grids collapse to one column on phones, and the header collapses to a menu below 768px. Nothing may scroll sideways in any language.

Page tops use a soft wash from Bay Tint through white to Yellowfin Tint, with the Bay Pattern contour lines fading in from the right. That wash is the only gradient in the system.

## Elevation & Depth

The system is flat at rest. Surfaces sit on Bay Mist, separated by white fill and a 1px border. Shadows appear only as a response to state or for things that float above the page.

### Shadow Vocabulary

- **Hover lift** (Tailwind `shadow-md`): Cards a resident can open, on hover.
- **Floating panel** (`shadow-lg` tinted with deep navy at 5% opacity): Search panels and suggestion lists.
- **Dialog** (`shadow-2xl` tinted with Deep Bay Ink at 30% opacity): Dialogs and bottom sheets.

### Named Rules

**The Flat Until It Floats Rule.** Nothing casts a shadow at rest unless it floats above the page.

## Shapes

Corners are gently rounded and consistent. Controls and inner tiles use 8px, cards 12px, and floating panels and dialogs 16px. Badges use 6px, and admin status pills and progress bars are fully round. Icon tiles are square with 8px corners and share one size within a group, 40px or 32px.

Callouts keep a square left edge where their accent sits, and round only the right corners.

## Components

### Buttons

Sturdy and obvious. A button always looks like a button.

- **Shape:** Gently rounded (8px).
- **Primary:** Action Blue fill with white text in weight 600. 10px to 12px vertical padding on public pages, so the tap area stays generous.
- **Hover / Focus:** Fill deepens to #153d69. Keyboard focus is a 2px outline offset by 2px, Action Blue on light surfaces and Yellowfin Light on navy.
- **Secondary:** White with a stone border and Quiet Ink text.
- **Danger (admin):** White with a rose border, or solid rose for a final confirmation.

**The Thumb Rule.** Every control a resident taps on a phone is at least 44px tall. Small inline links, such as breadcrumbs, are at least 24px.

### Cards / Containers

- **Corner Style:** 12px.
- **Background:** Paper, with a Card Edge border.
- **Shadow Strategy:** Flat at rest. Cards that open a page lift on hover, per the Flat Until It Floats Rule.
- **Internal Padding:** 20px.
- **Guide cards:** A slim category strip on top, then the agency, title, and summary, with the verification badge and "View guide" pinned to the bottom so cards in a row align.

### Inputs / Fields

- **Style:** White fill, stone border, 8px corners, and a persistent label above the field.
- **Focus:** The border shifts to blue with a soft 2px blue ring.
- **Error / Disabled:** A red border with the message beneath the field; disabled fields turn pale stone.

### Navigation

- **Header:** Deep Bay Navy with white links in weight 600. It stays at the top while scrolling.
- **Active state:** Yellowfin Light text with a 3px bar along the bottom edge.
- **Top strip:** A Bay Mist strip above the header says the guide is independent, and holds the time and language switcher, under a 3px gold line.
- **Mobile:** A menu button opens a full-width list, and the active link gets a 4px gold left accent.

### Callouts

The system's one attention surface, for reminders and warnings a resident should not miss.

- **Style:** Yellowfin Tint fill with a single 4px Yellowfin Gold left accent and no other border.
- **Content:** A short title, then items led by a bold takeaway, each with a matching icon in a white tile aligned to the first line of text.
- **Icons match meaning:** Lock for account safety, a refresh arrow for details that change, Info for general disclaimers.

**The One Accent Rule.** A callout has a soft fill and one 4px left accent. It never also has an outer stroke, so the two borders do not compete. This is the owner's confirmed style, and it applies only to callouts.

### Checklist

The product's signature component, and the folder being filled. It comes first on a guide page, directly below the title, followed by the steps and where to go.

- **Progress:** A Bay Tint panel with plain words ("3 of 5 ready"), a percentage in tabular numerals, and a gold bar that turns Ready Green when complete.
- **Rows:** The whole row is the tap target. Ticked rows take a soft green fill with the text struck through, so what is left stands out.
- **Honesty:** Optional items say so in a small gold badge, and progress is saved only on the device.

### Verification Badge

- **Style:** A 6px-rounded chip with a 1px matching ring, an icon, and a label. The date appears only when an item is verified.
- **States:** Verified, Needs review, Unverified, and Outdated, using the colors in Status above.

## Do's and Don'ts

### Do:

- **Do** keep the checklist and steps as the most prominent content on a guide, with the checklist starting within the first phone screen.
- **Do** show "Not yet verified" plainly wherever information is unconfirmed.
- **Do** use one icon style (lucide, outline) at one size within a group, and align list icons to the first line of text.
- **Do** test every new layout at phone width in all four languages.
- **Do** keep motion short and functional, under 300ms, with a reduced-motion alternative.
- **Do** blend reference sites into something original, using this palette.

### Don't:

- **Don't** make any screen look or read like an official government website, or use the official GenSan city seal as a logo.
- **Don't** clone a single reference site, including gensanjobboard.com.
- **Don't** add a new hue for a section, or use a different navy from the family above.
- **Don't** add a small label above a heading. Supporting details such as an agency name or an updated date go below it.
- **Don't** put a card inside a card. Section content sits directly in the section, and a section made of cards has no outer card.
- **Don't** combine a thick left accent with a full outer stroke on the same card.
- **Don't** use gradient text, decorative glass, or decorative glows.
- **Don't** show a statistic or a verified state that the data does not support.
