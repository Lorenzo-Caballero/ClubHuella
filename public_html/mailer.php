<?php
/* ============================================================
   mailer.php — Aviso al estampador (Club Huella)
   ------------------------------------------------------------
   Manda un mail vía SMTP (Hostinger) con los datos del pedido y
   el PNG ya listo para imprimir adjunto. Usa PHPMailer.

   Requiere en config.php:
     define('SMTP_HOST', 'smtp.hostinger.com');
     define('SMTP_PORT', 465);
     define('SMTP_SECURE', 'ssl');
     define('SMTP_USER', 'pedidos@clubhuella.com');
     define('SMTP_PASS', 'la-contraseña-de-la-casilla');
     define('ESTAMPADOR_EMAIL', 'rafa.cabj1997@gmail.com');
     define('ESTAMPADOR_CC', 'nahuelherrera1997@gmail.com'); // copia (opcional)
   ============================================================ */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

function notificar_estampador(int $pedidoId, array $meta, string $printAbsPath): array {

    if (!defined('SMTP_HOST') || !defined('SMTP_USER') || !defined('ESTAMPADOR_EMAIL')) {
        return ['ok' => false, 'error' => 'faltan constantes SMTP en config.php'];
    }

    $e = fn($v) => htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8');

    $mascota = $meta['nombre_mascota'] ?? 'Mascota';
    $estilo  = $meta['estilo']         ?? '';
    $color   = $meta['color']          ?? '';
    $talle   = $meta['talle']          ?? '';
    $dest    = $meta['nombre']          ?? '';
    $tel     = $meta['telefono']        ?? '';
    $dir     = $meta['direccion']       ?? '';
    $ciudad  = $meta['ciudad']          ?? '';
    $prov    = $meta['provincia']       ?? '';
    $cp      = $meta['cp']              ?? '';
    $tipo    = $meta['tipo_entrega']    ?? 'domicilio';

    $entrega = ($tipo === 'tienda')
        ? 'Retiro en local'
        : trim("{$dir}, {$ciudad}, {$prov} (CP {$cp})", ", ");

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->SMTPSecure = defined('SMTP_SECURE') ? SMTP_SECURE : PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = defined('SMTP_PORT') ? SMTP_PORT : 465;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom(SMTP_USER, 'Club Huella');
        $mail->addAddress(ESTAMPADOR_EMAIL);
        if (defined('ESTAMPADOR_CC') && ESTAMPADOR_CC) {
            $mail->addCC(ESTAMPADOR_CC);
        }

        $mail->Subject = "Nuevo pedido #{$pedidoId} — {$mascota}";

        $mail->isHTML(true);
        $mail->Body = "
            <div style='font-family:sans-serif;font-size:15px;color:#222'>
              <h2 style='margin:0 0 12px'>🐾 Nuevo pedido #{$pedidoId}</h2>
              <p><b>Mascota:</b> {$e($mascota)}<br>
                 <b>Estilo:</b> {$e($estilo)} &middot; <b>Color:</b> {$e($color)} &middot; <b>Talle:</b> {$e($talle)}</p>
              <hr style='border:none;border-top:1px solid #ddd'>
              <p><b>Cliente:</b> {$e($dest)}<br>
                 <b>Teléfono:</b> {$e($tel)}<br>
                 <b>Entrega:</b> {$e($entrega)}</p>
              <hr style='border:none;border-top:1px solid #ddd'>
              <p>El diseño <b>listo para imprimir</b> va adjunto a este mail.</p>
            </div>";
        $mail->AltBody =
            "Nuevo pedido #{$pedidoId} - {$mascota}\n"
            . "Estilo: {$estilo} | Color: {$color} | Talle: {$talle}\n"
            . "Cliente: {$dest} | Tel: {$tel}\n"
            . "Entrega: {$entrega}\n"
            . "El diseño listo para imprimir va adjunto.";

        if ($printAbsPath && file_exists($printAbsPath)) {
            $mail->addAttachment($printAbsPath, "pedido_{$pedidoId}_impresion.png");
        }

        $mail->send();
        return ['ok' => true];

    } catch (Exception $ex) {
        return ['ok' => false, 'error' => $mail->ErrorInfo];
    }
}
