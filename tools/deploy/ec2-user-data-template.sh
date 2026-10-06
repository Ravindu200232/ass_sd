#!/usr/bin/env bash
set -Eeuo pipefail
exec > >(tee -a /var/log/ssd-assignment-deploy.log | logger -t ssd-assignment-deploy -s 2>/dev/console) 2>&1

PROJECT="__PROJECT__"
APP_ROOT="/opt/${PROJECT}"
API_URL="__API_URL__"
FRONT_URL="__FRONT_URL__"
DB_NAME="__DB_NAME__"
DB_USER="__DB_USER__"
DB_PASSWORD="__DB_PASSWORD__"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y nginx mysql-server unzip curl ca-certificates \
  php8.3-cli php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl \
  php8.3-zip php8.3-bcmath php8.3-gd

systemctl enable --now mysql
systemctl enable --now nginx

mkdir -p "${APP_ROOT}/api" "${APP_ROOT}/front"
curl -fsSL "${API_URL}" -o /tmp/ssd-api.tar.gz
curl -fsSL "${FRONT_URL}" -o /tmp/ssd-front.zip
tar -xzf /tmp/ssd-api.tar.gz -C "${APP_ROOT}/api"
unzip -q -o /tmp/ssd-front.zip -d "${APP_ROOT}/front"

PUBLIC_IP="$(curl -fsS http://169.254.169.254/latest/meta-data/public-ipv4 || echo 127.0.0.1)"
cat > "${APP_ROOT}/api/.env" <<EOF
APP_NAME="Pubudu Tire Management System - ${PROJECT}"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://${PUBLIC_IP}

LOG_CHANNEL=stack
LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=${DB_NAME}
DB_USERNAME=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

BROADCAST_CONNECTION=log
CACHE_STORE=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=false

SANCTUM_TOKEN_EXPIRATION=480
BCRYPT_ROUNDS=12
FRONTEND_URLS=http://${PUBLIC_IP}

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://${PUBLIC_IP}/auth/callback
GOOGLE_HOSTED_DOMAIN=

MAIL_MAILER=log
MAIL_FROM_ADDRESS="noreply@example.com"
MAIL_FROM_NAME="Pubudu POS"
EOF

mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

cd "${APP_ROOT}/api"
php artisan key:generate --force
php artisan config:clear
php artisan migrate --seed --force
php artisan storage:link || true
chown -R www-data:www-data "${APP_ROOT}/api/storage" "${APP_ROOT}/api/bootstrap/cache"
chmod -R ug+rwX "${APP_ROOT}/api/storage" "${APP_ROOT}/api/bootstrap/cache"

cat > "/etc/systemd/system/${PROJECT}-api.service" <<EOF
[Unit]
Description=Pubudu POS ${PROJECT} Laravel API
After=network.target mysql.service
Requires=mysql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=${APP_ROOT}/api
ExecStart=/usr/bin/php artisan serve --host=127.0.0.1 --port=8000
Restart=always
RestartSec=5
Environment=APP_ENV=production

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/nginx/sites-available/default <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root ${APP_ROOT}/front/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

nginx -t
systemctl daemon-reload
systemctl enable --now "${PROJECT}-api.service"
systemctl restart nginx

touch "${APP_ROOT}/READY"
echo "${PROJECT} deployment complete at http://${PUBLIC_IP}"
