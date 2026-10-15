<?php

// ==========================================================
// HEADERS / CORS
// ==========================================================

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Expires: 0");

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "https://clubhuella.com",
];

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=utf-8");

// ==========================================================
// REQUIRES
// ==========================================================

require_once __DIR__ . "/../config.php";
require_once __DIR__ . "/conexion.php";

date_default_timezone_set("America/Argentina/Buenos_Aires");

// ==========================================================
// FALLBACKS DE CONFIG
// ==========================================================

// ✅ CORRECCIÓN: 'gemini-2.0-flash-preview-image-generation' fue dado de baja por Google
// (shutdown 14/11/2025) y su sucesor directo para edición/generación de imágenes con
// consistencia de personaje (manteniendo la identidad de la mascota entre generaciones)
// es 'gemini-nano-banana-2.1'. Si config.php define GEMINI_IMAGE_MODEL, ese valor manda:
// verificar también ahí que no siga apuntando al modelo dado de baja.
if (!defined('GEMINI_IMAGE_MODEL')) {
    define('GEMINI_IMAGE_MODEL', 'gemini-nano-banana-2.1');
}

if (!defined('GEMINI_TEXT_MODEL')) {
    define('GEMINI_TEXT_MODEL', 'gemini-2.0-flash');
}

if (!defined('GEMINI_ASPECT_RATIO')) {
    define('GEMINI_ASPECT_RATIO', '3:4');   // vertical para remera; editable en config.php
}

if (!defined('GEMINI_ENDPOINT')) {
    define('GEMINI_ENDPOINT', 'https://generativelanguage.googleapis.com/v1beta/models/');
}

if (!defined('GEMINI_API_KEY') || !GEMINI_API_KEY) {
    http_response_code(500);
    echo json_encode(["error" => "Falta GEMINI_API_KEY en config.php"]);
    exit();
}

// ==========================================================
// VARIABLES
// ==========================================================

$method  = $_SERVER['REQUEST_METHOD'];
$recurso = $_GET['recurso'] ?? '';
$id      = $_GET['id'] ?? null;

$input_raw = file_get_contents("php://input");
$input     = json_decode($input_raw, true);

// ==========================================================
// HELPERS
// ==========================================================

function send_json($obj, $status = 200)
{
    http_response_code($status);
    echo json_encode($obj, JSON_UNESCAPED_UNICODE);
    exit();
}

function file_to_inline_data($path)
{
    if (!file_exists($path)) return null;
    $mime = mime_content_type($path);
    if ($mime === 'application/octet-stream' || empty($mime)) {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $extMimes = [
            'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',  'webp' => 'image/webp',
            'heic' => 'image/heic', 'heif' => 'image/heif',
        ];
        $mime = $extMimes[$ext] ?? 'image/jpeg';
    }
    $data = base64_encode(file_get_contents($path));
    return ["inline_data" => ["mime_type" => $mime, "data" => $data]];
}

function dataurl_to_file($dataUrl, $folder, $prefix)
{
    $dataUrl = preg_replace('/\s+/', '', $dataUrl);
    if (!preg_match('/^data:(image\/[a-z0-9.+\-]+);base64,(.+)$/i', $dataUrl, $m)) return null;

    $mime   = strtolower($m[1]);
    $base64 = $m[2];
    $bin    = base64_decode($base64, true);
    if ($bin === false || strlen($bin) < 100) return null;

    $extMap = [
        'image/jpeg' => 'jpg', 'image/jpg'  => 'jpg',
        'image/png'  => 'png', 'image/webp' => 'webp',
        'image/heic' => 'heic', 'image/heif' => 'heif',
    ];
    $ext = $extMap[$mime] ?? 'jpg';

    if (!is_dir($folder) && !mkdir($folder, 0755, true)) return null;

    $filename = $prefix . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $path     = rtrim($folder, '/') . '/' . $filename;
    $written  = file_put_contents($path, $bin);
    if ($written === false) return null;

    return ['path' => $path, 'mime' => $mime, 'filename' => $filename];
}

function ref_image_for_style($estilo)
{
    $estilo = preg_replace('/[^a-z0-9\-]/i', '', $estilo);
    if (!$estilo) return null;
    $base = __DIR__ . '/referencias/';
    foreach (['jpg', 'jpeg', 'png', 'webp'] as $ext) {
        $path = $base . $estilo . '.' . $ext;
        if (file_exists($path)) return $path;
    }
    return null;
}

/**
 * Devuelve HASTA $max imágenes de referencia para un estilo.
 * Estructura nueva (recomendada): carpeta por estilo
 *   referencias/{slug}/1.jpg, 2.jpg, 3.jpg ...
 * Compatibilidad: si no hay carpeta, usa el archivo único referencias/{slug}.jpg
 */
function ref_images_for_style($estilo, $max = 3)
{
    $estilo = preg_replace('/[^a-z0-9\-]/i', '', $estilo);
    if (!$estilo) return [];
    $base  = __DIR__ . '/referencias/';
    $found = [];

    $dir = $base . $estilo;
    if (is_dir($dir)) {
        foreach (['jpg','jpeg','png','webp'] as $ext) {
            foreach (glob($dir . '/*.' . $ext) ?: [] as $p) $found[] = $p;
        }
        sort($found); // 1.jpg, 2.jpg, 3.jpg...
    }

    if (!$found) {
        $single = ref_image_for_style($estilo);
        if ($single) $found[] = $single;
    }

    return array_slice($found, 0, $max);
}

function list_available_references()
{
    $estilos = ['vogue','retro','streetwear','college','collage','minimal','anime','rap-tee'];
    $result  = [];
    foreach ($estilos as $estilo) {
        $found = ref_images_for_style($estilo);
        $result[$estilo] = [
            'existe'   => count($found) > 0,
            'cantidad' => count($found),
            'archivos' => array_map('basename', $found),
        ];
    }
    return $result;
}

// ==========================================================
// PASO 1: DESCRIPCIÓN DETALLADA DE LA MASCOTA (VISION)
// ==========================================================

function describir_mascota_detallado($imageInlineData)
{
    $prompt = 'You are a forensic visual analyst specializing in animal identification for illustration purposes. '
        . 'Analyze this pet photo with extreme precision and respond ONLY with a valid JSON object — no markdown, no extra text. '
        . 'Include these exact keys: '
        . '"especie" (string: "perro", "gato" or "otro"), '
        . '"raza" (string: breed in Spanish, or null if unknown), '
        . '"tiene_cuerpo" (boolean: true if body below neck is clearly visible), '
        . '"color_pelaje" (string: precise coat color description, e.g. "café dorado con manchas blancas en el pecho"), '
        . '"patron_pelaje" (string: coat pattern, e.g. "tricolor", "atigrado", "moteado", "sólido", "bicolor"), '
        . '"textura_pelaje" (string: "largo y ondulado", "corto y liso", "rizado", "doble capa", "áspero"), '
        . '"color_ojos" (string: precise eye color, e.g. "miel dorado", "marrón oscuro", "azul hielo"), '
        . '"forma_orejas" (string: e.g. "caídas y peludas", "erectas y puntiagudas", "semierguidas"), '
        . '"nariz" (string: color and shape, e.g. "nariz negra ancha", "nariz rosada pequeña"), '
        . '"forma_cabeza_rostro" (string: head/face GEOMETRY — skull shape, muzzle length and width, jaw width, forehead slope, cheek fullness; e.g. "cabeza redondeada, hocico corto y ancho, mejillas marcadas" or "cráneo alargado, hocico largo y estrecho, frente plana" — this is the single most important trait for the viewer to recognize the exact individual, independent of breed), '
        . '"rasgos_distintivos" (string: unique identifying marks, spots, patches, or features), '
        . '"expresion" (string: current expression, e.g. "alegre con lengua afuera", "sereno y majestuoso", "atento y curioso"), '
        . '"tamano_estimado" (string: "pequeño", "mediano", "grande"), '
        . '"postura" (string: describe pose if body is visible). '
        . 'Be extremely specific — this description will be used to recreate this exact pet in illustration form. '
        . 'Example: {"especie":"perro","raza":"Golden Retriever","tiene_cuerpo":false,"color_pelaje":"dorado cremoso con destellos más claros en el hocico","patron_pelaje":"sólido","textura_pelaje":"largo y ondulado","color_ojos":"miel oscuro cálido","forma_orejas":"caídas medianas cubiertas de pelo ondulado","nariz":"nariz negra ancha","forma_cabeza_rostro":"cabeza ancha y redondeada, hocico corto y robusto, mejillas llenas, frente ligeramente abombada","rasgos_distintivos":"mancha blanca pequeña en el pecho, cejas expresivas","expresion":"alegre con boca abierta y lengua asomando","tamano_estimado":"grande","postura":null}';

    $model = defined('GEMINI_TEXT_MODEL') ? GEMINI_TEXT_MODEL : 'gemini-2.0-flash';
    $url   = GEMINI_ENDPOINT . $model . ':generateContent?key=' . GEMINI_API_KEY;

    $payload = [
        "contents" => [[
            "role"  => "user",
            "parts" => [["text" => $prompt], $imageInlineData],
        ]],
        "generationConfig" => ["temperature" => 0.05, "maxOutputTokens" => 500],
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ["Content-Type: application/json"],
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_TIMEOUT        => 30,
    ]);
    $response = curl_exec($ch);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    $defaults = [
        'especie'           => 'perro',
        'raza'              => null,
        'tiene_cuerpo'      => false,
        'color_pelaje'      => null,
        'patron_pelaje'     => null,
        'textura_pelaje'    => null,
        'color_ojos'        => null,
        'forma_orejas'      => null,
        'nariz'             => null,
        'forma_cabeza_rostro' => null,
        'rasgos_distintivos'=> null,
        'expresion'         => null,
        'tamano_estimado'   => null,
        'postura'           => null,
    ];

    if ($curlErr || !$response) return $defaults;

    $data = json_decode($response, true);
    $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
    $text = preg_replace('/```json|```/i', '', $text);
    $text = trim($text);
    $parsed = json_decode($text, true);

    if (!is_array($parsed)) return $defaults;

    return array_merge($defaults, $parsed);
}

// ==========================================================
// DESCRIPCIÓN DEL ESTILO DE LA REFERENCIA (VISION)
// ==========================================================

function describir_estilo_referencia($refInlineData, $estilo)
{
    $prompt = 'You are an expert art director and graphic designer specializing in apparel and streetwear. '
        . "Analyze this t-shirt design reference image for the '$estilo' style. "
        . 'Respond ONLY with a valid JSON object — no markdown, no extra text. Include: '
        . '"paleta_colores" (array of 4-6 dominant hex colors, e.g. ["#1a1a2e","#e94560"]), '
        . '"tipografia" (string: typography style description, e.g. "serif bold condensed uppercase", "distressed brush script"), '
        . '"composicion" (string: layout description, e.g. "portrait centered with radial decoration", "full-bleed collage with overlapping crops"), '
        . '"textura_fondo" (string: background treatment, e.g. "grunge worn texture", "clean solid black", "halftone grain overlay"), '
        . '"efectos_graficos" (array of graphic effects present, e.g. ["glow halo","shadow drop","scanlines","torn edges"]), '
        . '"mood" (string: overall visual mood, e.g. "dark cinematic", "nostalgic warm", "bold aggressive"), '
        . '"elementos_decorativos" (array: decorative motifs present, e.g. ["laurel wreaths","geometric borders","burst rays","floral patterns"]), '
        . '"estilo_ilustracion" (string: illustration style, e.g. "photorealistic painting", "cel-shaded anime", "woodcut engraving", "airbrush"), '
        . '"contraste" (string: "high contrast hard", "medium soft gradients", "low muted"), '
        . '"densidad_visual" (string: "maximalist busy", "balanced structured", "minimal sparse").';

    $model = defined('GEMINI_TEXT_MODEL') ? GEMINI_TEXT_MODEL : 'gemini-2.0-flash';
    $url   = GEMINI_ENDPOINT . $model . ':generateContent?key=' . GEMINI_API_KEY;

    $payload = [
        "contents" => [[
            "role"  => "user",
            "parts" => [["text" => $prompt], $refInlineData],
        ]],
        "generationConfig" => ["temperature" => 0.1, "maxOutputTokens" => 400],
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ["Content-Type: application/json"],
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_TIMEOUT        => 30,
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    if (!$response) return null;

    $data = json_decode($response, true);
    $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
    $text = preg_replace('/```json|```/i', '', $text);
    $parsed = json_decode(trim($text), true);
    return is_array($parsed) ? $parsed : null;
}

// ==========================================================
// CONSTRUIR PROMPT HIPER-DETALLADO
// ==========================================================

function build_optimized_prompt($estilo, $nombreMascota, $analisis, $estiloDesc = null, $color = 'blanca')
{
    $nombre  = strtoupper(trim($nombreMascota));
    $especie = $analisis['especie'] ?? 'perro';
    $raza    = $analisis['raza']    ?? null;
    $cuerpo  = $analisis['tiene_cuerpo'] ?? false;

    $isDark  = ($color === 'negra');
    $bgWord  = $isDark ? 'BLACK' : 'WHITE';
    $bgHex   = $isDark ? '#0A0A0A' : '#FFFFFF';

    $petIdentityBlock = "=== PET IDENTITY (HIGHEST PRIORITY — DO NOT DEVIATE) ===\n";
    $petIdentityBlock .= "You MUST recreate this SPECIFIC pet — not a generic animal, not a breed template. Every visual detail below is mandatory:\n";

    if (!empty($analisis['raza'])) {
        $petIdentityBlock .= "- Breed: {$analisis['raza']}\n";
    }
    if (!empty($analisis['color_pelaje'])) {
        $petIdentityBlock .= "- Coat color: {$analisis['color_pelaje']}\n";
    }
    if (!empty($analisis['patron_pelaje'])) {
        $petIdentityBlock .= "- Coat pattern: {$analisis['patron_pelaje']}\n";
    }
    if (!empty($analisis['textura_pelaje'])) {
        $petIdentityBlock .= "- Fur texture: {$analisis['textura_pelaje']}\n";
    }
    if (!empty($analisis['color_ojos'])) {
        $petIdentityBlock .= "- Eye color: {$analisis['color_ojos']}\n";
    }
    if (!empty($analisis['forma_orejas'])) {
        $petIdentityBlock .= "- Ear shape: {$analisis['forma_orejas']}\n";
    }
    if (!empty($analisis['nariz'])) {
        $petIdentityBlock .= "- Nose: {$analisis['nariz']}\n";
    }
    if (!empty($analisis['forma_cabeza_rostro'])) {
        $petIdentityBlock .= "- HEAD/FACE GEOMETRY (critical for recognition): {$analisis['forma_cabeza_rostro']}\n";
    }
    if (!empty($analisis['rasgos_distintivos'])) {
        $petIdentityBlock .= "- UNIQUE MARKS (critical): {$analisis['rasgos_distintivos']}\n";
    }
    if (!empty($analisis['expresion'])) {
        $petIdentityBlock .= "- Expression: {$analisis['expresion']}\n";
    }

    $petIdentityBlock .= "\n";

    $especieLabel = ($especie === 'gato') ? 'cat' : 'dog';
    if ($cuerpo) {
        $bodyBlock = "=== BODY RULE ===\n"
            . "The customer photo shows the full body. Preserve the exact anatomy, proportions, posture and all physical details from the photo. Recreate the complete pose.\n\n";
    } elseif ($raza) {
        $bodyBlock = "=== BODY RULE ===\n"
            . "The photo shows only the face/head. Reconstruct a complete, anatomically accurate body for a {$raza} {$especieLabel}, "
            . "and whatever new pose, outfit or attire the style requires — but the HEAD must be copied from the customer photo, not "
            . "reinterpreted or redrawn as a standard breed-type head. Copy its exact proportions: muzzle length and width relative to the "
            . "skull, how round or narrow the face is, how big the eyes look relative to the face, the exact angle and set of the ears. "
            . "Do NOT substitute a generic, idealized, or stock-photo-cute version of this breed's head — this specific individual animal's "
            . "head geometry, coat colors, markings, eye color, and ear shape must match exactly, as if the same head were composited onto "
            . "the new body. Body proportions must be true to the {$raza} breed.\n\n";
    } else {
        $bodyBlock = "=== BODY RULE ===\n"
            . "The photo shows only the face/head and the breed is unknown. Create a centered artistic portrait focused on the face, "
            . "extending to a partial upper body for visual balance. Preserve all visible facial traits with absolute fidelity.\n\n";
    }

    $styleBlock = "=== STYLE DIRECTION ===\n";
    $styleBlock .= "Every image AFTER the customer pet photo is a STYLE REFERENCE. Replicate their shared visual language exactly. If a reference shows the print applied on a shirt, reproduce ONLY the printed graphic, never the shirt or the person. ";

    if ($estiloDesc) {
        if (!empty($estiloDesc['mood'])) {
            $styleBlock .= "Overall mood: {$estiloDesc['mood']}. ";
        }
        if (!empty($estiloDesc['estilo_ilustracion'])) {
            $styleBlock .= "Illustration style: {$estiloDesc['estilo_ilustracion']}. ";
        }
        if (!empty($estiloDesc['textura_fondo'])) {
            $styleBlock .= "Background: {$estiloDesc['textura_fondo']}. ";
        }
        if (!empty($estiloDesc['composicion'])) {
            $styleBlock .= "Composition: {$estiloDesc['composicion']}. ";
        }
        if (!empty($estiloDesc['contraste'])) {
            $styleBlock .= "Contrast: {$estiloDesc['contraste']}. ";
        }
        if (!empty($estiloDesc['densidad_visual'])) {
            $styleBlock .= "Visual density: {$estiloDesc['densidad_visual']}. ";
        }
        if (!empty($estiloDesc['tipografia'])) {
            $styleBlock .= "\nTypography style to use: {$estiloDesc['tipografia']}. ";
        }
        if (!empty($estiloDesc['efectos_graficos']) && is_array($estiloDesc['efectos_graficos'])) {
            $styleBlock .= "\nGraphic effects to include: " . implode(', ', $estiloDesc['efectos_graficos']) . ". ";
        }
        if (!empty($estiloDesc['elementos_decorativos']) && is_array($estiloDesc['elementos_decorativos'])) {
            $styleBlock .= "\nDecorative elements to include: " . implode(', ', $estiloDesc['elementos_decorativos']) . ". ";
        }
        if (!empty($estiloDesc['paleta_colores']) && is_array($estiloDesc['paleta_colores'])) {
            $styleBlock .= "\nColor palette to use: " . implode(', ', $estiloDesc['paleta_colores']) . ". ";
        }
    }
    $styleBlock .= "\n\n";

    $perEstilo = [
        'vogue'      => "STYLE DIRECTIVE: Clean Vogue-inspired editorial cover artwork on a pure white background. Minimal premium fashion magazine aesthetic. Use elegant black serif typography, refined spacing, soft studio lighting, and very few decorative elements. The pet must be the main subject, centered, elegant and recognizable. Avoid busy collages, neon effects, grunge, excessive overlays, heavy textures, dark backgrounds, random fashion accessories, or too many graphic details.",
        'retro'      => "STYLE DIRECTIVE: single-color risograph halftone print, exactly like the reference image. The ENTIRE pet portrait rendered in ONE warm ink color (burnt orange / salmon / brick red) as coarse halftone grain dots on a light background. No full-color photo: monochrome duotone riso texture only. Heavy visible grain. Minimal composition, generous negative space. Small understated typography for the pet name. Warm, analog, printed-zine feel.",
        'streetwear' => "STYLE DIRECTIVE: Premium streetwear hype graphic. Bold oversized sans-serif typography. Urban energy, aggressive layout. High contrast dark background. Layered graphic elements. Supreme/Palace/Off-White aesthetic adapted for pet culture.",
        'college'    => "STYLE DIRECTIVE: Varsity college athletic tee. Arched team-name lettering, jersey numerals. Twill patch aesthetic. Navy/red/gold color scheme typical of university apparel. EST. year below name. Shield or crest element.",
        'collage'    => "STYLE DIRECTIVE: elegant polaroid triptych, exactly like the reference. The pet name in refined cursive script, above a bold serif UPPERCASE phrase. Below: THREE instant-photo (polaroid) frames in a straight, perfectly aligned horizontal row — NOT rotated. CRITICAL RULE: all three frames contain THE SAME single black-and-white photo of the pet, repeated identically three times. One photo derived faithfully from the customer photo (same pet, same pose), duplicated in the three frames. The same small handwritten caption under each frame. Clean white background, generous whitespace. NEVER invent a different animal or a different photo per frame: it is one photo shown three times. Output ONLY the flat printed graphic: no person, no body, no shirt, no fabric.",
        'minimal'    => "STYLE DIRECTIVE: ONE single instant photo (polaroid), exactly like the reference. A single white polaroid frame containing a soft, natural photo of the pet, with a short handwritten caption on the bottom white border (the pet name or a tiny phrase). Centered, vast clean empty background around it. Nothing else in the composition.",
        'anime'      => "STYLE DIRECTIVE: Japanese anime / kawaii illustration. Cel-shaded with clean outlines. Large expressive eyes. Soft pastel or vibrant saturated colors. Speed lines or sparkle effects. Japanese characters or katakana as typographic element. Cute chibi proportions optional.",
        'rap-tee'    => "STYLE DIRECTIVE: 90s bootleg 'galaxy' rap tee, exactly like the reference image. Deep dark cosmic background with purple/blue nebula and stars. Electric blue lightning bolts crackling around the composition. TWO or THREE photographic renditions of THE SAME pet from the customer photo at different scales (large main portrait plus smaller crops) — identical animal in every rendition, only pose/angle changes — photo-real with subtle halftone grain. The pet name in huge CHROME 3D beveled metallic lettering with pink-to-blue gradient and glow, 90s airbrush style. Optional wireframe globe motif behind. Tour-tee text lines in clean white sans-serif below.",
    ];

    $styleDirective = $perEstilo[$estilo] ?? "STYLE DIRECTIVE: Modern premium streetwear graphic design.";
    // El fondo lo controla el color elegido: quitamos menciones fijas de color de fondo.
    $styleDirective = str_ireplace(
        ['on a pure white background', 'High contrast dark background.', 'dark backgrounds, '],
        ['', '', ''],
        $styleDirective
    );

    $compositionBlock = "=== COMPOSITION RULES ===\n"
        . "- Design the artwork to sit on a {$bgWord}-toned background (it prints on a {$bgWord} shirt)\n"
        . "- VERTICAL portrait canvas, aspect ratio 3:4 (taller than wide). NEVER landscape/horizontal.\n"
        . "- Centered composition optimized for front print placement\n"
        . "- NOT a mockup and NOT a visible shirt — only the final graphic artwork\n"
        . "- Keep the composition clean, premium and easy to print\n"
        . "- The pet is the dominant focal point (70-80% of visual weight)\n"
        . "- Use negative space. Avoid visual clutter, excessive textures, extra frames, random objects or overloaded backgrounds\n"
        . "- Include the pet name with tasteful typography, but do not let typography overpower the pet\n"
        . "- No extra animals, no busy collage unless the selected style specifically requires it\n\n";

    $nameBlock = "=== NAME TYPOGRAPHY ===\n"
        . "Integrate the name \"{$nombre}\" as prominent stylized lettering in the composition. "
        . "The typography must match the style's aesthetic. Place it naturally — above, below, or framing the pet. "
        . "The name should feel like it belongs to the design, not pasted on top.\n\n";

    $antiGenericBlock = "=== CRITICAL FIDELITY RULE ===\n"
        . "This is a LIKENESS PRESERVATION task, not a reinterpretation: treat the customer pet photo as ground truth and only re-skin its art style, never its identity. "
        . "FAIL CONDITION: If the output shows a GENERIC {$especieLabel} that does not match the specific pet described above, the generation has FAILED. "
        . "A viewer who knows this pet must be able to immediately recognize it at a glance, the same way they would recognize it in a different photo. "
        . "The coat color pattern, eye color, unique markings, AND the head/face geometry (skull and muzzle shape, proportions) are NON-NEGOTIABLE identity markers — do not default to a generic breed-standard head shape if the photo shows different proportions. "
        . "Do not idealize, simplify, slim down, or \"cute-ify\" the pet's real proportions.\n\n";

    $bgBlock = $isDark
        ? "=== BACKGROUND TONE (this design prints on a BLACK shirt) ===\n"
          . "Keep the OVERALL background DARK (deep blacks and dark tones) so it blends into the black shirt.\n"
          . "Use ONLY the background treatments and effects that appear in the style reference images — do not add effects that are not present in them. Keep the overall background dark. Render the pet, text and key elements in LIGHT / bright tones so they pop.\n"
          . "Do NOT use a white, light or bright solid background.\n\n"
        : "=== BACKGROUND TONE (this design prints on a WHITE shirt) ===\n"
          . "Keep the OVERALL background light / white and clean so it blends into the white shirt. Style textures and effects are welcome, but the base background stays light.\n"
          . "Do NOT use a dark or black background.\n\n";

    // Checklist corto de identidad repetido al final: el prompt completo es largo y con
    // mucha instrucción de estilo/composición de por medio, así que lo crítico de identidad
    // se repite acá, lo más cerca posible del final, porque es lo que más peso tiene a la
    // hora de generar (recency). No agregar más bloques de estilo DESPUÉS de este.
    $faceLockItems = array_filter([
        $analisis['color_pelaje']      ?? null,
        $analisis['patron_pelaje']     ?? null,
        $analisis['color_ojos']        ?? null,
        $analisis['forma_orejas']      ?? null,
        $analisis['forma_cabeza_rostro'] ?? null,
        $analisis['rasgos_distintivos'] ?? null,
        $analisis['expresion']         ?? null,
    ]);
    $faceLockBlock = '';
    if ($faceLockItems) {
        $faceLockBlock = "=== FINAL CHECK BEFORE GENERATING (highest priority, re-read this) ===\n"
            . "This exact animal's head/face, copied from the customer photo, not a generic {$especieLabel}: "
            . implode('; ', $faceLockItems) . ". "
            . "Verify these match before finalizing the image — this overrides any conflicting stylistic default.\n\n";
    }

    $prompt = $petIdentityBlock
        . $bodyBlock
        . $styleBlock
        . $styleDirective . "\n\n"
        . $compositionBlock
        . $nameBlock
        . $antiGenericBlock
        . $bgBlock
        . $faceLockBlock
        . "FINAL TARGET: A single, complete, print-ready pet artwork on a {$bgWord}-toned background. Premium quality, clean composition, not overloaded with details. Instantly recognizable as THIS specific pet rendered in the reference style.";

    return $prompt;
}

// ==========================================================
// CONSTRUIR PARTES DE LA REQUEST (prompt + imagen del cliente + referencias)
// ✅ CORRECCIÓN: cada imagen va precedida de una etiqueta de texto explícita
// para que el modelo no confunda "la mascota a recrear" con "las referencias
// de estilo" — ambigüedad que era una causa directa de la inconsistencia.
// ==========================================================

function build_image_parts($prompt, $clienteInlineData, $refsInline)
{
    $parts = [
        ["text" => $prompt],
        ["text" => "=== CUSTOMER PET PHOTO — THIS EXACT ANIMAL'S IDENTITY MUST BE PRESERVED ==="],
        $clienteInlineData,
    ];

    foreach ($refsInline as $i => $ref) {
        $parts[] = ["text" => "=== STYLE REFERENCE IMAGE " . ($i + 1) . " — USE ONLY FOR ART STYLE, NEVER FOR THE PET'S IDENTITY ==="];
        $parts[] = $ref;
    }

    return $parts;
}

// ==========================================================
// LLAMADA A GEMINI IMAGE CON RETRY
// ✅ CORRECCIÓN: responseModalities usa el formato correcto para este modelo
// ==========================================================

function call_gemini_image($prompt, $parts, $retries = 2)
{
    $url = GEMINI_ENDPOINT . GEMINI_IMAGE_MODEL . ':generateContent?key=' . GEMINI_API_KEY;

    $payload = [
        "contents" => [[
            "role"  => "user",
            "parts" => $parts,
        ]],
        "generationConfig" => [
            "responseModalities" => ["IMAGE"],   // ✅ solo IMAGE — TEXT no es necesario y puede causar errores
            // ✅ CORRECCIÓN: temperature=1.0 (el máximo) hacía que el modelo se alejara demasiado
            // de la foto real de la mascota en cada generación (baja fidelidad/consistencia).
            // Bajado a 0.35: prioriza al máximo la fidelidad a la identidad real de la mascota
            // y a las instrucciones del prompt. Si algún estilo queda "soso"/poco creativo,
            // conviene subir esto un poco (0.45-0.55) antes que tocar la identidad de la mascota.
            "temperature"        => 0.35,
            "imageConfig"        => ["aspectRatio" => GEMINI_ASPECT_RATIO],  // fuerza vertical 3:4
        ],
    ];

    for ($attempt = 0; $attempt <= $retries; $attempt++) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ["Content-Type: application/json"],
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_TIMEOUT        => 180,
            CURLOPT_CONNECTTIMEOUT => 30,
        ]);
        $response = curl_exec($ch);
        $curlErr  = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($curlErr)   return ["error" => "cURL error: $curlErr"];
        if (!$response) return ["error" => "Gemini no respondió (vacío)"];

        $data = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return ["error" => "JSON inválido de Gemini", "raw" => substr($response, 0, 500)];
        }
        if (isset($data['error'])) {
            $code = $data['error']['code'] ?? $httpCode;
            // 429 o 503 → reintentar con backoff
            if (in_array($code, [429, 503]) && $attempt < $retries) {
                sleep(pow(2, $attempt + 1));
                continue;
            }
            return ["error" => $data['error']['message'] ?? 'Error Gemini', "code" => $code];
        }

        // Extraer imagen
        $b64  = null;
        $mime = 'image/png';
        if (isset($data['candidates'][0]['content']['parts'])) {
            foreach ($data['candidates'][0]['content']['parts'] as $part) {
                $inline = $part['inlineData'] ?? $part['inline_data'] ?? null;
                if ($inline && !empty($inline['data'])) {
                    $b64  = $inline['data'];
                    $mime = $inline['mimeType'] ?? $inline['mime_type'] ?? 'image/png';
                    break;
                }
            }
        }

        if (!$b64) {
            $finishReason = $data['candidates'][0]['finishReason'] ?? 'UNKNOWN';
            if (in_array($finishReason, ['SAFETY', 'PROHIBITED_CONTENT'])) {
                return [
                    "error"        => "Contenido bloqueado por política de seguridad de Gemini.",
                    "finishReason" => $finishReason,
                ];
            }
            if ($attempt < $retries) {
                sleep(pow(2, $attempt + 1));
                continue;
            }
            return [
                "error"        => "Gemini no devolvió imagen. FinishReason: $finishReason",
                "finishReason" => $finishReason,
                "raw"          => $data,
            ];
        }

        return ["b64" => $b64, "mime" => $mime];
    }

    return ["error" => "Gemini falló después de $retries intentos"];
}

// ==========================================================
// RECURSO: GENERAR DISEÑO
//   POST /disenos.php?recurso=generar
// ==========================================================

if ($recurso === 'generar') {

    if ($method !== 'POST') send_json(["error" => "Método no permitido"], 405);

    $estilo = trim($input['estilo'] ?? '');
    $nombre = trim($input['nombre'] ?? '');
    $talle  = trim($input['talle']  ?? '');
    $imagen = $input['imagen']      ?? '';
    $email  = trim($input['email']  ?? '');
    $color  = trim($input['color']  ?? 'blanca');

    if (!$estilo || !$nombre || !$talle || !$imagen) {
        send_json(["error" => "Faltan datos: estilo, nombre, talle e imagen son obligatorios."], 400);
    }

    $estilosValidos = ['vogue','retro','streetwear','collage','minimal','rap-tee','no-edit'];
    if (!in_array($estilo, $estilosValidos, true)) {
        send_json(["error" => "Estilo no válido: $estilo"], 400);
    }

    // ── GUARDAR FOTO CLIENTE ──────────────────────────────────────────────
    $uploadFolder = __DIR__ . '/uploads';
    $clienteFile  = dataurl_to_file($imagen, $uploadFolder, 'cliente');
    if (!$clienteFile) {
        send_json(["error" => "Imagen inválida. Subí un JPG, PNG o WEBP."], 400);
    }

    $clienteInlineData = file_to_inline_data($clienteFile['path']);
    if (!$clienteInlineData) {
        send_json(["error" => "No se pudo leer la imagen guardada."], 500);
    }

    // ── ESTILO "SIN EDITAR" (no-edit): la imagen subida ES el diseño. Sin IA, costo cero. ──
    if ($estilo === 'no-edit') {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO disenos_mascotas
                    (nombre_mascota, estilo, talle, imagen_cliente, modelo, estado, email_cliente, ip_cliente)
                VALUES (?, ?, ?, ?, 'no-edit', 'pendiente', ?, ?)
            ");
            $stmt->execute([
                $nombre, $estilo, $talle,
                'uploads/' . $clienteFile['filename'],
                $email ?: null,
                $_SERVER['REMOTE_ADDR'] ?? null,
            ]);
            $disenoId = $pdo->lastInsertId();
        } catch (Exception $e) {
            send_json(["error" => "Error BD: " . $e->getMessage()], 500);
        }
        if (!$disenoId) send_json(["error" => "No se obtuvo ID de BD"], 500);

        $genFolder = __DIR__ . '/generados';
        if (!is_dir($genFolder)) mkdir($genFolder, 0755, true);
        $ext     = strtolower(pathinfo($clienteFile['filename'], PATHINFO_EXTENSION)) ?: 'png';
        $genName = 'diseno_' . $disenoId . '_' . date('Ymd_His') . '.' . $ext;
        @copy($clienteFile['path'], $genFolder . '/' . $genName);
        $genRel  = 'generados/' . $genName;

        try {
            $pdo->prepare("UPDATE disenos_mascotas SET imagen_generada=?, estado='generado' WHERE id=?")
                ->execute([$genRel, $disenoId]);
        } catch (Exception $e) {}

        send_json([
            "success"         => true,
            "id"              => (int)$disenoId,
            "imagen_generada" => $imagen,          // el mismo dataURL que subió el cliente
            "imagen_url"      => $genRel,
            "recorte"         => "no_aplica",
            "estilo"          => $estilo,
            "nombre"          => $nombre,
            "talle"           => $talle,
            "especie"         => null,
            "raza"            => null,
        ]);
    }

    // ── PASO 1: DESCRIPCIÓN DETALLADA DE LA MASCOTA ───────────────────────
    $analisis = describir_mascota_detallado($clienteInlineData);

    // ── PASO 2: REFERENCIA DE ESTILO ──────────────────────────────────────
    $refPaths = ref_images_for_style($estilo);
    if (!$refPaths) {
        send_json(["error" => "No hay referencias para el estilo '$estilo'. Subí imágenes a /referencias/{$estilo}/ o /referencias/{$estilo}.jpg"], 500);
    }

    $refsInline = [];
    foreach ($refPaths as $rp) {
        $d = file_to_inline_data($rp);
        if ($d) $refsInline[] = $d;
    }
    if (!$refsInline) {
        send_json(["error" => "No se pudieron leer las referencias del estilo '$estilo'."], 500);
    }
    $refInlineData = $refsInline[0];   // la principal (se usa para el análisis de estilo)

    // ── PASO 3: DESCRIPCIÓN DEL ESTILO DE LA REFERENCIA ──────────────────
    $estiloDesc = describir_estilo_referencia($refInlineData, $estilo);

    // ── PASO 4: INSERT EN BD ──────────────────────────────────────────────
    $disenoId = null;
    $insertData = [
        $nombre, $estilo, $talle,
        'uploads/' . $clienteFile['filename'],
        GEMINI_IMAGE_MODEL,
        $email ?: null,
        $_SERVER['REMOTE_ADDR'] ?? null,
        $analisis['especie'] ?? null,
        $analisis['raza']    ?? null,
    ];

    try {
        $stmt = $pdo->prepare("
            INSERT INTO disenos_mascotas
                (nombre_mascota, estilo, talle, imagen_cliente, modelo, estado, email_cliente, ip_cliente, especie_detectada, raza_detectada)
            VALUES
                (?, ?, ?, ?, ?, 'pendiente', ?, ?, ?, ?)
        ");
        $stmt->execute($insertData);
        $disenoId = $pdo->lastInsertId();
    } catch (Exception $e) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO disenos_mascotas
                    (nombre_mascota, estilo, talle, imagen_cliente, modelo, estado, email_cliente, ip_cliente)
                VALUES (?, ?, ?, ?, ?, 'pendiente', ?, ?)
            ");
            $stmt->execute(array_slice($insertData, 0, 7));
            $disenoId = $pdo->lastInsertId();
        } catch (Exception $e2) {
            send_json(["error" => "Error BD: " . $e2->getMessage()], 500);
        }
    }

    if (!$disenoId) send_json(["error" => "No se obtuvo ID de BD"], 500);

    // ── PASO 5: CONSTRUIR PROMPT OPTIMIZADO ───────────────────────────────
    $prompt = build_optimized_prompt($estilo, $nombre, $analisis, $estiloDesc, $color);

    // ── PASO 6: GENERAR IMAGEN ────────────────────────────────────────────
    $parts  = build_image_parts($prompt, $clienteInlineData, $refsInline);
    $result = call_gemini_image($prompt, $parts);

    if (isset($result['error'])) {
        try {
            $pdo->prepare("UPDATE disenos_mascotas SET estado='error', error_mensaje=? WHERE id=?")
                ->execute([$result['error'], $disenoId]);
        } catch (Exception $e) {}
        send_json(array_merge(["error" => $result['error']], $result), 500);
    }

    $generatedB64  = $result['b64'];
    $generatedMime = $result['mime'];

    // ── PASO 7: GUARDAR IMAGEN EN DISCO ───────────────────────────────────
    $generatedFolder = __DIR__ . '/generados';
    if (!is_dir($generatedFolder)) mkdir($generatedFolder, 0755, true);

    $ext         = ($generatedMime === 'image/jpeg') ? 'jpg' : 'png';
    $genFilename = 'diseno_' . $disenoId . '_' . date('Ymd_His') . '.' . $ext;
    $genPath     = $generatedFolder . '/' . $genFilename;
    $written     = file_put_contents($genPath, base64_decode($generatedB64));
    $genRelPath  = $written !== false ? 'generados/' . $genFilename : null;

    // ── PASO 8: UPDATE BD ─────────────────────────────────────────────────
    if ($genRelPath) {
        try {
            $pdo->prepare("UPDATE disenos_mascotas SET imagen_generada=?, prompt_enviado=?, estado='generado', analisis_mascota=? WHERE id=?")
                ->execute([$genRelPath, $prompt, json_encode($analisis), $disenoId]);
        } catch (Exception $e) {
            try {
                $pdo->prepare("UPDATE disenos_mascotas SET imagen_generada=?, estado='generado' WHERE id=?")
                    ->execute([$genRelPath, $disenoId]);
            } catch (Exception $e2) {}
        }
    } else {
        try {
            $pdo->prepare("UPDATE disenos_mascotas SET estado='generado', error_mensaje='No se pudo guardar archivo' WHERE id=?")
                ->execute([$disenoId]);
        } catch (Exception $e) {}
    }

    // ── PASO 9: RESPUESTA ─────────────────────────────────────────────────
    $responseData = [
        "success"         => true,
        "id"              => (int)$disenoId,
        "imagen_generada" => "data:{$generatedMime};base64,{$generatedB64}",
        "estilo"          => $estilo,
        "nombre"          => $nombre,
        "talle"           => $talle,
        "especie"         => $analisis['especie'],
        "raza"            => $analisis['raza'],
        "analisis"        => $analisis,
    ];

    if ($genRelPath) {
        $responseData["imagen_url"]       = $genRelPath;
        $responseData["referencias_usadas"] = array_map("basename", $refPaths);
    }

    send_json($responseData);
}

// ==========================================================
// RECURSO: REFERENCIAS
//   GET /disenos.php?recurso=referencias
// ==========================================================

if ($recurso === 'referencias' && $method === 'GET') {
    send_json([
        "carpeta"     => __DIR__ . '/referencias/',
        "referencias" => list_available_references(),
    ]);
}

// ==========================================================
// RECURSO: REGENERAR
//   POST /disenos.php?recurso=regenerar&id=123
// ==========================================================

if ($recurso === 'regenerar' && $method === 'POST') {

    if (!$id) send_json(["error" => "Falta ID"], 400);

    $stmt = $pdo->prepare("SELECT * FROM disenos_mascotas WHERE id = ?");
    $stmt->execute([$id]);
    $diseno = $stmt->fetch();

    if (!$diseno) send_json(["error" => "Diseño no encontrado"], 404);

    if (($diseno['estilo'] ?? '') === 'no-edit') {
        send_json(["error" => "Este diseño es tu propia imagen: no se regenera."], 400);
    }

    $clientePath = __DIR__ . '/' . $diseno['imagen_cliente'];
    if (!file_exists($clientePath)) {
        send_json(["error" => "Imagen original no encontrada en el servidor"], 404);
    }

    $clienteInlineData = file_to_inline_data($clientePath);
    if (!$clienteInlineData) send_json(["error" => "No se pudo leer la imagen del cliente"], 500);

    $analisis = null;
    if (!empty($diseno['analisis_mascota'])) {
        $analisis = json_decode($diseno['analisis_mascota'], true);
    }
    if (!$analisis) {
        $analisis = describir_mascota_detallado($clienteInlineData);
    }

    $refPaths = ref_images_for_style($diseno['estilo']);
    if (!$refPaths) send_json(["error" => "No hay referencias para el estilo '{$diseno['estilo']}'."], 500);

    $refsInline = [];
    foreach ($refPaths as $rp) { $d = file_to_inline_data($rp); if ($d) $refsInline[] = $d; }
    if (!$refsInline) send_json(["error" => "No se pudieron leer las referencias."], 500);
    $refInlineData = $refsInline[0];
    $estiloDesc    = describir_estilo_referencia($refInlineData, $diseno['estilo']);
    $regenColor    = trim($input['color'] ?? 'blanca');
    $prompt        = build_optimized_prompt($diseno['estilo'], $diseno['nombre_mascota'], $analisis, $estiloDesc, $regenColor);

    $parts  = build_image_parts($prompt, $clienteInlineData, $refsInline);
    $result = call_gemini_image($prompt, $parts);

    if (isset($result['error'])) send_json($result, 500);

    $generatedB64  = $result['b64'];
    $generatedMime = $result['mime'];

    $ext         = ($generatedMime === 'image/jpeg') ? 'jpg' : 'png';
    $genFilename = 'diseno_' . $id . '_v' . time() . '.' . $ext;
    $genPath     = __DIR__ . '/generados/' . $genFilename;
    file_put_contents($genPath, base64_decode($generatedB64));

    try {
        $pdo->prepare("UPDATE disenos_mascotas SET imagen_generada=?, estado='generado' WHERE id=?")
            ->execute(['generados/' . $genFilename, $id]);
    } catch (Exception $e) {}

    send_json([
        "success"         => true,
        "id"              => (int)$id,
        "imagen_generada" => "data:{$generatedMime};base64,{$generatedB64}",
        "imagen_url"      => 'generados/' . $genFilename,
        "analisis"        => $analisis,
    ]);
}

// ==========================================================
// CRUD BÁSICO
// ==========================================================

if ($recurso === 'disenos') {

    if ($method === 'GET') {
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM disenos_mascotas WHERE id = ?");
            $stmt->execute([$id]);
            send_json($stmt->fetch() ?: []);
        }
        $stmt = $pdo->query("SELECT * FROM disenos_mascotas ORDER BY id DESC LIMIT 200");
        send_json($stmt->fetchAll());
    }

    if ($method === 'DELETE') {
        if (!$id) send_json(["error" => "Falta ID"], 400);
        $stmt = $pdo->prepare("DELETE FROM disenos_mascotas WHERE id = ?");
        $ok   = $stmt->execute([$id]);
        send_json(["success" => $ok]);
    }

    if ($method === 'PUT') {
        if (!$id) send_json(["error" => "Falta ID"], 400);
        $estado = $input['estado'] ?? null;
        if (!$estado) send_json(["error" => "Falta estado"], 400);
        $stmt = $pdo->prepare("UPDATE disenos_mascotas SET estado=? WHERE id=?");
        $ok   = $stmt->execute([$estado, $id]);
        send_json(["success" => $ok]);
    }
}

// ==========================================================
// NOT FOUND
// ==========================================================

send_json(["error" => "Recurso no encontrado: '$recurso'"], 404);