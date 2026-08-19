/**
 * lib/mock/seed.generated.ts → supabase/seed.sql 생성.
 * 실행: node scripts/generate-seed-sql.mjs
 *
 * - DB에는 시연용 집계를 넣지 않는다 (avg_rating null / checkin_count 0) —
 *   실집계는 체크인이 쌓이면 pg_cron recompute_aggregates()가 계산한다.
 * - location은 지역 중심 근사 좌표(WKT) — 실좌표 확정 시 UPDATE로 교정.
 * - unique (district,slug) / (origin,slug) 기준 idempotent (on conflict do nothing).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// seed.generated.ts에서 JSON 블록 추출 (import 대신 파싱 — .ts를 node로 직접 못 읽으므로)
const src = readFileSync(join(ROOT, "lib/mock/seed.generated.ts"), "utf8");
const grab = (name) => {
  const m = src.match(new RegExp(`export const ${name}[^=]*= (\\[[\\s\\S]*?\\n\\]);`));
  if (!m) throw new Error(`cannot find ${name}`);
  return JSON.parse(m[1]);
};
const cafes = grab("SEED_CAFES");
const beans = grab("SEED_BEANS");

const q = (s) => (s === null || s === undefined || s === "" ? "null" : `'${String(s).replace(/'/g, "''")}'`);
const arr = (a) =>
  a && a.length ? `array[${a.map((v) => q(v)).join(",")}]` : "null";

let sql = `-- 자동 생성: node scripts/generate-seed-sql.mjs (원본: launch/*.csv)\n-- 실행 컨텍스트: 직접 연결(postgres) — RLS 미적용. idempotent.\n\n`;

sql += `insert into public.cafes (name, is_roastery, location, address, district, slug, verified, website_url)\nvalues\n`;
sql += cafes
  .map(
    (c) =>
      `  (${q(c.name)}, ${c.isRoastery}, 'POINT(${c.lng} ${c.lat})'::extensions.geography, ${q(c.address)}, ${q(c.district)}, ${q(c.slug)}, false, ${q(c.websiteUrl)})`,
  )
  .join(",\n");
sql += `\non conflict (district, slug) do nothing;\n\n`;

// 원두: roaster는 (district,slug) 대신 이름으로 조회 — CSV상 카페명이 유일함을 생성기가 검증
sql += beans
  .map((b) => {
    const roasterName = b.roasterName;
    return `insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified, purchase_url)
select ${q(b.name)}, ${q(b.normalizedName)}, c.id, ${q(b.origin)}, ${q(b.region)}, ${q(b.process)}, ${b.roastLevel ?? "null"}, ${arr(b.officialNotes)}, ${q(b.slug)}, false, ${q(b.purchaseUrl)}
from public.cafes c where c.name = ${q(roasterName)}
on conflict (origin, slug) do nothing;`;
  })
  .join("\n");
sql += "\n";

writeFileSync(join(ROOT, "supabase/seed.sql"), sql);
console.log(`seed.sql: ${cafes.length} cafes, ${beans.length} beans`);
