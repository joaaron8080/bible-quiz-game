import { supabase, isSupabaseConfigured } from "./supabase";

export const LEADERBOARD_TABLE = "leaderboard";
export const LEADERBOARD_PAGE_SIZE = 10;
export const NICKNAME_MAX_LENGTH = 20;

const NICKNAME_KEY = "bible-quiz-nickname-v1";
const TOTAL_SCORE_KEY = "bible-quiz-total-score-v1";

export type BoardKind = "total" | "challenge";

const BOARD_SCORE_COLUMN: Record<BoardKind, "score" | "challenge_score"> = {
  total: "score",
  challenge: "challenge_score",
};

export type LeaderboardEntry = {
  nickname: string;
  score: number;
  challenge_score: number;
  updated_at: string;
};

export type LeaderboardPage = {
  entries: LeaderboardEntry[];
  total: number;
};

export type RegisterResult =
  | { ok: true }
  | { ok: false; reason: "duplicate" | "unconfigured" | "error"; message: string };

export { isSupabaseConfigured };

export function getMyNickname(storage?: Storage): string | null {
  if (!storage) return null;
  return storage.getItem(NICKNAME_KEY);
}

export function setMyNickname(nickname: string, storage?: Storage) {
  storage?.setItem(NICKNAME_KEY, nickname);
}

export function clearMyNickname(storage?: Storage) {
  storage?.removeItem(NICKNAME_KEY);
}

export function getTotalScore(storage?: Storage): number {
  if (!storage) return 0;
  const raw = storage.getItem(TOTAL_SCORE_KEY);
  const value = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function addTotalScore(delta: number, storage?: Storage): number {
  const next = getTotalScore(storage) + Math.max(0, delta);
  storage?.setItem(TOTAL_SCORE_KEY, String(next));
  return next;
}

export function normalizeNickname(nickname: string): string {
  return nickname.trim().slice(0, NICKNAME_MAX_LENGTH);
}

export async function registerNickname(nickname: string, score: number): Promise<RegisterResult> {
  if (!supabase) {
    return { ok: false, reason: "unconfigured", message: "리더보드가 아직 설정되지 않았습니다." };
  }

  const { error } = await supabase.from(LEADERBOARD_TABLE).insert({ nickname, score });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, reason: "duplicate", message: "이미 사용 중인 닉네임입니다." };
    }
    return { ok: false, reason: "error", message: error.message };
  }

  return { ok: true };
}

export async function pushScore(nickname: string, score: number): Promise<void> {
  if (!supabase) return;
  await supabase
    .from(LEADERBOARD_TABLE)
    .update({ score, updated_at: new Date().toISOString() })
    .eq("nickname", nickname);
}

export async function pushChallengeScore(nickname: string, score: number): Promise<void> {
  if (!supabase) return;

  const { data, error } = await supabase
    .from(LEADERBOARD_TABLE)
    .select("challenge_score")
    .eq("nickname", nickname)
    .maybeSingle();

  if (error || !data) return;

  const current = (data as { challenge_score: number }).challenge_score ?? 0;
  if (score <= current) return;

  await supabase
    .from(LEADERBOARD_TABLE)
    .update({ challenge_score: score, updated_at: new Date().toISOString() })
    .eq("nickname", nickname);
}

export async function fetchLeaderboardPage(page: number, board: BoardKind = "total"): Promise<LeaderboardPage> {
  if (!supabase) return { entries: [], total: 0 };

  const column = BOARD_SCORE_COLUMN[board];
  const from = page * LEADERBOARD_PAGE_SIZE;
  const to = from + LEADERBOARD_PAGE_SIZE - 1;

  let query = supabase
    .from(LEADERBOARD_TABLE)
    .select("nickname, score, challenge_score, updated_at", { count: "exact" });

  if (board === "challenge") {
    query = query.gt(column, 0);
  }

  const { data, count, error } = await query
    .order(column, { ascending: false })
    .order("updated_at", { ascending: true })
    .range(from, to);

  if (error || !data) return { entries: [], total: 0 };

  return { entries: data as LeaderboardEntry[], total: count ?? 0 };
}

export async function fetchMyRank(nickname: string, board: BoardKind = "total"): Promise<{ rank: number; score: number } | null> {
  if (!supabase) return null;

  const column = BOARD_SCORE_COLUMN[board];
  const { data, error } = await supabase
    .from(LEADERBOARD_TABLE)
    .select("score, challenge_score")
    .eq("nickname", nickname)
    .maybeSingle();

  if (error || !data) return null;

  const myScore = (data as { score: number; challenge_score: number })[column] ?? 0;
  if (board === "challenge" && myScore <= 0) return null;

  const { count } = await supabase
    .from(LEADERBOARD_TABLE)
    .select("nickname", { count: "exact", head: true })
    .gt(column, myScore);

  return { rank: (count ?? 0) + 1, score: myScore };
}

export function subscribeLeaderboard(onChange: () => void): () => void {
  const client = supabase;
  if (!client) return () => {};

  const channel = client
    .channel("leaderboard-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: LEADERBOARD_TABLE }, onChange)
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
