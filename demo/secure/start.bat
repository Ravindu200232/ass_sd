@echo off
setlocal EnableExtensions
for %%I in ("%~dp0..") do set "DEMO_ROOT=%%~fI"
for %%I in ("%~dp0pubudu-pos-api-secure") do set "API=%%~fI"
for %%I in ("%~dp0pubudu-pos-front-end-secure") do set "WEB=%%~fI"
set "DB_HELPER=%DEMO_ROOT%\scripts\ensure-database.php"

where php >nul 2>nul || goto :missing_php
where composer >nul 2>nul || goto :missing_composer
where node >nul 2>nul || goto :missing_node
where npm >nul 2>nul || goto :missing_npm

if not exist "%API%\composer.json" goto :missing_api
if not exist "%WEB%\package.json" goto :missing_web

if not exist "%API%\vendor\autoload.php" (
    echo Installing secure backend dependencies...
    pushd "%API%"
    if exist "C:\composer\composer.phar" (
        php -d extension=zip "C:\composer\composer.phar" install --no-interaction --prefer-dist
    ) else (
        composer install --no-interaction --prefer-dist
    )
    if errorlevel 1 goto :failed_pop_api
    popd
)

if not exist "%WEB%\node_modules" (
    echo Installing secure frontend dependencies...
    pushd "%WEB%"
    call npm ci
    if errorlevel 1 goto :failed_pop_web
    popd
)

if not exist "%API%\.env" (
    if not exist "%API%\.env.example" goto :missing_env
    copy "%API%\.env.example" "%API%\.env" >nul
    set "GENERATE_KEY=1"
)
findstr /R /C:"^APP_KEY=." "%API%\.env" >nul
if errorlevel 1 set "GENERATE_KEY=1"
if not exist "%WEB%\.env.local" if exist "%WEB%\.env.example" copy "%WEB%\.env.example" "%WEB%\.env.local" >nul

pushd "%API%"
if defined GENERATE_KEY (
    php artisan key:generate
    if errorlevel 1 goto :failed_pop_api
)
php "%DB_HELPER%" "%API%"
set "DB_SETUP_RESULT=%ERRORLEVEL%"
if "%DB_SETUP_RESULT%"=="1" goto :failed_pop_api
if "%DB_SETUP_RESULT%"=="2" set "DATABASE_CREATED=1"
php artisan migrate --force
if errorlevel 1 goto :failed_pop_api
if defined DATABASE_CREATED (
    php artisan db:seed --class=SecurityDemoSeeder --force
    if errorlevel 1 goto :failed_pop_api
)
popd

echo Starting secure project: http://localhost:5173
start "Secure POS API - 8000" /D "%API%" cmd /k "php artisan serve --host=127.0.0.1 --port=8000"
set "VITE_API_BASE_URL=http://127.0.0.1:8000/api"
start "Secure POS frontend - 5173" /D "%WEB%" cmd /k "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort"
echo API: http://127.0.0.1:8000
echo Frontend: http://localhost:5173
exit /b 0

:failed_pop_api
popd
goto :failed
:failed_pop_web
popd
goto :failed
:missing_php
echo PHP was not found. Install XAMPP or add PHP to PATH.
goto :failed
:missing_composer
echo Composer was not found. Install Composer and retry.
goto :failed
:missing_node
echo Node.js was not found. Install Node.js and retry.
goto :failed
:missing_npm
echo npm was not found. Install Node.js and retry.
goto :failed
:missing_api
echo Secure backend folder is missing: %API%
goto :failed
:missing_web
echo Secure frontend folder is missing: %WEB%
goto :failed
:missing_env
echo Backend .env and .env.example are both missing.
goto :failed
:failed
echo Startup stopped. Check the message above, then run start.bat again.
pause
exit /b 1
