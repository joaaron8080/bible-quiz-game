#!/usr/bin/env bash
# ============================================================
#  monitor.sh — 실시간 진행상황 모니터링
# ============================================================

clear_screen() { printf "\033[2J\033[H"; }

while true; do
  clear_screen

  echo "╔══════════════════════════════════════════════════╗"
  echo "║        fable5 분산 빌드 모니터 (Ctrl+C 종료)     ║"
  printf "║  %s  ║\n" "$(date '+%Y-%m-%d %H:%M:%S')              "
  echo "╠══════════════════════════════════════════════════╣"

  # Issues 현황
  total_issues=$(ls .fable/issues/*.md  2>/dev/null | wc -l)
  archived=$(ls .fable/archive/*.md     2>/dev/null | wc -l)
  done_pending=$(ls .fable/done/*.md    2>/dev/null | wc -l)
  queue_f=$([ -f .fable/queue/frontend.md ] && echo "작업중 ✅" || echo "대기   ⬜")
  queue_b=$([ -f .fable/queue/backend.md  ] && echo "작업중 ✅" || echo "대기   ⬜")

  echo "║  📋 대기 Issues    : $total_issues 개"
  echo "║  ✅ 완료(archive)  : $archived 개"
  echo "║  🔎 리뷰 대기      : $done_pending 개"
  echo "║  🎨 Frontend(Codex): $queue_f"
  echo "║  ⚙️  Backend(Gemini): $queue_b"
  echo "╠══════════════════════════════════════════════════╣"

  # 현재 큐 내용
  if [ -f .fable/queue/frontend.md ]; then
    echo "║  [Frontend 현재 작업]"
    grep "^#" .fable/queue/frontend.md | head -3 | while read -r line; do
      printf "║    %s\n" "$line"
    done
  fi

  if [ -f .fable/queue/backend.md ]; then
    echo "║  [Backend 현재 작업]"
    grep "^#" .fable/queue/backend.md | head -3 | while read -r line; do
      printf "║    %s\n" "$line"
    done
  fi

  echo "╠══════════════════════════════════════════════════╣"
  echo "║  📝 최근 로그 (fable5)"
  tail -5 logs/fable5.log 2>/dev/null | while read -r line; do
    printf "║  %s\n" "${line:0:48}"
  done

  echo "╚══════════════════════════════════════════════════╝"

  sleep 3
done
