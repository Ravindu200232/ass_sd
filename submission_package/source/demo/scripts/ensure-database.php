<?php

declare(strict_types=1);

$backend = realpath($argv[1] ?? '');
if ($backend === false || ! is_file($backend.DIRECTORY_SEPARATOR.'vendor'.DIRECTORY_SEPARATOR.'autoload.php')) {
    fwrite(STDERR, "Backend dependencies are not installed.\n");
    exit(1);
}

require $backend.DIRECTORY_SEPARATOR.'vendor'.DIRECTORY_SEPARATOR.'autoload.php';

Dotenv\Dotenv::createImmutable($backend)->safeLoad();

$env = static function (string $key, string $fallback = ''): string {
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);

    return $value === false || $value === null ? $fallback : (string) $value;
};

$driver = $env('DB_CONNECTION', 'mysql');
$host = $env('DB_HOST', '127.0.0.1');
$port = $env('DB_PORT', '3306');
$database = $env('DB_DATABASE');
$username = $env('DB_USERNAME');
$password = $env('DB_PASSWORD');

if ($driver !== 'mysql') {
    fwrite(STDERR, "This local launcher expects DB_CONNECTION=mysql.\n");
    exit(1);
}

if ($database === '' || ! preg_match('/\A[a-zA-Z0-9_]+\z/', $database)) {
    fwrite(STDERR, "DB_DATABASE is empty or contains unsupported characters.\n");
    exit(1);
}

if (in_array('--name-only', $argv, true)) {
    fwrite(STDOUT, $database.PHP_EOL);
    exit(0);
}

try {
    $pdo = new PDO(
        "mysql:host={$host};port={$port};charset=utf8mb4",
        $username,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $check = $pdo->prepare('SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = ?');
    $check->execute([$database]);
    $wasCreated = (int) $check->fetchColumn() === 0;
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    fwrite(STDOUT, "Database {$database} is ready.\n");
    exit($wasCreated ? 2 : 0);
} catch (PDOException $exception) {
    fwrite(STDERR, "Could not prepare the MySQL database. Start MySQL and check DB_* settings in the backend .env.\n");
    exit(1);
}
