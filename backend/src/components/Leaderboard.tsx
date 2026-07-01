"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LEADERBOARD_PAGE_SIZE,
  NICKNAME_MAX_LENGTH,
  clearMyNickname,
  fetchLeaderboardPage,
  fetchMyRank,
  getMyNickname,
  getTotalScore,
  isSupabaseConfigured,
  normalizeNickname,
  registerNickname,
  setMyNickname,
  subscribeLeaderboard,
  type LeaderboardEntry,
} from "@/lib/leaderboard";

type RegisterStep = "ask" | "input" | "done";

export function Leaderboard({ storage, onClose }: { storage: Storage | null; onClose: () => void }) {
  const [nickname, setNickname] = useState<string | null>(null);
  const [registerStep, setRegisterStep] = useState<RegisterStep>("ask");
  const [nicknameInput, setNicknameInput] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<{ rank: number; score: number } | null>(null);

  const totalScore = getTotalScore(storage ?? undefined);
  const totalPages = Math.max(1, Math.ceil(total / LEADERBOARD_PAGE_SIZE));

  const loadPage = useCallback(async (targetPage: number) => {
    setLoading(true);
    const result = await fetchLeaderboardPage(targetPage);
    setEntries(result.entries);
    setTotal(result.total);
    setLoading(false);
  }, []);

  const refreshMyRank = useCallback(async (name: string | null) => {
    if (!name) {
      setMyRank(null);
      return;
    }
    setMyRank(await fetchMyRank(name));
  }, []);

  useEffect(() => {
    const saved = getMyNickname(storage ?? undefined);
    setNickname(saved);
    setRegisterStep(saved ? "done" : "ask");
  }, [storage]);

  useEffect(() => {
    loadPage(page);
  }, [page, loadPage]);

  useEffect(() => {
    refreshMyRank(nickname);
  }, [nickname, refreshMyRank]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const unsubscribe = subscribeLeaderboard(() => {
      loadPage(page);
      refreshMyRank(nickname);
    });
    return unsubscribe;
  }, [page, nickname, loadPage, refreshMyRank]);

  async function submitRegistration() {
    const clean = normalizeNickname(nicknameInput);
    if (clean.length === 0) {
      setRegisterError("닉네임을 입력하세요.");
      return;
    }

    setSubmitting(true);
    setRegisterError(null);
    const result = await registerNickname(clean, totalScore);
    setSubmitting(false);

    if (!result.ok) {
      setRegisterError(result.message);
      return;
    }

    setMyNickname(clean, storage ?? undefined);
    setNickname(clean);
    setRegisterStep("done");
    loadPage(page);
  }

  function unregister() {
    clearMyNickname(storage ?? undefined);
    setNickname(null);
    setRegisterStep("ask");
    setMyRank(null);
  }

  return (
    <section className="flex-1 space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-bold uppercase text-gold">Leader Board</p>
          <h1 className="font-serif text-4xl font-extrabold">실시간 순위</h1>
        </div>
        <button className="secondary-button" onClick={onClose}>
          모드 선택으로
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-5 text-sm leading-6 text-red-800">
          리더보드 저장소가 아직 설정되지 않았습니다. 환경변수 <code>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 설정이 필요합니다.
        </div>
      )}

      {isSupabaseConfigured && registerStep === "ask" && (
        <div className="rounded-lg border border-gold/30 bg-white/70 p-6 text-center shadow-sm">
          <p className="font-serif text-2xl font-bold">점수를 등록하시겠습니까?</p>
          <p className="mt-2 text-sm text-brown-dark/70">
            등록하면 퀴즈를 풀 때마다 내 점수가 순위에 반영됩니다. 등록하지 않으면 순위만 볼 수 있습니다.
          </p>
          <p className="mt-1 text-sm font-bold text-brown-dark/60">현재 내 누적 점수: {totalScore}점</p>
          <div className="mt-5 flex justify-center gap-3">
            <button className="primary-button" onClick={() => setRegisterStep("input")}>
              YES
            </button>
            <button className="secondary-button" onClick={() => setRegisterStep("done")}>
              NO
            </button>
          </div>
        </div>
      )}

      {isSupabaseConfigured && registerStep === "input" && (
        <div className="rounded-lg border border-gold/30 bg-white/70 p-6 shadow-sm">
          <label className="block text-sm font-bold text-brown-dark/70" htmlFor="nickname-input">
            닉네임 (최대 {NICKNAME_MAX_LENGTH}자)
          </label>
          <div className="mt-2 flex flex-wrap gap-3">
            <input
              id="nickname-input"
              className="min-h-12 flex-1 rounded-lg border border-gold/30 bg-white px-4 text-lg font-bold outline-none transition focus:border-gold"
              maxLength={NICKNAME_MAX_LENGTH}
              onChange={(event) => setNicknameInput(event.target.value)}
              placeholder="닉네임 입력"
              value={nicknameInput}
            />
            <button className="primary-button" disabled={submitting} onClick={submitRegistration}>
              {submitting ? "등록 중..." : "등록"}
            </button>
            <button className="secondary-button" onClick={() => setRegisterStep("ask")}>
              취소
            </button>
          </div>
          {registerError && <p className="mt-2 text-sm font-bold text-red-600">{registerError}</p>}
        </div>
      )}

      {isSupabaseConfigured && registerStep === "done" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/25 bg-white/55 px-5 py-4">
          {nickname ? (
            <>
              <p className="text-sm font-bold">
                <span className="text-gold">{nickname}</span> 님 · 내 순위{" "}
                {myRank ? `${myRank.rank}위 (${myRank.score}점)` : "집계 중"}
              </p>
              <button className="text-sm font-bold text-brown-dark/60 underline" onClick={unregister}>
                등록 해제
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-brown-dark/70">읽기 전용 모드입니다.</p>
              <button className="text-sm font-bold text-gold underline" onClick={() => setRegisterStep("ask")}>
                점수 등록하기
              </button>
            </>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gold/25 bg-white/60 shadow-sm">
        <div className="grid grid-cols-[64px_1fr_96px] gap-2 border-b border-gold/25 bg-cream-dark/60 px-4 py-3 text-xs font-black uppercase text-brown-dark/60">
          <span>순위</span>
          <span>닉네임</span>
          <span className="text-right">점수</span>
        </div>
        {loading ? (
          <p className="px-4 py-8 text-center text-sm font-bold text-brown-dark/55">불러오는 중...</p>
        ) : entries.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm font-bold text-brown-dark/55">아직 등록된 점수가 없습니다.</p>
        ) : (
          entries.map((entry, index) => {
            const rank = page * LEADERBOARD_PAGE_SIZE + index + 1;
            const isMe = entry.nickname === nickname;
            return (
              <div
                className={`grid grid-cols-[64px_1fr_96px] items-center gap-2 border-b border-gold/10 px-4 py-3 text-sm last:border-b-0 ${
                  isMe ? "bg-gold/15 font-black" : "font-bold"
                }`}
                key={entry.nickname}
              >
                <span className={rank <= 3 ? "text-lg font-black text-gold" : "text-brown-dark/70"}>{rank}</span>
                <span className="truncate">
                  {entry.nickname}
                  {isMe && <span className="ml-2 text-xs text-gold">(나)</span>}
                </span>
                <span className="text-right">{entry.score}점</span>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            className="secondary-button"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            이전
          </button>
          <span className="text-sm font-bold text-brown-dark/70">
            {page + 1} / {totalPages}
          </span>
          <button
            className="secondary-button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
          >
            다음
          </button>
        </div>
      )}
    </section>
  );
}
