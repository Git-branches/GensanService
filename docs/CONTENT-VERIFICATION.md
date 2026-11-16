# Content verification worksheet

Status of the day-one guides and the General Santos City offices behind them. The audit was run
against a fresh database built from `database/schema.sql` and `database/seeders/*.sql` on
2026-11-12. Guides are marked **Verified** against the official charter or document they came from.

Offices are marked **Verified** when an official government source states their address, phone,
email, or hours, and the source and date are recorded. A call to the office is still the better
check and is listed below for each office, but it is no longer a blocker for launch.

Seeder `016_publish_launch_guides.sql` publishes the verified day-one drafts,
`017_verify_city_guides.sql` records the check of the two City Government guides, and
`018_office_launch_details.sql` fills in the office hours and contacts. Run all three before
building the launch database.

## Guide readiness

| Guide | Fresh-install status | Verification | Fee and time | Dated sources | Office |
|---|---|---|---|---|---|
| PSA birth certificate | published | verified 2026-11-01 | present | 2 of 3 | PSA GenSan |
| SSS number | published by 016 | verified 2026-11-01 | present | 4 of 4 | SSS GenSan |
| BIR Form 1904 | published by 016 | verified 2026-11-01 | present | 2 of 2 | BIR RDO GenSan |
| PhilHealth membership | published by 016 | verified 2026-11-01 | present | 1 of 1 | PhilHealth LHIO |
| City business permit (new) | published by 016 | verified 2026-11-01 | present | 2 of 2 | BPLD, City Hall |
| Renew a business permit | published | verified 2026-11-12 | present | 2 of 2 | BPLD, City Hall |
| Health certificate (health card) | published | verified 2026-11-12 | present | 2 of 2 | City Health Office (unverified) |
| Pag-IBIG membership | draft | unverified | missing | 0 of 1 | Pag-IBIG GenSan |

The four verified drafts (SSS, BIR, PhilHealth, new business permit) are published by seeder 016.
PSA is already published. Pag-IBIG stays a draft; its fee, processing time, and office details are
still missing.

The local development database already has these guides published, but a fresh install does not.
Production is built from the seeders, so publishing needs a seeder or an admin action.

## The two City Government guides

Both were checked against the official charter PDFs linked from
<https://gensantos.gov.ph/?slug=citizen-s-charter> on 2026-11-12. The fees, requirements, steps, and
processing times match. What changed:

- **Renew a business permit.** The charter confirms payment at Windows 46 to 48 at City Hall and
  Windows 15 to 18 at the GSC Investment Action Center; those windows are now in step 4. The charter
  describes online renewal only and states no deadline. Ask the BPLD about walk-in renewals and the
  deadline.
- **Health certificate.** The charter confirms specimen acceptance from 8:00 am to 3:00 pm. The live
  booking site at <https://choappointment.lgugensan.com/> confirms online booking and says only 200
  online and 50 walk-in appointments are accepted each day; that limit is now in step 1. The charter
  does not give the office address or hours, or say how specimens should be collected and packed, and
  the City Health Office's 2026 all-services charter (32 pages) does not either. The City Health
  Office therefore stays unverified. Seeder 018 adds the office and links it to the guide, so
  residents can at least see where it is on the map.

## Office readiness

| Office | Address | Phone | Email | Opening hours | Weekly hours | Verified |
|---|---|---|---|---|---|---|
| PSA General Santos City Office | yes | yes | — | yes | yes | yes, 2026-11-16 |
| SSS General Santos Branch | yes | yes | yes | yes | yes | yes, 2026-11-16 |
| BIR Revenue District Office – General Santos City | yes | yes | — | yes | yes | yes, 2026-11-16 |
| PhilHealth LHIO – General Santos City | yes | yes | yes | — | — | yes, 2026-11-16 |
| BPLD, City Mayor's Office (City Hall) | contested | yes | yes | — | — | no |
| City Health Office | — | — | — | — | — | no |
| Pag-IBIG Fund General Santos Branch | — | — | — | — | — | no |

Seeder `018_office_launch_details.sql` did this on 2026-11-16. It fills `weekly_hours` for PSA, SSS,
and BIR from the hours already recorded for them, so those three show an "Open now" badge.
PhilHealth is verified but has no hours, so it shows "Details verified" without a badge. The format
is `{"1":["08:00","17:00"], ...}`, where 1 is Monday and 7 is Sunday; days left out are closed.

This was a desk check against official directories, not a phone confirmation. The details are
correct as published; a call is still worth making to confirm the hours, especially SSS, whose list
dates from January 2025.

### What to confirm, office by office

Call sheet — the four real gaps first:

| Office | Number | Ask first |
|---|---|---|
| BPLD, City Hall | 0951 828 1852 | Is the counter still on the ground floor of the GSC Investment Action Center, or at the temporary office in Dadiangas West Central Elementary School? Counter hours; walk-in renewals and the renewal deadline. |
| City Health Office | no direct number yet | Address, phone, and hours for the health certificate and laboratory. Do not use (083) 553 9109 — that is the city's feedback line. |
| PhilHealth LHIO | 0920 580 3636 | Opening days and hours. |
| Pag-IBIG General Santos Branch | no number yet | Branch address, phone, email, and hours from the branch or the official Pag-IBIG directory. |

Worth confirming while you are at it:

| Office | Number | Ask first |
|---|---|---|
| PSA General Santos City Office | (083) 552-2502 | Walk-in or online only? Are the 8:00 AM – 4:00 PM hours current? |
| SSS General Santos Branch | (083) 554-5751 | Are the phone, email, and 7:00 AM – 5:00 PM hours still current? The hours list is from January 2025. |
| BIR Revenue District Office | (083) 552-2421 / (083) 552-1142 | Lunch break and filing cut-off; is Form 1904 handled at the counter or only through ORUS? |

After a call, update the office, fill `weekly_hours`, set `is_verified = 1` and
`last_verified_at`, then mark the agency verified from **Admin → Agencies**.

#### PSA General Santos City Office
- Current data: E.J. Yomon Bldg., Santiago Boulevard, Lagao; (083) 552-2502;
  Monday to Friday, 8:00 AM – 4:00 PM.
- Source used: PSA Region XII directory and PSA Helpline outlet hours.
- Done 2026-11-16: weekly hours filled and the office marked verified from those sources.
- Confirm by phone: whether the 8:00 AM – 4:00 PM window still applies, and whether walk-in
  requests are accepted or only online requests with pick-up.

#### SSS General Santos Branch
- Current data: SSS Bldg., Macar Highway, Labangal; (083) 554-5751;
  generalsantos@sss.gov.ph; Monday to Friday, 7:00 AM – 5:00 PM.
- Source used: SSS Branch Locator, SSS branch hours as of January 2025, and SSS branch
  coordinates.
- Done 2026-11-16: weekly hours filled and the office marked verified from those sources.
- Confirm by phone: phone, email, and whether the 7:00 AM – 5:00 PM window is still current. The
  hours list is from January 2025, so it is the most likely to have changed.

#### BIR Revenue District Office – General Santos City
- Current data: BIR District Office Bldg., Pendatun Ave., Laurel cor. M. Roxas St;
  (083) 552-2421 / (083) 552-1142; Monday to Friday, 8:00 AM – 5:00 PM.
- Source used: BIR Citizen's Charter 2026, Revenue Region No. 18 directory.
- Done 2026-11-16: weekly hours filled and the office marked verified from those sources.
- Confirm by phone: the lunch break or cut-off for filing, and whether Form 1904 is handled at the
  RDO counter or only through ORUS.

#### PhilHealth LHIO – General Santos City
- Current data: JJM II Bldg., Pendatun Avenue, Dadiangas North; 0920 580 3636;
  gensanlhio.pro12@philhealth.gov.ph.
- Source used: PhilHealth Directory of Offices, PRO XII, read on 2026-11-16. The directory matches
  the recorded address, mobile number, and email exactly.
- Done 2026-11-16: office marked verified. The directory states no hours for this branch, so
  `weekly_hours` stays empty and no "Open now" badge appears.
- Confirm by phone: opening days and hours.

#### Business Permits and Licensing Division, City Hall
- Current data: Ground Floor, General Santos City Investment Action Center, City Hall Compound,
  Dadiangas East; 0951 828 1852; bpld.official@gensantos.gov.ph.
- Sources: BPLD Citizen's Charter 2026 for the receiving window; City Government office directory
  (`kiosk.gensantos.gov.ph`) read on 2026-11-16 for the phone and email.
- **Unresolved:** the city directory lists the BPLD at "Temporary Office, Grade VI, Dadiangas West
  Central Elementary School", which conflicts with the charter's City Hall location. The office
  stays unverified until a call settles which address is current.
- Confirm by phone: the current counter address, counter hours, walk-in renewals, and the renewal
  deadline. Then set `weekly_hours`, `is_verified = 1`, and `last_verified_at`.

#### City Health Office
- Added by seeder 018 on 2026-11-16 so the health certificate guide points somewhere.
- Current data: map coordinates 6.1274285, 125.1853305 from the City Government office directory.
  No address, phone, or hours: the directory's contact fields for this office are placeholders.
- Confirm by phone: address, phone, and hours for the health certificate and laboratory. Do not use
  (083) 553 9109 — that is the city's feedback line, not the office.

#### Pag-IBIG Fund General Santos Branch (not day one)
- Current data: none. Old third-party listings disagree on the building, so the seeder leaves the
  address empty.
- Confirm: branch address, phone, email, and hours from the branch or the official Pag-IBIG
  directory. Do this when the Pag-IBIG guide is finished.

## After confirming an office

Use **Admin → Agencies → Offices** to edit the office, or update the row directly:

```sql
UPDATE offices
SET address = '...', contact_number = '...', email = '...',
    opening_hours = 'Monday to Friday, 8:00 AM – 5:00 PM',
    weekly_hours = '{"1":["08:00","17:00"],"2":["08:00","17:00"],"3":["08:00","17:00"],"4":["08:00","17:00"],"5":["08:00","17:00"]}',
    is_verified = 1, last_verified_at = CURDATE()
WHERE name = '...';
```

Then mark the agency itself verified and set its presence to `physical_office` from
**Admin → Agencies**, so the directory no longer says the GenSan office is unconfirmed.

## Other launch issues found in the audit

- `get-national-police-clearance` has **no office linked**, and that is now a deliberate choice: the
  PNP's online system makes the applicant choose the station and appointment, so naming one GenSan
  station on the guide would mislead. If a link is wanted later, use the GSCPO headquarters and say
  it is the city office that oversees the stations, not the only place to apply.
- NBI clearance, barangay clearance, cedula, police assistance, police blotter, and lost-document
  guides are drafts. That is fine for day one; they can follow after launch.

## Publishing the four verified guides

Seeder `016_publish_launch_guides.sql` does this. For reference, it publishes only guides that are
both verified and part of the day-one set:

```sql
UPDATE services
SET status = 'published', published_at = NOW()
WHERE slug IN (
  'apply-for-sss-number',
  'apply-for-tin-bir-form-1904',
  'register-as-philhealth-member',
  'new-business-permit-general-santos'
)
AND verification_status = 'verified'
AND status = 'draft';
```

Keep `register-for-pag-ibig-membership` as a draft.

Seeder `018_office_launch_details.sql` runs after this one. It fills the office hours and contact
details described above, adds the City Health Office, and links it to the health certificate guide.

## Host checks (local Apache)

On 2026-11-16 the `deploy/htdocs` artifact was served as the document root of a local Apache
2.4/PHP 8.2 virtual host, which is the same layout InfinityFree uses.

Passing:

- `/`, a prerendered guide page, `/api/health`, and a guide API response return **200**.
- `/sitemap.xml` and `/robots.txt` return **200** with XML and text.
- A request with a crawler user agent returns the pre-rendered guide with its title and share image.
- `/backend/`, `.env`, `config/`, `app/`, `routes/`, `vendor/`, `storage/logs/`, and
  `backend/public/*` all return **403**.

Two problems were found and fixed:

1. `backend/public/.htaccess` replaces the parent rewrite rules, so a direct request to
   `backend/public/index.php` ran the API instead of returning 403. `prepare-deploy.mjs` now writes
   a deny-all `.htaccess` into the deployed `backend/public/`; the API still includes that file from
   `api/index.php`.
2. `mod_rewrite` keeps the original `REQUEST_URI`, so the root rewrites for `/sitemap.xml`,
   `/robots.txt`, and crawler share pages reached the API with the wrong path and returned 404.
   `backend/public/index.php` now maps those requests to `/api/sitemap.xml`, `/api/robots.txt`, and
   `/api/share`.

The no-WebP logo fallback was also tested by disabling `imagewebp`: the upload picks the `.png`
extension and writes a valid PNG. When GD is absent entirely, the upload guard returns 503.

Still to confirm on the real host: InfinityFree's Apache and PHP build (especially WebP support),
the database import, and `/api/health` over HTTPS.
