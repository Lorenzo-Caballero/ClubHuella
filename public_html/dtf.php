<?php
/* ============================================================
   dtf.php — Procesamiento DTF de Club Huella
   ------------------------------------------------------------
   Se ejecuta SOLO cuando un pago está confirmado (lo llama el
   webhook de payments_envios.php). Nunca procesa diseños que
   no se compraron.

   - Estilos de fondo oscuro (rap-tee = "Retro", streetwear = "Street")
       → HALFTONE con GD (semitono, PNG transparente).
   - Resto de estilos (sticker)
       → RECORTE de fondo con fal.ai (Bria RMBG 2.0).

   Parámetros editables desde config.php:
       define('HALFTONE_LPI', 22);
       define('HALFTONE_ANCHO', 3508);   // A4 @ 300 dpi
       define('HALFTONE_DPI', 300);
   FAL_API_KEY también sale de config.php.
   ============================================================ */

// Cargar el módulo de mail al estampador (si está presente)
if (file_exists(__DIR__ . '/mailer.php')) {
    require_once __DIR__ . '/mailer.php';
}

if (!defined('HALFTONE_LPI'))   define('HALFTONE_LPI', 22);
if (!defined('HALFTONE_ANCHO')) define('HALFTONE_ANCHO', 3508);
if (!defined('HALFTONE_DPI'))   define('HALFTONE_DPI', 300);
if (!defined('FAL_ENDPOINT'))   define('FAL_ENDPOINT', 'https://fal.run/fal-ai/bria/background/remove');

/* ============================================================
   REGLAS DE ESTILO
   OJO: son SLUGS internos, no las etiquetas que ve el cliente.
     'rap-tee'    = "Retro"  (galaxia)
     'streetwear' = "Street" (tipografía clara)
   ============================================================ */
function estilos_solo_negra(): array {
    return ['rap-tee', 'streetwear'];
}
function estilo_se_recorta(string $estilo): bool {
    return !in_array($estilo, estilos_solo_negra(), true);
}

/* ============================================================
   HALFTONE con GD — mismo método ya probado en halftone_test.php
   Devuelve un recurso GD (imagen) con puntos de color y fondo
   transparente. Lo oscuro se vuelve "sin puntos" = transparente.
   ============================================================ */
function halftone_gd(string $srcPath, int $ancho, int $lpi, int $dpi) {
    $raw  = @file_get_contents($srcPath);
    $orig = @imagecreatefromstring($raw);
    if (!$orig) throw new Exception("halftone: no se pudo leer $srcPath");

    $ow = imagesx($orig);
    $oh = imagesy($orig);
    $w  = $ancho;
    $h  = (int) round($oh * $ancho / $ow);

    // 1) A ancho A4
    $full = imagecreatetruecolor($w, $h);
    imagecopyresampled($full, $orig, 0, 0, 0, 0, $w, $h, $ow, $oh);
    imagedestroy($orig);

    // 2) Grilla de celdas (promedio de color) por downsample
    $cell  = max(2, (int) round($dpi / $lpi));
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
            $cov = ($lum - 0.06) / 0.88;
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

/* ============================================================
   PROCESAR UN PEDIDO (idempotente)
   Toma el diseño del pedido y genera el archivo listo para
   imprimir según el estilo. Se llama con el pago ya confirmado.
     $meta = metadata del pago (tiene estilo e imagen_url).
   Devuelve ['ok'=>bool, 'estado'=>..., 'archivo'=>ruta].
   ============================================================ */
function procesar_dtf_pedido(int $pedidoId, array $meta, PDO $pdo): array {

    $estilo    = (string)($meta['estilo'] ?? '');
    $imagenUrl = ltrim((string)($meta['imagen_url'] ?? ''), '/');

    // Respaldo: si la metadata no trajo la imagen, buscarla en la BD por diseno_id
    if ($imagenUrl === '' && !empty($meta['diseno_id'])) {
        try {
            $q = $pdo->prepare("SELECT imagen_generada, estilo FROM disenos_mascotas WHERE id = ?");
            $q->execute([(int)$meta['diseno_id']]);
            if ($row = $q->fetch(PDO::FETCH_ASSOC)) {
                $imagenUrl = ltrim((string)($row['imagen_generada'] ?? ''), '/');
                if ($estilo === '') $estilo = (string)($row['estilo'] ?? '');
            }
        } catch (Throwable $e) { /* sigue al error de abajo */ }
    }
    if ($imagenUrl === '') return ['ok' => false, 'error' => 'sin imagen_url', 'meta_keys' => array_keys($meta)];

    $designPath = __DIR__ . '/' . $imagenUrl;   // dtf.php vive en public_html, junto a /generados
    if (!file_exists($designPath)) {
        return ['ok' => false, 'error' => "no existe el diseño: $imagenUrl"];
    }

    // Nombre determinístico → idempotencia (no reprocesa ni cobra fal dos veces)
    $printRel  = 'generados/impresion_pedido_' . $pedidoId . '.png';
    $printPath = __DIR__ . '/' . $printRel;
    if (file_exists($printPath) && filesize($printPath) > 0) {
        return ['ok' => true, 'estado' => 'ya_procesado', 'archivo' => $printRel];
    }

    /* Regla de procesamiento:
       - 'no-edit' → SE ESTAMPA TAL CUAL (imagen propia del cliente): solo se convierte a PNG, sin knockout
       - negra     → halftone knockout de lo oscuro (gratis, GD)
       - blanca    → recorte con fal.ai (fondo blanco es su caso ideal); si falla, queda la original */
    $colorRemera = strtolower(trim((string)($meta['color'] ?? 'blanca')));
    $modo = '';
    if ($estilo === 'no-edit') {
        // Promesa "tal cual": sin halftone ni recorte. PNG para el estampador, preservando transparencia si trae.
        $bytes = file_get_contents($designPath);
        $im = @imagecreatefromstring($bytes);
        if ($im) {
            imagesavealpha($im, true);
            imagepng($im, $printPath);
            imagedestroy($im);
        } else {
            file_put_contents($printPath, $bytes);
        }
        $modo = 'sin_editar_tal_cual';
    } elseif ($colorRemera !== 'negra') {
        // Remera BLANCA → recorte transparente con fal.ai
        $bytes = file_get_contents($designPath);
        $mime  = function_exists('mime_content_type')
                    ? (mime_content_type($designPath) ?: 'image/png')
                    : 'image/png';
        $fal = quitar_fondo_fal($bytes, $mime);
        if (isset($fal['png'])) {
            file_put_contents($printPath, $fal['png']);
            $modo = 'recorte_fal';
        } else {
            // fal falló → no bloqueamos la venta: va la original y queda avisado en el modo
            file_put_contents($printPath, $bytes);
            $modo = 'recorte_fallo_se_uso_original';
        }
    } else {
        // Remera NEGRA → halftone knockout de lo oscuro
        $out = halftone_gd($designPath, HALFTONE_ANCHO, HALFTONE_LPI, HALFTONE_DPI);
        imagepng($out, $printPath);
        imagedestroy($out);
        $modo = 'halftone';
    }

    // Guardar la ruta en la BD (si existe la columna; si no, no pasa nada)
    try {
        $pdo->prepare("UPDATE pedidos SET archivo_impresion = ? WHERE id = ?")
            ->execute([$printRel, $pedidoId]);
    } catch (Throwable $e) { /* columna opcional */ }

    /* ============================================================
       AVISO AL ESTAMPADOR (mail con el PNG adjunto).
       Solo corre en el procesamiento fresco → una vez por pedido.
       Si el mail falla, no rompe nada: queda registrado el error.
       ============================================================ */
    $mailRes = ['ok' => false, 'error' => 'mailer no cargado'];
    if (function_exists('notificar_estampador')) {
        try {
            $mailRes = notificar_estampador($pedidoId, $meta, $printPath);
        } catch (Throwable $e) {
            $mailRes = ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    return ['ok' => true, 'estado' => 'procesado', 'modo' => $modo, 'archivo' => $printRel, 'mail' => $mailRes];
}