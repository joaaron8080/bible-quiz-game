#!/usr/bin/env bash
# ============================================================
#  monitor.sh — 실시간 진행상황 모니터링
# ============================================================

clear_screen() { printf "\033[2J\033[H"; }

count_md() {
  local dir="$1"
  local count=0
  if [ -d "$dir" ]; then
    shopt -s nullglob
    local files=("$dir"/*.md)
    shopt -u nullglob
    count=${#files[@]}
  fi
  echo "$count"
}

while true; do
  clear_screen

  now=$(date '+%Y-%m-%d %H:%M:%S')
  echo "╔══════════════════════════════════════════════════╗"
  echo "║    fable5 분산 빌드 모니터 (Ctrl+C 종료)         ║"
  printf "║  %-48s║\n" "  $now"
  echo "╠══════════════════════════════════════════════════╣"

  # Issues 현황 (nullglob 기반 카운트)
  total_issues=$(count_md ".fable/issues")
  archived=$(count_md ".fable/archive")
  done_pending=$(count_md ".fable/done")
  queue_f=$([ -f .fable/queue/frontend.md ] && echo "작업중 ✅" || echo "대기   ⬜")
  queue_b=$([ -f .fable/queue/backend.md  ] && echo "작업중 ✅" || echo "대기   ⬜")

  echo "║  📋 대기 Issues             : $total_issues 개"
  echo "║  ✅ 완료(archive)           : $archived 개"
  echo "║  🔎 리뷰 대기               : $done_pending 개"
  echo "║  🎨 Enhancement/Frontend(Codex): $queue_f"
  echo "║  ⚙️  Backend(Gemini)         : $queue_b"
  echo "╠══════════════════════════════════════════════════╣"

  # 현재 큐 내용
  if [ -f .fable/queue/frontend.md ]; then
    echo "║  [Codex 현재 작업 (enhancement/frontend)]"
    grep "^#" .fable/queue/frontend.md | head -3 | while read -r line; do
      printf "║    %-46s║\n" "$line"
    done
  fi

  if [ -f .fable/queue/backend.md ]; then
    echo "║  [Backend 현재 작업]"
    grep "^#" .fable/queue/backend.md | head -3 | while read -r line; do
      printf "║    %-46s║\n" "$line"
    done
  fi

  echo "╠══════════════════════════════════════════════════╣"
  echo "║  📝 최근 로그 (fable5)"
  tail -5 logs/fable5.log 2>/dev/null | while read -r line; do
    printf "║  %-48s║\n" "${line:0:48}"
  done

  echo "╚══════════════════════════════════════════════════╝"

  sleep 3
done
