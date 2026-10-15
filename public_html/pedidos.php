<?php
/* ============================================================
   pedidos.php — Panel de pedidos de Club Huella
   ------------------------------------------------------------
   Layout maestro-detalle: tabla compacta con miniaturas a la
   izquierda; al clickear una fila se abre el detalle completo
   en un panel a la derecha. Solo LECTURA.
   Vive en public_html, junto a payments_envios.php y disenos.php.
   ============================================================ */

session_start();

require_once __DIR__ . "/../config.php";
require_once __DIR__ . "/conexion.php";

date_default_timezone_set('America/Argentina/Buenos_Aires');

/* ================= LOGIN POR CONTRASEÑA ================= */
$panelPass = defined('PANEL_PASSWORD') ? PANEL_PASSWORD : '';

if (isset($_POST['pass'])) {
    if ($panelPass !== '' && hash_equals($panelPass, (string)$_POST['pass'])) {
        $_SESSION['panel_ok'] = true;
    } else {
        $loginError = 'Contraseña incorrecta';
    }
}
if (isset($_GET['logout'])) {
    $_SESSION = [];
    session_destroy();
    header("Location: pedidos.php");
    exit;
}

if (empty($_SESSION['panel_ok'])) {
    ?>
    <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Acceso · Club Huella</title>
    <style>
      body{margin:0;background:#0f1115;color:#e7e9ee;font-family:-apple-system,Segoe UI,Roboto,sans-serif;
           display:flex;align-items:center;justify-content:center;height:100vh}
      form{background:#171a21;border:1px solid #2a2f3a;border-radius:14px;padding:28px;width:300px}
      h1{font-size:18px;margin:0 0 4px}h1 span{color:#d8b15a}
      p{color:#9aa1ad;font-size:13px;margin:0 0 18px}
      input{width:100%;padding:12px;font-size:15px;background:#0f1115;border:1px solid #2a2f3a;
            border-radius:8px;color:#e7e9ee;box-sizing:border-box}
      button{width:100%;padding:12px;margin-top:10px;background:#d8b15a;border:none;border-radius:8px;
             font-weight:700;cursor:pointer}
      .err{color:#ef4444;font-size:13px;margin-top:10px}
    </style></head><body>
      <form method="post">
        <h1>Pedidos <span>Club Huella</span></h1>
        <p>Ingresá la contraseña para continuar.</p>
        <input type="password" name="pass" placeholder="Contraseña" autofocus>
        <button type="submit">Entrar</button>
        <?php if (!empty($loginError)): ?><div class="err"><?= htmlspecialchars($loginError) ?></div><?php endif; ?>
      </form>
    </body></html>
    <?php
    exit;
}

/* ================= DATOS ================= */
$SITE_BASE = 'https://clubhuella.com/';

try {
    $pedidos = $pdo->query("SELECT * FROM pedidos ORDER BY created_at DESC")->fetchAll();
} catch (Throwable $e) {
    http_response_code(500);
    echo "Error al leer pedidos: " . htmlspecialchars($e->getMessage());
    exit;
}

$totalPedidos   = count($pedidos);
$totalFacturado = 0;
$porEstado      = [];
foreach ($pedidos as $p) {
    $totalFacturado += (int)$p['total'];
    $e = $p['estado'] ?? 'pendiente';
    $porEstado[$e] = ($porEstado[$e] ?? 0) + 1;
}

/* ================= HELPERS ================= */
function h($v) { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
function money($v) { return '$' . number_format((int)$v, 0, ',', '.'); }
function fecha($v) { if (!$v) return '—'; $ts = strtotime($v); return $ts ? date('d/m/Y H:i', $ts) : h($v); }
function estadoColor($e) {
    return ['pendiente'=>'#9ca3af','aprobado'=>'#22c55e','en_preparacion'=>'#f59e0b',
            'enviado'=>'#3b82f6','entregado'=>'#10b981','cancelado'=>'#ef4444'][$e] ?? '#9ca3af';
}
function estadoLabel($e) {
    return ['pendiente'=>'Pendiente','aprobado'=>'Aprobado','en_preparacion'=>'En preparación',
            'enviado'=>'Enviado','entregado'=>'Entregado','cancelado'=>'Cancelado'][$e] ?? ucfirst($e);
}

// Array para el detalle (se inyecta como JSON y lo lee el JS)
$pedidosJson = [];
foreach ($pedidos as $p) {
    $img = trim((string)$p['imagen_url']);
    $pedidosJson[(int)$p['id']] = [
        'id'        => (int)$p['id'],
        'img'       => $img ? ($SITE_BASE . ltrim($img, '/')) : '',
        'mascota'   => $p['nombre_mascota'],
        'estilo'    => $p['estilo'],
        'color'     => $p['color'],
        'talle'     => $p['talle'],
        'estado'    => $p['estado'],
        'estadoLbl' => estadoLabel($p['estado']),
        'estadoCol' => estadoColor($p['estado']),
        'cliente'   => $p['destinatario_nombre'],
        'tel'       => $p['destinatario_telefono'],
        'entrega'   => ($p['tipo_entrega'] === 'tienda')
                        ? 'Retiro en local'
                        : ($p['direccion_completa'] ?: trim(($p['ciudad'] ?? '') . ', ' . ($p['provincia'] ?? ''))),
        'precioRem' => money($p['precio_remera']),
        'precioEnv' => $p['precio_envio'] > 0 ? money($p['precio_envio']) : 'Gratis / retiro',
        'total'     => money($p['total']),
        'carrier'   => trim(($p['carrier'] ?? '') . ' ' . ($p['carrier_service'] ?? '')),
        'tracking'  => $p['tracking_number'],
        'trackUrl'  => $p['tracking_url'],
        'mpId'      => $p['mp_payment_id'],
        'disenoId'  => $p['diseno_id'],
        'fecha'     => fecha($p['paid_at'] ?: $p['created_at']),
    ];
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
  :root{--bg:#0f1115;--panel:#171a21;--panel2:#1e222b;--border:#2a2f3a;--text:#e7e9ee;--muted:#9aa1ad;--gold:#d8b15a;}
  *{box-sizing:border-box;}
  body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}
  .top{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:10px;}
  h1{font-size:19px;margin:0;}h1 span{color:var(--gold);}
  .stats{display:flex;gap:18px;font-size:13px;color:var(--muted);align-items:center;flex-wrap:wrap;}
  .stats b{color:var(--text);font-size:15px;}
  .stats .g{color:var(--gold);}
  .logout{color:var(--muted);font-size:12px;text-decoration:none;border:1px solid var(--border);padding:6px 12px;border-radius:8px;}

  .layout{display:flex;height:calc(100vh - 65px);}
  .list{flex:1;overflow-y:auto;min-width:0;}
  table{width:100%;border-collapse:collapse;}
  thead th{position:sticky;top:0;background:var(--panel);color:var(--muted);font-size:11px;text-transform:uppercase;
           letter-spacing:.5px;text-align:left;padding:10px 14px;border-bottom:1px solid var(--border);}
  tbody tr{cursor:pointer;border-bottom:1px solid var(--border);transition:background .12s;}
  tbody tr:hover{background:var(--panel);}
  tbody tr.active{background:var(--panel2);box-shadow:inset 3px 0 0 var(--gold);}
  td{padding:10px 14px;font-size:13.5px;vertical-align:middle;}
  .thumb{width:42px;height:42px;border-radius:8px;object-fit:cover;background:var(--panel2);display:block;}
  .thumb-ph{width:42px;height:42px;border-radius:8px;background:var(--panel2);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--muted);}
  .pet{font-weight:700;}
  .sub{color:var(--muted);font-size:11.5px;text-transform:uppercase;letter-spacing:.4px;}
  .pill{font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;color:#0f1115;white-space:nowrap;}
  .tot{font-weight:700;color:var(--gold);white-space:nowrap;}

  .detail{width:360px;border-left:1px solid var(--border);background:var(--panel);overflow-y:auto;flex-shrink:0;}
  .detail .empty{color:var(--muted);font-size:14px;text-align:center;padding:80px 24px;}
  .detail .d-img{width:100%;aspect-ratio:1/1;object-fit:cover;background:var(--panel2);display:block;}
  .detail .d-body{padding:18px 20px;}
  .d-row{display:flex;justify-content:space-between;align-items:baseline;gap:10px;}
  .d-pet{font-size:20px;font-weight:700;}
  .d-style{color:var(--gold);font-size:12px;text-transform:uppercase;letter-spacing:.5px;}
  .d-tot{font-size:18px;font-weight:700;color:var(--gold);}
  .d-meta{color:var(--muted);font-size:12px;margin-top:3px;}
  hr{border:none;border-top:1px solid var(--border);margin:14px 0;}
  .kv{font-size:13.5px;line-height:1.7;}
  .kv b{color:var(--muted);font-weight:600;}
  .kv a{color:#7fb4ff;text-decoration:none;}
  .d-ids{font-size:11px;color:var(--muted);margin-top:12px;word-break:break-all;}
  .empty-list{padding:60px 24px;text-align:center;color:var(--muted);}
  .close{display:none;position:sticky;top:0;background:var(--panel);padding:12px 20px;border-bottom:1px solid var(--border);
         cursor:pointer;color:var(--gold);font-weight:700;}
  @media(max-width:820px){
    .detail{display:none;}
    .detail.open{display:block;position:fixed;inset:0;width:100%;z-index:50;}
    .detail.open .close{display:block;}
  }
</style>
</head>
<body>

<div class="top">
  <h1>Pedidos <span>Club Huella</span></h1>
  <div class="stats">
    <span><b><?= $totalPedidos ?></b> pedidos</span>
    <span class="g"><b class="g"><?= money($totalFacturado) ?></b> facturado</span>
    <?php foreach ($porEstado as $est => $cant): ?>
      <span><b><?= $cant ?></b> <?= h(estadoLabel($est)) ?></span>
    <?php endforeach; ?>
    <a class="logout" href="?logout=1">Salir</a>
  </div>
</div>

<?php if ($totalPedidos === 0): ?>
  <div class="empty-list">Todavía no hay pedidos.<br>Cuando se confirme el primer pago aprobado, va a aparecer acá.</div>
<?php else: ?>
<div class="layout">
  <div class="list">
    <table>
      <thead><tr>
        <th></th><th>Mascota</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th>
      </tr></thead>
      <tbody>
        <?php foreach ($pedidos as $p):
          $id = (int)$p['id'];
          $img = trim((string)$p['imagen_url']);
          $imgUrl = $img ? ($SITE_BASE . ltrim($img, '/')) : '';
        ?>
        <tr data-id="<?= $id ?>" onclick="verDetalle(<?= $id ?>, this)">
          <td>
            <?php if ($imgUrl): ?>
              <img class="thumb" src="<?= h($imgUrl) ?>" alt="" loading="lazy">
            <?php else: ?>
              <div class="thumb-ph">s/img</div>
            <?php endif; ?>
          </td>
          <td>
            <div class="pet"><?= h($p['nombre_mascota'] ?: '—') ?></div>
            <div class="sub"><?= h($p['estilo']) ?> · <?= h($p['talle']) ?></div>
          </td>
          <td><?= h($p['destinatario_nombre'] ?: '—') ?></td>
          <td class="tot"><?= money($p['total']) ?></td>
          <td><span class="pill" style="background:<?= estadoColor($p['estado']) ?>"><?= h(estadoLabel($p['estado'])) ?></span></td>
          <td style="color:var(--muted);font-size:12.5px;"><?= fecha($p['paid_at'] ?: $p['created_at']) ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <div class="detail" id="detail">
    <div class="close" onclick="cerrarDetalle()">← Volver</div>
    <div class="empty" id="detailEmpty">Tocá un pedido para ver el detalle.</div>
    <div id="detailContent" style="display:none;"></div>
  </div>
</div>
<?php endif; ?>

<script>
  const PEDIDOS = <?= json_encode($pedidosJson, JSON_UNESCAPED_UNICODE) ?>;

  function esc(s){ return String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  function verDetalle(id, row){
    document.querySelectorAll('tbody tr').forEach(t => t.classList.remove('active'));
    if (row) row.classList.add('active');

    const p = PEDIDOS[id];
    if (!p) return;

    const img = p.img
      ? `<img class="d-img" src="${esc(p.img)}" alt="">`
      : `<div class="d-img" style="display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:13px;">Sin imagen</div>`;

    const track = p.tracking
      ? `<br><b>Tracking:</b> ` + (p.trackUrl
          ? `<a href="${esc(p.trackUrl)}" target="_blank" rel="noopener">${esc(p.tracking)}</a>`
          : esc(p.tracking))
      : '';

    const carrier = p.carrier ? `<br><b>Correo:</b> ${esc(p.carrier)}` : '';

    document.getElementById('detailContent').innerHTML = `
      ${img}
      <div class="d-body">
        <div class="d-row">
          <div>
            <div class="d-pet">${esc(p.mascota)}</div>
            <div class="d-style">${esc(p.estilo)} · ${esc(p.color)} · Talle ${esc(p.talle)}</div>
          </div>
          <div class="d-tot">${esc(p.total)}</div>
        </div>
        <div class="d-meta">Pedido #${p.id} · ${esc(p.fecha)}
          &nbsp;<span class="pill" style="background:${p.estadoCol}">${esc(p.estadoLbl)}</span>
        </div>
        <hr>
        <div class="kv">
          <b>Cliente:</b> ${esc(p.cliente)}<br>
          <b>Tel:</b> ${esc(p.tel) || '—'}<br>
          <b>Entrega:</b> ${esc(p.entrega)}
        </div>
        <hr>
        <div class="kv">
          <b>Remera:</b> ${esc(p.precioRem)} · <b>Envío:</b> ${esc(p.precioEnv)}${carrier}${track}
        </div>
        <div class="d-ids">MP: ${esc(p.mpId)} · Diseño: ${esc(p.disenoId)}</div>
      </div>`;

    document.getElementById('detailEmpty').style.display = 'none';
    document.getElementById('detailContent').style.display = 'block';
    document.getElementById('detail').classList.add('open');
  }

  function cerrarDetalle(){ document.getElementById('detail').classList.remove('open'); }

  // En pantallas anchas, abrir el primer pedido por defecto
  window.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth > 820) {
      const first = document.querySelector('tbody tr');
      if (first) verDetalle(parseInt(first.dataset.id), first);
    }
  });
</script>
</body>
</html>