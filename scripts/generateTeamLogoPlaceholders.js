const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "../public/logos");
fs.mkdirSync(dir, { recursive: true });

const ids = [
  "montenegro-nt",
  "western-sahara-nt",
  "hapoel-jerusalem",
  "as-gubbio",
  "ac-pavia",
  "giugliano-calcio",
  "ssd-savoia",
  "spartak-subotica",
  "fk-tukums-2000",
  "dfk-dainava",
  "marconi-stallions",
  "st-george-city",
  "ssc-napoli",
  "palermo",
  "udinese",
  "frosinone",
  "reggina",
  "livorno",
  "cosenza",
  "crvena-zvezda",
  "nec-nijmegen",
  "nac-breda",
  "the-new-saints",
  "nk-celje",
  "levadiakos",
  "north-korea-nt",
  "gibraltar-nt",
];

const hues = [210, 0, 25, 145, 280, 190, 45, 320];

function initials(id) {
  return (
    id
      .split("-")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0].toUpperCase())
      .join("") || "?"
  );
}

for (let i = 0; i < ids.length; i++) {
  const id = ids[i];
  const hue = hues[i % hues.length];
  const text = initials(id);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img">
  <rect width="512" height="512" fill="none"/>
  <circle cx="256" cy="256" r="200" fill="hsl(${hue} 35% 22%)"/>
  <circle cx="256" cy="256" r="168" fill="none" stroke="hsl(${hue} 40% 55%)" stroke-width="12"/>
  <text x="256" y="276" text-anchor="middle" font-family="system-ui,Segoe UI,sans-serif" font-size="120" font-weight="700" fill="#f5f5f5">${text}</text>
</svg>
`;
  fs.writeFileSync(path.join(dir, `${id}.svg`), svg);
}

fs.writeFileSync(
  path.join(dir, "README.md"),
  `# Team logos

Place club / national team logos here.

## Naming
- Filename = team \`id\` from \`data/teams.ts\`
- Prefer SVG: \`montenegro-nt.svg\`
- PNG fallback: \`montenegro-nt.png\` (update \`logo\` path in data if needed)

## Requirements
- Transparent background
- Square canvas (1:1), max 512×512 px
- Centered mark with comfortable padding
- Optimize SVG with [svgo](https://github.com/svg/svgo) before commit

\`\`\`bash
npx svgo public/logos/*.svg
\`\`\`

## Adding a team
1. Add an object to \`TEAMS\` in \`data/teams.ts\`
2. Drop the logo file here as \`{id}.svg\`
`,
);

console.log("wrote", ids.length, "logos");
