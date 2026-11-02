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

function notificar_estampador_pedido(string $paymentId, array $items, array $delivery): array {

    if (!defined('SMTP_HOST') || !defined('SMTP_USER') || !defined('SMTP_PASS') || !defined('ESTAMPADOR_EMAIL')) {
        return ['ok' => false, 'error' => 'faltan constantes SMTP en config.php'];
    }
    if ($paymentId === '' || !$items) return ['ok' => false, 'error' => 'falta referencia de pago o adjuntos'];

    $safeRef = preg_replace('/[^a-zA-Z0-9_-]/', '', $paymentId);
    $privateDir = dirname(__DIR__) . '/meta_pagos';
    if (!is_dir($privateDir) && !@mkdir($privateDir, 0750, true) && !is_dir($privateDir)) {
        return ['ok' => false, 'error' => 'no se pudo preparar el control privado de correo'];
    }
    $sentFile = $privateDir . '/dtf_mail_' . $safeRef . '.sent';
    $lock = @fopen($privateDir . '/dtf_mail_' . $safeRef . '.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX)) {
        if (is_resource($lock)) fclose($lock);
        return ['ok' => false, 'error' => 'no se pudo bloquear el envío para evitar duplicados'];
    }
    if (is_file($sentFile)) {
        flock($lock, LOCK_UN);
        fclose($lock);
        return ['ok' => true, 'already_sent' => true];
    }

    foreach ($items as $item) {
        $path = (string)($item['archivo'] ?? '');
        $image = $path !== '' ? @getimagesize($path) : false;
        if (!$image || ($image['mime'] ?? '') !== 'image/png') {
            flock($lock, LOCK_UN);
            fclose($lock);
            return ['ok' => false, 'error' => 'se canceló el email: un adjunto no es un PNG válido'];
        }
    }

    $e = fn($v) => htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8');
    $dest = $delivery['destinatario_nombre'] ?? '';
    $tel = $delivery['destinatario_telefono'] ?? '';
    $entrega = (($delivery['tipo_entrega'] ?? '') === 'tienda')
        ? 'Retiro en local'
        : (string)($delivery['direccion'] ?? '');
    $ids = implode(', ', array_map(fn($item) => '#' . (int)$item['pedido_id'], $items));

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

        $mail->Subject = 'Club Huella — pago ' . $e($paymentId) . ' · ' . count($items) . ' remera(s) (' . $ids . ')';

        $itemHtml = '';
        $itemText = '';
        foreach ($items as $item) {
            $itemHtml .= '<li><b>Pedido #' . (int)$item['pedido_id'] . '</b> — ' . $e($item['nombre_mascota'] ?? 'Mascota')
                . ' · ' . $e($item['estilo'] ?? '') . ' · Remera ' . $e($item['color'] ?? '')
                . ' · Talle ' . $e($item['talle'] ?? '') . '</li>';
            $itemText .= 'Pedido #' . (int)$item['pedido_id'] . ' — ' . ($item['nombre_mascota'] ?? 'Mascota')
                . ' | ' . ($item['estilo'] ?? '') . ' | ' . ($item['color'] ?? '') . ' | Talle ' . ($item['talle'] ?? '') . "\n";
        }

        $mail->isHTML(true);
        $mail->Body = "
            <div style='font-family:sans-serif;font-size:15px;color:#222'>
              <h2 style='margin:0 0 12px'>🐾 Nuevo pago {$e($paymentId)}</h2>
              <p><b>Prendas ({$e(count($items))}):</b></p><ul>{$itemHtml}</ul>
              <hr style='border:none;border-top:1px solid #ddd'>
              <p><b>Cliente:</b> {$e($dest)}<br>
                 <b>Teléfono:</b> {$e($tel)}<br>
                 <b>Entrega:</b> {$e($entrega)}</p>
              <hr style='border:none;border-top:1px solid #ddd'>
              <p>Todos los PNG adjuntos están preparados para impresión a 300 ppp.</p>
            </div>";
        $mail->AltBody =
            "Nuevo pago {$paymentId} ({$ids})\n"
            . "Prendas:\n{$itemText}"
            . "Cliente: {$dest} | Tel: {$tel}\n"
            . "Entrega: {$entrega}\n"
            . "Todos los PNG adjuntos están preparados para impresión a 300 ppp.";

        foreach ($items as $item) {
            $itemId = (int)$item['pedido_id'];
            $mail->addAttachment((string)$item['archivo'], "pedido_{$itemId}_impresion.png", 'base64', 'image/png');
        }

        $mail->send();
        if (@file_put_contents($sentFile, gmdate('c')) === false) {
            return ['ok' => false, 'error' => 'el correo salió, pero no se pudo guardar el control anti-duplicado'];
        }
        return ['ok' => true, 'cantidad_adjuntos' => count($items)];

    } catch (Throwable $ex) {
        return ['ok' => false, 'error' => $mail->ErrorInfo ?: $ex->getMessage()];
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}
