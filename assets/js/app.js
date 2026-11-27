/* Zikra — shared storefront helpers (no framework, no build step). */
(function () {
  'use strict';

  const LABELS = {
    gender: { men: 'رجالي', women: 'حريمي', unisex: 'يونيسكس' },
    genderEn: { men: 'FOR HIM', women: 'FOR HER', unisex: 'FOR EVERYONE' },
    family: { woody: 'خشبي', fresh: 'فريش', oriental: 'شرقي', fruity: 'فواكه', floral: 'ورد', oud: 'عود' },
    familyEn: { woody: 'WOODY', fresh: 'FRESH', oriental: 'ORIENTAL', fruity: 'FRUITY', floral: 'ROSE', oud: 'OUD' },
    occasion: { daily: 'يومي', evening: 'سهرة', summer: 'صيفي', winter: 'شتوي', gift: 'هدايا' },
    season: { summer: 'صيف', winter: 'شتا', all: 'طول السنة' },
    time: { day: 'بالنهار', night: 'بالليل' },
    line: { zikra: 'تركيبتنا', inspired: 'مستوحى' },
    level: ['', 'خفيف', 'هادي', 'متوسط', 'قوي', 'قوي جداً']
  };
  const BUDGETS = [
    { id: 'u300', label: 'أقل من 300 ج', min: 0, max: 299 },
    { id: '300-600', label: '300 – 600 ج', min: 300, max: 600 },
    { id: '600-1000', label: '600 – 1000 ج', min: 601, max: 1000 },
    { id: 'o1000', label: 'أكتر من 1000 ج', min: 1001, max: Infinity }
  ];

  const I = {
    menu: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M10 17h10"/></svg>',
    close: '<svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    bag: '<svg class="icon" viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
    search: '<svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg>',
    home: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9H4z"/></svg>',
    star: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/></svg>',
    truck: '<svg class="icon" viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17" r="1.6"/><circle cx="17" cy="17" r="1.6"/></svg>',
    cash: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>',
    chat: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 20l1.5-4A8 8 0 1 1 8 18.5z"/></svg>',
    ig: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/></svg>',
    tt: '<svg class="icon" viewBox="0 0 24 24"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.5 2.5 2.3 4 5 4.2"/></svg>',
    filter: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.6 2 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.9-.1 1.6z"/></svg>'
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => Number(n).toLocaleString('en-US') + ' ج';

  // ---------- Storage (guarded: private mode can throw) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  // ---------- Catalog ----------
  let catalogPromise = null;
  function loadCatalog() {
    if (!catalogPromise) {
      catalogPromise = fetch('data/catalog.json', { cache: 'no-cache' })
        .then((r) => { if (!r.ok) throw new Error('catalog ' + r.status); return r.json(); });
    }
    return catalogPromise;
  }
  const minPrice = (p) => Math.min(...p.variants.map((v) => v.price));
  const inStock = (p) => p.variants.some((v) => v.stock > 0);
  const productUrl = (p) => 'product.html?p=' + encodeURIComponent(p.slug);
  const familyLine = (p) => p.families.map((f) => LABELS.family[f]).join(' · ');
  const subLine = (p) => (p.line === 'inspired' && p.inspiredBy) ? 'مستوحى من: ' + p.inspiredBy : LABELS.gender[p.gender];

  function card(p) {
    const ok = inStock(p);
    const img = p.images[0]
      ? `<img src="${esc(p.images[0].replace('.webp', '-sm.webp'))}" alt="${esc(p.name)}" loading="lazy" width="480" height="480">`
      : '<div class="noimg">الصورة قريباً</div>';
    const tester = p.variants.some((v) => v.tester) ? '<span class="tester">معاه تستر 3 مل</span>' : '';
    return `<article class="p-card">
      <div class="img">${ok ? `<span class="tag">${esc(LABELS.line[p.line] || '')}</span>` : '<span class="tag out">خلص</span>'}${img}${tester}</div>
      <div class="body">
        <h3 class="name"><bdi>${esc(p.name)}</bdi></h3>
        <div class="sub">${esc(subLine(p))}</div>
        <div class="fam-l">${esc(familyLine(p))}</div>
        <div class="row">
          <div class="price"><small>${p.variants.length > 1 ? 'يبدأ من' : ''}</small>${money(minPrice(p))}</div>
          <button class="add" data-add="${esc(p.id)}" aria-label="أضف ${esc(p.name)} للسلة" ${ok ? '' : 'disabled'}>+</button>
        </div>
      </div>
      <a class="stretch" href="${productUrl(p)}" aria-label="${esc(p.name)}"></a>
    </article>`;
  }

  // ---------- Cart ----------
  const CART_KEY = 'zikra_cart';
  const cart = {
    items() { return store.get(CART_KEY, []); },
    save(items) { store.set(CART_KEY, items); updateBadges(); },
    count() { return cart.items().reduce((n, i) => n + i.qty, 0); },
    add(id, size, qty = 1) {
      const items = cart.items();
      const hit = items.find((i) => i.id === id && i.size === size);
      if (hit) hit.qty += qty; else items.push({ id, size, qty });
      cart.save(items);
    },
    setQty(id, size, qty) {
      const items = cart.items().map((i) => (i.id === id && i.size === size ? { ...i, qty } : i)).filter((i) => i.qty > 0);
      cart.save(items);
    },
    remove(id, size) { cart.save(cart.items().filter((i) => !(i.id === id && i.size === size))); },
    clear() { cart.save([]); },
    /* Resolve stored items against the catalog: drops removed products, caps qty at stock */
    lines(catalog) {
      const out = [];
      for (const i of cart.items()) {
        const p = catalog.products.find((x) => x.id === i.id);
        const v = p && p.variants.find((x) => x.size === i.size);
        if (!p || !v) continue;
        const qty = Math.max(0, Math.min(i.qty, v.stock));
        out.push({ p, v, qty, wanted: i.qty, total: qty * v.price });
      }
      return out;
    }
  };

  // ---------- Firestore REST (public pages stay SDK-free) ----------
  const FB = window.FIREBASE_CONFIG || null;
  const fsBase = () => (window.FIRESTORE_EMULATOR
    ? `http://${window.FIRESTORE_EMULATOR}/v1/projects/${FB.projectId}/databases/(default)/documents`
    : `https://firestore.googleapis.com/v1/projects/${FB.projectId}/databases/(default)/documents`);
  function toFs(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'string') return { stringValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(toFs) } };
    return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toFs(x)])) } };
  }
  function fromFs(f) {
    if (!f) return undefined;
    if ('stringValue' in f) return f.stringValue;
    if ('integerValue' in f) return Number(f.integerValue);
    if ('doubleValue' in f) return f.doubleValue;
    if ('booleanValue' in f) return f.booleanValue;
    if ('timestampValue' in f) return new Date(f.timestampValue);
    if ('nullValue' in f) return null;
    if ('arrayValue' in f) return (f.arrayValue.values || []).map(fromFs);
    if ('mapValue' in f) return Object.fromEntries(Object.entries(f.mapValue.fields || {}).map(([k, x]) => [k, fromFs(x)]));
    return undefined;
  }

  // ---------- Orders ----------
  // Orders go to Firestore; a copy stays on the device for the confirmation page.
  // If Firestore refuses (offline, outdated prices), the order is kept locally and
  // the customer is pushed to send it on WhatsApp so it is never lost.
  const ORDERS_KEY = 'zikra_orders';
  const orders = {
    newId() {
      const d = new Date(); const pad = (n) => String(n).padStart(2, '0');
      const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid misreading
      const rnd = new Uint32Array(4); (window.crypto || window.msCrypto).getRandomValues(rnd);
      const tail = Array.from(rnd, (n) => abc[n % abc.length]).join('');
      return `ZK-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${tail}`;
    },
    keepLocal(order) { const all = store.get(ORDERS_KEY, []); all.unshift(order); store.set(ORDERS_KEY, all.slice(0, 20)); },
    async save(order) {
      let synced = false;
      if (FB) {
        const { createdAt, ...data } = order;
        const body = { writes: [{
          update: { name: `projects/${FB.projectId}/databases/(default)/documents/orders/${order.id}`, fields: toFs(data).mapValue.fields },
          currentDocument: { exists: false },
          updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }]
        }] };
        try {
          const r = await fetch(`${fsBase()}:commit?key=${FB.apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          synced = r.ok;
        } catch (e) { synced = false; }
      }
      orders.keepLocal({ ...order, synced });
      return synced;
    },
    get(id) { return store.get(ORDERS_KEY, []).find((o) => o.id === id) || null; }
  };

  // Coupons live in Firestore (coupons/{CODE}); visitors can read one code at a time.
  async function checkCoupon(code) {
    const c = String(code || '').trim().toUpperCase();
    if (!c) return null;
    if (!/^[A-Z0-9]{3,20}$/.test(c) || !FB) return { ok: false, msg: 'الكود ده مش صحيح' };
    try {
      const r = await fetch(`${fsBase()}/coupons/${c}?key=${FB.apiKey}`);
      if (r.status === 404 || r.status === 403) return { ok: false, msg: 'الكود ده مش صحيح' };
      if (!r.ok) return { ok: false, msg: 'مش قادرين نتأكد من الكود دلوقتي. جرّب تاني.' };
      const d = fromFs({ mapValue: { fields: (await r.json()).fields || {} } });
      if (!d.active) return { ok: false, msg: 'الكود ده متوقف' };
      if (!(d.expiresAt instanceof Date) || d.expiresAt < new Date()) return { ok: false, msg: 'الكود ده انتهى' };
      return { ok: true, code: c, percent: Number(d.percent) };
    } catch (e) { return { ok: false, msg: 'مش قادرين نتأكد من الكود دلوقتي. جرّب تاني.' }; }
  }

  const normPhone = (s) => String(s || '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g, '').replace(/^20(?=1)/, '0');
  const validPhone = (s) => /^01[0125]\d{8}$/.test(normPhone(s));

  function orderText(o) {
    const lines = o.items.map((i) => `- ${i.name} (${i.size} مل) × ${i.qty} = ${money(i.total)}`).join('\n');
    return [
      `طلب جديد من موقع ذِكرى`,
      `رقم الأوردر: ${o.id}`,
      ``,
      `الاسم: ${o.customer.name}`,
      `التليفون: ${o.customer.phone}${o.customer.phone2 ? ' / ' + o.customer.phone2 : ''}`,
      `العنوان: ${o.address.govName} - ${o.address.zoneName} - ${o.address.street}${o.address.landmark ? ' (علامة مميزة: ' + o.address.landmark + ')' : ''}`,
      ``,
      `المنتجات:`,
      lines,
      ``,
      `المجموع: ${money(o.subtotal)}`,
      o.discount ? `الخصم (${o.coupon}): -${money(o.discount)}` : null,
      `الشحن: ${money(o.shipping)}`,
      `الإجمالي: ${money(o.total)}`,
      `الدفع: ${o.payment === 'wallet' ? 'محفظة / إنستاباي' : 'عند الاستلام'}`,
      o.notes ? `ملاحظات: ${o.notes}` : null
    ].filter((x) => x !== null).join('\n');
  }

  function updateBadges() {
    const n = cart.count();
    document.querySelectorAll('[data-cart-count]').forEach((b) => { b.textContent = n || ''; b.dataset.n = n; });
  }

  // ---------- Toast ----------
  let toastTimer;
  function toast(html) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = html; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ---------- WhatsApp ----------
  function waLink(settings, text) {
    const num = (settings.whatsapp || '').replace(/\D/g, '');
    if (!num) return 'contact.html';
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(text);
  }

  // ---------- Layout ----------
  const NAV = [
    ['index.html', 'الرئيسية', 'home'], ['shop.html', 'كل العطور', 'shop'],
    ['shop.html?gender=men', 'رجالي', 'men'], ['shop.html?gender=women', 'حريمي', 'women'],
    ['shop.html?gender=unisex', 'يونيسكس', 'unisex'], ['shop.html?occasion=gift', 'الهدايا', 'gift'],
    ['quiz.html', 'اعرف ريحتك', 'quiz']
  ];

  function renderLayout(active, settings, demo) {
    const header = document.getElementById('site-header');
    if (header) {
      header.outerHTML = `${demo ? '<div class="demo-bar">نسخة تجريبية: الأسعار والمخزون والمكونات للعرض بس لحد ما تتظبط من لوحة التحكم.</div>' : ''}
      <div class="announce">${esc(settings.announcement || ('توصيل ' + settings.areas + ' · الدفع عند الاستلام'))}</div>
      <header class="site-header"><div class="wrap bar">
        <button class="icon-btn menu-btn" data-open-menu aria-label="القائمة">${I.menu}</button>
        <nav class="main-nav" aria-label="الرئيسية">${NAV.map(([h, l, k]) => `<a href="${h}" class="${k === active ? 'on' : ''}">${l}</a>`).join('')}</nav>
        <a class="logo" href="index.html" aria-label="ذِكرى — الرئيسية"><img src="assets/brand/logo-mark-gold.webp" alt="ذِكرى" width="80" height="58"></a>
        <div class="hdr-actions">
          <a class="icon-btn" href="shop.html" aria-label="ابحث في العطور">${I.search}</a>
          <a class="icon-btn" href="cart.html" aria-label="السلة">${I.bag}<span class="badge" data-cart-count></span></a>
        </div>
      </div></header>
      <div class="drawer" id="drawer" aria-hidden="true"><div class="scrim" data-close-menu></div>
        <nav class="panel" aria-label="القائمة"><button class="icon-btn close" data-close-menu aria-label="اقفل">${I.close}</button>
          ${NAV.map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}
          <a href="about.html">عننا</a><a href="shipping.html">الشحن</a><a href="returns.html">الاستبدال والاسترجاع</a><a href="faq.html">الأسئلة الشائعة</a><a href="contact.html">تواصل معانا</a>
        </nav></div>`;
    }
    const footer = document.getElementById('site-footer');
    if (footer) {
      const social = [settings.instagram && `<a href="${esc(settings.instagram)}" aria-label="إنستجرام" rel="noopener">${I.ig}</a>`, settings.tiktok && `<a href="${esc(settings.tiktok)}" aria-label="تيك توك" rel="noopener">${I.tt}</a>`].filter(Boolean).join('');
      footer.outerHTML = `<footer class="site-footer"><div class="wrap">
        <div class="cols">
          <div><a class="logo" href="index.html"><img src="assets/brand/logo-mark-gold.webp" alt="ذِكرى" width="80" height="58" loading="lazy"></a>
            <p>عطور مختارة بعناية، بتوصلك لحد البيت في ${esc(settings.areas)}.</p>${social ? `<div class="social" style="margin-top:12px">${social}</div>` : ''}</div>
          <div><h4>المتجر</h4><ul><li><a href="shop.html">كل العطور</a></li><li><a href="shop.html?gender=men">رجالي</a></li><li><a href="shop.html?gender=women">حريمي</a></li><li><a href="shop.html?gender=unisex">يونيسكس</a></li><li><a href="quiz.html">اعرف ريحتك</a></li></ul></div>
          <div><h4>مساعدة</h4><ul><li><a href="shipping.html">الشحن</a></li><li><a href="returns.html">الاستبدال والاسترجاع</a></li><li><a href="faq.html">الأسئلة الشائعة</a></li><li><a href="contact.html">تواصل معانا</a></li></ul></div>
          <div><h4>ذِكرى</h4><ul><li><a href="about.html">عننا</a></li></ul></div>
        </div>
        <div class="copy">© ${new Date().getFullYear()} ذِكرى. أونلاين فقط.</div>
      </div></footer>
      <nav class="bnav" aria-label="تنقل سريع">
        <a href="index.html" class="${active === 'home' ? 'on' : ''}">${I.home}الرئيسية</a>
        <a href="shop.html" class="${['shop', 'men', 'women', 'unisex', 'gift'].includes(active) ? 'on' : ''}">${I.search}العطور</a>
        <a href="quiz.html" class="${active === 'quiz' ? 'on' : ''}">${I.star}اعرف ريحتك</a>
        <a href="cart.html" class="${active === 'cart' ? 'on' : ''}">${I.bag}السلة<span class="badge" data-cart-count></span></a>
      </nav>
      <a class="wa-fab" href="${waLink(settings, 'أهلاً ذِكرى، عندي سؤال')}" aria-label="كلمنا على واتساب" ${settings.whatsapp ? 'target="_blank" rel="noopener"' : ''}>${I.wa}</a>`;
    }
    const drawer = document.getElementById('drawer');
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-menu]')) { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); }
      if (e.target.closest('[data-close-menu]')) { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }
    });
    updateBadges();
  }

  // Quick add from any card: first in-stock size
  function bindQuickAdd(catalog) {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add]');
      if (!btn) return;
      e.preventDefault();
      const p = catalog.products.find((x) => x.id === btn.dataset.add);
      const v = p && p.variants.find((x) => x.stock > 0);
      if (!v) return;
      cart.add(p.id, v.size);
      toast(`اتضاف <bdi>${esc(p.name)}</bdi> (${v.size} مل) للسلة <a href="cart.html">السلة</a>`);
    });
  }

  async function boot(active) {
    try {
      const catalog = await loadCatalog();
      renderLayout(active, catalog.settings, catalog.demo);
      bindQuickAdd(catalog);
      return catalog;
    } catch (err) {
      const main = document.querySelector('main');
      if (main) main.insertAdjacentHTML('afterbegin', '<p class="empty">حصلت مشكلة في تحميل العطور. جرّب تعمل refresh.</p>');
      throw err;
    }
  }

  window.Z = { LABELS, BUDGETS, I, esc, money, store, loadCatalog, minPrice, inStock, productUrl, familyLine, subLine, card, cart, orders, checkCoupon, normPhone, validPhone, orderText, toast, waLink, boot };
})();
