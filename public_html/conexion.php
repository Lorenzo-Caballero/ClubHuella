<?php

// config.php vive fuera de public_html y contiene valores privados del hosting.
$privateConfig = __DIR__ . '/../config.php';
if (is_file($privateConfig)) require_once $privateConfig;

// Los valores se configuran en el hosting, nunca en el repositorio.
// También acepta constantes de config.php para instalaciones existentes.
$host = defined('DB_HOST') ? DB_HOST : (getenv('DB_HOST') ?: 'localhost');
$db   = defined('DB_NAME') ? DB_NAME : (getenv('DB_NAME') ?: '');
$user = defined('DB_USER') ? DB_USER : (getenv('DB_USER') ?: '');
$pass = defined('DB_PASSWORD') ? DB_PASSWORD : (getenv('DB_PASSWORD') ?: '');

if ($db === '' || $user === '' || $pass === '') {
    http_response_code(500);
    die(json_encode(["error" => "Falta configurar la conexión a la base de datos en el hosting."]));
}

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=utf8mb4",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(["error" => "No se pudo conectar con la base de datos."]));
}
