#!/usr/bin/env bash
# ============================================================
#  fable5_loop.sh — Orchestrator (Claude Opus 4.8)
#  역할: PRD → Issue 분해 → Frontend/Backend 할당 → 리뷰 → 루프
# ============================================================

set -uo pipefail
# 주의: set -e 는 의도적으로 제외함.
# ls/grep 등이 "매치 없음"으로 비-제로 종료 코드를 반환하는 것은
# 이 스크립트에서 정상 동작이며, -e 가 있으면 그때마다 전체가 종료됨.

# ── 설정 ────────────────────────────────────────────────────
ORCHESTRATOR="claude --model claude-opus-4-8 -p"
# Python 실행 명령: Windows Git Bash는 보통 'python', Mac/Linux는 'python3'
# 환경에 맞는 것을 자동 감지
if command -v python &>/dev/null && python -c "import sys" &>/dev/null; then
  PYTHON="python"
else
  PYTHON="python3"
fi
PRD_FILE=".fable/PRD.md"
ISSUES_DIR=".fable/issues"
QUEUE_DIR=".fable/queue"
DONE_DIR=".fable/done"
ARCHIVE_DIR=".fable/archive"
LOG_FILE="logs/fable5.log"
STATE_FILE=".fable/state.json"

MAX_ITERATIONS=50
LOOP_INTERVAL=15
# ────────────────────────────────────────────────────────────

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$msg" | tee -a "$LOG_FILE"
}

# ── 디렉토리 초기화 ──────────────────────────────────────────
init_dirs() {
  mkdir -p .fable/{issues,queue,done,archive}
  mkdir -p logs
  log "📁 디렉토리 구조 초기화 완료"
}

init_state() {
  if [ ! -f "$STATE_FILE" ]; then
    cat > "$STATE_FILE" <<EOF
{
  "iteration": 0,
  "max_iterations": $MAX_ITERATIONS,
  "status": "running",
  "total_issues": 0,
  "completed_issues": 0
}
EOF
    log "✅ State 초기화 완료"
  fi
}

# ── 끊김 복구: 큐에 남은 미완료 Issue를 issues로 되돌림 ──────
recover_orphaned_queue() {
  local recovered=0

  for q in "$QUEUE_DIR/frontend.md" "$QUEUE_DIR/backend.md"; do
    [ -f "$q" ] || continue

    # 큐 파일에서 원래 issue id 추출
    local issue_id
    issue_id=$(grep "^id:" "$q" | awk '{print $2}' || echo "")

    if [ -n "$issue_id" ]; then
      local restore_path="$ISSUES_DIR/issue-${issue_id}.md"
      # 이미 archive에 있으면(=완료됨) 복구 불필요, 큐만 제거
      if [ -f "$ARCHIVE_DIR/issue-${issue_id}.md" ]; then
        rm -f "$q"
        log "🧹 이미 완료된 issue-${issue_id} 큐 잔여물 제거"
      else
        mv "$q" "$restore_path"
        log "♻️  끊긴 작업 복구: issue-${issue_id} → issues/ 재배치"
        recovered=$((recovered + 1))
      fi
    else
      rm -f "$q"
      log "🧹 id 없는 큐 파일 제거: $(basename "$q")"
    fi
  done

  if [ "$recovered" -gt 0 ]; then
    log "♻️  총 ${recovered}개 미완료 Issue 복구 완료 (재작업 예정)"
  fi
}

get_iteration() {
  $PYTHON -c "import json; d=json.load(open('$STATE_FILE')); print(d['iteration'])"
}

bump_iteration() {
  $PYTHON -c "
import json
with open('.fable/state.json', 'r') as f:
    d = json.load(f)
d['iteration'] += 1
with open('.fable/state.json', 'w') as f:
    json.dump(d, f, indent=2)
"
}

should_stop() {
  local iter
  iter=$(get_iteration)

  if [ "$iter" -ge "$MAX_ITERATIONS" ]; then
    log "⛔ max_iterations($MAX_ITERATIONS) 도달 → 종료"
    return 0
  fi

  local remaining_issues queue_items pending_done
  remaining_issues=$(ls "$ISSUES_DIR"/*.md 2>/dev/null | wc -l)
  queue_items=$(ls "$QUEUE_DIR"/*.md 2>/dev/null | wc -l)
  pending_done=$(ls "$DONE_DIR"/*.md 2>/dev/null | wc -l)

  if [ "$remaining_issues" -eq 0 ] && \
     [ "$queue_items" -eq 0 ] && \
     [ "$pending_done" -eq 0 ]; then
    log "🎉 모든 Issue 완료 → 루프 종료"
    return 0
  fi

  return 1
}

# ── STEP 0-A: GitHub Issues → .fable/issues/ 동기화 ─────────
sync_github_issues() {
  log "🔄 GitHub Issues 동기화 중..."

  # gh CLI 설치 여부 확인
  if ! command -v gh &>/dev/null; then
    log "⚠️ gh CLI 없음 → GitHub 동기화 스킵"
    return
  fi

  # gh 인증 여부 확인
  if ! gh auth status &>/dev/null; then
    log "⚠️ gh 미인증 → GitHub 동기화 스킵 (gh auth login 필요)"
    return
  fi

  # ── Windows Git Bash 파이프 오류 우회: 임시 파일 사용 ──────
  local tmp_json=".fable/gh_issues_tmp.json"

  gh issue list --state open --json number,title,body,labels \
    > "$tmp_json" 2>> "$LOG_FILE"

  if [ ! -s "$tmp_json" ]; then
    log "⚠️ GitHub Issues 없음 또는 조회 실패"
    rm -f "$tmp_json"
    return
  fi

  # ── Python 스크립트를 별도 파일로 실행 (heredoc 오류 우회) ──
  local py_script=".fable/sync_issues.py"
  cat > "$py_script" << 'PYEOF'
import json, os, sys

tmp_json = sys.argv[1]
issues_dir = sys.argv[2]

with open(tmp_json, "r", encoding="utf-8") as f:
    issues = json.load(f)

for issue in issues:
    num    = str(issue["number"]).zfill(3)
    labels = [l["name"].lower() for l in issue["labels"]]

    if "frontend" in labels:
        issue_type = "Frontend"
    elif "backend" in labels:
        issue_type = "Backend"
    else:
        issue_type = "unassigned"

    filepath = os.path.join(issues_dir, f"issue-{num}.md")
    if not os.path.exists(filepath):
        body = issue.get("body") or ""
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"---\n")
            f.write(f"id: {num}\n")
            f.write(f"type: {issue_type}\n")
            f.write(f"priority: medium\n")
            f.write(f"depends_on: []\n")
            f.write(f"status: pending\n")
            f.write(f"github_issue: {issue['number']}\n")
            f.write(f"---\n\n")
            f.write(f"# {issue['title']}\n\n")
            f.write(f"{body}\n")
        status = "unassigned" if issue_type == "unassigned" else "ok"
        print(f"  {'⚠️ ' if status == 'unassigned' else '✅'} issue-{num}.md 생성 (type: {issue_type})")
    else:
        print(f"  ⏭️  issue-{num}.md 이미 존재, 스킵")
PYEOF

  $PYTHON "$py_script" "$tmp_json" "$ISSUES_DIR" 2>> "$LOG_FILE" \
    || log "⚠️ Python 처리 중 오류"

  rm -f "$tmp_json" "$py_script"

  local unassigned_count
  unassigned_count=$(grep -rl "^type: unassigned" "$ISSUES_DIR" 2>/dev/null | wc -l)
  log "✅ GitHub 동기화 완료 (unassigned: ${unassigned_count}개)"
}

# ── STEP 0-B: unassigned Issue → Opus 4.8 자동 분류 ─────────
classify_unassigned_issues() {
  local unassigned_files
  unassigned_files=$(grep -rl "^type: unassigned" "$ISSUES_DIR" 2>/dev/null || true)
  [ -z "$unassigned_files" ] && return

  log "🤖 unassigned Issue 자동 분류 중 (Opus 4.8)..."

  for issue_file in $unassigned_files; do
    [ -f "$issue_file" ] || continue
    local issue_name
    issue_name=$(basename "$issue_file")

    local result
    result=$($ORCHESTRATOR \
      "다음 Issue가 Frontend 작업인지 Backend 작업인지 판단해줘.
PRD를 참고해서 'Frontend' 또는 'Backend' 단어 하나만 응답해줘. 다른 텍스트 없이.

PRD:
$(cat "$PRD_FILE")

Issue:
$(cat "$issue_file")" 2>> "$LOG_FILE")

    # 응답 정리 (공백·줄바꿈 제거)
    local issue_type
    issue_type=$(echo "$result" | tr -d '[:space:]')

    case "$issue_type" in
      Frontend|Backend)
        # frontmatter의 type 필드만 교체
        sed -i "s/^type: unassigned/type: $issue_type/" "$issue_file"
        log "  🏷️  $issue_name → $issue_type 분류 완료"
        ;;
      *)
        log "  ⚠️  $issue_name → 판단 불가 (응답: '$issue_type') → unassigned 유지"
        ;;
    esac
  done
}

# ── STEP 1: PRD → Issue 분해 (최초 1회) ──────────────────────
decompose_prd() {
  if [ -z "$(ls "$ISSUES_DIR"/*.md 2>/dev/null)" ]; then
    log "📋 PRD → Issue 분해 시작"
    $ORCHESTRATOR \
      --append-system-prompt "당신은 프로젝트 오케스트레이터입니다. 반드시 지시한 형식과 파일 경로로만 응답하세요." \
      "
다음 PRD를 읽고 Issue들을 분해하여 각각 파일로 저장해줘.

PRD 내용:
$(cat "$PRD_FILE")

규칙:
1. 각 Issue는 .fable/issues/issue-NNN.md 형식으로 저장 (001부터 시작)
2. 파일 상단에 YAML frontmatter 포함:
   ---
   id: NNN
   type: Frontend 또는 Backend
   priority: high / medium / low
   depends_on: []  # 선행 issue id 목록 (없으면 빈 배열)
   status: pending
   ---
3. Frontend 작업은 Codex가, Backend 작업은 Gemini가 처리
4. 의존성 있는 Issue는 depends_on에 명시 (예: [001, 002])
5. Issue 본문은 구체적이고 실행 가능하게 작성
6. 저장 완료 후 생성된 issue 파일 목록을 출력
" 2>> "$LOG_FILE" || log "⚠️ PRD 분해 중 오류"

    log "✅ Issue 분해 완료: $(ls "$ISSUES_DIR"/*.md 2>/dev/null | wc -l)개"
  else
    log "ℹ️ Issue 이미 존재, 분해 스킵"
  fi
}

# ── STEP 2: 의존성 체크 후 큐에 할당 ────────────────────────
assign_next_issues() {
  log "🔍 할당 가능한 Issue 탐색 중..."

  for issue_file in "$ISSUES_DIR"/issue-*.md; do
    [ -f "$issue_file" ] || continue

    local issue_type depends_on
    issue_type=$(grep "^type:" "$issue_file" | awk '{print $2}')
    depends_on=$(grep "^depends_on:" "$issue_file" | sed 's/depends_on: //;s/\[//;s/\]//;s/ //g')

    local target_queue=""
    case "$issue_type" in
      Frontend) target_queue="$QUEUE_DIR/frontend.md" ;;
      Backend)  target_queue="$QUEUE_DIR/backend.md"  ;;
      *)        log "⚠️ 알 수 없는 type: $issue_type ($issue_file)"; continue ;;
    esac

    # 큐가 이미 차 있으면 스킵
    [ -f "$target_queue" ] && continue

    # 의존성 체크
    local deps_ok=true
    if [ -n "$depends_on" ]; then
      IFS=',' read -ra DEP_LIST <<< "$depends_on"
      for dep_id in "${DEP_LIST[@]}"; do
        dep_id=$(echo "$dep_id" | tr -d ' ')
        [ -z "$dep_id" ] && continue
        if [ ! -f "$ARCHIVE_DIR/issue-${dep_id}.md" ]; then
          deps_ok=false
          log "  ⏳ $(basename $issue_file): 선행 issue-${dep_id} 미완료"
          break
        fi
      done
    fi

    if $deps_ok; then
      cp "$issue_file" "$target_queue"
      rm "$issue_file"
      log "  ➡️  $(basename $issue_file) → $issue_type 큐 할당"
    fi
  done
}

# ── STEP 3: 완료된 결과 리뷰 ─────────────────────────────────
review_done_issues() {
  local done_count
  done_count=$(ls "$DONE_DIR"/*.md 2>/dev/null | wc -l)
  [ "$done_count" -eq 0 ] && return

  for done_file in "$DONE_DIR"/*.md; do
    [ -f "$done_file" ] || continue
    local issue_name
    issue_name=$(basename "$done_file")

    log "🔎 리뷰 중: $issue_name"

    local review_result
    review_result=$($ORCHESTRATOR \
      "
완료된 Issue 결과를 리뷰하고 JSON으로만 응답해줘 (다른 텍스트 없이).

PRD:
$(cat "$PRD_FILE")

완료된 Issue:
$(cat "$done_file")

다음 JSON 형식으로만 응답:
{
  \"approved\": true 또는 false,
  \"score\": 1~10,
  \"issues\": [\"문제점1\", \"문제점2\"],
  \"next_action\": \"approved\" 또는 \"rework\"
}
" 2>> "$LOG_FILE")

    local approved
    approved=$(echo "$review_result" | $PYTHON -c "
import sys, json
try:
    text = sys.stdin.read().strip()
    parsed = json.loads(text)
    print(str(parsed.get('approved', True)).lower())
except:
    print('true')
" 2>/dev/null || echo "true")

    if [ "$approved" = "true" ]; then
      mv "$done_file" "$ARCHIVE_DIR/$issue_name"
      log "  ✅ $issue_name 승인 → archive"
    else
      log "  🔄 $issue_name 재작업 필요 → issues 복귀"
      mv "$done_file" "$ISSUES_DIR/$issue_name"
    fi
  done
}

# ── 상태 출력 ─────────────────────────────────────────────────
print_status() {
  local iter remaining queue_f queue_b done_count archived
  iter=$(get_iteration)
  remaining=$(ls "$ISSUES_DIR"/*.md 2>/dev/null | wc -l)
  queue_f=$([ -f "$QUEUE_DIR/frontend.md" ] && echo "✅ 작업중" || echo "⬜ 대기")
  queue_b=$([ -f "$QUEUE_DIR/backend.md"  ] && echo "✅ 작업중" || echo "⬜ 대기")
  done_count=$(ls "$DONE_DIR"/*.md 2>/dev/null | wc -l)
  archived=$(ls "$ARCHIVE_DIR"/*.md 2>/dev/null | wc -l)

  echo ""
  echo "┌──────────────────────────────────────────┐"
  echo "│   fable5 Orchestrator — Opus 4.8         │"
  printf "│   Iteration  : %s / %s\n" "$iter" "$MAX_ITERATIONS"
  printf "│   대기 Issues : %s개\n" "$remaining"
  printf "│   Frontend 큐 : %s\n" "$queue_f"
  printf "│   Backend 큐  : %s\n" "$queue_b"
  printf "│   리뷰 대기   : %s개\n" "$done_count"
  printf "│   완료(archive): %s개\n" "$archived"
  echo "└──────────────────────────────────────────┘"
  echo ""
}

# ── 메인 루프 ─────────────────────────────────────────────────
main() {
  log "🚀 fable5 Orchestrator 시작 (Opus 4.8)"

  if [ ! -f "$PRD_FILE" ]; then
    echo "❌ PRD 파일 없음: $PRD_FILE"
    echo "   .fable/PRD.md 를 먼저 작성하세요."
    exit 1
  fi

  init_dirs
  init_state
  recover_orphaned_queue
  sync_github_issues
  classify_unassigned_issues
  decompose_prd

  while true; do
    bump_iteration
    print_status

    if should_stop; then
      log "🏁 Orchestrator 종료"
      break
    fi

    review_done_issues
    assign_next_issues

    log "⏳ ${LOOP_INTERVAL}초 대기..."
    sleep "$LOOP_INTERVAL"
  done

  log "✅ 전체 프로젝트 완료!"
}

main "$@"
