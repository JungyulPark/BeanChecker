/**
 * BUNNA 회귀 검증 스위트 (E2E).
 * 로컬:  npm run build && npm start & && node tests/qa.cjs
 * CI:    .github/workflows/ci.yml 이 자동 실행 — 실패 시 종료코드 1로 빌드를 깨뜨린다.
 *
 * 검사 범위는 "사람이 눈으로 놓치는 것" 위주다:
 * 색 대비(WCAG AA 실측), 320px 오버플로, 핵심 체크인 플로우 완주, 404, SEO 산출물, JS 에러.
 * 시각적 아름다움은 자동화하지 않는다 — 그건 스크린샷 리뷰의 몫.
 */
const { chromium } = require("playwright");
const BASE = process.env.QA_BASE_URL || "http://localhost:3100";
const OUT = process.env.QA_OUT_DIR || require("os").tmpdir();
const R = [];
const log = (n, ok, note = "") => { R.push(ok); console.log(`${ok ? "PASS" : "FAIL"} | ${n}${note ? " — " + note : ""}`); };

// WCAG 상대휘도 대비 계산 (브라우저에서 실제 렌더된 색으로)
const CONTRAST_FN = `(() => {
  const lum = (c) => { const [r,g,b] = c.map(v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }); return 0.2126*r+0.7152*g+0.0722*b; };
  const parse = (s) => (s.match(/[\\d.]+/g)||[]).slice(0,3).map(Number);
  window.__contrast = (el) => {
    let bg = null, n = el;
    while (n && !bg) { const c = getComputedStyle(n).backgroundColor; if (c && !c.includes("rgba(0, 0, 0, 0)")) bg = parse(c); n = n.parentElement; }
    if (!bg) bg = [239,231,218];
    const fg = parse(getComputedStyle(el).color);
    const [L1,L2] = [lum(fg), lum(bg)].sort((a,b)=>b-a);
    return +((L1+0.05)/(L2+0.05)).toFixed(2);
  };
})()`;

(async () => {
  const b = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined, args: ["--no-proxy-server"] });
  const errors = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`${p.url()}: ${e.message}`));

  // 1. 전 페이지 렌더
  const PAGES = ["/", "/map", "/bean/ethiopia/worka-chelbesa", "/cafe/yeonnam/coffee-libre", "/best/seongsu", "/flavor/berry", "/checkin", "/diary"];
  let allOk = true;
  for (const u of PAGES) {
    const r = await p.goto(BASE + u, { waitUntil: "domcontentloaded", timeout: 60000 });
    await p.waitForTimeout(900);
    if (!r.ok()) { allOk = false; console.log(`  ${u} → ${r.status()}`); }
  }
  log("1. 주요 8개 페이지 200 응답", allOk);

  // 2. 대비 실측 (본문/보조/액센트)
  await p.goto(BASE + "/map", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1200);
  await p.evaluate(CONTRAST_FN);
  const c = await p.evaluate(() => {
    const pick = (sel) => { const el = document.querySelector(sel); return el ? window.__contrast(el) : null; };
    return {
      primary: pick(".text-crema-100"),
      secondary: pick(".text-crema-400"),
      accent: pick(".text-amber-glow"),
    };
  });
  log(`2. 본문 텍스트 대비 ${c.primary}:1`, c.primary >= 4.5);
  log(`3. 보조 텍스트 대비 ${c.secondary}:1`, c.secondary >= 4.5);
  log(`4. 액센트(별점) 대비 ${c.accent}:1`, c.accent >= 4.5);

  // 5. CTA 버튼(앰버 배경 위 텍스트) 대비
  await p.goto(BASE + "/bean/ethiopia/worka-chelbesa", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1000);
  await p.evaluate(CONTRAST_FN);
  const cta = await p.evaluate(() => {
    const el = [...document.querySelectorAll("a,button")].find((e) => e.className.includes("bg-amber-glow"));
    return el ? window.__contrast(el) : null;
  });
  log(`5. CTA 버튼 대비 ${cta}:1`, cta !== null && cta >= 4.5);

  // 6. 하단 내비가 비쳐 보이지 않는가 (배경 알파 ≥ .9)
  await p.goto(BASE + "/map", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(900);
  const navAlpha = await p.evaluate(() => {
    const nav = document.querySelector("nav");
    const m = getComputedStyle(nav).backgroundColor.match(/[\d.]+/g);
    return m.length === 4 ? Number(m[3]) : 1;
  });
  log(`6. 하단 내비 불투명도 ${navAlpha}`, navAlpha >= 0.9);

  // 7. 더블베젤 적용 확인 (카드에 spread 그림자 존재)
  const bezel = await p.evaluate(() => {
    const card = document.querySelector(".glass-card");
    return getComputedStyle(card).boxShadow;
  });
  log("7. 카드 더블베젤(트레이) 적용", bezel.includes("rgba") && bezel.split("rgba").length >= 3);

  // 8. 종이 노이즈 오버레이
  const noise = await p.evaluate(() => getComputedStyle(document.body, "::after").backgroundImage);
  log("8. 종이 질감 오버레이 존재", noise.includes("svg"));

  // 9. 320px 가로 스크롤
  const narrow = await b.newContext({ viewport: { width: 320, height: 700 } });
  const np = await narrow.newPage();
  let hs = [];
  for (const u of ["/map", "/checkin", "/diary", "/best/seongsu", "/bean/ethiopia/worka-chelbesa"]) {
    await np.goto(BASE + u, { waitUntil: "domcontentloaded" });
    await np.waitForTimeout(700);
    if (await np.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) hs.push(u);
  }
  await np.screenshot({ path: `${OUT}/qa-320.png` });
  log("9. 320px 가로 스크롤 없음", hs.length === 0, hs.join(","));
  await narrow.close();

  // 10. 핵심 플로우 (홈브루 체크인 완주)
  await p.goto(BASE + "/checkin", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1200);
  const home = p.getByRole("button", { name: /카페가 아니에요/ });
  if (await home.count()) await home.click();
  await p.waitForTimeout(400);
  const skip = p.getByRole("button", { name: "사진 없이 계속" });
  if (await skip.count()) await skip.click();
  await p.waitForTimeout(600);
  await p.getByPlaceholder("원두 이름 검색").fill("첼베사");
  await p.waitForTimeout(400);
  await p.getByRole("button", { name: /첼베사/ }).first().click();
  const sl = p.locator("input.flavor-slider");
  for (let i = 0; i < 5; i++) await sl.nth(i).fill(String([6,7,8,3,6][i]));
  await p.locator('button[aria-label="4점"]').click();
  await p.getByRole("button", { name: "베리", exact: true }).click();
  await p.waitForTimeout(300);
  const submit = p.getByRole("button", { name: "기록 완료" });
  const canSubmit = await submit.isEnabled();
  log("10. 체크인 제출 가능", canSubmit);
  if (canSubmit) {
    await submit.click();
    await p.waitForTimeout(1200);
    log("11. 완료 화면 도달", (await p.getByText("첼베사").count()) > 0);
  }

  // 12. 404
  const r404 = await p.goto(BASE + "/cafe/seongsu/nope-nope", { waitUntil: "domcontentloaded" });
  log("12. 없는 카페 404", r404.status() === 404);

  // 13. 아이콘/매니페스트
  const icon = await p.request.get(BASE + "/icon.svg");
  const mani = await p.request.get(BASE + "/manifest.webmanifest");
  const mj = await mani.json();
  log("13. 아이콘·매니페스트 정합", icon.ok() && mj.theme_color === "#efe7da", `theme=${mj.theme_color}`);

  // 14. sitemap/robots
  const sm = await p.request.get(BASE + "/sitemap.xml");
  const rb = await p.request.get(BASE + "/robots.txt");
  log("14. SEO 산출물", sm.ok() && rb.ok());

  log("15. 전 구간 JS 에러 0건", errors.length === 0, errors.slice(0, 2).join(" / "));

  const passed = R.filter(Boolean).length;
  console.log(`\n===== ${passed}/${R.length} PASS =====`);
  await b.close();
  if (passed !== R.length) process.exit(1);
})();
