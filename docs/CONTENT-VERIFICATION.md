# Content verification worksheet

Status of the day-one guides and the General Santos City offices behind them. The audit was run
against a fresh database built from `database/schema.sql` and `database/seeders/*.sql` on
2026-11-12. Offices are only marked **Verified** after someone confirms the details with the office
itself; official directories are a starting point, not the final check.

Seeder `016_publish_launch_guides.sql` publishes the verified day-one drafts, and seeder
`017_verify_city_guides.sql` records the check of the two City Government guides against the
Citizen's Charter. Run both before building the launch database.

## Guide readiness

| Guide | Fresh-install status | Verification | Fee and time | Dated sources | Office |
|---|---|---|---|---|---|
| PSA birth certificate | published | verified 2026-11-01 | present | 2 of 3 | PSA GenSan |
| SSS number | published by 016 | verified 2026-11-01 | present | 4 of 4 | SSS GenSan |
| BIR Form 1904 | published by 016 | verified 2026-11-01 | present | 2 of 2 | BIR RDO GenSan |
| PhilHealth membership | published by 016 | verified 2026-11-01 | present | 1 of 1 | PhilHealth LHIO |
| City business permit (new) | published by 016 | verified 2026-11-01 | present | 2 of 2 | BPLD, City Hall |
| Renew a business permit | published | verified 2026-11-12 | present | 2 of 2 | BPLD, City Hall |
| Health certificate (health card) | published | verified 2026-11-12 | present | 2 of 2 | none (CHO unverified) |
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
  does not give the office address or hours, or say how specimens should be collected and packed, so
  the City Health Office stays unverified.

## Office readiness

| Office | Address | Phone | Email | Opening hours | Weekly hours | Verified |
|---|---|---|---|---|---|---|
| PSA General Santos City Office | yes | yes | — | yes | — | no |
| SSS General Santos Branch | yes | yes | yes | yes | — | no |
| BIR Revenue District Office – General Santos City | yes | yes | — | yes | — | no |
| PhilHealth LHIO – General Santos City | yes | yes | yes | — | — | no |
| BPLD, City Mayor's Office (City Hall) | yes | — | — | — | — | no |
| Pag-IBIG Fund General Santos Branch | — | — | — | — | — | no |

`weekly_hours` is empty for every office. Even after an office is marked verified, the "Open now"
badge will not appear until the weekly hours are filled in. The format is
`{"1":["08:00","17:00"], ...}`, where 1 is Monday and 7 is Sunday; days left out are closed.

### What to confirm, office by office

#### PSA General Santos City Office
- Current data: E.J. Yomon Bldg., Santiago Boulevard, Lagao; (083) 552-2502;
  Monday to Friday, 8:00 AM – 4:00 PM.
- Source used: PSA Region XII directory and PSA Helpline outlet hours.
- Confirm: exact office name, address, phone, and whether the 8:00 AM – 4:00 PM window still
  applies. Ask whether walk-in requests are accepted or only online requests with pick-up.
- Then set weekly hours, `is_verified = 1`, and `last_verified_at`.

#### SSS General Santos Branch
- Current data: SSS Bldg., Macar Highway, Labangal; (083) 554-5751;
  generalsantos@sss.gov.ph; Monday to Friday, 7:00 AM – 5:00 PM.
- Source used: SSS Branch Locator, SSS branch hours as of January 2025, and SSS branch
  coordinates.
- Confirm: phone, email, and whether the 7:00 AM – 5:00 PM window is still current. The hours list
  is from January 2025, so it is the most likely to have changed.
- Then set weekly hours, `is_verified = 1`, and `last_verified_at`.

#### BIR Revenue District Office – General Santos City
- Current data: BIR District Office Bldg., Pendatun Ave., Laurel cor. M. Roxas St;
  (083) 552-2421 / (083) 552-1142; 8:00 AM – 5:00 PM.
- Source used: BIR Citizen's Charter 2026, Revenue Region No. 18 directory.
- Confirm: phone numbers, exact address, and the lunch break or cut-off for filing. Ask whether
  Form 1904 is handled at the RDO counter or only through ORUS.
- Then set weekly hours, `is_verified = 1`, and `last_verified_at`.

#### PhilHealth LHIO – General Santos City
- Current data: JJM II Bldg., Pendatun Avenue, Dadiangas North; 0920 580 3636;
  gensanlhio.pro12@philhealth.gov.ph.
- Source used: PhilHealth Regional Offices Directory, PRO XII.
- Confirm: address, mobile number, email, and the office's opening days and hours. Hours are the
  main gap here.
- Then set weekly hours, `is_verified = 1`, and `last_verified_at`.

#### Business Permits and Licensing Division, City Hall
- Current data: Ground Floor, General Santos City Investment Action Center, City Hall Compound,
  Dadiangas East.
- Source used: BPLD Citizen's Charter 2026, receiving window location.
- Confirm: phone number, email, counter hours, and whether the online application through
  Filipizen is still the preferred channel.
- Then set weekly hours, `is_verified = 1`, and `last_verified_at`.

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

- `get-national-police-clearance` is published and verified but has **no office linked**, so the
  guide shows no office. Link the PNP office or add a note.
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
