#!/bin/sh
# Claude Code refuses --dangerously-skip-permissions when running as root.
# Drop to a non-root user before starting the app.
set -e

if [ "$(id -u)" = "0" ]; then
  # Determine which non-root user to run as.
  # Prefer the built-in 'node' user (uid 1000) from the official Node.js Docker image.
  # Fall back to creating a 'nanoclaw' user if 'node' doesn't exist.
  if id node >/dev/null 2>&1; then
    RUN_USER=node
  elif id nanoclaw >/dev/null 2>&1; then
    RUN_USER=nanoclaw
  else
    useradd -m -u 1001 nanoclaw
    RUN_USER=nanoclaw
  fi

  # Create all runtime directories the app needs (gitignored, don't exist on fresh deploy)
  mkdir -p /app/data /app/store

  # Give the run user write access to all directories it needs at runtime:
  # - /app/data  : SQLite sessions, workspace symlinks, IPC sockets
  # - /app/store : SQLite messages.db (gitignored, created at runtime)
  # - /app/groups: Agent workspace CWD (Claude writes memory/session files here)
  chown -R "$RUN_USER" /app/data /app/store /app/groups

  # Re-exec as non-root user
  exec su -s /bin/sh "$RUN_USER" -c "exec node /app/dist/index.js"
else
  exec node /app/dist/index.js
fi
