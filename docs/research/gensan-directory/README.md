# General Santos City government directory: research, first pass

Checked November 5, 2026. This is research for Andam GenSan, not data in the live database. Nothing here has been imported.

## How to read this

- **Partially verified:** an official government source (an agency directory, an agency website, or the official social media page of the office) says the office is in General Santos City. Nobody has yet called or visited it.
- **Unverified:** the office is named only by a third-party site, a news story, or a search result, or the address is missing or conflicting.
- **Verified:** confirmed directly with the office. No office has reached this level yet.

"Not yet verified" in a field means no source was found for it. Nothing was filled in by guesswork.

## Files

| File | Contents |
|---|---|
| [agencies.csv](agencies.csv) | 32 agencies and public institutions, with whether a GenSan office was found |
| [offices.csv](offices.csv) | 59 local offices in General Santos City |
| [services.csv](services.csv) | 39 services: published guides, drafts, and candidates still to verify |
| [office_services.csv](office_services.csv) | Which office handles which service, and whether that link is confirmed |
| [sources.csv](sources.csv) | Every source used, with its type and the date checked |

`agency_slug` values match the existing `agencies.slug` values in the database, so imports will not create duplicate agencies. `in_andam_db` marks rows that already exist.

## Summary

| Status | Offices |
|---|---|
| Verified | 0 |
| Partially verified | 47 |
| Unverified | 12 |

### Confirmed by an official source (national agencies)

SSS (branch, and a service office at Robinsons Place), PhilHealth (LHIO, and PhilHealth Express at Robinsons Place Lagao), PSA, BIR, DOLE, TESDA, LTO (district office, licensing center, and Tambler extension office), NBI (Sarangani District Office), LRA Registry of Deeds, DepEd Schools Division Office, DSWD Field Office XII and its crisis intervention satellite office, DILG, CDA, and the PNP (GSCPO and seven stations, already in the database).

### City Government

The official departments page lists about 65 city offices and divisions. The 24 that residents are most likely to visit are in `offices.csv`. Only the Local Civil Registrar, CDRRMO, and BPLD have published contact details. CSWDO, City Health Office, and PESO addresses come from a city document seen in search results.

## Verification report

### Conflicting information

- **PhilHealth LHIO:** JJM II Bldg., Pendatun Ave. on the current directory; HW One Bldg., Santiago Blvd. on an older PhilHealth page.
- **DOLE General Santos City Field Office:** Villamor Bldg., Pendatun Ave. on one DOLE page; General Complex Bldg., Roxas St. on another.
- **LTO:** the 2025 regional directory and the main directory name different chiefs of office.

### Named, but only by third-party or news sources

COMELEC (Office of the Election Officer and the Region XII office), GSIS branch, Bureau of Immigration field office, BFP fire station, PPA Port Management Office at Makar Wharf, the Hall of Justice (courts), the Office of the City Prosecutor, the Public Attorney's Office, the Parole and Probation Office, and the PhilSys registration center.

### No GenSan office found

- **DMW and OWWA:** the Region XII offices are in Koronadal City.
- **DFA:** no consular office in General Santos City was found.
- **DTI:** only an old article about a planned field office.
- **CSC:** a GenSan testing center is mentioned with no address.
- **Pag-IBIG:** the official site blocks automated reading, and no other official source gives the branch address.

### Not yet researched

DA, DAR, DENR (national CENRO or PENRO), DOH, DPWH, PFDA (fish port), Bureau of Customs, CAAP (airport), PHLPost, NFA, LTFRB, public colleges and universities (such as MSU General Santos), public hospitals other than the city hospital, and barangay halls.

### Confirmed by the site owner

On November 5, 2026 the site owner confirmed how four offices take transactions (column `walk_in_or_online` in `offices.csv`):

- **SSS General Santos Branch:** online and walk-in. The 2026 SSS charter entries found for the SS number describe online application, so the walk-in option still needs the branch to confirm what it accepts.
- **PhilHealth LHIO:** walk-in.
- **BIR Revenue District Office:** online and walk-in, which matches the BIR charter.
- **Business Permits and Licensing Division:** walk-in. The city charter documents only online application through Filipizen for new permits, and online renewal all year for renewals, so the walk-in option needs the BPLD to confirm.

### City services with an official charter

The City Citizen's Charter page ([S36](https://gensantos.gov.ph/?slug=citizen-s-charter)) links a PDF for each city service. Fourteen of them back services in `services.csv` (sources S38 to S51):

- **City Treasurer's Office:** cedula, real property tax.
- **Local Civil Registrar:** certified copies, PSA copies, delayed birth registration, marriage license.
- **CSWDO:** Solo Parent ID, travel permit for minors, certificate of indigency for PAO.
- **City Health Office:** health certificate, sanitary permit.
- **PDAO:** PWD ID. **PESO:** referral slip and PESLA ID.
- **BPLD:** business permit renewal (online through Filipizen; the permit can be printed at home, sent by courier, or printed at the BPLD).

The PDFs themselves have not been read yet. Requirements, fees, and processing times must come from them before any guide is written.

### Needs direct confirmation from the office

Every row. Above all: operating hours (missing for most offices), whether each office accepts walk-in transactions, and which services each office actually offers.

## Suggested next steps

1. Call or message the offices behind the draft guides first: NBI SARDO, the Local Civil Registrar, and COMELEC.
2. Settle the PhilHealth and DOLE address conflicts.
3. Research the agencies under "Not yet researched".
4. Import only Partially verified offices, as inactive or "Not yet verified", the way the PNP stations were added.
