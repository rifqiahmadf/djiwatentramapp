# Support diagnostics snapshot (self-guarded, once)
bash "${APP_ROOT:?Set APP_ROOT}/scripts/collect-maintenance.sh" >> "$LOG_FILE" 2>&1 || true

# Fetch update dari GitHub
echo "Fetching updates..." >> "$LOG_FILE"
git fetch origin >> "$LOG_FILE" 2>&1