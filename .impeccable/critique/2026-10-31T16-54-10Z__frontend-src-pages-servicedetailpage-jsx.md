---
target: guide page
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:C:\\xampp\\htdocs\\gensan-service-navigator\\frontend\\src\\pages\\ServiceDetailPage.jsx"
target_fingerprint: "sha256:7ba4c77c901e58131aba4ee8b001b31ed6b30c9a612a4d7b0284a2d10c1f682b"
target_path: "C:\\xampp\\htdocs\\gensan-service-navigator\\frontend\\src\\pages\\ServiceDetailPage.jsx"
timestamp: 2026-10-31T16-54-10Z
slug: frontend-src-pages-servicedetailpage-jsx
---
Method: dual-agent (A: design review, B: detector and browser evidence). No visual overlay: no visible browser in this session. Real screen readers and real phones untested.

# Critique: guide page

Design Health Score: 25/40 (Acceptable).

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | System status | 3 | Checklist progress scrolls off-screen for the last rows |
| 2 | Real-world match | 2 | "Documents ready" counts an email address; PSA, UMID, E-1, My.SSS unexplained |
| 3 | User control | 3 | Reset wipes all ticks with no undo |
| 4 | Consistency | 3 | Sidebar section order doesn't match the page |
| 5 | Error prevention | 2 | Missing fees and hours disappear silently |
| 6 | Recognition over recall | 2 | Step 1 says "on the SSS website" with no link |
| 7 | Flexibility | 2 | Phones have no jump links; hotline 1455 can't be tapped |
| 8 | Minimalist design | 3 | Clean, but the same disclaimers repeat |
| 9 | Error recovery | 3 | Errors are clear, but focus doesn't move to them |
| 10 | Help | 2 | No term explanations, no contact for "ask the agency" |

## Design specificity
Partly authored. Checklist rows, honest status notes, and the gold step ladder belong to this product. From "Where to go" down the page is a generic card stack. The Ready Folder lives in one component only.

Detector: source scan clean. Rendered scans: line-length (~89 chars, ServiceDetailPage About paragraph), side-tab (accepted), advisory stragglers. Browser checks: #steps does nothing on direct load; facts-card agency and category links 21px; privacy link 15px.

## Priority issues
1. [P1] The checklist has no finish line. Progress is off-screen for the last rows; optional items count toward the total (PhilHealth fully ready reads 2 of 6, 33%); done state ends on Reset and a caveat. Fix: count required items only, keep progress visible on phones, add a completion block with next steps, give Reset an undo. Command: shape.
2. [P1] Unknown facts disappear instead of saying "Not yet verified". Fact and InfoRow render nothing when empty: SSS and Pag-IBIG have no fee row, 4 of 6 offices no hours. Fix: always render Fee, Processing time, Office hours. Command: clarify.
3. [P1] The phone page is hard to move around or act on. 8.4 screens; Where to go at 3,047px; no phone jump menu; #steps fails on direct load; checklist heading misses the first screen at 360x640; Step 1 and hotline are not links. Fix: jump row, single back link, link steps and hotline, apply the hash after data loads. Command: layout.
4. [P1] The "Government Services" card reads as official. Heaviest element, holding only agency, category, fee, date. "Not an official website" first appears ~5,000px down on phones. The owner chose this label. Fix: rename, plain card, add "not official" to the phone strip. Command: quieter.
5. [P2] Guide links load the home page's hero photo. Side effect of pre-rendering: the fallback shell preloads a 60KB photo, ~21% of the load; tab title is "Andam GenSan" until the script runs. Fix: neutral shell or pre-build guides. Command: optimize.

## What's working
Checklist rows (whole-row target, ticks survive reload). Honest status beside a next step. Step ladder.

## Persona red flags
Casey: Reset below the last row with no undo. Jordan: "If applicable" has no test; "Needs review" may read as an instruction. Sam: progress and "All set" not announced; English content not marked in Bisaya mode. Nene (prefers Bisaya, prepaid data): content stays English with no explanation; page fails offline.

## Cognitive load
High: 5 of 8 fail, 1 partial.

## Minor observations
About paragraph has no width limit. Desktop sidebar scrolls away. 12px checklist caveat. Printouts lack site name and link addresses.

## Questions to consider
Fee as a checklist line? "Online" or "In person" up front? A one-screen ready summary?
