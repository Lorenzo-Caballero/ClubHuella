# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Club Huella: an e-commerce flow that turns a customer's pet photo into an AI-generated
illustration (Gemini image generation) printed on a t-shirt. Frontend is a Create React App
SPA; backend is plain PHP (no framework) deployed directly to Hostinger shared hosting.

## Commands

```bash
npm start      # CRA dev server (localhost:3000)
npm run build  # production build -> build/
npm test       # react-scripts test (Jest + Testing Library), watch mode by default
npm test -- --watchAll=false --testPathPattern=SomeFile   # single file, no watch
npm run deploy # gh-pages -d build (publishes build/ to the gh-pages branch — NOT how the live site is deployed, see below)
```

There is no PHP linter/test runner wired up in this repo; `php -l <file>` is the quickest
sanity check after editing backend code.

## Deployment model (important — nothing is automatic)

`public_html/` is a **mirror of what is manually uploaded to Hostinger** — it holds both
the compiled React build (`static/`, `index.html`, `asset-manifest.json`, …) and every PHP
backend script, served from the same webroot. There is no CI/CD: shipping a frontend change
means running `npm run build` and re-uploading the output into `public_html/` (or directly
to Hostinger via FTP/file manager); shipping a backend change means editing the PHP files in
`public_html/` directly (that's what `git push` here does — it does not deploy anything by
itself). `npm run deploy` (gh-pages) is unrelated to the real deployment and most likely stale.

`config.php`, required by nearly every PHP entrypoint (`require_once __DIR__ . "/../config.php"`),
is **not in this repo** — it only exists on the Hostinger server and holds all secrets/constants
(`GEMINI_API_KEY`, `MP_ACCESS_TOKEN`, `SMTP_*`, `FAL_API_KEY`, `PANEL_PASSWORD`, etc.) plus any
overrides of the fallback `define()`s seen in the PHP files. When a PHP file defines a fallback
with `if (!defined('X'))`, assume `config.php` on the server may or may not override it — you
cannot verify which value is actually live from this repo alone.

⚠️ `public_html/conexion.php` has the MySQL DB password hardcoded in plaintext, and
`public_html/paymentsProduct.php` has a hardcoded OpenAI API key (marked `// 🔥 CAMBIAR` by a
previous dev, never changed) — both are committed to this repo. Flag this to the user; don't
silently rewrite or scrub it without being asked.

## Frontend architecture (`src/`)

- `src/pages/CreateFlow.jsx` is the entire design wizard: a single component driving a
  `STEPS` array (style → name → color → size → upload photo → summary → generating →
  result → shipping → payment) via a step index, not a router. `stepsComponents/ShippingStep.jsx`
  and `PaymentStep.jsx` are the only steps split out.
- `src/config/env.js` centralizes all `REACT_APP_*` env vars and builds the two backend
  endpoint URLs (`DESIGNS_URL` → `disenos.php`, `PAYMENTS_URL` → `payments_envios.php`).
  Never hardcode an endpoint URL elsewhere — import from here.
- `src/store/cartSlice.js` (+ `store/index.js`) is a small Redux Toolkit + redux-persist
  cart, holding at most the last generated design (generated images are data URLs/base64 —
  CreateFlow explicitly works around localStorage quota limits when persisting it).
- `src/pages/admin/PedidosAdmin.jsx` is a read/write admin view on top of `backend/api/pedidos.php`
  (see "Two parallel `pedidos` backends" below) — distinct from the PHP-only `public_html/pedidos.php`
  panel.

## Backend architecture (`public_html/*.php`)

Everything is a flat PHP file acting as its own router via a `recurso`/`action` query param
(no framework, no routing library). The pattern repeats across files: CORS headers → require
`config.php` + `conexion.php` (shared PDO handle) → read `$_GET`/json decode `php://input` →
`if ($recurso === '...')` blocks that each `send_json(...)` and `exit()`.

- **`disenos.php`** — the AI design generation pipeline, hit by the frontend as
  `?recurso=generar` (new design) and `?recurso=regenerar&id=X` (one free regen). Flow per
  request:
  1. Save the uploaded photo (`dataurl_to_file`).
  2. `describir_mascota_detallado()` — Gemini **text** model (vision) analyzes the pet photo
     into a structured JSON (breed, coat color/pattern, eye color, markings, etc.) — this
     structured description is what drives identity fidelity in the final prompt.
  3. `ref_images_for_style()` loads 1-3 reference images per style from `referencias/{slug}/`
     (or `referencias/{slug}.jpg` as a single-file fallback) and `describir_estilo_referencia()`
     analyzes the first one into a style JSON (palette, typography, mood, effects...).
  4. `build_optimized_prompt()` assembles one large prompt from both JSON analyses plus a
     per-style hardcoded `STYLE DIRECTIVE` string (`$perEstilo` in that function) — this is
     where style-specific art direction lives, not in the reference images alone.
  5. `build_image_parts()` + `call_gemini_image()` sends prompt + the client photo + the style
     reference(s) as separate parts to `GEMINI_IMAGE_MODEL` (via `generateContent`,
     `responseModalities: ["IMAGE"]`) and retries on 429/503/missing-image.
  6. Result is saved to `generados/` and the row in `disenos_mascotas` is updated.
  `estilo = 'no-edit'` is a special no-AI path (cost zero): the uploaded photo *is* the design.
  Adding a new style requires: a slug in `$estilosValidos`, reference image(s) in
  `referencias/{slug}/`, and an entry in `$perEstilo`.
- **`dtf.php`** — post-purchase only (called from `payments_envios.php`'s webhook once a
  payment is confirmed, never on-demand). Produces the print-ready file: styles in
  `estilos_solo_negra()` (`rap-tee`, `streetwear` — internal slugs, not the customer-facing
  names) get a GD halftone treatment; everything else gets background removal via fal.ai
  (Bria RMBG 2.0).
- **`payments_envios.php`** — Mercado Pago checkout + Envia.com shipping quotes + order
  persistence, all behind one `action` param (`rate`, `pagar`, `webhook`, `success`, CRUD).
  Calls into `dtf.php` after a confirmed payment.
- **`mailer.php`** — PHPMailer wrapper that emails the print-ready PNG to the screen printer
  once an order is ready; configured entirely via `config.php` SMTP constants.
- **Two parallel `pedidos` backends**: `public_html/pedidos.php` is the live, read-only,
  password-gated (`PANEL_PASSWORD`, PHP session) HTML admin panel actually used in production.
  `backend/api/pedidos.php` is a separate, newer JSON REST CRUD API for the same `pedidos`
  table — it is not referenced by `public_html/pedidos.php`; check which one a given task
  actually needs before assuming they're interchangeable.

## Gemini model fallbacks move — verify before trusting them

`disenos.php` hardcodes fallback model IDs (`GEMINI_IMAGE_MODEL`, `GEMINI_TEXT_MODEL`) only
used `if (!defined(...))`, i.e. if `config.php` doesn't already set them. Google deprecates/
shuts down Gemini image models on a short cycle — if image generation starts failing or
degrading, check `https://ai.google.dev/gemini-api/docs/deprecations` for the current model's
shutdown date before assuming the bug is in the prompt logic.
