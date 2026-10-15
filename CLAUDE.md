# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Club Huella: an e-commerce flow that turns a customer's pet photo into an AI-generated
illustration (Gemini image generation) printed on a t-shirt. Frontend is a Create React App
SPA; backend is plain PHP (no framework) deployed directly to Hostinger shared hosting.

## Team & how we work

Small two-person operation: Lorenzo (primary dev, git author on this repo) and Nahuel, who
also makes changes to this codebase. There's no CI, no code review process, no staging
environment — whoever edits a file and uploads it to Hostinger is the deploy pipeline, so be
precise about which file you changed and whether it was actually uploaded (see "Deployment
model" below) before assuming a fix is live.

A few hard-earned rules for working in this repo, from things that already went wrong:

- **Never ask someone to paste real secret values into chat**, including to "check" or "fix"
  a config value. If `config.php` needs a change, give the exact line to edit and let them
  edit it on the server directly, or have them paste it with values redacted. This repo's
  `config.php` (OpenAI, Gemini, Mercado Pago, Envia, fal.ai, SMTP, panel password) has already
  been fully pasted into a chat once — treat every one of those credentials as needing
  periodic rotation, not just when something breaks.
- **Never hardcode a secret in a PHP file.** `public_html/conexion.php` still has the MySQL
  password hardcoded in plaintext (pre-existing, not yet cleaned up — flag it, don't silently
  rewrite it without asking). `public_html/paymentsProduct.php` used to have a live OpenAI key
  and a live Mercado Pago token hardcoded too; both were removed and it now reads
  `ENVIA_API_KEY`/`MP_ACCESS_TOKEN` from `config.php` like everything else does — follow that
  pattern for any new credential, and if you ever find one hardcoded, treat it as already
  compromised (rotate it) even after removing it from the code.
- **Before trusting a hardcoded Gemini model ID, verify it's still alive.** Google deprecates/
  shuts down Gemini image models on a short cycle (`GEMINI_IMAGE_MODEL` has already silently
  pointed at a dead model more than once — see "Known incidents" below). Check
  `https://ai.google.dev/gemini-api/docs/deprecations`, or run the snippet in that section,
  before assuming a generation-quality bug is a prompt/code problem.

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
`public_html/` directly, then re-uploading that exact file to Hostinger — `git push` here does
not deploy anything by itself, it only updates this repo. `npm run deploy` (gh-pages) is
unrelated to the real deployment and most likely stale.

`config.php`, required by nearly every PHP entrypoint (`require_once __DIR__ . "/../config.php"`),
is **not in this repo and must never be added to it** — it only exists on the Hostinger server,
one directory above `public_html/` (outside the public webroot, on purpose), and holds every
secret/constant (`GEMINI_API_KEY`, `GEMINI_IMAGE_MODEL`, `MP_ACCESS_TOKEN`, `ENVIA_API_KEY`,
`FAL_API_KEY`, `SMTP_*`, `PANEL_PASSWORD`, etc.) plus any overrides of the fallback `define()`s
seen in the PHP files. When a PHP file defines a fallback with `if (!defined('X'))`, that
fallback is **not necessarily what's live** — `config.php` on the server may already define
the same constant with a different value, and that one wins. You cannot verify which value is
actually live from this repo alone; ask, or have them check the server file.

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

- **`disenos.php`** — the AI design generation pipeline. See its own section below, it's the
  most-tuned and most fragile part of the codebase.
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
- **`paymentsProduct.php`** — looks like a leftover from a different, unrelated project (its
  CORS whitelist is `argames.store`, not `clubhuella.com`) and is currently broken (references
  an undefined `$client` in the `pagar` action). Not known to be wired into the live checkout
  flow (`payments_envios.php` is) — confirm it's actually unused before deleting it, but don't
  assume it does anything either.
- **Two parallel `pedidos` backends**: `public_html/pedidos.php` is the live, read-only,
  password-gated (`PANEL_PASSWORD`, PHP session) HTML admin panel actually used in production.
  `backend/api/pedidos.php` is a separate, newer JSON REST CRUD API for the same `pedidos`
  table — it is not referenced by `public_html/pedidos.php`; check which one a given task
  actually needs before assuming they're interchangeable.

## `disenos.php`: the AI design generation pipeline

Hit by the frontend as `?recurso=generar` (new design) and `?recurso=regenerar&id=X` (one
free regen, same logic). Flow per request:

1. Save the uploaded photo (`dataurl_to_file`).
2. `describir_mascota_detallado()` — a Gemini **vision/text** model analyzes the pet photo
   into a structured JSON: breed, coat color/pattern/texture, eye color, ear shape, nose,
   **head/face geometry** (`forma_cabeza_rostro` — skull/muzzle shape and proportions; this is
   the main cue a human actually recognizes a specific animal by, separate from coat color),
   unique markings, expression. This structured description is what drives identity fidelity
   in the final prompt — if generated pets don't look like the right *individual* animal, the
   fix usually belongs here (is the analysis actually capturing the distinguishing trait?) more
   than in the image-generation call itself.
3. `ref_images_for_style()` loads 1-3 reference images per style from `referencias/{slug}/`
   (or `referencias/{slug}.jpg` as a single-file fallback) and `describir_estilo_referencia()`
   analyzes the first one into a style JSON (palette, typography, mood, effects...).
4. `build_optimized_prompt()` assembles one large prompt from both JSON analyses plus a
   per-style hardcoded `STYLE DIRECTIVE` string (`$perEstilo` in that function) — this is
   where style-specific art direction lives, not in the reference images alone. Adding a new
   style requires three things: a slug in `$estilosValidos`, reference image(s) in
   `referencias/{slug}/`, and an entry in `$perEstilo`.
5. `build_image_parts()` labels each image with an explicit role before sending it — one text
   part says "this is the pet, preserve its identity", another says "this is style reference
   only, never use it for identity" — then `call_gemini_image()` sends prompt + labeled images
   to `GEMINI_IMAGE_MODEL` (via `generateContent`, `responseModalities: ["IMAGE"]`) and retries
   on 429/503/missing-image.
6. Result is saved to `generados/` and the row in `disenos_mascotas` is updated.

`estilo = 'no-edit'` is a special no-AI path (cost zero): the uploaded photo *is* the design.

### Tuning fidelity vs. creativity

`temperature` in `call_gemini_image()`'s `generationConfig` is the main lever: lower = closer
to the customer's real photo and to the prompt's identity instructions, higher = more creative
stylization but more drift toward a "generic-looking" pet. It's currently `0.35` (tuned low,
on purpose, favoring likeness over creative flair). If a specific style starts looking flat or
repetitive, nudge this up in small steps (e.g. `0.45`) — but check actual fidelity against a
few real customer photos again afterward, since this one number trades off directly against
the whole point of the pipeline. Don't "fix" a flat-looking style by loosening the identity
instructions in `build_optimized_prompt()` (`$petIdentityBlock`, `$antiGenericBlock`) instead —
that's treating the symptom and will bring back the original bug.

### Known incidents

- **Oct 2026**: generated designs stopped resembling the uploaded pet photo. Root cause was
  three compounding things: `GEMINI_IMAGE_MODEL` (set in `config.php` on the server) pointed at
  `gemini-3.1-flash-image-preview`, which Google had shut down months earlier (25 Jun 2026);
  `temperature` was maxed at `1.0`; and the customer photo was sent alongside the style
  reference images with no indication of which was which. Fixed by moving to
  `gemini-nano-banana-2.1` (the documented replacement, built for multi-image identity
  consistency), lowering temperature, and adding the explicit per-image text labels in
  `build_image_parts()`. If inconsistency resurfaces, check the model's deprecation status
  first (`https://ai.google.dev/gemini-api/docs/deprecations`) before re-tuning the prompt —
  it's cheaper to rule out than to assume.
- Same investigation turned up a live OpenAI key and a live Mercado Pago production token
  hardcoded in `public_html/paymentsProduct.php` (both committed to git). Removed from code;
  confirm with Lorenzo/Nahuel whether both were actually rotated on OpenAI's/Mercado Pago's
  dashboards before treating this as closed — removing code doesn't invalidate a key. See
  "Team & how we work" above for the handling rule going forward.
