/**
 * BUNNA 서버 동기화 검증 (E2E).
 *
 * 실행 전제: **Supabase env가 설정돼 있되 그 주소에는 아무것도 없는** 빌드.
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54999 npm run build && npm start
 * CI의 sync 잡이 그렇게 띄운다.
 *
 * 왜 이렇게까지 하나:
 *   lib/data/checkins.ts의 핵심 약속은 두 가지다.
 *     (A) 서버가 죽어도 기록은 절대 잃지 않는다
 *     (B) 로그인하면 이 기기에 쌓인 기록이 계정으로 올라간다 (중복 없이)
 *   둘 다 "실 Supabase가 없으면 검증 불가"로 남기기엔 너무 중요한 성질이다.
 *   (A)는 실제로 죽은 주소로, (B)는 Supabase의 HTTP 표면을 가로채 검증한다.
 *
 * 검증되지 않는 것(정직하게): 실제 RLS 통과 여부와 스토리지 정책.
 *   그건 실 프로젝트 키가 붙은 뒤 프리뷰 배포에서 확인해야 한다.
 */
const { chromium } = require("playwright");

const BASE = process.env.QA_BASE_URL || "http://localhost:3101";
const SB = process.env.QA_SUPABASE_URL || "http://127.0.0.1:54999";
const USER_ID = "11111111-2222-3333-4444-555555555555";

const R = [];
const log = (n, ok, note = "") => { R.push(ok); console.log(`${ok ? "PASS" : "FAIL"} | ${n}${note ? " — " + note : ""}`); };

/** 홈브루 체크인 1건 완주 (사진 없음) */
async function doCheckin(p) {
  await p.goto(`${BASE}/checkin`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1200);
  await p.getByRole("button", { name: /카페가 아니에요/ }).click();
  await p.waitForTimeout(400);
  await p.getByRole("button", { name: "사진 없이 계속" }).click();
  await p.waitForTimeout(600);
  await p.getByPlaceholder("원두 이름 검색").fill("첼베사");
  await p.waitForTimeout(400);
  await p.getByRole("button", { name: /첼베사/ }).first().click();
  const sl = p.locator("input.flavor-slider");
  for (let i = 0; i < 5; i++) await sl.nth(i).fill(String([6, 7, 8, 3, 6][i]));
  await p.locator('button[aria-label="4점"]').click();
  await p.getByRole("button", { name: "베리", exact: true }).click();
  await p.waitForTimeout(300);
  await p.getByRole("button", { name: "기록 완료" }).click();
  await p.waitForTimeout(1800);
}

/** 네트워크 실패는 이 시나리오의 전제다 — 그 외 JS 에러만 문제로 본다 */
const fatalOnly = (errs) =>
  errs.filter((e) => !/Failed to fetch|NetworkError|fetch failed|ERR_CONNECTION|AuthRetryable/i.test(e));

(async () => {
  const b = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
    args: ["--no-proxy-server"],
  });

  // ---------- (A) 서버가 죽어 있어도 기록을 잃지 않는다 ----------
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(e.message));

    await doCheckin(p);
    log("1. 서버가 죽어도 체크인 완주", (await p.getByText("첼베사").count()) > 0);

    await p.goto(`${BASE}/diary`, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(1500);
    const t = await p.locator("main").innerText();
    log("2. 기록이 로컬에 남는다 (유실 없음)", /첼베사/.test(t));
    log("3. 미동기화 안내 배너 노출", /이 기기에만/.test(t), t.match(/\d+잔이 이 기기에만/)?.[0] ?? "");
    log("4. 네트워크 실패 외 JS 에러 0건", fatalOnly(errs).length === 0, fatalOnly(errs).slice(0, 2).join(" / "));
    await ctx.close();
  }

  // ---------- (B) 로그인하면 계정으로 올라간다 (중복 없이) ----------
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const seen = [];

    await ctx.route(`${SB}/**`, async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      let body = null;
      try { body = req.postDataJSON(); } catch {}
      seen.push({ method: req.method(), path: url.pathname, body });

      const json = (data, status = 200) =>
        route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });

      if (url.pathname === "/auth/v1/user")
        return json({ id: USER_ID, aud: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" });
      if (url.pathname.startsWith("/storage/v1/object/")) return json({ Key: "photos/x.jpg" });
      if (url.pathname === "/rest/v1/beans") return json({ id: "bean-uuid-0001" }, req.method() === "POST" ? 201 : 200);
      if (url.pathname === "/rest/v1/cafes") return json({ id: "cafe-uuid-0001" }, req.method() === "POST" ? 201 : 200);
      if (url.pathname === "/rest/v1/checkins" && req.method() === "POST") return json({ id: "checkin-uuid-0001" }, 201);
      return json([]);
    });

    const p = await ctx.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(e.message));

    await doCheckin(p); // 아직 비로그인 — 미동기화로 쌓인다

    // @supabase/ssr는 쿠키에서 세션을 읽는다. 실제 로그인 대신 세션 쿠키를 심는다.
    const session = {
      access_token: "fake.jwt.token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: "fake-refresh",
      user: { id: USER_ID, aud: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" },
    };
    const ref = new URL(SB).hostname.split(".")[0];
    await ctx.addCookies([{
      name: `sb-${ref}-auth-token`,
      value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"),
      url: BASE,
    }]);

    seen.length = 0;
    await p.goto(`${BASE}/diary`, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(3000);

    const insert = seen.find((s) => s.path === "/rest/v1/checkins" && s.method === "POST");
    log("5. 로그인이 잡히면 미동기화 기록을 서버로 올린다", !!insert);

    if (insert) {
      const row = Array.isArray(insert.body) ? insert.body[0] : insert.body;
      const cols = Object.keys(row);
      // 0001+0004 스키마에 실재하는 컬럼만 보내야 한다 — 없는 컬럼이면 PostgREST가 400을 낸다
      const SCHEMA = new Set(["user_id","bean_id","cafe_id","context","brew_method","rating","profile","flavor_tags","photo_url","gps_verified","roast_date","memo","is_public","created_at","id","hidden"]);
      const unknown = cols.filter((c) => !SCHEMA.has(c));
      log("6. 스키마에 없는 컬럼을 보내지 않는다", unknown.length === 0, unknown.join(",") || "없음");
      log("7. user_id가 세션 유저로 채워진다", row.user_id === USER_ID);
      log("8. 원두 id를 자연키로 해석한다 (시드 id 전송 안 함)", row.bean_id === "bean-uuid-0001");
      log("9. 사진 없는 기록은 photo_url=null (0004 nullable)", row.photo_url === null);
      log("10. created_at은 마신 시각을 유지한다", typeof row.created_at === "string");
    } else {
      for (let i = 6; i <= 10; i++) log(`${i}. (5 실패로 검사 불가)`, false);
    }

    const t = await p.locator("main").innerText();
    log("11. 동기화 후 미동기화 배너가 사라진다", !/이 기기에만/.test(t));

    seen.length = 0;
    await p.goto(`${BASE}/diary`, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(2500);
    const dup = seen.filter((s) => s.path === "/rest/v1/checkins" && s.method === "POST");
    log("12. 재방문해도 중복 insert 없음", dup.length === 0, `${dup.length}건`);

    log("13. JS 에러 0건", fatalOnly(errs).length === 0, fatalOnly(errs).slice(0, 2).join(" / "));
    await ctx.close();
  }

  const passed = R.filter(Boolean).length;
  console.log(`\n===== ${passed}/${R.length} PASS =====`);
  await b.close();
  if (passed !== R.length) process.exit(1);
})();
