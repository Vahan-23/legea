# Team logos

Official / public crest images for the «Нам доверяют» section.

## Naming
- Filename = team `id` from `data/teams.ts`
- Prefer transparent PNG (current seed set) or SVG

## Sources (seed download)
Badges were mirrored from [TheSportsDB](https://www.thesportsdb.com/) free media CDN.
Western Sahara uses the national flag (no public crest in sports DBs).

Re-download:

```bash
node scripts/downloadTeamLogos.js
```

## Requirements for replacements
- Transparent background when possible
- Square-ish mark, max ~512px
- Update `logo` path in `data/teams.ts` if extension changes

## Adding a team
1. Add an object to `TEAMS` in `data/teams.ts`
2. Drop the logo file here as `{id}.png` (or `.svg`)
