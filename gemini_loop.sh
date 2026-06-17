#!/usr/bin/env bash
# ============================================================
#  gemini_loop.sh — Backend Agent (Gemini)
#  역할: .fable/queue/backend.md 감시 → 작업 수행 → 완료 보고
# ============================================================

set -uo pipefail   # -e 제외 (루프형 스크립트)

QUEUE_FILE=".fable/queue/backend.md"
DONE_DIR=".fable/done"
LOG_FILE="logs/gemini.log"
LOOP_INTERVAL=10
AGENT_LABEL="[Gemini/Backend]"

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $AGENT_LABEL $1"
  echo "$msg" | tee -a "$LOG_FILE"
}

main() {
  log "⚙️ Backend Agent 시작"

  if ! command -v gemini &>/dev/null; then
    log "❌ gemini CLI 없음 → 종료"
    exit 1
  fi

  while true; do
    if [ -f "$QUEUE_FILE" ]; then
      local issue_id task_content timestamp done_file
      issue_id=$(grep "^id:" "$QUEUE_FILE" | awk '{print $2}' || echo "unknown")
      task_content=$(cat "$QUEUE_FILE")
      timestamp=$(date +%s)
      done_file="$DONE_DIR/backend-issue-${issue_id}-${timestamp}.md"

      log "📌 Issue #${issue_id} 작업 시작"

      # ── Gemini: --yolo (자동 승인) non-interactive ──────────
      gemini --yolo \
        "다음 Backend Issue를 구현해줘. 프로젝트 루트에서 작업.

${task_content}

완료 후:
1. 구현/수정한 파일 목록 출력
2. API 엔드포인트 변경사항 (있을 경우)
3. DB/데이터 스키마 변경사항 (있을 경우)
4. 테스트 방법 안내" >> "$LOG_FILE" 2>&1

      local exit_code=$?
      if [ $exit_code -eq 0 ]; then
        log "✅ Issue #${issue_id} gemini 완료 (exit 0)"
      else
        log "⚠️ Issue #${issue_id} gemini 종료 코드: $exit_code"
      fi

      cat > "$done_file" <<EOF
---
id: $issue_id
agent: Gemini
type: Backend
completed_at: $(date '+%Y-%m-%d %H:%M:%S')
exit_code: $exit_code
status: done
---

# 완료 보고: Issue #${issue_id}

## 원본 태스크
${task_content}

## 완료 처리
Gemini에 의해 작업 완료됨. (exit code: $exit_code)
상세 로그는 logs/gemini.log 참조.
EOF

      rm -f "$QUEUE_FILE"
      log "📄 완료 보고서 작성 → $done_file"

      # ── Git 자동 커밋 (Issue 단위 복구 지점 생성) ──────────
      if git rev-parse --git-dir &>/dev/null; then
        git add -A >> "$LOG_FILE" 2>&1
        if git commit -m "feat(backend): Issue #${issue_id} 완료 [Gemini]" >> "$LOG_FILE" 2>&1; then
          log "💾 Git 커밋 완료: Issue #${issue_id}"
        else
          log "ℹ️ 커밋할 변경사항 없음 (Issue #${issue_id})"
        fi
      else
        log "⚠️ Git repo 아님 → 커밋 스킵"
      fi

    else
      log "⬜ 대기 중 (큐 없음)..."
    fi

    sleep "$LOOP_INTERVAL"
  done
}

main "$@"
