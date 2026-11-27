#!/usr/bin/env python3
"""Deploy build: Firestore -> static site in _site/.

Reads products, settings and uploaded images through the public Firestore REST API
(no secrets needed: catalog data is public in firestore.rules), then writes:
  - data/catalog.json (what the storefront reads)
  - product image files for images uploaded in the admin
  - pre-rendered product pages p/<slug>/ with SEO tags and Product structured data
  - Open Graph share images, sitemap.xml, robots.txt, Google Merchant feed (feed.xml)
Any failure exits non-zero, so the deploy stops and the live site keeps the last good build.
"""
import base64, datetime, html, io, json, os, re, shutil, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / '_site'
SITE_URL = os.environ.get('SITE_URL', 'https://ziadzakaria-creator.github.io/zikra/').rstrip('/') + '/'
CUSTOM_DOMAIN = os.environ.get('CUSTOM_DOMAIN', '').strip()
OFFLINE = os.environ.get('BUILD_OFFLINE') == '1'  # use data/catalog.json instead of Firestore (local dev)

FAMILY = {'woody': 'خشبي', 'fresh': 'فريش', 'oriental': 'شرقي', 'fruity': 'فواكه', 'floral': 'ورد', 'oud': 'عود'}
GENDER = {'men': 'رجالي', 'women': 'حريمي', 'unisex': 'يونيسكس'}
SKIP = {'_site', 'docs', 'tests', 'tools', 'mockup', 'content', '.github', '.git', 'node_modules'}
SKIP_FILES = {'firebase.json', 'firestore.rules', 'firestore.indexes.json', 'README.md', '.gitignore'}


def fail(msg):
    print('BUILD FAILED:', msg, file=sys.stderr)
    sys.exit(1)


# ---------- Firestore REST ----------
def read_config():
    js = (ROOT / 'firebase-config.js').read_text(encoding='utf-8')
    pid = re.search(r"projectId:\s*'([^']+)'", js)
    key = re.search(r"apiKey:\s*'([^']+)'", js)
    if not pid or not key:
        fail('firebase-config.js is missing projectId/apiKey')
    return pid.group(1), key.group(1)


def from_fs(v):
    if 'stringValue' in v: return v['stringValue']
    if 'integerValue' in v: return int(v['integerValue'])
    if 'doubleValue' in v: return v['doubleValue']
    if 'booleanValue' in v: return v['booleanValue']
    if 'timestampValue' in v: return v['timestampValue']
    if 'nullValue' in v: return None
    if 'arrayValue' in v: return [from_fs(x) for x in v['arrayValue'].get('values', [])]
    if 'mapValue' in v: return {k: from_fs(x) for k, x in v['mapValue'].get('fields', {}).items()}
    return None


def fs_get(base, key, path):
    url = f'{base}/{path}{"&" if "?" in path else "?"}key={key}'
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.load(r)
    except Exception as e:  # network error, 403 (rules), 5xx...
        fail(f'Firestore request failed for {path}: {e}')


def fetch_data():
    pid, key = read_config()
    base = f'https://firestore.googleapis.com/v1/projects/{pid}/databases/(default)/documents'
    products, token = [], ''
    while True:
        page = fs_get(base, key, f'products?pageSize=300{"&pageToken=" + token if token else ""}')
        for d in page.get('documents', []):
            p = from_fs({'mapValue': {'fields': d.get('fields', {})}})
            p['id'] = d['name'].rsplit('/', 1)[1]
            products.append(p)
        token = page.get('nextPageToken')
        if not token:
            break
    st = fs_get(base, key, 'settings/store')
    settings = from_fs({'mapValue': {'fields': st.get('fields', {})}})
    images = {}
    for ref in {r for p in products for r in p.get('images', []) if str(r).startswith('fs:')}:
        doc = fs_get(base, key, f'productImages/{ref[3:]}')
        images[ref[3:]] = from_fs({'mapValue': {'fields': doc.get('fields', {})}})
    return products, settings, images


# ---------- Helpers ----------
def data_url_bytes(u):
    m = re.match(r'data:image/[a-z]+;base64,(.*)$', u or '', re.S)
    if not m:
        fail('uploaded image is not a base64 data URL')
    return base64.b64decode(m.group(1))


def esc(s):
    return html.escape(str(s or ''), quote=True)


def min_price(p):
    return min(v['price'] for v in p['variants'])


def validate(products, settings):
    if not products:
        fail('no products in Firestore')
    for p in products:
        for k in ('slug', 'name', 'gender', 'variants'):
            if not p.get(k):
                fail(f'product {p.get("id")} has no {k}')
        if not re.match(r'^[a-z0-9-]{1,60}$', p['slug']):
            fail(f'bad slug {p["slug"]!r}')
        for v in p['variants']:
            if not isinstance(v.get('price'), (int, float)) or v['price'] <= 0:
                fail(f'{p["slug"]}: price must be > 0')
            if not isinstance(v.get('stock'), (int, float)) or v['stock'] < 0:
                fail(f'{p["slug"]}: stock must be >= 0')
    if len({p['slug'] for p in products}) != len(products):
        fail('duplicate slugs')
    if not settings.get('governorates') or not settings.get('shippingFees'):
        fail('settings/store is missing shipping data')


# ---------- Build ----------
def copy_site():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    for item in ROOT.iterdir():
        if item.name in SKIP or item.name in SKIP_FILES or item.name.startswith('.'):
            continue
        dst = OUT / item.name
        shutil.copytree(item, dst) if item.is_dir() else shutil.copy2(item, dst)
    (OUT / '.nojekyll').write_text('')
    nf = OUT / '404.html'
    if nf.exists():
        nf.write_text(nf.read_text(encoding='utf-8').replace('href="/zikra/"', f'href="{SITE_URL}"'), encoding='utf-8')


def write_images(products, images):
    """Turn admin uploads (base64 in Firestore) into files and rewrite references."""
    pdir = OUT / 'assets/img/products'
    pdir.mkdir(parents=True, exist_ok=True)
    for p in products:
        refs = []
        for r in p.get('images', []):
            if str(r).startswith('fs:'):
                iid = r[3:]
                if iid not in images:
                    continue
                (pdir / f'{iid}.webp').write_bytes(data_url_bytes(images[iid].get('data')))
                (pdir / f'{iid}-sm.webp').write_bytes(data_url_bytes(images[iid].get('thumb')))
                refs.append(f'assets/img/products/{iid}.webp')
            elif (ROOT / r).exists():
                refs.append(r)
        p['images'] = refs


def og_images(products):
    """1200x630 share images (JPEG: the most widely supported by WhatsApp/Facebook)."""
    from PIL import Image
    og = OUT / 'assets/og'
    og.mkdir(parents=True, exist_ok=True)
    logo = Image.open(ROOT / 'assets/brand/logo-full-gold.webp').convert('RGBA')

    def compose(photo_path, out, photo_side='left'):
        canvas = Image.new('RGB', (1200, 630), (15, 14, 12))
        ph = Image.open(photo_path).convert('RGB')
        # photo fills one half (cover crop), logo sits on the other half
        w, h = ph.size; tw, th = 600, 630
        s = max(tw / w, th / h); ph = ph.resize((int(w * s) + 1, int(h * s) + 1))
        x = (ph.width - tw) // 2; y = max(0, (ph.height - th) // 2)
        ph = ph.crop((x, y, x + tw, y + th))
        canvas.paste(ph, (0 if photo_side == 'left' else 600, 0))
        lg = logo.copy(); lg.thumbnail((380, 340))
        lx = (600 if photo_side == 'left' else 0) + (600 - lg.width) // 2
        canvas.paste(lg, (lx, (630 - lg.height) // 2), lg)
        canvas.save(out, 'JPEG', quality=84, optimize=True)

    hero = ROOT / 'assets/img/products/mambo-no-05-3.webp'
    compose(hero if hero.exists() else OUT / products[0]['images'][0], og / 'home.jpg')
    for p in products:
        if p['images']:
            src = OUT / p['images'][0] if (OUT / p['images'][0]).exists() else ROOT / p['images'][0]
            compose(src, og / f'{p["slug"]}.jpg')


def product_pages(products, settings):
    tpl = (ROOT / 'product.html').read_text(encoding='utf-8')
    for p in products:
        url = f'{SITE_URL}p/{p["slug"]}/'
        fams = '، '.join(FAMILY.get(f, f) for f in p.get('families', []))
        title = f'{p["name"]} | عطر {GENDER.get(p["gender"], "")} {fams} | ذِكرى'
        desc = f'{p["name"]}: {p.get("description", "")} {GENDER.get(p["gender"], "")}، {fams}. يبدأ من {min_price(p)} ج. توصيل لكل مصر والدفع عند الاستلام.'.strip()
        if p.get('line') == 'inspired' and p.get('inspiredBy'):
            desc = f'مستوحى من {p["inspiredBy"]} (مش العطر الأصلي). ' + desc
        img = f'{SITE_URL}assets/og/{p["slug"]}.jpg' if p['images'] else f'{SITE_URL}assets/og/home.jpg'
        offers = [{
            '@type': 'Offer', 'sku': f'{p["slug"]}-{v["size"]}ml', 'price': str(v['price']), 'priceCurrency': 'EGP',
            'availability': 'https://schema.org/InStock' if v['stock'] > 0 else 'https://schema.org/OutOfStock',
            'itemCondition': 'https://schema.org/NewCondition', 'url': url,
            'shippingDetails': {'@type': 'OfferShippingDetails', 'shippingDestination': {'@type': 'DefinedRegion', 'addressCountry': 'EG'}},
            'hasMerchantReturnPolicy': {'@type': 'MerchantReturnPolicy', 'applicableCountry': 'EG', 'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnWindow', 'merchantReturnDays': 14, 'returnMethod': 'https://schema.org/ReturnByMail', 'returnFees': 'https://schema.org/ReturnShippingFees'}
        } for v in p['variants']]
        ld = {'@context': 'https://schema.org', '@type': 'Product', 'name': p['name'], 'description': desc,
              'image': [f'{SITE_URL}{i}' for i in p['images']] or [img], 'brand': {'@type': 'Brand', 'name': 'ذِكرى Zikra'},
              'sku': p['slug'], 'category': 'Perfume', 'offers': offers if len(offers) > 1 else offers[0]}
        # No aggregateRating/review on purpose: we never publish ratings we don't have.
        head = (f'<base href="../../">\n<link rel="canonical" href="{url}">\n'
                f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>\n')
        page = tpl.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + head, 1)
        page = re.sub(r'<title>.*?</title>', f'<title>{esc(title)}</title>', page, count=1, flags=re.S)
        page = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{esc(desc)}">', page, count=1)
        page = page.replace('<body>', f'<body data-slug="{esc(p["slug"])}" data-og="{esc(img)}">', 1)
        static = (f'<div class="pdp"><div><h1>{esc(p["name"])}</h1><p>{esc(p.get("description", ""))}</p>'
                  f'<p class="big-price">{min_price(p)} ج</p>'
                  + (f'<img src="{esc(p["images"][0])}" alt="{esc(p["name"])}" width="1000" height="1000">' if p['images'] else '')
                  + '</div></div>')
        page = page.replace('<div id="pdp"></div>', f'<div id="pdp">{static}</div>', 1)
        d = OUT / 'p' / p['slug']
        d.mkdir(parents=True, exist_ok=True)
        (d / 'index.html').write_text(page, encoding='utf-8')


def seo_tags():
    """canonical + Open Graph + Twitter card on every public page (product pages set their own image)."""
    for f in list(OUT.glob('*.html')) + list(OUT.glob('p/*/index.html')):
        s = f.read_text(encoding='utf-8')
        if 'noindex' in s:
            continue
        rel = f.relative_to(OUT).as_posix()
        url = SITE_URL + ('' if rel == 'index.html' else rel.replace('index.html', ''))
        title = re.search(r'<title>(.*?)</title>', s, re.S).group(1)
        desc_m = re.search(r'<meta name="description" content="([^"]*)">', s)
        desc = desc_m.group(1) if desc_m else ''
        img_m = re.search(r'data-og="([^"]+)"', s)
        img = img_m.group(1) if img_m else f'{SITE_URL}assets/og/home.jpg'
        tags = [f'<meta property="og:type" content="{"product" if rel.startswith("p/") else "website"}">',
                '<meta property="og:site_name" content="ذِكرى Zikra">', '<meta property="og:locale" content="ar_EG">',
                f'<meta property="og:title" content="{title}">', f'<meta property="og:description" content="{desc}">',
                f'<meta property="og:url" content="{url}">', f'<meta property="og:image" content="{img}">',
                '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
                '<meta name="twitter:card" content="summary_large_image">', '<link rel="manifest" href="manifest.webmanifest">']
        if 'rel="canonical"' not in s:
            tags.insert(0, f'<link rel="canonical" href="{url}">')
        s = s.replace('</head>', '\n'.join(tags) + '\n</head>', 1)
        f.write_text(s, encoding='utf-8')


def sitemap_feed(products, settings):
    today = datetime.date.today().isoformat()
    pages = ['', 'shop.html', 'quiz.html', 'about.html', 'shipping.html', 'returns.html', 'faq.html', 'contact.html']
    urls = [SITE_URL + u for u in pages] + [f'{SITE_URL}p/{p["slug"]}/' for p in products]
    (OUT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + ''.join(f'<url><loc>{esc(u)}</loc><lastmod>{today}</lastmod></url>\n' for u in urls) + '</urlset>\n', encoding='utf-8')
    (OUT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /cart.html\nDisallow: /checkout.html\nDisallow: /order.html\n\nSitemap: {SITE_URL}sitemap.xml\n', encoding='utf-8')
    items = []
    for p in products:
        for v in p['variants']:
            title = f'{p["name"]} {v["size"]}ml - ذِكرى'
            if p.get('line') == 'inspired' and p.get('inspiredBy'):
                title = f'{p["name"]} {v["size"]}ml (مستوحى من {p["inspiredBy"]})'
            items.append(f'''<item>
<g:id>{esc(p["slug"])}-{v["size"]}</g:id><g:item_group_id>{esc(p["slug"])}</g:item_group_id>
<title>{esc(title)}</title><description>{esc(p.get("description") or p["name"])}</description>
<link>{SITE_URL}p/{esc(p["slug"])}/</link>
{f'<g:image_link>{SITE_URL}{esc(p["images"][0])}</g:image_link>' if p["images"] else ''}
{''.join(f'<g:additional_image_link>{SITE_URL}{esc(i)}</g:additional_image_link>' for i in p["images"][1:10])}
<g:availability>{"in_stock" if v["stock"] > 0 else "out_of_stock"}</g:availability>
<g:price>{v["price"]:.2f} EGP</g:price><g:condition>new</g:condition><g:brand>Zikra</g:brand>
<g:identifier_exists>no</g:identifier_exists><g:google_product_category>479</g:google_product_category>
<g:gender>{ {"men": "male", "women": "female"}.get(p["gender"], "unisex") }</g:gender><g:size>{v["size"]} ml</g:size>
</item>''')
    (OUT / 'feed.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>\n'
        f'<title>ذِكرى Zikra</title><link>{SITE_URL}</link><description>عطور ذِكرى</description>\n' + '\n'.join(items) + '\n</channel></rss>\n', encoding='utf-8')


def main():
    if OFFLINE:
        cat = json.loads((ROOT / 'data/catalog.json').read_text(encoding='utf-8'))
        products, settings, images = cat['products'], cat['settings'], {}
        settings.setdefault('shippingFees', {g['id']: g['fee'] for g in settings.get('governorates', [])})
    else:
        products, settings, images = fetch_data()
    products = [p for p in products if p.get('active', True) is not False]
    validate(products, settings)
    copy_site()
    write_images(products, images)
    products.sort(key=lambda p: str(p.get('createdAt', '')), reverse=True)
    for p in products:
        for k in ('updatedAt',):
            p.pop(k, None)
    public_settings = {k: v for k, v in settings.items() if k not in ('updatedAt',)}
    catalog = {'demo': False, 'built': True, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
               'settings': public_settings, 'products': products}
    (OUT / 'data').mkdir(exist_ok=True)
    (OUT / 'data/catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    og_images(products)
    product_pages(products, settings)
    seo_tags()
    sitemap_feed(products, settings)
    version = catalog['generatedAt']
    sw = OUT / 'sw.js'
    if sw.exists():
        sw.write_text(sw.read_text(encoding='utf-8').replace('__BUILD__', version), encoding='utf-8')
    if CUSTOM_DOMAIN:
        (OUT / 'CNAME').write_text(CUSTOM_DOMAIN + '\n')
    print(f'Built {len(products)} products, {len(images)} uploaded images -> {OUT}')


if __name__ == '__main__':
    main()
