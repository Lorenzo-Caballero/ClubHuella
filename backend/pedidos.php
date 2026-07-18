<?php
/* ============================================================
   pedidos.php — Panel de pedidos de Club Huella
   ------------------------------------------------------------
   Muestra todos los pedidos con su diseño generado, datos del
   cliente, envío y estado. Solo LECTURA (no toca el flujo de
   compra). Pensado para vivir en la raíz del sitio, junto a
   payments_envios.php y disenos.php.
   ============================================================ */

session_start();

require_once __DIR__ . "/../config.php";
require_once __DIR__ . "/conexion.php";

/* ============================================================
   AUTENTICACIÓN
   Definir PANEL_PASSWORD en config.php (fuera de public_html).
   ============================================================ */
if (($_POST['pass'] ?? '') === (defined('PANEL_PASSWORD') ? PANEL_PASSWORD : '')) {
    $_SESSION['panel_ok'] = true;
}
if (empty($_SESSION['panel_ok'])) {
    echo '<form method="post" style="margin:80px auto;max-width:280px;font-family:sans-serif">
            <input type="password" name="pass" placeholder="Contraseña"
                   style="width:100%;padding:12px;font-size:16px">
            <button style="width:100%;padding:12px;margin-top:8px">Entrar</button>
          </form>';
    exit;
}

date_default_timezone_set('America/Argentina/Buenos_Aires');

// Base pública del sitio (para construir la URL de las imágenes generadas)
$SITE_BASE = 'https://clubhuella.com/';

/* ============================================================
   Traer los pedidos (todos, más nuevos primero)
   ============================================================ */
try {
    $pedidos = $pdo->query("SELECT * FROM pedidos ORDER BY created_at DESC")->fetchAll();
} catch (Throwable $e) {
    http_response_code(500);
    echo "Error al leer pedidos: " . htmlspecialchars($e->getMessage());
    exit;
}

/* ============================================================
   Resumen rápido (totales)
   ============================================================ */
$totalPedidos   = count($pedidos);
$totalFacturado = 0;
$porEstado      = [];
foreach ($pedidos as $p) {
    $totalFacturado += (int)$p['total'];
    $e = $p['estado'] ?? 'pendiente';
    $porEstado[$e] = ($porEstado[$e] ?? 0) + 1;
}

/* ============================================================
   Helpers de presentación
   ============================================================ */
function h($v) { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }

function money($v) { return '$' . number_format((int)$v, 0, ',', '.'); }

function fecha($v) {
    if (!$v) return '—';
    $ts = strtotime($v);
    return $ts ? date('d/m/Y H:i', $ts) : h($v);
}

// Color del badge según estado
function estadoColor($estado) {
    return [
        'pendiente'      => '#9ca3af',
        'aprobado'       => '#22c55e',
        'en_preparacion' => '#f59e0b',
        'enviado'        => '#3b82f6',
        'entregado'      => '#10b981',
        'cancelado'      => '#ef4444',
    ][$estado] ?? '#9ca3af';
}

function estadoLabel($estado) {
    return [
        'pendiente'      => 'Pendiente',
        'aprobado'       => 'Aprobado',
        'en_preparacion' => 'En preparación',
        'enviado'        => 'Enviado',
        'entregado'      => 'Entregado',
        'cancelado'      => 'Cancelado',
    ][$estado] ?? ucfirst($estado);
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Pedidos · Club Huella</title>
<style>
  :root {
    --bg: #0f1115;
    --panel: #171a21;
    --panel-2: #1e222b;
    --border: #2a2f3a;
    --text: #e7e9ee;
    --muted: #9aa1ad;
    --gold: #d8b15a;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 24px;
  }
  .wrap { max-width: 1200px; margin: 0 auto; }
  header.top {
    display: flex; align-items: baseline; justify-content: space-between;
    flex-wrap: wrap; gap: 12px; margin-bottom: 8px;
  }
  h1 { font-size: 22px; margin: 0; letter-spacing: .3px; }
  h1 span { color: var(--gold); }
  .sub { color: var(--muted); font-size: 13px; }

  .stats { display: flex; gap: 12px; flex-wrap: wrap; margin: 18px 0 26px; }
  .stat {
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 12px; padding: 12px 16px; min-width: 130px;
  }
  .stat .n { font-size: 20px; font-weight: 700; }
  .stat .l { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .stat.gold .n { color: var(--gold); }

  .grid {
    display: grid; gap: 16px;
    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  }
  .card {
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 14px; overflow: hidden; display: flex; flex-direction: column;
  }
  .card .img {
    aspect-ratio: 1/1; background: var(--panel-2);
    display: flex; align-items: center; justify-content: center; position: relative;
  }
  .card .img img { width: 100%; height: 100%; object-fit: cover; }
  .card .img .ph { color: var(--muted); font-size: 13px; }
  .badge {
    position: absolute; top: 10px; right: 10px;
    font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px;
    color: #0f1115;
  }
  .body { padding: 14px 16px 16px; }
  .row { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }
  .pet { font-size: 17px; font-weight: 700; }
  .style { font-size: 12px; color: var(--gold); text-transform: uppercase; letter-spacing: .5px; }
  .meta { color: var(--muted); font-size: 12.5px; margin-top: 2px; }
  hr { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
  .kv { font-size: 13px; line-height: 1.5; }
  .kv b { color: var(--muted); font-weight: 600; }
  .total { font-size: 16px; font-weight: 700; color: var(--gold); }
  .track a { color: #7fb4ff; text-decoration: none; font-size: 12.5px; }
  .ids { font-size: 11px; color: var(--muted); margin-top: 8px; word-break: break-all; }
  .empty {
    text-align: center; color: var(--muted); padding: 60px 20px;
    border: 1px dashed var(--border); border-radius: 14px;
  }
</style>
</head>
<body>
<div class="wrap">

  <header class="top">
    <div>
      <h1>Pedidos <span>Club Huella</span></h1>
      <div class="sub">Actualizado <?= date('d/m/Y H:i') ?></div>
    </div>
  </header>

  <div class="stats">
    <div class="stat"><div class="n"><?= $totalPedidos ?></div><div class="l">Pedidos totales</div></div>
    <div class="stat gold"><div class="n"><?= money($totalFacturado) ?></div><div class="l">Facturado</div></div>
    <?php foreach ($porEstado as $est => $cant): ?>
      <div class="stat"><div class="n"><?= $cant ?></div><div class="l"><?= h(estadoLabel($est)) ?></div></div>
    <?php endforeach; ?>
  </div>

  <?php if ($totalPedidos === 0): ?>
    <div class="empty">
      Todavía no hay pedidos registrados.<br>
      Cuando se confirme el primer pago aprobado, va a aparecer acá.
    </div>
  <?php else: ?>
    <div class="grid">
      <?php foreach ($pedidos as $p):
        $estado = $p['estado'] ?? 'pendiente';
        $img    = trim((string)$p['imagen_url']);
        $imgUrl = $img ? ($SITE_BASE . ltrim($img, '/')) : '';
      ?>
        <div class="card">
          <div class="img">
            <?php if ($imgUrl): ?>
              <img src="<?= h($imgUrl) ?>" alt="Diseño de <?= h($p['nombre_mascota']) ?>" loading="lazy">
            <?php else: ?>
              <span class="ph">Sin imagen</span>
            <?php endif; ?>
            <span class="badge" style="background: <?= estadoColor($estado) ?>">
              <?= h(estadoLabel($estado)) ?>
            </span>
          </div>

          <div class="body">
            <div class="row">
              <div>
                <div class="pet"><?= h($p['nombre_mascota'] ?: '—') ?></div>
                <div class="style"><?= h($p['estilo']) ?> · <?= h($p['color']) ?> · Talle <?= h($p['talle']) ?></div>
              </div>
              <div class="total"><?= money($p['total']) ?></div>
            </div>
            <div class="meta">Pedido #<?= (int)$p['id'] ?> · <?= fecha($p['paid_at'] ?: $p['created_at']) ?></div>

            <hr>

            <div class="kv">
              <b>Cliente:</b> <?= h($p['destinatario_nombre'] ?: '—') ?><br>
              <b>Tel:</b> <?= h($p['destinatario_telefono'] ?: '—') ?><br>
              <b>Entrega:</b>
              <?php if (($p['tipo_entrega'] ?? '') === 'tienda'): ?>
                Retiro en local
              <?php else: ?>
                <?= h($p['direccion_completa'] ?: trim(($p['ciudad'] ?? '') . ', ' . ($p['provincia'] ?? ''))) ?>
              <?php endif; ?>
            </div>

            <hr>

            <div class="kv">
              <b>Remera:</b> <?= money($p['precio_remera']) ?> ·
              <b>Envío:</b> <?= $p['precio_envio'] > 0 ? money($p['precio_envio']) : 'Gratis/retiro' ?><br>
              <?php if (!empty($p['carrier'])): ?>
                <b>Correo:</b> <?= h($p['carrier']) ?> <?= h($p['carrier_service']) ?><br>
              <?php endif; ?>
              <?php if (!empty($p['tracking_number'])): ?>
                <span class="track"><b>Tracking:</b>
                  <?php if (!empty($p['tracking_url'])): ?>
                    <a href="<?= h($p['tracking_url']) ?>" target="_blank" rel="noopener"><?= h($p['tracking_number']) ?></a>
                  <?php else: ?>
                    <?= h($p['tracking_number']) ?>
                  <?php endif; ?>
                </span><br>
              <?php endif; ?>
            </div>

            <div class="ids">MP: <?= h($p['mp_payment_id']) ?> · Diseño: <?= h($p['diseno_id']) ?></div>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>

</div>
</body>
</html>
