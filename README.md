# Lycian Way · small-group travel website

Static Russian and English travel pages for EAST, WEST and the combined FULL RESET enquiry. Node.js 22+ generates HTML from shared templates. The browser uses CSS and vanilla JavaScript. There is no database or application backend.

## Local run

```sh
npm start
```

Open http://127.0.0.1:4173/. No dependency installation is needed. `npm run build` writes the complete static site to `dist/`. Restart after editing source files.

## What to edit

- `build.mjs` contains the shared layout, brand, localised copy, SEO and policy templates. The Russian site is at the root and the English site is under `en/`.
- `content.mjs` contains route names, proposed stops, draft itineraries, highlights and photo selections. Confirm the itinerary, accommodation, languages and leaders per departure before publishing.
- `config.js` contains optional HTTPS contact links and the email address. MAX renders only in Russian. The departures array is reserved for confirmed dates, availability and prices. Add a visitor-facing schedule only once these details are confirmed.
- `site.css` contains responsive styles. `site.js` handles the menu, photo viewer, enquiry and analytics events.

## Enquiries and privacy

The form validates required fields, applies route preselection and sends asynchronously to Web3Forms when configured. Empty configuration disables delivery. After owner approval, inject a provider-approved **public** Web3Forms browser key into the deployment copy of `dist/config.js`. Keep private credentials and real submissions out of Git. Use a local mock to test provider responses.

Complete both privacy templates with the operator, contact, retention and processor details and have them reviewed before collecting personal data.

Analytics defaults to off. `trackGoal` supports existing Yandex Metrica and GA4 instances and requires explicit consent in English. Connect an actual consent flow before enabling or loading any English analytics provider. Events are `form_submit`, `click_whatsapp`, `click_telegram`, `click_max`, `click_cta`, `select_east`, `select_west`, `select_full_reset`, `select_camp` and `select_comfort`.

## Photos and credits

`images/` holds the prepared WebP assets, including separate desktop and mobile covers. Paths in `photo-data/manifest.csv` are relative to this folder. Check `top-10.csv` for priority photos and `MISSING.md` for genuine photos still needed. Add a replacement to the manifest with dimensions and update the relevant references in `content.mjs` or `build.mjs`. Originals, masters and review material are outside Git.

Keep `photo-licenses/ATTRIBUTION.md` and `external-licenses.csv` in sync with external photo changes. Both Photo Credits pages render attribution from the Markdown source. Use actual accommodation photos with permission for that property.

## Before publication

1. Confirm dates, pricing, included services, meeting and transfer logistics, accommodation, leaders, booking, payment and cancellation terms. Supply verified public contacts.
2. Complete both policies and configure the form with the owner. Verify delivery and spam protection in a controlled environment.
3. Set `SITE_DOMAIN` to the full HTTPS site origin, or origin plus base path for a GitHub project site, and rebuild. The default `[DOMAIN]` build blocks crawling. Inspect canonical and language URLs, robots and sitemap.
4. After owner approval, deploy only `dist/`. For GitHub Pages, configure an Actions workflow to build and upload `dist/` as the Pages artifact. For Netlify or Cloudflare Pages, set the build command to `npm run build` and output directory to `dist`. Configure DNS and TLS using the chosen host’s domain settings, then check both languages, redirects and form configuration at the final URL.
