#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT="$1"
PUBLIC_IP="$2"
APP_ROOT="/opt/${PROJECT}"

mkdir -p "${APP_ROOT}/api/bootstrap/cache"
mkdir -p "${APP_ROOT}/api/storage/framework/cache" \
         "${APP_ROOT}/api/storage/framework/sessions" \
         "${APP_ROOT}/api/storage/framework/views" \
         "${APP_ROOT}/api/storage/logs"

# The original variant contains a pre-existing migration typo: this column is
# used with ON DELETE SET NULL, so it must be nullable before migrations run.
if [ "${PROJECT}" = "ssd-origin" ]; then
  sed -i "s/unsignedBigInteger('adjusted_by');/unsignedBigInteger('adjusted_by')->nullable();/" \
    "${APP_ROOT}/api/database/migrations/2025_12_02_211837_create_grn_adjustment_histories_table.php"
  sed -i "s/unsignedBigInteger('returned_by');/unsignedBigInteger('returned_by')->nullable();/" \
    "${APP_ROOT}/api/database/migrations/2025_12_02_211838_create_return_to_stock_table.php"
fi

if [ -f "${APP_ROOT}/api/.env" ]; then
  sed -i "s#^APP_URL=.*#APP_URL=http://${PUBLIC_IP}#" "${APP_ROOT}/api/.env"
  sed -i "s#^FRONTEND_URLS=.*#FRONTEND_URLS=http://${PUBLIC_IP}#" "${APP_ROOT}/api/.env"
  sed -i "s#^GOOGLE_REDIRECT_URI=.*#GOOGLE_REDIRECT_URI=http://${PUBLIC_IP}/auth/callback#" "${APP_ROOT}/api/.env"
fi

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
echo "${PROJECT} repaired"
