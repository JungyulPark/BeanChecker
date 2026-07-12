"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listReports,
  updateReportStatus,
  updateCheckinHidden,
  type LocalReport,
} from "@/lib/data/local";

const REASON_LABEL: Record<LocalReport["reason"], string> = {
  spam: "스팸",
  inappropriate_photo: "부적절한 사진",
  defamation: "명예훼손",
  wrong_info: "잘못된 정보",
  other: "기타",
};

const TARGET_LABEL: Record<LocalReport["targetType"], string> = {
  checkin: "체크인",
  bean: "원두",
  cafe: "카페",
};

/**
 * /admin — isAdmin만 (TECHNICAL_SPEC §4). Ugly 허용 (DESIGN_DIRECTION §5).
 *
 * 게이트: middleware.ts의 HTTP Basic Auth로 보호 중(임시, ADMIN_BASIC_AUTH_USER/PASSWORD
 * env 필요 — 미설정 시 전부 401). Supabase 연결 시 profiles.is_admin 세션 체크로 교체할 것.
 * verified/병합은 admin/service role 전용 RLS로 보호되는 실 DB 작업이라, 백엔드 없는
 * 지금은 신고 처리(로컬에서 실제로 의미 있게 동작하는 유일한 부분)만 구현했다.
 */
export default function AdminPage() {
  const [reports, setReports] = useState<LocalReport[] | null>(null);
  const [filter, setFilter] = useState<LocalReport["status"]>("open");

  const reload = () => listReports().then(setReports);
  useEffect(() => {
    reload();
  }, []);

  const filtered = reports?.filter((r) => r.status === filter) ?? [];

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <div className="flex items-center justify-between">
        <Link href="/map" className="text-caption text-crema-400">
          ← 홈
        </Link>
        <span className="rounded-full border border-amber-glow/50 px-2.5 py-0.5 text-caption text-amber-glow">
          admin (임시 Basic Auth)
        </span>
      </div>

      <h1 className="font-display mt-4 text-h2 text-crema-100">신고 처리</h1>

      <nav className="mt-4 flex gap-2">
        {(["open", "resolved", "dismissed"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1.5 text-caption ${
              filter === s
                ? "border-amber-glow bg-amber-glow text-roast-950"
                : "border-roast-700 text-crema-400"
            }`}
          >
            {s === "open" ? "미처리" : s === "resolved" ? "처리완료" : "기각"}
            {s === "open" && reports ? ` (${reports.filter((r) => r.status === "open").length})` : ""}
          </button>
        ))}
      </nav>

      {reports === null ? (
        <p className="mt-6 text-body text-crema-400">불러오는 중…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-6 text-body text-crema-400">
          {filter === "open" ? "미처리 신고가 없어요." : "해당 상태의 신고가 없어요."}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {filtered.map((r) => (
            <li key={r.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-caption text-crema-400">
                    {TARGET_LABEL[r.targetType]} · {REASON_LABEL[r.reason]}
                  </p>
                  <p className="mt-0.5 truncate text-body font-semibold text-crema-100">
                    {r.targetLabel}
                  </p>
                  {r.memo && <p className="mt-1 text-caption text-crema-400">&ldquo;{r.memo}&rdquo;</p>}
                  <p className="font-mono mt-1 text-caption text-crema-400">
                    {new Date(r.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
              </div>

              {r.status === "open" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (r.targetType === "checkin") {
                        await updateCheckinHidden(r.targetId, true);
                      }
                      await updateReportStatus(r.id, "resolved");
                      reload();
                    }}
                    className="pressable rounded-full bg-amber-glow px-4 py-1.5 text-caption font-semibold text-roast-950"
                  >
                    {r.targetType === "checkin" ? "숨기고 처리완료" : "처리완료"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await updateReportStatus(r.id, "dismissed");
                      reload();
                    }}
                    className="rounded-full border border-roast-700 px-4 py-1.5 text-caption text-crema-400"
                  >
                    기각
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <section className="mt-10 glass-card border-dashed p-4">
        <p className="text-body font-semibold text-crema-100">verified · 병합 처리</p>
        <p className="mt-1 text-caption text-crema-400">
          Supabase 연결 후 구현 — cafes/beans의 verified·hidden·merged_into는 admin/service
          role 전용 RLS로 보호되는 실 DB 작업이라(TECHNICAL_SPEC §2), 로컬 mock 배열을 흉내내는
          가짜 토글은 만들지 않았다. 병합 배치 로직 자체는 supabase/migrations/0001_init.sql의
          recompute_aggregates()에 이미 구현되어 있다.
        </p>
      </section>
    </main>
  );
}
