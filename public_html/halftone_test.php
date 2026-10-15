<?php
/* ============================================================
   halftone_test.php — PRUEBA de halftone DTF con GD
   ------------------------------------------------------------
   Versión con GD (funciona en cualquier server, sin depender de
   funciones de Imagick que cambian de versión).

   CÓMO USAR:
   1. Subí este archivo a public_html.
   2. Al lado, una imagen de prueba llamada  spike.jpg
   3. Entrá a:  https://clubhuella.com/halftone_test.php
      - Cambiar LPI:    ...?lpi=22   (probá 15, 22, 30)
      - Cambiar imagen: ...?img=otra.jpg
   ============================================================ */

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('memory_limit', '512M');
set_time_limit(120);

$imgName = isset($_GET['img']) ? preg_replace('/[^a-zA-Z0-9._-]/', '', $_GET['img']) : 'spike.jpg';
$lpi     = isset($_GET['lpi']) ? max(8, min(60, (int)$_GET['lpi'])) : 22;
$dpi     = 300;
$anchoA4 = 3508;

$src = __DIR__ . '/' . $imgName;

echo "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Halftone GD</title>";
echo "<style>body{background:#222;color:#eee;font-family:sans-serif;padding:20px}
      .row{display:flex;gap:20px;flex-wrap:wrap;margin-top:16px}
      .box{background:#333;padding:10px;border-radius:8px}
      img{max-width:420px;height:auto;display:block}
      code{background:#000;padding:2px 6px;border-radius:4px}</style></head><body>";
echo "<h2>Prueba de halftone DTF (GD)</h2>";
echo "<p>Imagen: <code>" . htmlspecialchars($imgName) . "</code> · LPI: <code>$lpi</code> · DPI: <code>$dpi</code> · A4</p>";

if (!function_exists('imagecreatetruecolor')) {
    exit("<p style='color:#f66'>ERROR: GD no está disponible.</p></body></html>");
}
if (!file_exists($src)) {
    exit("<p style='color:#f66'>ERROR: no encuentro <code>" . htmlspecialchars($imgName) . "</code>. Subilo al lado de este archivo.</p></body></html>");
}

/**
 * Halftone con puntos de color y fondo transparente.
 * Lo oscuro se vuelve "sin puntos" = transparente = color de la remera.
 */
function halftone_gd($srcPath, $anchoA4, $lpi, $dpi)
{
    $raw  = @file_get_contents($srcPath);
    $orig = @imagecreatefromstring($raw);
    if (!$orig) throw new Exception("No se pudo leer la imagen (formato no soportado)");

    $ow = imagesx($orig);
    $oh = imagesy($orig);
    $w  = $anchoA4;
    $h  = (int) round($oh * $anchoA4 / $ow);

    // 1) Redimensionar a ancho A4
    $full = imagecreatetruecolor($w, $h);
    imagecopyresampled($full, $orig, 0, 0, 0, 0, $w, $h, $ow, $oh);
    imagedestroy($orig);

    // 2) Grilla de celdas (promedio de color) vía downsample
    $cell  = max(2, (int) round($dpi / $lpi));   // 300/22 ≈ 14 px
    $gx    = (int) ceil($w / $cell);
    $gy    = (int) ceil($h / $cell);
    $small = imagecreatetruecolor($gx, $gy);
    imagecopyresampled($small, $full, 0, 0, 0, 0, $gx, $gy, $w, $h);
    imagedestroy($full);

    // 3) Lienzo transparente
    $out = imagecreatetruecolor($w, $h);
    imagealphablending($out, false);
    imagesavealpha($out, true);
    $transparent = imagecolorallocatealpha($out, 0, 0, 0, 127);
    imagefilledrectangle($out, 0, 0, $w, $h, $transparent);

    // 4) Un punto por celda: tamaño según luminancia, color de la celda
    $half = $cell / 2.0;
    for ($cy = 0; $cy < $gy; $cy++) {
        for ($cx = 0; $cx < $gx; $cx++) {
            $rgb = imagecolorat($small, $cx, $cy);
            $r = ($rgb >> 16) & 0xFF;
            $g = ($rgb >> 8) & 0xFF;
            $b = $rgb & 0xFF;

            $lum = (0.299 * $r + 0.587 * $g + 0.114 * $b) / 255.0;
            $cov = ($lum - 0.06) / 0.88;      // knockout de oscuro + realce
            if ($cov < 0) $cov = 0;
            if ($cov > 1) $cov = 1;

            $rad = sqrt($cov) * $half * 1.08;
            if ($rad < 0.6) continue;         // sin punto = transparente

            $cxp = (int) round($cx * $cell + $half);
            $cyp = (int) round($cy * $cell + $half);
            $dia = (int) round($rad * 2);
            if ($dia < 1) $dia = 1;

            $col = imagecolorallocatealpha($out, $r, $g, $b, 0);
            imagefilledellipse($out, $cxp, $cyp, $dia, $dia, $col);
        }
    }
    imagedestroy($small);

    if (function_exists('imageresolution')) {
        imageresolution($out, $dpi, $dpi);
    }
    return $out;
}

/** Compone la imagen transparente sobre un color de fondo y la achica para preview. */
function preview_sobre($out, $hex, $file, $anchoPrev = 420)
{
    $w = imagesx($out); $h = imagesy($out);
    $bg = imagecreatetruecolor($w, $h);
    $c  = sscanf($hex, "#%02x%02x%02x");
    $fill = imagecolorallocate($bg, $c[0], $c[1], $c[2]);
    imagefilledrectangle($bg, 0, 0, $w, $h, $fill);
    imagealphablending($bg, true);
    imagecopy($bg, $out, 0, 0, 0, 0, $w, $h);   // compone respetando alpha

    $ph = (int) round($h * $anchoPrev / $w);
    $sm = imagecreatetruecolor($anchoPrev, $ph);
    imagecopyresampled($sm, $bg, 0, 0, 0, 0, $anchoPrev, $ph, $w, $h);
    imagepng($sm, __DIR__ . '/' . $file);
    imagedestroy($bg); imagedestroy($sm);
}

try {
    $t0  = microtime(true);
    $out = halftone_gd($src, $anchoA4, $lpi, $dpi);
    $w = imagesx($out); $h = imagesy($out);

    imagepng($out, __DIR__ . '/halftone_resultado.png');   // entregable transparente
    preview_sobre($out, '#111111', 'prev_negra.png');
    preview_sobre($out, '#ffffff', 'prev_blanca.png');
    imagedestroy($out);

    $secs  = round(microtime(true) - $t0, 2);
    $cache = '?v=' . time();
    echo "<p style='color:#6f6'>OK — generado en {$secs}s. {$w}x{$h} @ {$dpi} dpi.</p>";
    echo "<div class='row'>";
    echo "<div class='box'><b>Sobre remera negra</b><br><img src='prev_negra.png{$cache}'></div>";
    echo "<div class='box'><b>Sobre remera blanca</b><br><img src='prev_blanca.png{$cache}'></div>";
    echo "</div>";
    echo "<p>Archivo final transparente: <a style='color:#9cf' href='halftone_resultado.png{$cache}' target='_blank'>halftone_resultado.png</a></p>";
    echo "<p style='color:#aaa'>Probá: <code>?lpi=15</code> · <code>?lpi=30</code></p>";

} catch (Throwable $e) {
    echo "<p style='color:#f66'><b>ERROR:</b><br>" . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p style='color:#aaa'>Copiá el mensaje y pasámelo.</p>";
}

echo "</body></html>";