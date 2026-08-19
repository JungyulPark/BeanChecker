/**
 * 마이그레이션 ↔ lib/database.types.ts 드리프트 검사.
 * 실행: node scripts/check-types-drift.mjs (CI에서 lint 직후)
 *
 * 왜 필요한가:
 *   프로젝트 규칙은 "수기 타입 금지 — supabase gen types 산출물 사용"이다.
 *   그런데 이 개발 컨테이너에는 Docker가 없어 supabase CLI의 gen types가 돌지 않는다
 *   (CLI가 pg_meta를 컨테이너로 띄운다). 즉 규칙을 지키고 싶어도 지금은 손으로 고쳐야 한다.
 *
 *   그래서 규칙의 **목적**(타입이 실제 스키마와 어긋나지 않는 것)을 대신 강제한다.
 *   마이그레이션 SQL에서 컬럼 추가/삭제를 읽어, 그 컬럼이 타입 파일의 해당 테이블
 *   블록에 존재하는지 확인한다. 사람이 타입 갱신을 잊으면 CI가 빨간불이 된다.
 *
 * 한계(정직하게):
 *   - 타입의 정확성(string vs number, nullable 여부)까지는 검증하지 않는다. 존재 여부만 본다.
 *   - 진짜 검증은 Docker가 있는 환경에서 gen types 산출물과 diff하는 것이다.
 *     그 환경이 생기면 이 스크립트를 그 diff로 교체한다.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIG_DIR = join(ROOT, "supabase/migrations");

const sql = readdirSync(MIG_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(join(MIG_DIR, f), "utf8"))
  .join("\n");

// 1) create table public.X ( ... ) 의 최상위 컬럼
// 2) alter table public.X add column [if not exists] Y
// 3) alter table public.X drop column [if exists] Y  → 있으면 안 됨
const expected = new Map(); // table -> Set(column)
const dropped = new Map();

const add = (map, table, col) => {
  if (!map.has(table)) map.set(table, new Set());
  map.get(table).add(col);
};

for (const m of sql.matchAll(/create table (?:if not exists )?(?:public\.)?(\w+)\s*\(([\s\S]*?)\n\);/g)) {
  const table = m[1];
  let depth = 0;
  for (const rawLine of m[2].split("\n")) {
    const line = rawLine.replace(/--.*$/, "").trim();
    if (!line) continue;
    // 괄호 깊이 추적 — check(...) 안의 토큰을 컬럼으로 오인하지 않도록
    const atTop = depth === 0;
    depth += (line.match(/\(/g) ?? []).length - (line.match(/\)/g) ?? []).length;
    if (!atTop) continue;
    const col = line.match(/^(\w+)\s+/);
    if (!col) continue;
    // 테이블 제약(constraint/primary/unique/check/foreign/exclude)은 컬럼이 아니다
    if (/^(constraint|primary|unique|check|foreign|exclude)$/i.test(col[1])) continue;
    add(expected, table, col[1]);
  }
}

for (const m of sql.matchAll(/alter table (?:only )?(?:public\.)?(\w+)\s+add column (?:if not exists )?(\w+)/gi)) {
  add(expected, m[1], m[2]);
}
for (const m of sql.matchAll(/alter table (?:only )?(?:public\.)?(\w+)\s+drop column (?:if exists )?(\w+)/gi)) {
  add(dropped, m[1], m[2]);
  expected.get(m[1])?.delete(m[2]);
}

// 타입 파일에서 테이블별 Row 블록 추출
const types = readFileSync(join(ROOT, "lib/database.types.ts"), "utf8");
const rowBlocks = new Map();
for (const m of types.matchAll(/^      (\w+): \{\n        Row: \{\n([\s\S]*?)\n        \}/gm)) {
  rowBlocks.set(m[1], m[2]);
}

const problems = [];
for (const [table, cols] of expected) {
  const block = rowBlocks.get(table);
  if (!block) {
    problems.push(`테이블 '${table}' 이(가) database.types.ts에 없습니다`);
    continue;
  }
  const present = new Set(
    [...block.matchAll(/^\s{10}(\w+)\??:/gm)].map((m) => m[1]),
  );
  for (const c of cols) {
    if (!present.has(c)) problems.push(`${table}.${c} — 마이그레이션에는 있는데 타입에 없습니다`);
  }
  for (const c of present) {
    if (!cols.has(c)) problems.push(`${table}.${c} — 타입에는 있는데 마이그레이션에 없습니다`);
  }
  for (const c of dropped.get(table) ?? []) {
    if (present.has(c)) problems.push(`${table}.${c} — drop된 컬럼이 타입에 남아 있습니다`);
  }
}

if (problems.length) {
  console.error("스키마 ↔ 타입 드리프트:");
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error("\nsupabase gen types를 다시 돌리거나(권장), 없으면 타입 파일을 마이그레이션에 맞추세요.");
  process.exit(1);
}

const total = [...expected.values()].reduce((n, s) => n + s.size, 0);
console.log(`스키마 ↔ 타입 일치: ${expected.size}개 테이블 / ${total}개 컬럼`);
