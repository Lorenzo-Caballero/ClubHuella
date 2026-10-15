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
$allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://clubhuella.com",
    "https://www.clubhuella.com",
];
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["ok" => true]);
    exit;
}

/* ================= UTILS ================= */
function sendJSON(array $data, int $status = 200): void {
    http_response_code($status);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
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
    file_put_contents(
        __DIR__ . "/debug.txt",
        date("Y-m-d H:i:s ") . json_encode($data, JSON_UNESCAPED_UNICODE) . PHP_EOL,
        FILE_APPEND
    );
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
            "declaredValue" => (int)($meta["precio_remera"] ?? 42990),
            "weight"        => 0.4,
            "dimensions"    => ["length" => 30, "width" => 25, "height" => 5],
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

    $stmt = $pdo->prepare("SELECT id, tracking_number FROM pedidos WHERE mp_payment_id = ? LIMIT 1");
    $stmt->execute([$paymentId]);
    $existing = $stmt->fetch();
    if ($existing) {
        logg(["REGISTRAR_YA_EXISTE" => $paymentId]);
        return [
            'ok'        => true,
            'estado'    => 'ya_registrado',
            'pedido_id' => (int)$existing['id'],
            'tracking'  => $existing['tracking_number'],
        ];
    }

    $meta        = meta_de_pago($payment);
    $tipoEntrega = $meta["tipo_entrega"] ?? 'domicilio';
    $precioEnvio = (int)($meta["precio_envio"] ?? 0);

    $call = $pdo->prepare("CALL sp_registrar_pedido(
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?
    )");

    $call->execute([
        $paymentId,
        $payment->order->id ?? null,
        $payment->external_reference ?? ($meta["diseno_id"] ?? null),
        $meta["diseno_id"]      ?? null,
        $meta["imagen_url"]     ?? null,
        $meta["nombre_mascota"] ?? 'Tu mascota',
        $meta["estilo"]         ?? '',
        $meta["color"]          ?? 'blanca',
        $meta["talle"]          ?? 'M',
        (int)($meta["precio_remera"] ?? 42990),
        $precioEnvio,
        (int)($meta["total"] ?? 42990),
        $meta["nombre"]   ?? 'Cliente',
        $meta["telefono"] ?? null,
        $tipoEntrega,
        $meta["direccion"] ?? null,
        null,
        null,
        null,
        $meta["cp"]        ?? null,
        $meta["ciudad"]    ?? null,
        $meta["provincia"] ?? null,
        $meta["carrier"]   ?? null,
        $meta["service"]   ?? null,
    ]);
    $call->closeCursor();

    $stmt = $pdo->prepare("SELECT id FROM pedidos WHERE mp_payment_id = ? LIMIT 1");
    $stmt->execute([$paymentId]);
    $pedidoId = (int)($stmt->fetchColumn() ?: 0);

    logg(["REGISTRAR_OK" => ["payment" => $paymentId, "pedido_id" => $pedidoId]]);

    $trackingNum = null;
    if ($tipoEntrega === 'domicilio' && $precioEnvio > 0) {
        $claim = $pdo->prepare(
            "UPDATE pedidos SET shipped_at = NOW()
             WHERE mp_payment_id = ? AND shipped_at IS NULL"
        );
        $claim->execute([$paymentId]);

        if ($claim->rowCount() === 1) {
            [$trackingNum, $trackUrl, $labelUrl] = generar_envio_envia($meta, $enviaKey);

            if ($trackingNum) {
                $pdo->prepare(
                    "UPDATE pedidos
                     SET tracking_number = ?, tracking_url = ?, label_url = ?
                     WHERE mp_payment_id = ?"
                )->execute([$trackingNum, $trackUrl, $labelUrl, $paymentId]);
            } else {
                $pdo->prepare("UPDATE pedidos SET shipped_at = NULL WHERE mp_payment_id = ?")
                    ->execute([$paymentId]);
            }
        }
    }

    /* >>> PUNTO 2 DEL PLAN: AVISO AL ESTAMPADOR <<< */

    return [
        'ok'        => true,
        'estado'    => 'registrado',
        'pedido_id' => $pedidoId,
        'tracking'  => $trackingNum,
    ];
}

/* ================= ROUTER ================= */
// $action se define UNA sola vez, antes de cualquier bloque que la use.
$action = $_GET['action'] ?? '';

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
            "amount" => 1, "declaredValue" => 42990, "weight" => 0.4,
            "dimensions" => ["length" => 30, "width" => 25, "height" => 5],
        ]],
        "shipment" => ["type" => 1, "carrier" => "correoargentino"],
    ];

    logg(["RATE_REQUEST" => $body]);

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

    $precioRemera = (float)($input["precio_remera"] ?? 42990);
    $precioEnvio  = (float)($input["precio_envio"]  ?? 0);
    $total        = (float)($input["total"]          ?? ($precioRemera + $precioEnvio));
    $nombreMasc   = $input["nombre_mascota"] ?? 'Tu mascota';
    $estilo       = $input["estilo"]         ?? '';
    $color        = $input["color"]          ?? '';
    $talle        = $input["talle"]          ?? '';
    $tipoEntrega  = $input["tipo_entrega"]   ?? 'domicilio';
    $carrier      = $input["carrier"]        ?? '';
    $service      = $input["service"]        ?? '';
    $externalRef  = $input["diseno_id"]      ?? (string)time();

    $items = [[
        "id"          => "remera-" . $externalRef,
        "title"       => "Remera Club Huella · {$nombreMasc} · " . strtoupper($estilo),
        "description" => "Talle $talle · " . ucfirst($color) . " · Algodón 240g DTF premium",
        "quantity"    => 1,
        "unit_price"  => $precioRemera,
        "currency_id" => "ARS",
    ]];

    if ($precioEnvio > 0) {
        $items[] = [
            "id"          => "envio-" . $externalRef,
            "title"       => "Envío " . strtoupper($carrier) . " · " . $service,
            "quantity"    => 1,
            "unit_price"  => $precioEnvio,
            "currency_id" => "ARS",
        ];
    }

    $metadata = [
        "diseno_id"      => $externalRef,
        "imagen_url"     => $input["imagen_url"]     ?? '',
        "nombre_mascota" => $nombreMasc,
        "estilo"         => $estilo,
        "color"          => $color,
        "talle"          => $talle,
        "precio_remera"  => $precioRemera,
        "precio_envio"   => $precioEnvio,
        "total"          => $total,
        "tipo_entrega"   => $tipoEntrega,
        "carrier"        => $carrier,
        "service"        => $service,
        "nombre"         => $input["nombre"]    ?? '',
        "telefono"       => $input["telefono"]  ?? '',
        "direccion"      => $input["direccion"] ?? '',
        "ciudad"         => $input["ciudad"]    ?? '',
        "cp"             => $input["cp"]        ?? '',
        "provincia"      => $input["provincia"] ?? '',
    ];

    logg(["PAGAR_INPUT" => $metadata]);
    guardar_meta_pago($externalRef, $metadata);

    try {
        $client = new MercadoPago\Client\Preference\PreferenceClient();

        $preference = $client->create([
            "items"              => $items,
            "external_reference" => $externalRef,
            "metadata"           => $metadata,
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
        if (!empty($res['pedido_id'])) {
            $metaDtf = meta_de_pago($payment);
            try { $dtf = procesar_dtf_pedido((int)$res['pedido_id'], $metaDtf, $pdo); logg(["DTF" => $dtf, "META_KEYS" => array_keys($metaDtf)]); }
            catch (Throwable $e) { logg(["DTF_ERROR" => $e->getMessage()]); }
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
    if (!empty($res['pedido_id'])) {
        $metaDtf = meta_de_pago($payment);
        try { $dtf = procesar_dtf_pedido((int)$res['pedido_id'], $metaDtf, $pdo); logg(["DTF" => $dtf, "META_KEYS" => array_keys($metaDtf)]); }
        catch (Throwable $e) { logg(["DTF_ERROR" => $e->getMessage()]); }
    }

    $meta = meta_de_pago($payment);
    $params = http_build_query([
        "status"   => "approved",
        "tracking" => $res['tracking'] ?? '',
        "nombre"   => $meta["nombre_mascota"] ?? '',
        "tipo"     => $meta["tipo_entrega"]   ?? 'domicilio',
    ]);

    header("Location: https://clubhuella.com/gracias?" . $params);
    exit;
}

/* ── Acción no reconocida ── */
sendJSON(["ok" => false, "error" => "Acción no válida: $action"]);