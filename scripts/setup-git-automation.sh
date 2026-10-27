#!/bin/bash
# Setup cron jobs untuk auto-pull dan auto-push

echo "Setting up git automation for djiwatentramapp..."
: "${RUNTIME_ENV_FILE:?Set RUNTIME_ENV_FILE to the scheduler environment file}"
[[ "$RUNTIME_ENV_FILE" =~ ^/[a-zA-Z0-9_./-]+$ ]] || { echo "Invalid RUNTIME_ENV_FILE path" >&2; exit 1; }

# Buat script executable
chmod +x "${APP_ROOT:?Set APP_ROOT}/scripts/git-auto-pull.sh"
chmod +x "${APP_ROOT:?Set APP_ROOT}/scripts/git-auto-push.sh"
chmod +x "${APP_ROOT:?Set APP_ROOT}/scripts/git-smart-push.sh"

# Buat logs directory
mkdir -p "${APP_ROOT:?Set APP_ROOT}/logs"

# Backup crontab
crontab -l > /tmp/crontab-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null

# Tambahkan cron jobs
(
  # Pull setiap 5 menit
  printf '*/5 * * * * set -a; . "%s"; set +a; "%s/scripts/git-auto-pull.sh"\n' "$RUNTIME_ENV_FILE" "$APP_ROOT"
  
  # Smart push setiap 10 menit (hanya push commit manual)
  printf '*/10 * * * * set -a; . "%s"; set +a; "%s/scripts/git-smart-push.sh"\n' "$RUNTIME_ENV_FILE" "$APP_ROOT"
  
  # Auto push (semua perubahan) - di-comment secara default, gunakan dengan hati-hati
  # printf '*/15 * * * * set -a; . "%s"; set +a; "%s/scripts/git-auto-push.sh"\n' "$RUNTIME_ENV_FILE" "$APP_ROOT"
) | crontab -

echo "Cron jobs setup selesai!"
echo ""
echo "Aktif cron jobs:"
crontab -l | grep git-auto
echo ""
echo "Log files:"
echo "  - Pull log: ${APP_ROOT:?Set APP_ROOT}/logs/auto-pull.log"
echo "  - Smart push log: ${APP_ROOT:?Set APP_ROOT}/logs/smart-auto-push.log"
echo "  - Auto push log: ${APP_ROOT:?Set APP_ROOT}/logs/auto-push.log"
echo ""
echo "CATATAN:"
echo "1. git-auto-pull.sh - Pull setiap 5 menit, otomatis stash perubahan lokal"
echo "2. git-smart-push.sh - Push hanya commit yang sudah dibuat manual (setiap 10 menit)"
echo "3. git-auto-push.sh - Push otomatis semua perubahan (HATI-HATI, default dimatikan)"
echo ""
echo "Untuk mengubah interval, edit crontab: crontab -e"
