#!/usr/bin/env bash
# ============================================================
#  codex_loop.sh — Frontend Agent (Codex)
#  역할: .fable/queue/frontend.md 감시 → 작업 수행 → 완료 보고
#  Codex CLI 0.137+ : 'codex exec' (non-interactive) 사용
# ============================================================

set -uo pipefail   # -e 제외 (루프형 스크립트)

QUEUE_FILE=".fable/queue/frontend.md"
DONE_DIR=".fable/done"
LOG_FILE="logs/codex.log"
LOOP_INTERVAL=10
AGENT_LABEL="[Codex/Frontend]"
# fable5 종료 신호 파일 (있으면 worker 도 graceful 종료)
DONE_FLAG=".fable/.pipeline_complete"
# fable5 크래시 대비 백스톱: 연속 무작업 폴링 이 횟수 넘으면 종료
#   기본 90 * 10초 = 15분간 큐 없으면 fable5 종료/사망으로 간주
IDLE_LIMIT=90

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $AGENT_LABEL $1"
  echo "$msg" | tee -a "$LOG_FILE"
}

main() {
  log "🎨 Frontend Agent 시작"

  # codex CLI 존재 확인
  if ! command -v codex &>/dev/null; then
    log "❌ codex CLI 없음 → 종료"
    exit 1
  fi

  local idle_count=0

  while true; do
    # 완료 신호 감지 → graceful 종료
    if [ -f "$DONE_FLAG" ]; then
      log "🏁 완료 신호 감지($DONE_FLAG) → Frontend Agent 종료"
      break
    fi

    if [ -f "$QUEUE_FILE" ]; then
      idle_count=0
      local issue_id github_issue task_content timestamp done_file
      issue_id=$(grep "^id:" "$QUEUE_FILE" | awk '{print $2}' || echo "unknown")
      github_issue=$(grep "^github_issue:" "$QUEUE_FILE" | awk '{print $2}' || echo "")
      task_content=$(cat "$QUEUE_FILE")
      timestamp=$(date +%s)
      done_file="$DONE_DIR/frontend-issue-${issue_id}-${timestamp}.md"

      log "📌 Issue #${issue_id} 작업 시작"

      # ── Codex 0.137: codex exec (non-interactive) ──────────
      #   --full-auto       : workspace-write 샌드박스 + 자동 승인
      #   --skip-git-repo-check 없이도 repo 안이면 정상 동작
      #   현재 디렉토리(프로젝트 루트)에서 작업
      codex exec --full-auto \
        "다음 Frontend Issue를 구현해줘. 프로젝트 루트에서 작업.

${task_content}

완료 후:
1. 구현/수정한 파일 목록 출력
2. 주요 변경사항 요약
3. 테스트 방법 안내" >> "$LOG_FILE" 2>&1

      local exit_code=$?
      if [ $exit_code -eq 0 ]; then
        log "✅ Issue #${issue_id} codex exec 완료 (exit 0)"
      else
        log "⚠️ Issue #${issue_id} codex exec 종료 코드: $exit_code"
      fi

      # 완료 보고서 작성 (큐 삭제 전에 먼저 기록)
      cat > "$done_file" <<EOF
---
id: $issue_id
github_issue: $github_issue
agent: Codex
type: Frontend
completed_at: $(date '+%Y-%m-%d %H:%M:%S')
exit_code: $exit_code
status: done
---

# 완료 보고: Issue #${issue_id}

## 원본 태스크
${task_content}

## 완료 처리
Codex(codex exec)에 의해 작업 완료됨. (exit code: $exit_code)
상세 로그는 logs/codex.log 참조.
EOF

      if [ $? -ne 0 ]; then
        log "❌ 완료 보고서 작성 실패 → 큐 유지 (재시도 예정)"
        sleep "$LOOP_INTERVAL"
        continue
      fi

      rm -f "$QUEUE_FILE"
      log "📄 완료 보고서 작성 → $done_file"

      # ── Git 자동 커밋 (Issue 단위 복구 지점 생성) ──────────
      if git rev-parse --git-dir &>/dev/null; then
        git add -u >> "$LOG_FILE" 2>&1
        if git commit -m "feat(frontend): Issue #${issue_id} 완료 [Codex]" >> "$LOG_FILE" 2>&1; then
          log "💾 Git 커밋 완료: Issue #${issue_id}"
        else
          log "ℹ️ 커밋할 변경사항 없음 (Issue #${issue_id})"
        fi
      else
        log "⚠️ Git repo 아님 → 커밋 스킵"
      fi

    else
      idle_count=$((idle_count + 1))
      if [ "$idle_count" -ge "$IDLE_LIMIT" ]; then
        local mins=$((IDLE_LIMIT * LOOP_INTERVAL / 60))
        log "⛔ ${mins}분간 큐 없음 → fable5 종료/사망 간주, Frontend Agent 종료"
        break
      fi
      log "⬜ 대기 중 (큐 없음) ${idle_count}/${IDLE_LIMIT}..."
    fi

    sleep "$LOOP_INTERVAL"
  done

  log "👋 Frontend Agent 루프 종료"
}

main "$@"
