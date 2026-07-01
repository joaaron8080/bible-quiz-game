# Leader Board 설정 가이드

성경 퀴즈 게임의 Leader Board는 Supabase(Postgres + Realtime)를 백엔드로 사용합니다.
정적 export(`output: 'export'`)를 유지하며 클라이언트 SDK만으로 동작합니다.

## 1. Supabase 프로젝트 생성

1. https://supabase.com 접속 → 로그인 → **New project** 생성
2. 프로젝트 생성 후 **Project Settings → API** 에서 두 값 확인:
   - `Project URL`
   - `anon` `public` key

## 2. 테이블 + 정책 생성

Supabase 대시보드 → **SQL Editor** → 아래 SQL 실행:

```sql
create table if not exists public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  nickname text not null unique,
  score integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.leaderboard enable row level security;

create policy "leaderboard read for all"
  on public.leaderboard for select using (true);

create policy "leaderboard insert for all"
  on public.leaderboard for insert with check (true);

create policy "leaderboard update for all"
  on public.leaderboard for update using (true) with check (true);

-- 실시간 순위 갱신을 위한 realtime publication 등록
alter publication supabase_realtime add table public.leaderboard;
```

## 3. 환경변수 설정

### 로컬 개발
`backend/.env.local` 파일 생성 (`.env.local.example` 참고):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### Vercel 배포
Vercel 프로젝트 → **Settings → Environment Variables** 에 동일한 두 변수 추가 후 재배포.

## 4. 동작 방식

- **홈 화면**: 7개 퀴즈 모드 카드 옆에 **Leader Board** 카드 추가
- **진입 시**: 미등록자에게 "점수를 등록하시겠습니까? YES / NO"
  - **YES** → 닉네임 입력 → 등록 (닉네임 unique). 이후 퀴즈를 풀 때마다 누적 점수가 순위에 반영
  - **NO** → 읽기 전용(READ ONLY). 순위만 조회
- **누적 점수**: 매 레벨(10문항) 완료 때마다 맞힌 개수를 합산 (전 모드·전 시도 누적, localStorage 저장)
- **실시간 순위**: 모든 사용자가 Supabase realtime 구독으로 순위 변동을 즉시 확인
- **페이지네이션**: 등록자가 많아지면 Top 10씩 페이지 전환

## 보안 참고

`닉네임만` 신원 모델이라 인증이 없습니다. anon key로 누구나 임의 닉네임의 점수를 수정할 수 있습니다.
저스테이크 게임이라 허용된 트레이드오프이며, 도용 방지가 필요하면 닉네임+PIN 또는 Supabase Auth 도입이 필요합니다.
