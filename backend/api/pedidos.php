<?php
/*
 * backend/api/pedidos.php — CRUD API REST para la tabla pedidos
 *
 * GET    /backend/api/pedidos.php          → listar todos
 * GET    /backend/api/pedidos.php?id=X     → obtener uno
 * POST   /backend/api/pedidos.php          → crear
 * PUT    /backend/api/pedidos.php?id=X     → actualizar
 * DELETE /backend/api/pedidos.php?id=X     → eliminar
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../conexion.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

function input(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function notFound(): void {
    http_response_code(404);
    echo json_encode(['error' => 'Pedido no encontrado']);
    exit;
}

function badRequest(string $msg): void {
    http_response_code(400);
    echo json_encode(['error' => $msg]);
    exit;
}

$campos = [
    'nombre_mascota', 'estilo', 'color', 'talle',
    'total', 'precio_remera', 'precio_envio',
    'destinatario_nombre', 'destinatario_telefono',
    'tipo_entrega', 'direccion_completa', 'ciudad', 'provincia',
    'estado', 'carrier', 'carrier_service',
    'tracking_number', 'tracking_url',
    'imagen_url', 'mp_payment_id', 'diseno_id',
];

try {
    switch ($method) {

        /* ── GET ──────────────────────────────────────────────── */
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM pedidos WHERE id = ?");
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                if (!$row) notFound();
                echo json_encode($row);
            } else {
                $rows = $pdo->query("SELECT * FROM pedidos ORDER BY created_at DESC")->fetchAll();
                echo json_encode($rows);
            }
            break;

        /* ── POST ─────────────────────────────────────────────── */
        case 'POST':
            $data = input();
            if (empty($data)) badRequest('Cuerpo JSON vacío o inválido');

            $cols    = implode(', ', $campos);
            $holders = implode(', ', array_map(fn($c) => ":$c", $campos));

            $stmt = $pdo->prepare("INSERT INTO pedidos ($cols) VALUES ($holders)");

            $params = [];
            foreach ($campos as $c) {
                $params[$c] = $data[$c] ?? (in_array($c, ['total','precio_remera','precio_envio']) ? 0 : '');
            }
            if (empty($params['estado'])) $params['estado'] = 'pendiente';
            if (empty($params['tipo_entrega'])) $params['tipo_entrega'] = 'envio';

            $stmt->execute($params);
            http_response_code(201);
            echo json_encode(['id' => (int)$pdo->lastInsertId(), 'message' => 'Pedido creado']);
            break;

        /* ── PUT ──────────────────────────────────────────────── */
        case 'PUT':
            if (!$id) badRequest('Se requiere ?id=X');
            $data = input();
            if (empty($data)) badRequest('Cuerpo JSON vacío o inválido');

            $sets = implode(', ', array_map(fn($c) => "$c = :$c", $campos));
            $stmt = $pdo->prepare("UPDATE pedidos SET $sets WHERE id = :id");

            $params = ['id' => $id];
            foreach ($campos as $c) {
                $params[$c] = $data[$c] ?? (in_array($c, ['total','precio_remera','precio_envio']) ? 0 : '');
            }

            $stmt->execute($params);
            if ($stmt->rowCount() === 0) notFound();
            echo json_encode(['message' => 'Pedido actualizado']);
            break;

        /* ── DELETE ───────────────────────────────────────────── */
        case 'DELETE':
            if (!$id) badRequest('Se requiere ?id=X');
            $stmt = $pdo->prepare("DELETE FROM pedidos WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() === 0) notFound();
            echo json_encode(['message' => 'Pedido eliminado']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
