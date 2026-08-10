/**
 * launch/seed-cafes.csv + seed-beans.csv → lib/mock/seed.generated.ts 생성.
 * 실행: node scripts/generate-seed.mjs
 *
 * 원칙 (launch/SEED_NOTES.md와 동기):
 * - CSV가 진실의 원천. 앱 데이터를 고치려면 CSV를 고치고 재생성한다.
 * - 신규 항목의 avgRating/checkinCount는 null/0 — 5건 룰(TECHNICAL_SPEC §3)을 실데이터에 그대로 적용.
 *   DEMO_AGGREGATES에 있는 소수 카페만 시연용 집계를 얹는다(전부 자리표시자, Supabase 연결 시 소멸).
 * - 좌표는 지역 중심 근사값 — 실좌표는 카카오맵 키가 있을 때 클라이언트 지오코딩으로 해석 (지도 데이터 크롤링 금지 원칙).
 * - 향미 태그는 로스터 공식 컵노트에서 확실한 키워드만 매핑, 애매하면 비움 (추측 금지).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---------- CSV 파서 (따옴표 필드 대응) ----------
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((f) => f !== "")) rows.push(row); }
  const header = rows[0];
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

// ---------- 지역 메타 (좌표는 지역 중심 근사값 — 개발 편의용, 서버 전송 없음) ----------
const DISTRICTS = {
  seongsu: { ko: "성수", lat: 37.544, lng: 127.056 },
  hannam: { ko: "한남", lat: 37.534, lng: 127.001 },
  yeonnam: { ko: "연남", lat: 37.562, lng: 126.925 },
  hapjeong: { ko: "합정", lat: 37.549, lng: 126.913 },
  mangwon: { ko: "망원", lat: 37.556, lng: 126.902 },
  haebangchon: { ko: "해방촌", lat: 37.545, lng: 126.988 },
  dohwa: { ko: "도화", lat: 37.54, lng: 126.949 },
  sinsa: { ko: "신사", lat: 37.516, lng: 127.02 },
  apgujeong: { ko: "압구정", lat: 37.527, lng: 127.028 },
  yangjae: { ko: "양재", lat: 37.484, lng: 127.034 },
  euljiro: { ko: "을지로", lat: 37.566, lng: 126.991 },
  seochon: { ko: "서촌", lat: 37.579, lng: 126.97 },
};

// name_en 없는 행 슬러그 수기 지정
const CAFE_SLUG_OVERRIDES = {
  "성수동 리얼 로스팅 커피&디저트": "real-roasting",
};

// 시연용 집계 자리표시자 (카페명 기준) — Supabase 집계 배치 연결 시 전부 소멸.
// 5건 룰 미달 케이스(null)도 일부러 남긴다: 발견 페이지의 "신규 카페" 섹션 시연용.
const DEMO_AGGREGATES = {
  "센터커피 서울숲점": { avgRating: 4.6, checkinCount: 128 },
  로우키: { avgRating: null, checkinCount: 3 },
  메쉬커피: { avgRating: 4.3, checkinCount: 61 },
  "앤트러사이트 커피 합정": { avgRating: 4.5, checkinCount: 214 },
  딥블루레이크: { avgRating: 4.7, checkinCount: 89 },
  "커피리브레 연남": { avgRating: 4.8, checkinCount: 302 },
  "프릳츠 커피 컴퍼니 도화점": { avgRating: 4.6, checkinCount: 187 },
  "테라로사 양재역점": { avgRating: 4.4, checkinCount: 96 },
  커피한약방: { avgRating: 4.5, checkinCount: 143 },
  아키비스트: { avgRating: 4.4, checkinCount: 38 },
  "카멜커피 도산2호점": { avgRating: 4.2, checkinCount: 77 },
  "테일러커피 신사": { avgRating: 4.3, checkinCount: 52 },
  "빈브라더스 합정": { avgRating: null, checkinCount: 4 },
  "히트커피로스터스 한남": { avgRating: 4.5, checkinCount: 29 },
};

// 수익 동선: source_url 중 로스터리 "공식" 도메인만 구매/공식채널 링크로 승격.
// 기사·리뷰·디렉토리 출처는 데이터 근거로만 남기고 유저에게 노출하지 않는다 (신뢰 원칙).
const NON_OFFICIAL_DOMAINS = [
  "the-edit.co.kr",
  "bwissue.com",
  "esquirekorea.co.kr",
  "diningcode.com",
  "beanprofiler.com",
  "trip.com",
  "bakerynews.co.kr",
  "coffeexplorer.com",
  "polle.com",
];
function officialUrl(url, { allowInstagram }) {
  if (!url || !url.startsWith("http")) return null;
  try {
    const host = new URL(url).hostname;
    if (NON_OFFICIAL_DOMAINS.some((d) => host === d || host.endsWith("." + d))) return null;
    if (!allowInstagram && /(^|\.)instagram\.com$/.test(host)) return null;
    return url;
  } catch {
    return null;
  }
}

function slugify(en) {
  return en
    .toLowerCase()
    .replace(/[&().]/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// ---------- 카페 ----------
const cafesCsv = parseCsv(readFileSync(join(ROOT, "launch/seed-cafes.csv"), "utf8"));
const cafes = cafesCsv.map((r) => {
  const d = DISTRICTS[r.district];
  if (!d) throw new Error(`unknown district: ${r.district} (${r.name})`);
  const slug = CAFE_SLUG_OVERRIDES[r.name] ?? slugify(r.name_en);
  if (!slug) throw new Error(`empty slug: ${r.name}`);
  const demo = DEMO_AGGREGATES[r.name];
  return {
    id: `cafe-${r.district}-${slug}`,
    name: r.name,
    slug,
    district: r.district,
    districtKo: d.ko,
    address: r.address,
    isRoastery: r.is_roastery === "true",
    lat: d.lat,
    lng: d.lng,
    avgRating: demo ? demo.avgRating : null,
    checkinCount: demo ? demo.checkinCount : 0,
    // 카페 공식 채널 — 인스타그램은 카페의 공식 채널로 인정
    websiteUrl: officialUrl(r.source_url, { allowInstagram: true }),
  };
});

// 같은 지역 내 슬러그 충돌 검증 (URL은 district+slug 복합키)
{
  const seen = new Set();
  for (const c of cafes) {
    const key = `${c.district}/${c.slug}`;
    if (seen.has(key)) throw new Error(`slug collision: ${key}`);
    seen.add(key);
  }
}

// ---------- 원두 ----------
// 한글 상품명 → URL 슬러그 수기 매핑 (자동 로마자화는 불안정 — 전 행 명시)
const BEAN_SLUGS = {
  "올드독 (Old Dog)": "old-dog",
  "서울 시네마": "seoul-cinema",
  "나쓰메 소세키": "natsume-soseki",
  "공기와 꿈": "air-and-dream",
  "파블로 네루다": "pablo-neruda",
  "배드 블러드": "bad-blood",
  "노 서프라이즈": "no-surprise",
  "다크 리브레": "dark-libre",
  블랙수트: "black-suit",
  벨벳화이트: "velvet-white",
  "콜롬비아 알토스 델 파라이소": "altos-del-paraiso",
  "바이올렛 블렌드": "violet-blend",
  "콜롬비아 엘 레나세르 옴블리곤": "el-renacer-ombligon",
  "콜롬비아 엘 실렌시오": "el-silencio",
  "콜롬비아 엘 로사리오": "el-rosario",
  "콜롬비아 엘 엔칸토": "el-encanto",
  "올데이 블렌드": "all-day-blend",
  버터리: "buttery",
  고티지: "gotige",
  뉴텐던시: "new-tendency",
  "블랙 인 서울": "black-in-seoul",
  "브라운 인 서울": "brown-in-seoul",
  "과테말라 엘 소코로 게이샤": "el-socorro-gesha",
  "콜롬비아 콘사카": "consaca",
  "에티오피아 아리차": "aricha",
  "Deep 블렌딩": "deep-blending",
  "Blue 블렌딩": "blue-blending",
  "케냐 싱글오리진": "travertine-kenya",
};

const ORIGIN_RULES = [
  [/^블렌드/, { origin: "blend", originKo: "블렌드" }],
  [/^에티오피아/, { origin: "ethiopia", originKo: "에티오피아" }],
  [/^콜롬비아/, { origin: "colombia", originKo: "콜롬비아" }],
  [/^케냐/, { origin: "kenya", originKo: "케냐" }],
  [/^과테말라/, { origin: "guatemala", originKo: "과테말라" }],
];

// 공식 컵노트 키워드 → 18개 고정 향미 태그 (lib/flavorTags.ts). 확실한 것만.
const TAG_KEYWORDS = [
  [/초콜릿|초콜렛|카카오/, "chocolate"],
  [/카라멜|캐러멜/, "caramel"],
  [/흑당|흑설탕|브라운슈가/, "brown-sugar"],
  [/꿀|허니/, "honey"],
  [/바닐라/, "vanilla"],
  [/딸기|스트로베리|베리|커런트|크랜베리/, "berry"],
  [/시트러스|레몬|자몽|오렌지/, "citrus"],
  [/열대|망고|파인애플/, "tropical"],
  [/복숭아|체리/, "stone-fruit"],
  [/사과|\b배\b/, "apple-pear"],
  [/플로럴|꽃|자스민/, "floral"],
  [/홍차/, "black-tea"],
  [/허브/, "herbal"],
  [/너트|견과|아몬드|헤이즐넛|캐슈넛|피칸|고소/, "nutty"],
  [/곡물/, "roasted-grain"],
  [/와인|와이니/, "winey"],
  [/스파이시/, "spicy"],
  [/스모키/, "smoky"],
];

const beansCsv = parseCsv(readFileSync(join(ROOT, "launch/seed-beans.csv"), "utf8"));
const cafeByName = new Map(cafes.map((c) => [c.name, c]));

const beans = beansCsv.map((r) => {
  const slug = BEAN_SLUGS[r.bean_name];
  if (!slug) throw new Error(`missing bean slug: ${r.bean_name}`);
  const rule = ORIGIN_RULES.find(([re]) => re.test(r.origin));
  if (!rule) throw new Error(`unknown origin: ${r.origin} (${r.bean_name})`);
  const { origin, originKo } = rule[1];

  // 블렌드는 괄호 안 구성 정보를 region 자리에 노출
  let region = "";
  if (origin === "blend") {
    const m = r.origin.match(/블렌드\((.+)\)/);
    region = m ? (m[1] === "원산지 비공개" ? "구성 비공개" : m[1]) : "";
  }

  // process 열에 로스팅 정보가 섞여 있음 — 분리 해석
  let process = null;
  let roastLevel = null;
  if (r.process === "washed") process = "washed";
  else if (r.process === "co-fermentation") process = "other";
  else if (r.process === "다크로스트") roastLevel = 5;
  else if (r.process === "라이트로스팅") roastLevel = 2;

  const rawNotes = /확인 안됨/.test(r.official_notes) ? "" : r.official_notes;
  const officialNotes = rawNotes
    .split(/[·,/]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const topFlavorTags = [
    ...new Set(TAG_KEYWORDS.filter(([re]) => re.test(rawNotes)).map(([, tag]) => tag)),
  ].slice(0, 3);

  const roaster = cafeByName.get(r.roaster_name);
  if (!roaster) throw new Error(`roaster not found in cafes csv: ${r.roaster_name}`);

  return {
    id: `bean-${slug}`,
    name: r.bean_name.replace(/\s*\(.+\)$/, ""),
    slug,
    normalizedName: r.bean_name.toLowerCase().replace(/[\s\-_.()]/g, ""),
    roasterId: roaster.id,
    roasterName: roaster.name,
    origin,
    originKo,
    region,
    process,
    roastLevel,
    officialNotes,
    avgRating: null,
    checkinCount: 0,
    avgProfile: null,
    topFlavorTags,
    // 구매 동선 — 로스터 공식몰만 (인스타 제외: 구매 페이지가 아님)
    purchaseUrl: officialUrl(r.source_url, { allowInstagram: false }),
  };
});

{
  const seen = new Set();
  for (const b of beans) {
    const key = `${b.origin}/${b.slug}`;
    if (seen.has(key)) throw new Error(`bean slug collision: ${key}`);
    seen.add(key);
  }
}

// ---------- 출력 ----------
const banner = `/**
 * 자동 생성 파일 — 직접 수정 금지.
 * 원본: launch/seed-cafes.csv, launch/seed-beans.csv
 * 재생성: node scripts/generate-seed.mjs
 * 규칙(집계 자리표시자·좌표 근사·태그 매핑)은 scripts/generate-seed.mjs 상단 주석 참조.
 */
import type { MockCafe, MockBean } from "./seed";

`;

const out =
  banner +
  `export const SEED_CAFES: MockCafe[] = ${JSON.stringify(cafes, null, 2)};\n\n` +
  `export const SEED_BEANS: MockBean[] = ${JSON.stringify(beans, null, 2)};\n`;

writeFileSync(join(ROOT, "lib/mock/seed.generated.ts"), out);
console.log(`generated: ${cafes.length} cafes, ${beans.length} beans`);
const tagged = beans.filter((b) => b.topFlavorTags.length > 0).length;
console.log(`beans with flavor tags: ${tagged}/${beans.length}`);
