<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}



require_once 'conexion.php';
require 'vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

date_default_timezone_set('America/Argentina/Buenos_Aires');

$metodo = $_SERVER['REQUEST_METHOD'];
$recurso = $_GET['recurso'] ?? '';
$id = $_GET['id'] ?? null;
$accion = $_GET['accion'] ?? null;


$input = json_decode(file_get_contents("php://input"), true);

if ($metodo === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT);
}

function verifyPassword($password, $hashed) {
    return password_verify($password, $hashed);
}

function generarToken($datos) {
    $clave = "tu_clave_secreta";
    return JWT::encode($datos, $clave, 'HS256');
}
   
   
   
   

if ($accion === 'apertura') {
  guardarApertura($conexion, $input);
} elseif ($accion === 'cierre') {
  guardarCierre($conexion, $input);
} else {
  http_response_code(400);
  echo json_encode(['error' => 'Acción no válida']);
}
// ------------------ APERTURAS ------------------
if ($recurso === 'aperturas') {
    switch ($metodo) {
        case 'GET':
            if ($id) {
                // Obtener apertura por ID, incluyendo datos del empleado y billeteras asociadas
                $res = $conexion->query("
                    SELECT a.*, e.nombre AS empleado
                    FROM aperturas a
                    JOIN empleados e ON a.empleado_id = e.id
                    WHERE a.id = $id
                ");
                $apertura = $res->fetch_assoc();

                if ($apertura) {
                    // Obtener billeteras asociadas
                    $resB = $conexion->query("
                        SELECT ab.*, b.servicio, b.titular
                        FROM apertura_billeteras ab
                        JOIN billeteras b ON ab.billetera_id = b.id
                        WHERE ab.apertura_id = $id
                    ");
                    $billeteras = [];
                    while ($fila = $resB->fetch_assoc()) $billeteras[] = $fila;

                    $apertura['billeteras'] = $billeteras;
                    echo json_encode($apertura);
                } else {
                    echo json_encode(["message" => "Apertura no encontrada"]);
                }

            } else {
                // Obtener todas las aperturas con el nombre del empleado
                $res = $conexion->query("
                    SELECT a.*, e.nombre AS empleado
                    FROM aperturas a
                    JOIN empleados e ON a.empleado_id = e.id
                    ORDER BY a.fecha DESC
                ");
                $datos = [];
                while ($fila = $res->fetch_assoc()) $datos[] = $fila;
                echo json_encode($datos);
            }
            break;
            case 'POST':
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['empleado_id'], $input['turno'], $input['billeteras'])) {
        http_response_code(400);
        echo json_encode(["error" => "Datos incompletos para la apertura"]);
        break;
    }

    $empleado_id = intval($input['empleado_id']);
    $turno = $conexion->real_escape_string($input['turno']);

    // Insertar apertura
    $conexion->query("
        INSERT INTO aperturas (empleado_id, turno)
        VALUES ($empleado_id, '$turno')
    ");

    $apertura_id = $conexion->insert_id;

    // Insertar billeteras asociadas
    $stmt = $conexion->prepare("
        INSERT INTO apertura_billeteras (apertura_id, billetera_id, monto_inicial)
        VALUES (?, ?, ?)
    ");

    foreach ($input['billeteras'] as $b) {
        $billetera_id = intval($b['billetera_id']);
        $monto_inicial = floatval($b['monto_inicial']);
        $stmt->bind_param("iid", $apertura_id, $billetera_id, $monto_inicial);
        $stmt->execute();
    }

    echo json_encode(["mensaje" => "Apertura registrada", "apertura_id" => $apertura_id]);
    break;


        default:
            http_response_code(405);
            echo json_encode(["error" => "Método no permitido"]);
            break;
    }
}

// ------------------ APERTURA_BILLETERAS ------------------
if ($recurso === 'apertura_billeteras') {
    switch ($metodo) {
        case 'GET':
            if ($id) {
                // Traer una relación específica por ID
                $res = $conexion->query("
                    SELECT ab.*, b.servicio, b.titular
                    FROM apertura_billeteras ab
                    JOIN billeteras b ON ab.billetera_id = b.id
                    WHERE ab.id = $id
                ");
                $fila = $res->fetch_assoc();
                echo json_encode($fila ?: ["message" => "Registro no encontrado"]);
            } elseif (isset($_GET['apertura_id'])) {
                // Traer todas las billeteras asociadas a una apertura específica
                $apertura_id = (int)$_GET['apertura_id'];
                $res = $conexion->query("
                    SELECT ab.*, b.servicio, b.titular
                    FROM apertura_billeteras ab
                    JOIN billeteras b ON ab.billetera_id = b.id
                    WHERE ab.apertura_id = $apertura_id
                ");
                $datos = [];
                while ($fila = $res->fetch_assoc()) $datos[] = $fila;
                echo json_encode($datos);
            } else {
                // Traer todos los registros
                $res = $conexion->query("
                    SELECT ab.*, b.servicio, b.titular
                    FROM apertura_billeteras ab
                    JOIN billeteras b ON ab.billetera_id = b.id
                ");
                $datos = [];
                while ($fila = $res->fetch_assoc()) $datos[] = $fila;
                echo json_encode($datos);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Método no permitido"]);
            break;
    }
}


function guardarApertura($conexion, $data) {
  $empleadoId = $conexion->real_escape_string($data['empleadoId']);
  $turno = $conexion->real_escape_string($data['turno']);
  $billeteras = $data['billeteras'];

  // Insertar en tabla aperturas
  $conexion->query("INSERT INTO aperturas (empleado_id, turno) VALUES ($empleadoId, '$turno')");
  $aperturaId = $conexion->insert_id;

  // Insertar billeteras asociadas
  $stmt = $conexion->prepare("INSERT INTO apertura_billeteras (apertura_id, billetera_id, monto_inicial) VALUES (?, ?, ?)");
  foreach ($billeteras as $b) {
    $stmt->bind_param("iid", $aperturaId, $b['id'], $b['monto']);
    $stmt->execute();
  }

  echo json_encode(['success' => true, 'apertura_id' => $aperturaId]);
}

function guardarCierre($conexion, $data) {
  $aperturaId = $conexion->real_escape_string($data['apertura_id']);
  $premios = floatval($data['premios_pagados']);
  $bonos = floatval($data['bonos']);
  $billeteras = $data['billeteras'];
  $retiros = $data['retiros'] ?? [];

  // Insertar en cierres
  $conexion->query("INSERT INTO cierres (apertura_id, premios_pagados, bonos) VALUES ($aperturaId, $premios, $bonos)");
  $cierreId = $conexion->insert_id;

  // Insertar billeteras asociadas al cierre
  $stmt = $conexion->prepare("INSERT INTO cierre_billeteras (cierre_id, billetera_id, monto_final) VALUES (?, ?, ?)");
  foreach ($billeteras as $b) {
    $stmt->bind_param("iid", $cierreId, $b['id'], $b['monto']);
    $stmt->execute();
  }

  // Insertar retiros si existen
  if (!empty($retiros)) {
    $stmtRetiro = $conexion->prepare("INSERT INTO retiros (cierre_id, desde_billetera_id, hasta_billetera_id, monto) VALUES (?, ?, ?, ?)");
    foreach ($retiros as $r) {
      $stmtRetiro->bind_param("iiid", $cierreId, $r['desde_id'], $r['hasta_id'], $r['monto']);
      $stmtRetiro->execute();
    }
  }

  echo json_encode(['success' => true, 'cierre_id' => $cierreId]);
}

// ------------------ EMPLEADOS ------------------
if ($recurso === 'empleados') {
    switch ($metodo) {
        case 'GET':
            $query = $id ? "SELECT * FROM empleados WHERE id = $id" : "SELECT * FROM empleados";
            $res = $conexion->query($query);
            $datos = $id ? $res->fetch_assoc() : iterator_to_array($res, false);
            echo json_encode($datos);
            break;

        case 'POST':
            if (!isset($input['nombre']) || !isset($input['turno'])) {
                echo json_encode(["error" => "Faltan los campos 'nombre' o 'turno'"]);
                exit;
            }
            $nombre = $conexion->real_escape_string($input['nombre']);
            $turno = $conexion->real_escape_string($input['turno']);
            $conexion->query("INSERT INTO empleados (nombre, turno) VALUES ('$nombre', '$turno')");
            echo json_encode(["message" => "Empleado creado", "id" => $conexion->insert_id]);
            break;

case 'PUT':
    if (!$id) exit(json_encode(["error" => "Falta ID"]));
    if (!isset($input['nombre']) || !isset($input['turno'])) {
        echo json_encode(["error" => "Faltan los campos 'nombre' o 'turno'"]);
        exit;
    }
    $nombre = $conexion->real_escape_string($input['nombre']);
    $turno = $conexion->real_escape_string($input['turno']);
    $conexion->query("UPDATE empleados SET nombre = '$nombre', turno = '$turno' WHERE id = $id");
    echo json_encode(["message" => "Empleado actualizado"]);
    break;

        case 'DELETE':
            if (!$id) exit(json_encode(["error" => "Falta ID"]));
            $conexion->query("DELETE FROM empleados WHERE id = $id");
            echo json_encode(["message" => "Empleado eliminado"]);
            break;
    }
}

// ------------------ BILLETERAS ------------------
if ($recurso === 'billeteras') {
    switch ($metodo) {
        case 'GET':
            $query = $id ? "SELECT * FROM billeteras WHERE id = $id" : "SELECT * FROM billeteras";
            $res = $conexion->query($query);
            $datos = $id ? $res->fetch_assoc() : iterator_to_array($res, false);
            echo json_encode($datos);
            break;

        case 'POST':
            if (!isset($input['cbu'], $input['servicio'], $input['titular'])) {
                echo json_encode(["error" => "Faltan campos requeridos"]);
                exit;
            }
            $cbu = $conexion->real_escape_string($input['cbu']);
            $servicio = $conexion->real_escape_string($input['servicio']);
            $titular = $conexion->real_escape_string($input['titular']);
            $conexion->query("INSERT INTO billeteras (cbu, servicio, titular) VALUES ('$cbu', '$servicio', '$titular')");
            echo json_encode(["message" => "Billetera creada", "id" => $conexion->insert_id]);
            break;

        case 'PUT':
            if (!$id) exit(json_encode(["error" => "Falta ID"]));
            $cbu = $conexion->real_escape_string($input['cbu']);
            $servicio = $conexion->real_escape_string($input['servicio']);
            $titular = $conexion->real_escape_string($input['titular']);
            $conexion->query("UPDATE billeteras SET cbu='$cbu', servicio='$servicio', titular='$titular' WHERE id=$id");
            echo json_encode(["message" => "Billetera actualizada"]);
            break;

        case 'DELETE':
            if (!$id) exit(json_encode(["error" => "Falta ID"]));
            $conexion->query("DELETE FROM billeteras WHERE id = $id");
            echo json_encode(["message" => "Billetera eliminada"]);
            break;
    }
}

// ----------- RELACIÓN EMPLEADO - BILLETERA -----------
if ($recurso === 'relaciones') {
    switch ($metodo) {
        case 'GET':
            $res = $conexion->query("
                SELECT eb.id, e.nombre AS empleado, b.servicio AS billetera
                FROM empleado_billetera eb
                JOIN empleados e ON eb.empleado_id = e.id
                JOIN billeteras b ON eb.billetera_id = b.id
            ");
            $datos = [];
            while ($fila = $res->fetch_assoc()) $datos[] = $fila;
            echo json_encode($datos);
            break;

        case 'POST':
            if (!isset($input['empleado_id'], $input['billetera_id'])) {
                echo json_encode(["error" => "Faltan campos requeridos"]);
                exit;
            }
            $empleado_id = (int)$input['empleado_id'];
            $billetera_id = (int)$input['billetera_id'];
            $conexion->query("INSERT INTO empleado_billetera (empleado_id, billetera_id) VALUES ($empleado_id, $billetera_id)");
            echo json_encode(["message" => "Relación creada"]);
            break;

        case 'DELETE':
            if (!$id) exit(json_encode(["error" => "Falta ID de relación"]));
            $conexion->query("DELETE FROM empleado_billetera WHERE id = $id");
            echo json_encode(["message" => "Relación eliminada"]);
            break;
    }
}
