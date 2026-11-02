<?php
/* ============================================================
   payments_envios.php — Club Huella
   Acciones: listar | pedido | crear | actualizar | eliminar |
             rate | pagar | webhook | success
   ------------------------------------------------------------
   Orden del archivo (importante para evitar "Undefined variable $action"):
   1) Config, DB, CORS, utils
   2) SDK de Mercado Pago
   3) Funciones auxiliares (generar_envio_envia, registrar_pedido_desde_pago)
   4) ROUTER: se define $action UNA sola vez
   5) Bloques if ($action === ...) en el orden que se prefiera
   6) Fallback de acción no reconocida
   ============================================================ */

ini_set('display_errors', 0);
error_reporting(E_ALL);
date_default_timezone_set('America/Argentina/Buenos_Aires');
if (!defined('PRECIO_REMERA_ARS')) {
    define('PRECIO_REMERA_ARS', max(1, (int)(getenv('CLUB_HUELLA_PRECIO_REMERA') ?: 44900)));
}

/* ================= CONFIG + DB ================= */
require_once __DIR__ . "/../config.php";
require_once __DIR__ . "/conexion.php";
require_once __DIR__ . "/dtf.php";

if (!defined('MP_ACCESS_TOKEN') || !MP_ACCESS_TOKEN) {
    http_response_code(500);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode(["ok" => false, "error" => "Falta MP_ACCESS_TOKEN en config.php"]);
    exit;
}
if (!defined('ENVIA_API_KEY')) {
    define('ENVIA_API_KEY', '');
}

$ENVIA_API = ENVIA_API_KEY;
$MP_TOKEN  = MP_ACCESS_TOKEN;

/* ================= URLs de retorno ================= */
define('URL_SUCCESS', 'https://clubhuella.com/payments_envios.php?action=success');
define('URL_FAILURE', 'https://clubhuella.com/gracias?status=failure');
define('URL_PENDING', 'https://clubhuella.com/gracias?status=pending');
define('URL_WEBHOOK', 'https://clubhuella.com/payments_envios.php?action=webhook');

/* ================= ASSETS (imágenes generadas / subidas) =================
   disenos.php guarda rutas RELATIVAS en BD (ej: "generados/diseno_39_....jpg",
   "uploads/cliente_....jpg"), relativas a la carpeta donde vive ese script.
   Si payments_envios.php y disenos.php están en la misma carpeta pública,
   esta base alcanza. Si disenos.php vive en una subcarpeta (ej. /backend/),
   ajustá esta constante para que apunte ahí. */
if (!defined('ASSETS_BASE_URL')) {
    define('ASSETS_BASE_URL', 'https://clubhuella.com/');
}

/* ================= CORS ================= */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$requestAction = $_GET['action'] ?? '';
$allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://clubhuella.com",
    "https://www.clubhuella.com",
    "https://olivedrab-bat-725875.hostingersite.com",
];
$adminAllowedOrigins = [
    "https://clubhuella.com",
    "https://www.clubhuella.com",
    "https://olivedrab-bat-725875.hostingersite.com",
];
$adminRoutes = ['admin_session', 'admin_login', 'admin_logout', 'listar', 'pedido', 'archivo_pedido', 'crear', 'actualizar', 'eliminar'];
$corsAllowedOrigins = in_array($requestAction, $adminRoutes, true) ? $adminAllowedOrigins : $allowedOrigins;
if ($origin && in_array($origin, $corsAllowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
    header("Access-Control-Allow-Credentials: true");
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if ($origin && !in_array($origin, $corsAllowedOrigins, true)) {
        http_response_code(403);
        exit;
    }
    http_response_code(200);
    echo json_encode(["ok" => true]);
    exit;
}

/* ================= UTILS ================= */
function sendJSON(array $data, int $status = 200): void {
    http_response_code($status);
    header("Content-Type: application/json; charset=utf-8");
    header("Cache-Control: no-store, private");
    header("X-Content-Type-Options: nosniff");
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function start_admin_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_name('clubhuella_admin');
    $isSecure = (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $isSecure,
        'httponly' => true,
        'samesite' => 'None',
    ]);
    session_start();
}

function admin_session_is_valid(): bool {
    if (empty($_SESSION['clubhuella_admin_authenticated']) || empty($_SESSION['clubhuella_admin_last_seen'])) return false;
    if (time() - (int)$_SESSION['clubhuella_admin_last_seen'] > 1800) {
        $_SESSION = [];
        session_destroy();
        return false;
    }
    $_SESSION['clubhuella_admin_last_seen'] = time();
    return true;
}

function require_admin_session(bool $requireCsrf = false): void {
    start_admin_session();
    if (!admin_session_is_valid()) sendJSON(["ok" => false, "error" => "Se requiere iniciar sesión como administrador."], 401);
    if ($requireCsrf) {
        $sentToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        $knownToken = $_SESSION['clubhuella_admin_csrf'] ?? '';
        if (!$sentToken || !$knownToken || !hash_equals($knownToken, $sentToken)) {
            sendJSON(["ok" => false, "error" => "La sesión venció. Recargá el panel e intentá de nuevo."], 419);
        }
    }
}

function valid_admin_password_hash(): bool {
    if (!defined('ADMIN_PASSWORD_HASH') || !is_string(ADMIN_PASSWORD_HASH) || ADMIN_PASSWORD_HASH === '') return false;
    $info = password_get_info(ADMIN_PASSWORD_HASH);
    return !empty($info['algo']);
}

/* ── Almacén propio de metadata de pagos (independiente de MP) ── */
function meta_pagos_dir(): string {
    $dir = dirname(__DIR__) . '/meta_pagos';
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    return $dir;
}
function guardar_meta_pago($externalRef, array $meta): void {
    $ref = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string)$externalRef);
    if ($ref === '') return;
    @file_put_contents(meta_pagos_dir() . "/meta_{$ref}.json", json_encode($meta, JSON_UNESCAPED_UNICODE));
}
function cargar_meta_pago($externalRef): array {
    $ref = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string)$externalRef);
    if ($ref === '') return [];
    $p = meta_pagos_dir() . "/meta_{$ref}.json";
    if (!file_exists($p)) return [];
    $d = json_decode((string)@file_get_contents($p), true);
    return is_array($d) ? $d : [];
}
function meta_de_pago($payment): array {
    $mp    = json_decode(json_encode($payment->metadata ?? []), true) ?: [];
    $store = cargar_meta_pago($payment->external_reference ?? '');
    $meta  = array_merge($store, $mp);
    if (empty($meta['diseno_id']) && !empty($payment->external_reference)) {
        $meta['diseno_id'] = (string)$payment->external_reference;
    }
    return $meta;
}

/* Convierte el carrito a unidades físicas: la tabla pedidos representa una
   remera por fila y no tiene una columna cantidad. */
function lineas_fisicas_pedido(array $meta): array {
    $rawLines = $meta['line_items'] ?? null;
    $legacy = !is_array($rawLines) || !$rawLines;
    if ($legacy) {
        $rawLines = [[
            'diseno_id' => $meta['diseno_id'] ?? '',
            'nombre_mascota' => $meta['nombre_mascota'] ?? 'Tu mascota',
            'estilo' => $meta['estilo'] ?? '',
            'color' => $meta['color'] ?? 'blanca',
            'talle' => $meta['talle'] ?? 'M',
            'imagen_url' => $meta['imagen_url'] ?? '',
            'cantidad' => 1,
            'precio_unitario' => $meta['precio_remera'] ?? 42990,
        ]];
    }

    $lines = [];
    foreach ($rawLines as $lineIndex => $line) {
        if (!is_array($line)) continue;
        $quantity = (int)($line['cantidad'] ?? 1);
        if ($quantity < 1 || $quantity > 20) {
            throw new InvalidArgumentException('La cantidad por diseño debe estar entre 1 y 20.');
        }
        $unitPrice = (int)($line['precio_unitario'] ?? $line['precio_remera'] ?? $meta['precio_remera'] ?? 42990);
        if ($unitPrice < 1 || $unitPrice > 1000000) {
            throw new InvalidArgumentException('El precio de una remera no es válido.');
        }
        $color = strtolower((string)($line['color'] ?? 'blanca'));
        $size = strtoupper((string)($line['talle'] ?? 'M'));
        if (!in_array($color, ['blanca', 'negra'], true) || !in_array($size, ['S', 'M', 'L', 'XL'], true)) {
            throw new InvalidArgumentException('El color o talle de una remera no es válido.');
        }
        $style = strtolower(trim((string)($line['estilo'] ?? '')));
        $colorPorEstilo = [
            'vogue' => ['blanca', 'negra'], 'retro' => ['blanca', 'negra'],
            'collage' => ['blanca', 'negra'], 'minimal' => ['blanca', 'negra'],
            'streetwear' => ['negra'], 'rap-tee' => ['negra'],
        ];
        if (!isset($colorPorEstilo[$style]) || !in_array($color, $colorPorEstilo[$style], true)) {
            throw new InvalidArgumentException('El estilo o color de una remera no está habilitado para impresión.');
        }
        for ($copy = 0; $copy < $quantity; $copy++) {
            if (count($lines) >= 20) {
                throw new InvalidArgumentException('El carrito admite hasta 20 remeras por compra.');
            }
            $lines[] = [
                'line_ref' => $legacy ? null : sprintf('L%03d', count($lines) + 1),
                'diseno_id' => (string)($line['diseno_id'] ?? ''),
                'imagen_url' => (string)($line['imagen_url'] ?? ''),
                'nombre_mascota' => (string)($line['nombre_mascota'] ?? 'Tu mascota'),
                'estilo' => (string)($line['estilo'] ?? ''),
                'color' => $color,
                'talle' => $size,
                'precio_remera' => $unitPrice,
            ];
        }
    }
    if (!$lines) throw new InvalidArgumentException('El carrito no contiene remeras válidas.');
    return $lines;
}

/* Convierte una ruta relativa guardada en BD ("generados/x.jpg") en URL absoluta.
   Si ya viene como URL absoluta (http/https) o como dataURL, la deja tal cual. */
function url_imagen(?string $ruta): ?string {
    if (!$ruta) return null;
    if (preg_match('#^(https?:)?//#i', $ruta) || str_starts_with($ruta, 'data:')) {
        return $ruta;
    }
    return rtrim(ASSETS_BASE_URL, '/') . '/' . ltrim($ruta, '/');
}

/* Agrega el campo "imagen_url" (ruta cruda, sin tocar) y "imagen_url_completa"
   (lista para usar en un <img src>) a un pedido, resolviendo fallback desde
   el diseño vinculado si el pedido no tiene imagen propia. */
function resolver_imagen_pedido(array $pedido): array {
    $ruta = $pedido['imagen_url'] ?? null;
    if (!$ruta && !empty($pedido['diseno_imagen_generada'])) {
        $ruta = $pedido['diseno_imagen_generada'];
    }
    $pedido['imagen_url_completa'] = url_imagen($ruta);
    unset($pedido['diseno_imagen_generada']); // campo auxiliar del JOIN, no hace falta exponerlo
    return $pedido;
}

function logg(mixed $data): void {
    $logPath = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'clubhuella-payments.log';
    file_put_contents(
        $logPath,
        date("Y-m-d H:i:s ") . json_encode($data, JSON_UNESCAPED_UNICODE) . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
    @chmod($logPath, 0600);
}

/* ── Whitelist de columnas editables de "pedidos" (evita SQLi por nombre de columna) ── */
const PEDIDO_CAMPOS_EDITABLES = [
    "nombre_mascota", "estilo", "color", "talle",
    "total", "precio_remera", "precio_envio",
    "destinatario_nombre", "destinatario_telefono",
    "tipo_entrega", "direccion_completa", "ciudad", "provincia",
    "estado", "carrier", "carrier_service",
    "tracking_number", "tracking_url",
    "imagen_url", "mp_payment_id", "diseno_id",
];

/* ================= ERRORES EN JSON ================= */
set_exception_handler(fn($e) => sendJSON(["ok" => false, "error" => $e->getMessage()], 500));
set_error_handler(function ($n, $e) {
    if (!(error_reporting() & $n)) return false;
    sendJSON(["ok" => false, "error" => $e], 500);
});

/* ================= LOAD MP SDK ================= */
$sdkBase = __DIR__ . "/vendor/mercadopago/dx-php/src/";

spl_autoload_register(function (string $class) use ($sdkBase) {
    if (strpos($class, 'MercadoPago\\') !== 0) return;
    $file = $sdkBase . str_replace("\\", "/", $class) . ".php";
    if (file_exists($file)) require_once $file;
});

require_once $sdkBase . "MercadoPago/MercadoPagoConfig.php";

if (!class_exists("MercadoPago\\MercadoPagoConfig")) {
    sendJSON(["ok" => false, "error" => "SDK MP no cargado"]);
}

MercadoPago\MercadoPagoConfig::setAccessToken($MP_TOKEN);

/* ============================================================
   ENVIA.COM — generar etiqueta de envío
   ============================================================ */
function generar_envio_envia(array $meta, string $enviaKey): array {
    $body = [
        "origin" => [
            "name"       => "Club Huella",
            "phone"      => "2230000000",
            "street"     => "Av Héctor Jara 22",
            "city"       => "Mar del Plata",
            "state"      => "B",
            "country"    => "AR",
            "postalCode" => "7600",
        ],
        "destination" => [
            "name"       => $meta["nombre"]    ?? "Cliente",
            "phone"      => $meta["telefono"]  ?? "000000",
            "street"     => $meta["direccion"] ?? "Sin dirección",
            "city"       => $meta["ciudad"]    ?? "Buenos Aires",
            "state"      => "B",
            "country"    => "AR",
            "postalCode" => $meta["cp"]        ?? "1000",
        ],
        "packages" => [[
            "type"          => "box",
            "content"       => "remera personalizada",
            "amount"        => 1,
            "declaredValue" => (int)($meta["precio_remera"] ?? 44900),
            "weight"        => max(0.4, 0.4 * (int)($meta["cantidad_remeras"] ?? 1)),
            "dimensions"    => ["length" => 30, "width" => 25, "height" => min(25, 5 + 2 * max(0, (int)($meta["cantidad_remeras"] ?? 1) - 1))],
        ]],
        "shipment" => [
            "type"    => 1,
            "carrier" => $meta["carrier"] ?? "correoargentino",
            "service" => $meta["service"] ?? "standard",
        ],
    ];

    $ch = curl_init("https://api.envia.com/ship/generate/");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            "Authorization: Bearer {$enviaKey}",
            "Content-Type: application/json",
        ],
        CURLOPT_POSTFIELDS => json_encode($body),
        CURLOPT_TIMEOUT    => 20,
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);

    logg(["GENERATE_RESPONSE" => $resp]);

    $res = json_decode($resp, true);
    if (!empty($res["data"][0])) {
        $e = $res["data"][0];
        return [
            $e["trackingNumber"] ?? null,
            $e["trackUrl"]       ?? null,
            $e["label"]          ?? null,
        ];
    }
    return [null, null, null];
}

/* ============================================================
   REGISTRAR PEDIDO DESDE UN PAGO MP (idempotente)
   La usan tanto el webhook como el success-redirect.
   ============================================================ */
function registrar_pedido_desde_pago($payment, PDO $pdo, string $enviaKey): array {

    if (($payment->status ?? '') !== 'approved') {
        return ['ok' => true, 'estado' => 'no_aprobado', 'mp_status' => $payment->status ?? null];
    }

    $paymentId = (string)$payment->id;

    $meta        = meta_de_pago($payment);
    $tipoEntrega = $meta["tipo_entrega"] ?? 'domicilio';
    $precioEnvio = (int)($meta["precio_envio"] ?? 0);
    $lines       = lineas_fisicas_pedido($meta);
    $baseRef     = (string)($payment->external_reference ?? $meta['diseno_id'] ?? $paymentId);
    $orderIds    = [];
    $trackingNum = null;

    // Serializa eventos simultáneos de webhook/retorno para que no dupliquen filas.
    $pdo->beginTransaction();
    try {
        $lock = $pdo->prepare("SELECT id, external_ref FROM pedidos WHERE mp_payment_id = ? FOR UPDATE");
        $lock->execute([$paymentId]);
        $existingRefs = [];
        foreach ($lock->fetchAll() as $row) $existingRefs[(string)$row['external_ref']] = (int)$row['id'];

        $call = $pdo->prepare("CALL sp_registrar_pedido(
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?
        )");

        foreach ($lines as $index => $line) {
            $lineRef = $line['line_ref']
                ? substr($baseRef, 0, 112) . '-' . $line['line_ref']
                : $baseRef;
            if (isset($existingRefs[$lineRef])) {
                $orderIds[] = $existingRefs[$lineRef];
                continue;
            }

            // El envío se cobra una sola vez y se asigna a la primera fila para
            // que la suma de los pedidos coincida con el total pagado.
            $lineShipping = $index === 0 ? $precioEnvio : 0;
            $lineTotal = (int)$line['precio_remera'] + $lineShipping;
            $call->execute([
                $paymentId,
                $payment->order->id ?? null,
                $lineRef,
                $line['diseno_id'] ?: null,
                $line['imagen_url'] ?: null,
                $line['nombre_mascota'] ?: 'Tu mascota',
                $line['estilo'],
                $line['color'],
                $line['talle'],
                (int)$line['precio_remera'],
                $lineShipping,
                $lineTotal,
                $meta['nombre'] ?? 'Cliente',
                $meta['telefono'] ?? null,
                $tipoEntrega,
                $meta['calle'] ?? $meta['direccion'] ?? null,
                $meta['numero'] ?? null,
                $meta['piso_depto'] ?? null,
                $meta['info_adicional'] ?? null,
                $meta['cp'] ?? null,
                $meta['ciudad'] ?? null,
                $meta['provincia'] ?? null,
                $meta['carrier'] ?? null,
                $meta['service'] ?? null,
            ]);
            $call->closeCursor();

            $find = $pdo->prepare("SELECT id FROM pedidos WHERE mp_payment_id = ? AND external_ref = ? ORDER BY id DESC LIMIT 1");
            $find->execute([$paymentId, $lineRef]);
            $orderId = (int)($find->fetchColumn() ?: 0);
            if (!$orderId) throw new RuntimeException('No se pudo recuperar una línea recién registrada.');
            $orderIds[] = $orderId;
            $existingRefs[$lineRef] = $orderId;
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    $trackingNum = null;
    if ($tipoEntrega === 'domicilio' && $precioEnvio > 0) {
        $claim = $pdo->prepare("UPDATE pedidos SET shipped_at = NOW() WHERE mp_payment_id = ? AND shipped_at IS NULL");
        $claim->execute([$paymentId]);
        if ($claim->rowCount() > 0) {
            $shippingMeta = $meta;
            $shippingMeta['cantidad_remeras'] = count($lines);
            $shippingMeta['precio_remera'] = array_sum(array_column($lines, 'precio_remera'));
            [$trackingNum, $trackUrl, $labelUrl] = generar_envio_envia($shippingMeta, $enviaKey);
            if ($trackingNum) {
                $pdo->prepare("UPDATE pedidos SET tracking_number = ?, tracking_url = ?, label_url = ? WHERE mp_payment_id = ?")
                    ->execute([$trackingNum, $trackUrl, $labelUrl, $paymentId]);
            } else {
                $pdo->prepare("UPDATE pedidos SET shipped_at = NULL WHERE mp_payment_id = ?")
                    ->execute([$paymentId]);
            }
        }
        $track = $pdo->prepare("SELECT tracking_number FROM pedidos WHERE mp_payment_id = ? AND tracking_number IS NOT NULL LIMIT 1");
        $track->execute([$paymentId]);
        $trackingNum = $track->fetchColumn() ?: null;
    }

    logg(["REGISTRAR_OK" => ["payment" => $paymentId, "pedido_ids" => $orderIds]]);

    return [
        'ok'        => true,
        'estado'    => 'registrado',
        'pedido_id' => $orderIds[0] ?? 0,
        'pedido_ids' => $orderIds,
        'cantidad'  => count($orderIds),
        'tracking'  => $trackingNum,
    ];
}

/* ================= ROUTER ================= */
// $action se define UNA sola vez, antes de cualquier bloque que la use.
$action = $requestAction;

if (in_array($action, $adminRoutes, true)) start_admin_session();

if ($action === 'admin_session') {
    $csrf = $_SESSION['clubhuella_admin_csrf'] ?? '';
    if ($csrf === '') {
        try { $csrf = bin2hex(random_bytes(32)); }
        catch (Throwable $e) { sendJSON(["ok" => false, "error" => "No se pudo inicializar la sesión."], 500); }
        $_SESSION['clubhuella_admin_csrf'] = $csrf;
    }
    sendJSON([
        "ok" => true,
        "authenticated" => admin_session_is_valid(),
        "csrf_token" => $csrf,
    ]);
}

if ($action === 'admin_login') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendJSON(["ok" => false, "error" => "Método no permitido."], 405);
    if (!$origin || !in_array($origin, $adminAllowedOrigins, true)) sendJSON(["ok" => false, "error" => "Origen no permitido."], 403);
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) sendJSON(["ok" => false, "error" => "Body inválido."], 400);
    $sentToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $knownToken = $_SESSION['clubhuella_admin_csrf'] ?? '';
    if (!$sentToken || !$knownToken || !hash_equals($knownToken, $sentToken)) {
        sendJSON(["ok" => false, "error" => "Recargá el inicio de sesión e intentá de nuevo."], 419);
    }
    $lockedUntil = (int)($_SESSION['clubhuella_admin_locked_until'] ?? 0);
    if ($lockedUntil > time()) sendJSON(["ok" => false, "error" => "Demasiados intentos. Probá nuevamente en unos minutos."], 429);
    if (!defined('ADMIN_USERNAME') || !valid_admin_password_hash()) {
        sendJSON(["ok" => false, "error" => "El acceso administrativo todavía no está configurado en el servidor."], 503);
    }
    $username = trim((string)($input['username'] ?? ''));
    $password = (string)($input['password'] ?? '');
    $valid = hash_equals((string)ADMIN_USERNAME, $username) && password_verify($password, ADMIN_PASSWORD_HASH);
    if (!$valid) {
        $failures = (int)($_SESSION['clubhuella_admin_failures'] ?? 0) + 1;
        $_SESSION['clubhuella_admin_failures'] = $failures;
        if ($failures >= 5) {
            $_SESSION['clubhuella_admin_locked_until'] = time() + 900;
            $_SESSION['clubhuella_admin_failures'] = 0;
        }
        sendJSON(["ok" => false, "error" => "Usuario o contraseña incorrectos."], 401);
    }

    session_regenerate_id(true);
    $_SESSION = [
        'clubhuella_admin_authenticated' => true,
        'clubhuella_admin_last_seen' => time(),
        'clubhuella_admin_failures' => 0,
        'clubhuella_admin_csrf' => bin2hex(random_bytes(32)),
    ];
    sendJSON(["ok" => true, "authenticated" => true, "csrf_token" => $_SESSION['clubhuella_admin_csrf']]);
}

if ($action === 'admin_logout') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendJSON(["ok" => false, "error" => "Método no permitido."], 405);
    if (!$origin || !in_array($origin, $adminAllowedOrigins, true)) sendJSON(["ok" => false, "error" => "Origen no permitido."], 403);
    require_admin_session(true);
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'],
            'domain' => $params['domain'],
            'secure' => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => $params['samesite'] ?? 'None',
        ]);
    }
    session_destroy();
    sendJSON(["ok" => true]);
}

if (in_array($action, ['listar', 'pedido', 'archivo_pedido', 'crear', 'actualizar', 'eliminar'], true)) {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $writeActions = ['crear', 'actualizar', 'eliminar'];
    $expectedMethod = in_array($action, $writeActions, true) ? 'POST' : 'GET';
    if ($method !== $expectedMethod) sendJSON(["ok" => false, "error" => "Método no permitido."], 405);
    if ($method === 'POST' && (!$origin || !in_array($origin, $adminAllowedOrigins, true))) {
        sendJSON(["ok" => false, "error" => "Origen no permitido."], 403);
    }
    require_admin_session($method === 'POST');
}

// Defensa: si MP pega al archivo sin action pero con params de webhook,
// lo tratamos como webhook igual.
if ($action === '' && (isset($_GET['topic']) || isset($_GET['type']) || isset($_GET['data_id']))) {
    $action = 'webhook';
}

/* ============================================================
   ACTION: listar  (GET — devuelve todos los pedidos)
   ============================================================ */
if ($action === "listar") {
    $stmt = $pdo->query("
        SELECT p.*, d.imagen_generada AS diseno_imagen_generada
        FROM pedidos p
        LEFT JOIN disenos_mascotas d ON d.id = p.diseno_id
        ORDER BY p.created_at DESC
    ");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $rows = array_map('resolver_imagen_pedido', $rows);
    sendJSON($rows);
}

/* ============================================================
   ACTION: pedido  (GET — un solo pedido por id)
   ============================================================ */
if ($action === "pedido") {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendJSON(["ok" => false, "error" => "Falta id"], 400);

    $stmt = $pdo->prepare("
        SELECT p.*, d.imagen_generada AS diseno_imagen_generada
        FROM pedidos p
        LEFT JOIN disenos_mascotas d ON d.id = p.diseno_id
        WHERE p.id = ? LIMIT 1
    ");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) sendJSON(["ok" => false, "error" => "No encontrado"], 404);
    sendJSON(resolver_imagen_pedido($row));
}

/* Descarga autenticada del original o del PNG DTF vinculado a un pedido. */
if ($action === 'archivo_pedido') {
    $id = (int)($_GET['id'] ?? 0);
    $type = (string)($_GET['tipo'] ?? '');
    if ($id < 1 || !in_array($type, ['original', 'dtf'], true)) {
        sendJSON(["ok" => false, "error" => "Pedido o tipo de archivo inválido."], 400);
    }

    $stmt = $pdo->prepare("SELECT p.*, d.imagen_generada AS diseno_imagen_generada
        FROM pedidos p
        LEFT JOIN disenos_mascotas d ON d.id = p.diseno_id
        WHERE p.id = ? LIMIT 1");
    $stmt->execute([$id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) sendJSON(["ok" => false, "error" => "Pedido no encontrado."], 404);

    if ($type === 'original') {
        $relativePath = trim((string)($order['imagen_url'] ?? ''));
        if ($relativePath === '') $relativePath = trim((string)($order['diseno_imagen_generada'] ?? ''));
    } else {
        $relativePath = trim((string)($order['archivo_impresion'] ?? ''));
        if ($relativePath === '') $relativePath = 'generados/impresion_pedido_' . $id . '_v2.png';
    }

    // Solo se sirven archivos locales bajo public_html. No aceptar URL remotas,
    // data URLs, traversal ni archivos fuera del sitio.
    if ($relativePath === '' || preg_match('#^(https?:)?//#i', $relativePath) || str_starts_with($relativePath, 'data:')) {
        sendJSON(["ok" => false, "error" => "El pedido no tiene ese archivo guardado."], 404);
    }
    $base = realpath(__DIR__);
    $filePath = realpath(__DIR__ . '/' . ltrim($relativePath, '/'));
    if (!$base || !$filePath || !is_file($filePath) || strpos($filePath, $base . DIRECTORY_SEPARATOR) !== 0) {
        sendJSON(["ok" => false, "error" => "El archivo no está disponible."], 404);
    }
    $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $allowedExtensions = $type === 'dtf' ? ['png'] : ['jpg', 'jpeg', 'png', 'webp'];
    if (!in_array($extension, $allowedExtensions, true)) {
        sendJSON(["ok" => false, "error" => "Formato de archivo no permitido."], 415);
    }
    $mimeTypes = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
    $downloadName = 'clubhuella_pedido_' . $id . '_' . $type . '.' . $extension;
    $disposition = ($_GET['inline'] ?? '') === '1' ? 'inline' : 'attachment';
    header('Content-Type: ' . ($mimeTypes[$extension] ?? 'application/octet-stream'));
    header('Content-Length: ' . filesize($filePath));
    header('Content-Disposition: ' . $disposition . '; filename="' . $downloadName . '"');
    header('Cache-Control: no-store, private');
    header('X-Content-Type-Options: nosniff');
    readfile($filePath);
    exit;
}

/* ============================================================
   ACTION: crear  (POST — alta manual de pedido)
   ============================================================ */
if ($action === "crear") {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!is_array($input)) sendJSON(["ok" => false, "error" => "Body inválido"], 400);

    $cols = [];
    $vals = [];
    $params = [];
    foreach (PEDIDO_CAMPOS_EDITABLES as $c) {
        if (array_key_exists($c, $input)) {
            $cols[]   = $c;
            $vals[]   = "?";
            $params[] = $input[$c];
        }
    }
    if (!$cols) sendJSON(["ok" => false, "error" => "Sin campos para guardar"], 400);

    $sql  = "INSERT INTO pedidos (" . implode(",", $cols) . ") VALUES (" . implode(",", $vals) . ")";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sendJSON(["ok" => true, "id" => (int)$pdo->lastInsertId()]);
}

/* ============================================================
   ACTION: actualizar  (POST — edita un pedido existente)
   ============================================================ */
if ($action === "actualizar") {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendJSON(["ok" => false, "error" => "Falta id"], 400);

    $input = json_decode(file_get_contents("php://input"), true);
    if (!is_array($input)) sendJSON(["ok" => false, "error" => "Body inválido"], 400);

    $sets   = [];
    $params = [];
    foreach (PEDIDO_CAMPOS_EDITABLES as $c) {
        if (array_key_exists($c, $input)) {
            $sets[]   = "$c = ?";
            $params[] = $input[$c];
        }
    }
    if (!$sets) sendJSON(["ok" => false, "error" => "Sin campos para actualizar"], 400);

    $params[] = $id;
    $stmt = $pdo->prepare("UPDATE pedidos SET " . implode(", ", $sets) . " WHERE id = ?");
    $stmt->execute($params);

    sendJSON(["ok" => true]);
}

/* ============================================================
   ACTION: eliminar  (POST — borra un pedido)
   ============================================================ */
if ($action === "eliminar") {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendJSON(["ok" => false, "error" => "Falta id"], 400);

    $stmt = $pdo->prepare("DELETE FROM pedidos WHERE id = ?");
    $stmt->execute([$id]);

    sendJSON(["ok" => true]);
}

/* ============================================================
   ACTION: rate  (cotización de envío)
   ============================================================ */
if ($action === "rate") {

    $input = json_decode(file_get_contents("php://input"), true);
    if (!is_array($input)) sendJSON(["ok" => false, "error" => "Body inválido"]);

    $cp        = trim($input["cp"]        ?? '');
    $nombre    = trim($input["nombre"]    ?? 'Cliente');
    $telefono  = trim($input["telefono"]  ?? '000000');
    $direccion = trim($input["direccion"] ?? 'Sin dirección');
    $ciudad    = trim($input["ciudad"]    ?? 'Buenos Aires');
    $quantity  = max(1, min(20, (int)($input['cantidad_remeras'] ?? 1)));
    $declaredValue = max(1, (int)($input['subtotal'] ?? (PRECIO_REMERA_ARS * $quantity)));

    if (!$cp) sendJSON(["ok" => false, "error" => "Falta el código postal"]);

    $body = [
        "origin" => [
            "name" => "Club Huella", "phone" => "2230000000",
            "street" => "Av Héctor Jara 22", "city" => "Mar del Plata",
            "state" => "B", "country" => "AR", "postalCode" => "7600",
        ],
        "destination" => [
            "name" => $nombre, "phone" => $telefono,
            "street" => $direccion, "city" => $ciudad,
            "state" => "B", "country" => "AR", "postalCode" => $cp,
        ],
        "packages" => [[
            "type" => "box", "content" => "remera personalizada",
            "amount" => 1, "declaredValue" => $declaredValue, "weight" => 0.4 * $quantity,
            "dimensions" => ["length" => 30, "width" => 25, "height" => min(25, 5 + 2 * ($quantity - 1))],
        ]],
        "shipment" => ["type" => 1, "carrier" => "correoargentino"],
    ];

    logg(["RATE_REQUEST" => ["cp" => $cp, "cantidad" => $quantity, "subtotal" => $declaredValue]]);

    $ch = curl_init("https://api.envia.com/ship/rate/");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            "Authorization: Bearer $ENVIA_API",
            "Content-Type: application/json",
        ],
        CURLOPT_POSTFIELDS => json_encode($body),
        CURLOPT_TIMEOUT    => 15,
    ]);
    $response = curl_exec($ch);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    logg(["RATE_RESPONSE" => $response, "CURL_ERR" => $curlErr]);

    if ($curlErr) sendJSON(["ok" => false, "error" => "Error de conexión con Envia.com: $curlErr"]);

    $res = json_decode($response, true);
    if (empty($res["data"])) {
        sendJSON(["ok" => false, "error" => "No hay opciones de envío disponibles para ese código postal"]);
    }

    $out = [];
    foreach ($res["data"] as $e) {
        $out[] = [
            "carrier"           => $e["carrier"]    ?? '',
            "service"           => $e["service"]    ?? '',
            "price"             => (float)($e["totalPrice"] ?? 0),
            "estimatedDelivery" => $e["deliveryEstimatedDate"] ?? null,
        ];
    }

    sendJSON(["ok" => true, "data" => $out]);
}

/* ============================================================
   ACTION: pagar  (crea preferencia + notification_url)
   ============================================================ */
if ($action === "pagar") {

    $input = json_decode(file_get_contents("php://input"), true);
    if (empty($input)) sendJSON(["ok" => false, "error" => "Sin datos"]);

    foreach (["nombre", "precio_remera", "total"] as $f) {
        if (!isset($input[$f])) sendJSON(["ok" => false, "error" => "Falta el campo: $f"]);
    }

    try {
        $lines = lineas_fisicas_pedido([
            'line_items' => $input['items'] ?? [],
            'diseno_id' => $input['diseno_id'] ?? '',
            'imagen_url' => $input['imagen_url'] ?? '',
            'nombre_mascota' => $input['nombre_mascota'] ?? 'Tu mascota',
            'estilo' => $input['estilo'] ?? '',
            'color' => $input['color'] ?? 'blanca',
            'talle' => $input['talle'] ?? 'M',
            'precio_remera' => PRECIO_REMERA_ARS,
        ]);
    } catch (InvalidArgumentException $e) {
        sendJSON(["ok" => false, "error" => $e->getMessage()], 400);
    }

    $shirtTotal = array_sum(array_column($lines, 'precio_remera'));
    foreach ($lines as $line) {
        if ((int)$line['precio_remera'] !== PRECIO_REMERA_ARS) {
            sendJSON(["ok" => false, "error" => "El precio de la remera está desactualizado. Recargá la página e intentá de nuevo."], 409);
        }
    }
    $precioEnvio = max(0, (int)($input["precio_envio"] ?? 0));
    $total = $shirtTotal + $precioEnvio;
    if ((int)$input['precio_remera'] !== $shirtTotal || (int)$input['total'] !== $total) {
        sendJSON(["ok" => false, "error" => "El total del carrito cambió. Volvé a revisar el envío antes de pagar."], 409);
    }

    $tipoEntrega  = $input["tipo_entrega"] ?? 'domicilio';
    $carrier      = $input["carrier"] ?? '';
    $service      = $input["service"] ?? '';
    try { $externalRef = 'CH-' . bin2hex(random_bytes(12)); }
    catch (Throwable $e) { $externalRef = 'CH-' . uniqid('', true); }

    $items = [];
    foreach ($lines as $index => $line) {
        $items[] = [
            "id"          => "remera-" . ($line['diseno_id'] ?: ($index + 1)),
            "title"       => "Remera Club Huella · " . ($line['nombre_mascota'] ?: 'Tu mascota') . " · " . strtoupper($line['estilo']),
            "description" => "Talle {$line['talle']} · " . ucfirst($line['color']) . " · Algodón 240g DTF premium",
            "quantity"    => 1,
            "unit_price"  => (int)$line['precio_remera'],
            "currency_id" => "ARS",
        ];
    }
    if ($precioEnvio > 0) {
        $items[] = [
            "id" => "envio-" . $externalRef,
            "title" => "Envío " . strtoupper($carrier) . " · " . $service,
            "quantity" => 1,
            "unit_price" => $precioEnvio,
            "currency_id" => "ARS",
        ];
    }

    $metadata = [
        "diseno_id" => $lines[0]['diseno_id'],
        "imagen_url" => $lines[0]['imagen_url'],
        "nombre_mascota" => $lines[0]['nombre_mascota'],
        "estilo" => $lines[0]['estilo'],
        "color" => $lines[0]['color'],
        "talle" => $lines[0]['talle'],
        "line_items" => $lines,
        "precio_remera" => $shirtTotal,
        "precio_envio" => $precioEnvio,
        "total" => $total,
        "tipo_entrega" => $tipoEntrega,
        "carrier" => $carrier,
        "service" => $service,
        "nombre" => $input["nombre"] ?? '',
        "telefono" => $input["telefono"] ?? '',
        "direccion" => $input["direccion"] ?? '',
        "ciudad" => $input["ciudad"] ?? '',
        "cp" => $input["cp"] ?? '',
        "provincia" => $input["provincia"] ?? '',
        "cantidad_remeras" => count($lines),
    ];

    logg(["PAGAR_INPUT" => ["external_ref" => $externalRef, "cantidad" => count($lines), "total" => $total]]);
    guardar_meta_pago($externalRef, $metadata);

    try {
        $client = new MercadoPago\Client\Preference\PreferenceClient();

        $preference = $client->create([
            "items"              => $items,
            "external_reference" => $externalRef,
            "metadata"           => ["cart_ref" => $externalRef],
            "notification_url"   => URL_WEBHOOK,
            "back_urls"          => [
                "success" => URL_SUCCESS . "&external_ref=" . urlencode($externalRef),
                "failure" => URL_FAILURE,
                "pending" => URL_PENDING,
            ],
            "auto_return"          => "approved",
            "statement_descriptor" => "Club Huella",
            "payment_methods"      => ["installments" => 12],
        ]);

        logg(["PAGAR_PREF_ID" => $preference->id, "INIT_POINT" => $preference->init_point]);

        sendJSON([
            "ok"         => true,
            "init_point" => $preference->init_point,
            "pref_id"    => $preference->id,
        ]);

    } catch (Throwable $e) {
        logg(["PAGAR_ERROR" => $e->getMessage()]);
        sendJSON(["ok" => false, "error" => $e->getMessage()]);
    }
}

/* ============================================================
   ACTION: webhook  (IPN de Mercado Pago — fuente de verdad)
   ============================================================ */
if ($action === "webhook") {

    $raw  = file_get_contents("php://input");
    $body = json_decode($raw, true) ?: [];

    logg(["WEBHOOK_IN" => ["query" => $_GET, "body" => $body]]);

    $type = $body['type']
        ?? ($_GET['type'] ?? ($_GET['topic'] ?? ''));

    $paymentId = $body['data']['id']
        ?? ($_GET['data_id'] ?? ($_GET['id'] ?? null));

    if ($type !== 'payment' || !$paymentId) {
        sendJSON(["ok" => true, "ignored" => true]);
    }

    try {
        $payClient = new MercadoPago\Client\Payment\PaymentClient();
        $payment   = $payClient->get((int)$paymentId);

        $res = registrar_pedido_desde_pago($payment, $pdo, $ENVIA_API);
        logg(["WEBHOOK_RESULT" => $res]);
        $dtfResult = procesar_dtf_pedidos($res['pedido_ids'] ?? [$res['pedido_id'] ?? 0], $pdo);
        logg(["DTF_BATCH_RESULT" => $dtfResult, "pedido_ids" => $res['pedido_ids'] ?? []]);
        if (empty($dtfResult['ok'])) {
            // Mercado Pago reintentará la notificación si el arte o el email
            // no quedó listo. El registro del pedido y los archivos son idempotentes.
            sendJSON(["ok" => false, "error" => "Pago registrado; el envío al estampador quedó pendiente."], 503);
        }

        sendJSON(["ok" => true, "result" => $res]);

    } catch (Throwable $e) {
        logg(["WEBHOOK_ERROR" => $e->getMessage()]);
        sendJSON(["ok" => false, "error" => $e->getMessage()]);
    }
}

/* ============================================================
   ACTION: success  (redirect del cliente — solo UX)
   ============================================================ */
if ($action === "success") {

    $paymentId   = $_GET['payment_id']   ?? null;
    $externalRef = $_GET['external_ref'] ?? null;

    if (!$paymentId) {
        header("Location: " . URL_FAILURE);
        exit;
    }

    try {
        $payClient = new MercadoPago\Client\Payment\PaymentClient();
        $payment   = $payClient->get((int)$paymentId);
    } catch (Throwable $e) {
        logg(["SUCCESS_MP_ERROR" => $e->getMessage()]);
        header("Location: " . URL_FAILURE);
        exit;
    }

    logg(["SUCCESS_PAYMENT" => [
        "id"     => $payment->id,
        "status" => $payment->status,
        "ref"    => $payment->external_reference,
    ]]);

    if ($payment->status !== "approved") {
        header("Location: " . URL_PENDING . "&payment_id=" . $paymentId);
        exit;
    }

    $res = registrar_pedido_desde_pago($payment, $pdo, $ENVIA_API);
    logg(["SUCCESS_RESULT" => $res]);
    $dtfResult = procesar_dtf_pedidos($res['pedido_ids'] ?? [$res['pedido_id'] ?? 0], $pdo);
    logg(["DTF_BATCH_RESULT" => $dtfResult, "pedido_ids" => $res['pedido_ids'] ?? []]);

    $meta = meta_de_pago($payment);
    $params = http_build_query([
        "status"   => "approved",
        "payment_id" => (string)$payment->id,
        "external_reference" => (string)($payment->external_reference ?? $externalRef ?? ''),
        "pedido_id" => (string)($res['pedido_id'] ?? ''),
        "total" => (string)($payment->transaction_amount ?? $meta['total'] ?? ''),
        "tracking" => $res['tracking'] ?? '',
        "nombre"   => $meta["nombre_mascota"] ?? '',
        "tipo"     => $meta["tipo_entrega"]   ?? 'domicilio',
    ]);

    header("Location: https://clubhuella.com/gracias?" . $params);
    exit;
}

/* ── Acción no reconocida ── */
sendJSON(["ok" => false, "error" => "Acción no válida: $action"]);
