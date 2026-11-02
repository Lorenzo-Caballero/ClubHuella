<?php
/* ============================================================
   dtf.php — Procesamiento DTF de Club Huella
   ------------------------------------------------------------
   Se ejecuta SOLO cuando un pago está confirmado (lo llama el
   webhook de payments_envios.php). Nunca procesa diseños que
   no se compraron.

   - Vogue y Granulado en ambos colores → halftone invertido según el color
       de la tela, para que las zonas del fondo sean transparencias reales.
   - Street y Retro bootleg sobre negro → knockout de sombras con halftone.
   - Clean Look y Polaroid: recorte en blanco; knockout con halftone en negro.

   Parámetros editables desde config.php:
       define('HALFTONE_LPI', 22);
       define('HALFTONE_ANCHO', 3508);   // aprox. 29,7 cm @ 300 ppp
       define('HALFTONE_DPI', 300);
   FAL_API_KEY también sale de config.php.
   ============================================================ */

// Cargar el módulo de mail al estampador (si está presente)
if (file_exists(__DIR__ . '/mailer.php')) {
    require_once __DIR__ . '/mailer.php';
}

if (!defined('HALFTONE_LPI'))   define('HALFTONE_LPI', 22);
if (!defined('HALFTONE_ANCHO')) define('HALFTONE_ANCHO', 3508);
if (!defined('HALFTONE_ALTO'))  define('HALFTONE_ALTO', (int)round(HALFTONE_ANCHO * 1200 / 896));
if (!defined('HALFTONE_DPI'))   define('HALFTONE_DPI', 300);
if (!defined('FAL_ENDPOINT'))   define('FAL_ENDPOINT', 'https://fal.run/fal-ai/bria/background/remove');

/* ============================================================
   REGLAS DE ESTILO (slugs internos; no son las etiquetas visibles)
   retro      = Granulado (el halftone es parte del estilo; no recortarlo con IA)
   rap-tee    = Retro bootleg / galaxia
   streetwear = Street
   collage    = Clean Look
   ============================================================ */
function estilos_solo_negra(): array {
    return ['rap-tee', 'streetwear'];
}
function color_dtf_por_estilo(): array {
    return [
        'vogue' => ['blanca', 'negra'],
        'retro' => ['blanca', 'negra'],
        'streetwear' => ['negra'],
        'collage' => ['blanca', 'negra'],
        'minimal' => ['blanca', 'negra'],
        'rap-tee' => ['negra'],
    ];
}
function estilo_se_recorta(string $estilo): bool {
    return !in_array($estilo, ['vogue', 'retro', 'rap-tee', 'streetwear'], true);
}

/* ============================================================
   HALFTONE con GD — mismo método ya probado en halftone_test.php
   Devuelve un recurso GD (imagen) con puntos de color y fondo
   transparente. Lo oscuro se vuelve "sin puntos" = transparente.
   ============================================================ */
function halftone_gd(string $srcPath, int $ancho, int $lpi, int $dpi, string $colorRemera = 'negra') {
    $raw  = @file_get_contents($srcPath);
    if ($raw === false) throw new Exception('halftone: no se pudo leer el diseño de origen');
    $orig = @imagecreatefromstring($raw);
    unset($raw);
    if (!$orig) throw new Exception("halftone: no se pudo leer $srcPath");

    $ow = imagesx($orig);
    $oh = imagesy($orig);
    $w  = $ancho;
    $h  = (int) round($oh * $ancho / $ow);
    if ($ow < $w || $oh < $h) {
        imagedestroy($orig);
        throw new Exception("Resolución insuficiente: {$ow}x{$oh}; se requiere al menos {$w}x{$h} px.");
    }

    // 1) Reducir a una celda por punto directamente desde el original. Así
    // evitamos mantener otra copia gigante del arte 4K en memoria.
    $cell  = max(2, (int) round($dpi / $lpi));
    $gx    = (int) ceil($w / $cell);
    $gy    = (int) ceil($h / $cell);
    $small = imagecreatetruecolor($gx, $gy);
    imagecopyresampled($small, $orig, 0, 0, 0, 0, $gx, $gy, $ow, $oh);
    imagedestroy($orig);

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
            // En negro se eliminan sombras para que se vea la tela.
            // En blanco se eliminan fondos claros y se tramaban las tintas oscuras.
            $signal = $colorRemera === 'blanca' ? (1.0 - $lum) : $lum;
            $cov = ($signal - 0.06) / 0.88;
            if ($cov < 0) $cov = 0;
            if ($cov > 1) $cov = 1;

            $rad = sqrt($cov) * $half * 1.08;
            if ($rad < 0.6) continue;

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

/* ============================================================
   RECORTE DE FONDO con fal.ai (Bria RMBG 2.0)
   Devuelve ['png' => bytes] o ['error' => '...'].
   ============================================================ */
function quitar_fondo_fal(string $imgBytes, string $mime): array {
    if (!defined('FAL_API_KEY') || !FAL_API_KEY) {
        return ["error" => "Falta FAL_API_KEY en config.php"];
    }

    $dataUri = "data:{$mime};base64," . base64_encode($imgBytes);
    $payload = ["image_url" => $dataUri, "sync_mode" => true];

    $ch = curl_init(FAL_ENDPOINT);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            "Authorization: Key " . FAL_API_KEY,
            "Content-Type: application/json",
        ],
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_TIMEOUT        => 90,
        CURLOPT_CONNECTTIMEOUT => 30,
    ]);
    $resp = curl_exec($ch);
    $err  = curl_error($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($err)   return ["error" => "fal cURL: $err"];
    if (!$resp)  return ["error" => "fal respuesta vacía"];

    $data = json_decode($resp, true);
    if ($code >= 400 || !is_array($data)) {
        return ["error" => "fal HTTP $code", "raw" => substr((string)$resp, 0, 300)];
    }
    $url = $data['image']['url'] ?? null;
    if (!$url) return ["error" => "fal sin imagen", "raw" => substr((string)$resp, 0, 300)];

    if (strpos($url, 'data:') === 0) {
        if (!preg_match('/^data:[^;]+;base64,(.+)$/', $url, $m)) return ["error" => "fal data URI inválido"];
        $bin = base64_decode($m[1], true);
        if ($bin === false) return ["error" => "fal base64 inválido"];
        return ["png" => $bin];
    }
    $bin = @file_get_contents($url);
    if ($bin === false) return ["error" => "no se pudo bajar el PNG de fal"];
    return ["png" => $bin];
}

/** Comprueba que la transparencia sea visible en una parte real del lienzo. */
function imagen_tiene_transparencia($im): bool {
    $w = imagesx($im);
    $h = imagesy($im);
    $transparent = 0;
    $samples = 0;
    // Muestreo de una grilla para rechazar exportaciones prácticamente opacas
    // sin recorrer los más de 16 millones de píxeles del archivo final.
    for ($gy = 0; $gy <= 32; $gy++) {
        for ($gx = 0; $gx <= 32; $gx++) {
            $x = (int) round($gx * ($w - 1) / 32);
            $y = (int) round($gy * ($h - 1) / 32);
            $rgba = imagecolorat($im, $x, $y);
            if (imageistruecolor($im)) {
                $alpha = ($rgba >> 24) & 0x7F;
            } else {
                $palette = imagecolorsforindex($im, $rgba);
                $alpha = (int)($palette['alpha'] ?? 0);
            }
            $samples++;
            if ($alpha >= 16) $transparent++;
        }
    }
    return $samples > 0 && ($transparent / $samples) >= 0.02;
}

/** Lee el chunk pHYs y devuelve la resolución en píxeles por metro. */
function png_resolucion(string $path): ?array {
    $handle = @fopen($path, 'rb');
    if (!$handle) return null;
    try {
        if (fread($handle, 8) !== "\x89PNG\r\n\x1a\n") return null;
        while (!feof($handle)) {
            $header = fread($handle, 8);
            if ($header === false || strlen($header) !== 8) return null;
            $length = unpack('N', substr($header, 0, 4))[1];
            $type = substr($header, 4, 4);
            if ($length > 1000000) return null;
            $data = $length > 0 ? fread($handle, $length) : '';
            $crc = fread($handle, 4);
            if ($data === false || strlen($data) !== $length || strlen($crc) !== 4) return null;
            if ($type === 'pHYs') {
                if ($length !== 9 || ord($data[8]) !== 1) return null;
                $resolution = unpack('Nx/Ny', substr($data, 0, 8));
                return ['x' => $resolution['x'], 'y' => $resolution['y']];
            }
            if ($type === 'IEND') return null;
        }
    } finally {
        fclose($handle);
    }
    return null;
}

/**
 * Guarda una imagen como PNG a tamaño de producción y 300 ppp.
 * No amplía arte pequeño: detecta la baja resolución antes de enviar a imprimir.
 */
function escribir_png_impresion(string $bytes, string $printPath, bool $requiereTransparencia = true): array {
    $info = @getimagesizefromstring($bytes);
    if (!$info || empty($info[0]) || empty($info[1])) {
        return ['ok' => false, 'error' => 'El resultado no es una imagen válida.'];
    }

    $srcW = (int) $info[0];
    $srcH = (int) $info[1];
    $dstW = HALFTONE_ANCHO;
    $dstH = HALFTONE_ALTO;
    if ($srcW < $dstW || $srcH < $dstH) {
        return [
            'ok' => false,
            'error' => "Resolución insuficiente: {$srcW}x{$srcH}; mínimo {$dstW}x{$dstH} px para 300 ppp.",
        ];
    }

    $im = @imagecreatefromstring($bytes);
    if (!$im) return ['ok' => false, 'error' => 'GD no pudo abrir la imagen para exportarla a PNG.'];

    $hasAlpha = imagen_tiene_transparencia($im);
    if ($requiereTransparencia && !$hasAlpha) {
        imagedestroy($im);
        return ['ok' => false, 'error' => 'El archivo no tiene transparencia real; se retuvo para revisión.'];
    }

    $dst = imagecreatetruecolor($dstW, $dstH);
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
    imagefilledrectangle($dst, 0, 0, $dstW, $dstH, $transparent);
    $scale = min($dstW / $srcW, $dstH / $srcH);
    $fitW = max(1, (int) round($srcW * $scale));
    $fitH = max(1, (int) round($srcH * $scale));
    $dstX = (int) floor(($dstW - $fitW) / 2);
    $dstY = (int) floor(($dstH - $fitH) / 2);
    imagecopyresampled($dst, $im, $dstX, $dstY, 0, 0, $fitW, $fitH, $srcW, $srcH);
    imagedestroy($im);

    if (function_exists('imageresolution')) imageresolution($dst, HALFTONE_DPI, HALFTONE_DPI);
    $tmpPath = $printPath . '.tmp';
    $saved = @imagepng($dst, $tmpPath, 6, PNG_ALL_FILTERS);
    imagedestroy($dst);
    if (!$saved || !is_file($tmpPath) || filesize($tmpPath) < 1000) {
        @unlink($tmpPath);
        return ['ok' => false, 'error' => 'No se pudo guardar el PNG de impresión.'];
    }
    $savedInfo = @getimagesize($tmpPath);
    if (!$savedInfo || ($savedInfo['mime'] ?? '') !== 'image/png' || $savedInfo[0] !== $dstW || $savedInfo[1] !== $dstH) {
        @unlink($tmpPath);
        return ['ok' => false, 'error' => 'El PNG exportado no pasó la validación de formato y tamaño.'];
    }
    if (is_file($printPath)) @unlink($printPath);
    if (!@rename($tmpPath, $printPath)) {
        @unlink($tmpPath);
        return ['ok' => false, 'error' => 'No se pudo publicar el archivo de impresión.'];
    }
    return ['ok' => true, 'width' => $dstW, 'height' => $dstH, 'dpi' => HALFTONE_DPI];
}

/* ============================================================
   PREPARAR ARCHIVO DE UNA REMERA
   No envía correo acá: el pedido entero se procesa primero y se
   envía en un único email con todos sus adjuntos.
   ============================================================ */
function validar_png_impresion(string $path): array {
    if (!is_file($path) || filesize($path) < 1000) return ['ok' => false, 'error' => 'No existe un archivo de impresión válido.'];
    $info = @getimagesize($path);
    if (!$info || empty($info[0]) || empty($info[1])) return ['ok' => false, 'error' => 'El archivo no es una imagen válida.'];
    $targetW = HALFTONE_ANCHO;
    $targetH = HALFTONE_ALTO;
    if (($info['mime'] ?? '') !== 'image/png' || $info[0] !== $targetW || $info[1] !== $targetH) {
        return ['ok' => false, 'error' => 'El archivo no es PNG o no tiene tamaño de impresión.'];
    }
    $im = @imagecreatefrompng($path);
    if (!$im) return ['ok' => false, 'error' => 'No se pudo abrir el PNG de impresión.'];
    $transparent = imagen_tiene_transparencia($im);
    imagedestroy($im);
    if (!$transparent) return ['ok' => false, 'error' => 'El diseño tiene fondo opaco; no se envió a imprimir.'];
    $resolution = png_resolucion($path);
    $expectedPpm = (int) round(HALFTONE_DPI / 0.0254);
    if (!$resolution || abs($resolution['x'] - $expectedPpm) > 2 || abs($resolution['y'] - $expectedPpm) > 2) {
        return ['ok' => false, 'error' => 'El PNG no tiene metadatos de resolución de 300 ppp; no se envió a imprimir.'];
    }
    return ['ok' => true, 'width' => $info[0], 'height' => $info[1], 'dpi' => HALFTONE_DPI];
}

function procesar_dtf_pedido(int $pedidoId, array $meta, PDO $pdo): array {
    $style = strtolower(trim((string)($meta['estilo'] ?? '')));
    $color = strtolower(trim((string)($meta['color'] ?? 'blanca')));
    $compatibleColors = color_dtf_por_estilo();
    if (!isset($compatibleColors[$style])) return ['ok' => false, 'error' => 'El estilo no tiene un perfil DTF habilitado.'];
    if (!in_array($color, ['blanca', 'negra'], true)) return ['ok' => false, 'error' => 'Color de remera inválido.'];
    if (!in_array($color, $compatibleColors[$style], true)) return ['ok' => false, 'error' => 'La combinación de estilo y color no está habilitada para impresión.'];

    $imageRel = ltrim((string)($meta['imagen_url'] ?? ''), '/');
    if ($imageRel === '' && !empty($meta['diseno_id'])) {
        try {
            $q = $pdo->prepare("SELECT imagen_generada, estilo FROM disenos_mascotas WHERE id = ?");
            $q->execute([(int)$meta['diseno_id']]);
            if ($row = $q->fetch(PDO::FETCH_ASSOC)) {
                $imageRel = ltrim((string)($row['imagen_generada'] ?? ''), '/');
                if ($style === '') $style = strtolower((string)($row['estilo'] ?? ''));
            }
        } catch (Throwable $e) { /* se reporta el archivo faltante abajo */ }
    }
    if ($imageRel === '') return ['ok' => false, 'error' => 'El pedido no tiene una ruta de diseño.'];
    $base = realpath(__DIR__);
    $designPath = realpath(__DIR__ . '/' . $imageRel);
    if (!$base || !$designPath || strpos($designPath, $base . DIRECTORY_SEPARATOR) !== 0) {
        return ['ok' => false, 'error' => 'El archivo de diseño no existe en una carpeta permitida.'];
    }

    $printRel  = 'generados/impresion_pedido_' . $pedidoId . '_v2.png';
    $printPath = __DIR__ . '/' . $printRel;
    if (is_file($printPath)) {
        $valid = validar_png_impresion($printPath);
        if ($valid['ok']) return ['ok' => true, 'estado' => 'ya_procesado', 'archivo' => $printRel, 'validacion' => $valid];
        @unlink($printPath); // Retirar entregables viejos o mal formados; nunca adjuntarlos.
    }

    $mode = '';
    if ($style === 'no-edit') {
        $bytes = @file_get_contents($designPath);
        if ($bytes === false) return ['ok' => false, 'error' => 'No se pudo leer el diseño original.'];
        $saved = escribir_png_impresion($bytes, $printPath, false);
        $mode = 'original_sin_filtro';
    } elseif ($color === 'negra' || in_array($style, ['vogue', 'retro'], true)) {
        // En prendas negras (todos los perfiles compatibles) se conserva la
        // tinta clara y se abren las sombras negras como transparencia real.
        // Vogue y Granulado también van tramados en blanco para abrir la
        // cobertura y evitar un bloque rígido de tinta.
        $direction = $color === 'blanca' ? 'blanca' : 'negra';
        $lpi = max(8, min(35, (int)(defined('HALFTONE_LPI') ? HALFTONE_LPI : 22)));
        $out = halftone_gd($designPath, HALFTONE_ANCHO, $lpi, HALFTONE_DPI, $direction);
        $tmp = $printPath . '.tmp';
        $ok = function_exists('imageresolution') ? imageresolution($out, HALFTONE_DPI, HALFTONE_DPI) : true;
        $ok = imagepng($out, $tmp, 6, PNG_ALL_FILTERS) && $ok;
        imagedestroy($out);
        if (!$ok) {
            @unlink($tmp);
            return ['ok' => false, 'error' => 'No se pudo guardar la trama DTF.'];
        }
        $valid = validar_png_impresion($tmp);
        if (!$valid['ok']) {
            @unlink($tmp);
            return ['ok' => false, 'error' => $valid['error']];
        }
        if (!@rename($tmp, $printPath)) {
            @unlink($tmp);
            return ['ok' => false, 'error' => 'No se pudo publicar el archivo tramado.'];
        }
        $saved = ['ok' => true, 'width' => $valid['width'], 'height' => $valid['height'], 'dpi' => HALFTONE_DPI];
        $mode = $color === 'blanca' ? 'halftone_abierto_blanco' : 'halftone_knockout_negro';
    } else {
        // En diseños tipo sticker/polaroid se conserva el color y se elimina
        // solo el fondo con transparencia. Si falla, el original no se envía.
        $bytes = @file_get_contents($designPath);
        if ($bytes === false) return ['ok' => false, 'error' => 'No se pudo leer el diseño original.'];
        $mime = function_exists('mime_content_type') ? (mime_content_type($designPath) ?: 'image/png') : 'image/png';
        $fal = quitar_fondo_fal($bytes, $mime);
        if (empty($fal['png'])) return ['ok' => false, 'error' => 'Falló el recorte de fondo; el original se retuvo para revisión.'];
        $saved = escribir_png_impresion($fal['png'], $printPath, true);
        $mode = 'fondo_transparente';
    }

    if (empty($saved['ok'])) {
        @unlink($printPath);
        return ['ok' => false, 'error' => $saved['error'] ?? 'No se pudo validar el arte para imprimir.'];
    }
    $valid = validar_png_impresion($printPath);
    if (!$valid['ok']) {
        @unlink($printPath);
        return ['ok' => false, 'error' => $valid['error']];
    }

    try {
        $pdo->prepare("UPDATE pedidos SET archivo_impresion = ? WHERE id = ?")
            ->execute([$printRel, $pedidoId]);
    } catch (Throwable $e) { /* columna auxiliar opcional */ }
    return ['ok' => true, 'estado' => 'procesado', 'modo' => $mode, 'archivo' => $printRel, 'validacion' => $valid];
}

/** Procesa todas las remeras del pago y manda un único email con todos los PNG. */
function procesar_dtf_pedidos(array $orderIds, PDO $pdo): array {
    if (!function_exists('notificar_estampador_pedido')) return ['ok' => false, 'error' => 'Mailer no cargado.'];
    $ids = array_values(array_unique(array_filter(array_map('intval', $orderIds), fn($id) => $id > 0)));
    if (!$ids) return ['ok' => false, 'error' => 'El pago no contiene pedidos para procesar.'];
    $marks = implode(',', array_fill(0, count($ids), '?'));
    $q = $pdo->prepare("SELECT id, mp_payment_id, diseno_id, imagen_url, nombre_mascota, estilo, color, talle,
        destinatario_nombre, destinatario_telefono, tipo_entrega, calle, numero, piso_depto,
        info_adicional, codigo_postal, ciudad, provincia
        FROM pedidos WHERE id IN ($marks) ORDER BY id");
    $q->execute($ids);
    $orders = $q->fetchAll(PDO::FETCH_ASSOC);
    if (count($orders) !== count($ids)) return ['ok' => false, 'error' => 'No se encontraron todas las líneas del pedido.'];

    $paymentId = (string)($orders[0]['mp_payment_id'] ?? '');
    $items = [];
    foreach ($orders as $row) {
        if ((string)$row['mp_payment_id'] !== $paymentId) return ['ok' => false, 'error' => 'Las líneas no pertenecen al mismo pago.'];
        $result = procesar_dtf_pedido((int)$row['id'], $row, $pdo);
        if (empty($result['ok'])) return ['ok' => false, 'pedido_id' => (int)$row['id'], 'error' => $result['error'] ?? 'Falló la preparación DTF.'];
        $items[] = [
            'pedido_id' => (int)$row['id'],
            'nombre_mascota' => $row['nombre_mascota'],
            'estilo' => $row['estilo'],
            'color' => $row['color'],
            'talle' => $row['talle'],
            'archivo' => __DIR__ . '/' . $result['archivo'],
        ];
    }

    $delivery = $orders[0];
    $delivery['direccion'] = trim(implode(', ', array_filter([
        trim(($delivery['calle'] ?? '') . ' ' . ($delivery['numero'] ?? '')),
        $delivery['piso_depto'] ?? '', $delivery['ciudad'] ?? '',
        $delivery['provincia'] ?? '', $delivery['codigo_postal'] ?? '',
        $delivery['info_adicional'] ?? '',
    ])));
    $mail = notificar_estampador_pedido($paymentId, $items, $delivery);
    return ['ok' => !empty($mail['ok']), 'pedido_ids' => $ids, 'cantidad' => count($items), 'mail' => $mail];
}
