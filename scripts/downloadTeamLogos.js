/**
 * Downloads real team badges into public/logos/ and rewrites data/teams.ts logo paths.
 * Sources: TheSportsDB (free badges) + Wikimedia for missing sides.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public", "logos");

const DOWNLOADS = [
  ["montenegro-nt", "https://r2.thesportsdb.com/images/media/team/badge/dywswx1552859263.png"],
  [
    "western-sahara-nt",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Flag_of_the_Sahrawi_Arab_Democratic_Republic.svg/512px-Flag_of_the_Sahrawi_Arab_Democratic_Republic.svg.png",
  ],
  ["hapoel-jerusalem", "https://r2.thesportsdb.com/images/media/team/badge/cvh4ec1639431062.png"],
  ["as-gubbio", "https://r2.thesportsdb.com/images/media/team/badge/el7zx61680802664.png"],
  ["ac-pavia", "https://r2.thesportsdb.com/images/media/team/badge/erj5yh1754845619.png"],
  ["giugliano-calcio", "https://r2.thesportsdb.com/images/media/team/badge/fxabhs1675356445.png"],
  ["ssd-savoia", "https://r2.thesportsdb.com/images/media/team/badge/ce25mk1724132443.png"],
  ["spartak-subotica", "https://r2.thesportsdb.com/images/media/team/badge/cty1ud1578920617.png"],
  ["fk-tukums-2000", "https://r2.thesportsdb.com/images/media/team/badge/f2losf1644854968.png"],
  ["dfk-dainava", "https://r2.thesportsdb.com/images/media/team/badge/n6kb5a1615669872.png"],
  ["marconi-stallions", "https://r2.thesportsdb.com/images/media/team/badge/noeabj1742605073.png"],
  ["st-george-city", "https://r2.thesportsdb.com/images/media/team/badge/5052tk1742605620.png"],
  ["ssc-napoli", "https://r2.thesportsdb.com/images/media/team/badge/l8qyxv1742982541.png"],
  ["palermo", "https://r2.thesportsdb.com/images/media/team/badge/zi1tb01579708939.png"],
  ["udinese", "https://r2.thesportsdb.com/images/media/team/badge/vwvstr1448806811.png"],
  ["frosinone", "https://r2.thesportsdb.com/images/media/team/badge/a7xa151603170120.png"],
  ["reggina", "https://r2.thesportsdb.com/images/media/team/badge/5zh7bz1603170133.png"],
  ["livorno", "https://r2.thesportsdb.com/images/media/team/badge/2t0q851754609465.png"],
  ["cosenza", "https://r2.thesportsdb.com/images/media/team/badge/u6z5yu1656094382.png"],
  ["crvena-zvezda", "https://r2.thesportsdb.com/images/media/team/badge/osgmbz1781157114.png"],
  ["nec-nijmegen", "https://r2.thesportsdb.com/images/media/team/badge/t5qjle1701019868.png"],
  ["nac-breda", "https://r2.thesportsdb.com/images/media/team/badge/ute4en1544965805.png"],
  [
    "the-new-saints",
    "https://r2.thesportsdb.com/images/media/team/badge/rxbv2i1689313887.png",
  ],
  ["nk-celje", "https://r2.thesportsdb.com/images/media/team/badge/amvs371681106952.png"],
  ["levadiakos", "https://r2.thesportsdb.com/images/media/team/badge/csu6c61659016057.png"],
  ["north-korea-nt", "https://r2.thesportsdb.com/images/media/team/badge/csrw4y1742100239.png"],
  ["gibraltar-nt", "https://r2.thesportsdb.com/images/media/team/badge/l5eevk1655237355.png"],
];

async function download(id, url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "LegeaDistributorSite/1.0 (logo mirror for partner showcase)",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 200) throw new Error(`${id}: too small (${buf.length})`);
  const outPath = path.join(OUT, `${id}.png`);
  fs.writeFileSync(outPath, buf);
  return { id, bytes: buf.length, outPath };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const results = [];
  for (const [id, url] of DOWNLOADS) {
    try {
      const r = await download(id, url);
      results.push({ ok: true, ...r });
      console.log("OK", id, r.bytes);
    } catch (e) {
      results.push({ ok: false, id, error: String(e) });
      console.error("FAIL", id, e.message || e);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  // Remove old placeholder SVGs that we replaced with PNG
  for (const [id] of DOWNLOADS) {
    const svg = path.join(OUT, `${id}.svg`);
    if (fs.existsSync(svg)) fs.unlinkSync(svg);
  }

  // Rewrite logo paths in teams.ts
  const teamsPath = path.join(ROOT, "data", "teams.ts");
  let src = fs.readFileSync(teamsPath, "utf8");
  src = src.replace(/logo: "\/logos\/([^"]+)\.svg"/g, 'logo: "/logos/$1.png"');
  fs.writeFileSync(teamsPath, src);

  const failed = results.filter((r) => !r.ok);
  console.log("done", results.filter((r) => r.ok).length, "ok,", failed.length, "failed");
  if (failed.length) process.exitCode = 1;
}

main();
