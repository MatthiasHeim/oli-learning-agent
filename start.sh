#!/bin/sh
# Claude Code refuses --dangerously-skip-permissions when running as root.
# Drop to a non-root user before starting the app.
set -e

if [ "$(id -u)" = "0" ]; then
  # Create nanoclaw user if it doesn't exist
  if ! id -u nanoclaw >/dev/null 2>&1; then
    useradd -m -u 1001 nanoclaw
  fi
  # Give the app user write access to data directories
  mkdir -p /app/data
  chown -R nanoclaw:nanoclaw /app/data
  # Re-exec as non-root user
  exec su -s /bin/sh nanoclaw -c "exec node /app/dist/index.js"
else
  exec node dist/index.js
fi
