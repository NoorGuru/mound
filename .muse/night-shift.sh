#!/usr/bin/env bash
set -u

# Run from repo root regardless of caller cwd (script lives in .muse/)
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" || exit 1
# tagy/cursor/agent/muse are real executables in ~/.local/bin (tagy is a shim, not an alias), so PATH alone works in non-interactive subshells
export PATH="$HOME/.local/bin:$PATH"

PROMPT_FILE=".muse/NIGHT_LOOP_PROMPT.md"
LOG_DIR=".muse/night-logs"
mkdir -p "$LOG_DIR"
if [ ! -f "$PROMPT_FILE" ]; then echo "Missing $PROMPT_FILE" >&2; exit 1; fi
command -v muse >/dev/null || { echo "muse not found on PATH" >&2; exit 1; }
command -v tagy >/dev/null || { echo "tagy not found on PATH" >&2; exit 1; }

verify_repo() {
  echo "🔍 [Verifier] Running TypeScript & Vite bundle checks..."
  if ! bun run typecheck; then
    return 1
  fi
  if [ -d "apps/web" ]; then
    (cd apps/web && bun run build) || return 1
  fi
  return 0
}

ITERATION=1
echo "🐜 Starting MOUND 24/7 Ubuntu Autonomous Loop (Muse + tagy + Cursor/Grok)..."
echo "🛑 To stop cleanly tomorrow: run 'touch STOP_NIGHT_SHIFT' in repo root."

while true; do
  if [ -f "STOP_NIGHT_SHIFT" ]; then
    echo "🛑 Found STOP_NIGHT_SHIFT. Exiting cleanly."
    rm -f "STOP_NIGHT_SHIFT"
    break
  fi

  TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
  RUN_LOG="$LOG_DIR/iter_${ITERATION}_${TIMESTAMP}.log"

  echo "=================================================="
  echo "🚀 [Iteration #$ITERATION] Starting at $(date)"
  echo "=================================================="

  # Main Feature / Phase Run
  muse exec \
    --yolo \
    --max-model-steps 90 \
    --prompt-file "$PROMPT_FILE" \
    2>&1 | tee "$RUN_LOG"

  # Independent Hard Verification Gate
  if verify_repo; then
    echo "✅ [Iteration #$ITERATION] Build & Typecheck 100% GREEN!"
    # Commit any uncommitted stragglers if verify passed
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -m "chore(night-shift): auto-checkpoint verified iteration #$ITERATION"
    fi
  else
    echo "⚠️ [Iteration #$ITERATION] Build/Typecheck failed! Triggering auto-repair with tagy & Grok..."
    muse exec \
      --yolo \
      --max-model-steps 50 \
      "URGENT: The build or typecheck is currently failing. Run 'bun run typecheck' and 'cd apps/web && bun run build', inspect the exact errors, use 'tagy -p' or 'agent --model grok-4.7-high -p --force' to fix every single error until the build passes cleanly, then git commit the fix." \
      2>&1 | tee "$LOG_DIR/iter_${ITERATION}_repair.log"
  fi

  sleep 5
  ITERATION=$((ITERATION + 1))
done
