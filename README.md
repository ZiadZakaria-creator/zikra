# Zikra (ذِكرى)

Online perfume store in Egypt (nationwide delivery). Static site (HTML/CSS/vanilla JS) + Firebase (phase C).

## Run locally
```bash
python3 -m http.server 8080
# open http://localhost:8080
```
`fetch()` of `data/catalog.json` needs a server; opening files directly won't load products.

## Structure
- `index.html`, `shop.html`, `product.html?p=<slug>`, `quiz.html`, static pages (`about`, `shipping`, `returns`, `faq`, `contact`), `cart.html`, `checkout.html`, `order.html?id=`
- `assets/css/main.css` – all styles (mobile first, RTL)
- `assets/js/app.js` – shared helpers: catalog loading, header/footer, cart storage, product card
- `assets/js/{home,shop,product,quiz,static}.js` – page scripts
- `data/catalog.json` – demo catalog; in phase D it is generated from Firestore at deploy time
- `tools/gen_pages.py` – one-off generator used to create the page shells
- `mockup/` – design references and phase screenshots
- Figma design: https://www.figma.com/design/I8Uf65jSlL0LwV28lHCNuL

## Phases
- [x] A – public pages with demo data
- [x] B – cart & checkout (orders saved on the device until phase C)
- [x] C – admin panel + Firebase (see docs/FIREBASE_SETUP.md)
- [x] D – SEO, deploy pipeline (see docs/DEPLOY_AND_DOMAIN.md); custom domain pending purchase

## Admin & Firebase
- Admin panel: `/admin/` (Firebase Auth email/password, admins listed in `admins/{uid}`)
- Security rules: `firestore.rules`, tested in `tests/rules.test.mjs` (`cd tests && npm i && npm run rules`)
- Orders are written from the storefront through the Firestore REST API (no SDK on public pages)
- Product images uploaded in the admin are stored as WebP in `productImages`; the deploy build (phase D) turns them into files

## Deploy
GitHub Actions (`.github/workflows/deploy.yml`) runs `tools/build.py` hourly, on every push to `main` and on demand.
The build reads Firestore (public catalog data), writes `_site/` (catalog.json, pre-rendered `p/<slug>/` pages with
Product structured data, Open Graph images, sitemap.xml, feed.xml) and deploys to GitHub Pages. Any failure stops the deploy.
Lighthouse (mobile, built site): performance 93-99, accessibility/best-practices/SEO 100 on public pages.
