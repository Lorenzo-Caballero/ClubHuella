<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=utf-8");
date_default_timezone_set('America/Argentina/Buenos_Aires');

// ================= CORS =================
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://argames.store"
];

if ($origin && in_array($origin, $allowedOrigins, true)) {
  header("Access-Control-Allow-Origin: $origin");
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// ================= CONFIG =================
// ⚠️ Credenciales reales removidas del código (quedaron expuestas en git y hay que
// rotarlas). Definir en config.php: define('ENVIA_API_KEY', '...'); define('MP_ACCESS_TOKEN', '...');
require_once __DIR__ . "/../config.php";
$ENVIA_API = defined('ENVIA_API_KEY') ? ENVIA_API_KEY : '';
$MP_TOKEN  = defined('MP_ACCESS_TOKEN') ? MP_ACCESS_TOKEN : '';

// ================= UTILS =================
function sendJSON($data, $status = 200){
  http_response_code($status);
  echo json_encode($data);
  exit;
}

// ================= SDK =================
require_once __DIR__ . "/vendor/autoload.php";

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\Client\Payment\PaymentClient;

MercadoPagoConfig::setAccessToken($MP_TOKEN);

// ================= INPUT =================
$input = json_decode(file_get_contents("php://input"), true);

// ================= ROUTER =================
$action = $_GET['action'] ?? '';


// ================= PAGAR =================
if($action === "pagar"){

  $input = json_decode(file_get_contents("php://input"), true);

  if(empty($input)){
    sendJSON(["ok"=>false,"error"=>"Sin datos"]);
  }

  foreach(["price","carrier","service"] as $f){
    if(!isset($input[$f])){
      sendJSON(["ok"=>false,"error"=>"Falta $f"]);
    }
  }

$precioProducto = 45000;
$precioEnvio = (float)$input["price"];

$pref = $client->create([
  "items"=>[
    [
      "title"=>"Producto Club Huella", // 🔥 NOMBRE FINAL
      "quantity"=>1,
      "unit_price"=>$precioProducto,
      "currency_id"=>"ARS"
    ],
    [
      "title"=>"Envío ".$input["service"],
      "quantity"=>1,
      "unit_price"=>$precioEnvio,
      "currency_id"=>"ARS"
    ]
  ]
]);

    sendJSON([
      "ok"=>true,
      "init_point"=>$pref->init_point
    ]);

  }catch(Throwable $e){
    sendJSON([
      "ok"=>false,
      "error"=>$e->getMessage()
    ]);
  }
}// ================= SUCCESS =================
if($action === "success"){

  $paymentId = $_GET['payment_id'] ?? null;

  if(!$paymentId){
    echo "Pago inválido";
    exit;
  }

  $client = new PaymentClient();
  $payment = $client->get($paymentId);

  if($payment->status !== "approved"){
    echo "Pago no aprobado";
    exit;
  }

  $data = (array)$payment->metadata;

  