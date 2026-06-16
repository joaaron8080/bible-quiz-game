# fable5 분산 빌드 시스템

## 구성
| 스크립트 | 역할 | 모델 |
|---|---|---|
| fable5_loop.sh | Orchestrator | Claude Opus 4.8 |
| codex_loop.sh | Frontend Agent | Codex |
| gemini_loop.sh | Backend Agent | Gemini |
| monitor.sh | 모니터링 | - |

## 시작 방법

### 1. PRD 작성
```
.fable/PRD.md 편집
```

### 2. VS Code 터미널 4개 열기
```bash
# Terminal 1 — Orchestrator
bash fable5_loop.sh

# Terminal 2 — Frontend
bash codex_loop.sh

# Terminal 3 — Backend
bash gemini_loop.sh

# Terminal 4 — 모니터링
bash monitor.sh
```

## 디렉토리 구조
```
.fable/
├── PRD.md           ← 원본 PRD
├── state.json       ← 루프 상태
├── issues/          ← 대기 중인 Issues
├── queue/
│   ├── frontend.md  ← Codex 현재 작업
│   └── backend.md   ← Gemini 현재 작업
├── done/            ← 완료 후 리뷰 대기
└── archive/         ← 승인된 완료 Issues
logs/
├── fable5.log
├── codex.log
└── gemini.log
```

## Issue 파일 형식
```markdown
---
id: 001
type: Frontend  # 또는 Backend
priority: high
depends_on: []  # 선행 issue id 목록
status: pending
---

# Issue 제목
상세 내용...
```

## 종료
- 자동 종료: 모든 Issue 완료 시
- 강제 종료: 각 터미널에서 Ctrl+C
- 최대 반복: fable5_loop.sh의 MAX_ITERATIONS 조정
# bible-quiz-game
