/* Zikra admin panel — Firebase Auth + Firestore (modular SDK from the official CDN). */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {
  getFirestore, connectFirestoreEmulator, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, orderBy, limit, where, documentId, runTransaction, Timestamp, arrayUnion, writeBatch
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
// Local testing against the emulators: /admin/?emu=1 on localhost
if (['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).has('emu')) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8085);
}

// ---------- Constants & helpers ----------
const STATUS = [['new', 'جديد'], ['confirmed', 'متأكد'], ['shipped', 'اتشحن'], ['delivered', 'اتسلّم'], ['cancelled', 'اتلغى']];
const STATUS_L = Object.fromEntries(STATUS);
const L = {
  gender: { men: 'رجالي', women: 'حريمي', unisex: 'يونيسكس' },
  family: { woody: 'خشبي', fresh: 'فريش', oriental: 'شرقي', fruity: 'فواكه', floral: 'ورد', oud: 'عود' },
  occasion: { daily: 'يومي', evening: 'سهرة', summer: 'صيفي', winter: 'شتوي', gift: 'هدايا' },
  season: { summer: 'صيف', winter: 'شتا', all: 'طول السنة' },
  time: { day: 'بالنهار', night: 'بالليل' },
  line: { zikra: 'تركيبتنا', inspired: 'مستوحى' }
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => Number(n || 0).toLocaleString('en-US') + ' ج';
const fmtDate = (t) => { const d = t?.toDate ? t.toDate() : (t ? new Date(t) : null); return d ? d.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '—'; };
const $ = (sel, root = document) => root.querySelector(sel);
const appEl = document.getElementById('app');
const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
const waTo = (phone, text) => 'https://wa.me/2' + String(phone).replace(/\D/g, '') + '?text=' + encodeURIComponent(text);
const imgSrc = (ref, thumbs) => (ref.startsWith('fs:') ? (thumbs[ref.slice(3)] || '') : '../' + ref.replace('.webp', '-sm.webp'));

function toast(msg) {
  let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
}
async function guard(fn, okMsg) {
  try { const r = await fn(); if (okMsg) toast(okMsg); return r; } catch (e) { console.error(e); toast('حصلت مشكلة: ' + (e.code || e.message)); throw e; }
}

const S = { user: null, tab: 'orders', settings: null, products: [], orders: [], coupons: [], thumbs: {}, filter: 'all', q: '' };

// ---------- Auth ----------
onAuthStateChanged(auth, async (user) => {
  S.user = user;
  if (!user) return renderLogin();
  const adm = await getDoc(doc(db, 'admins', user.uid)).catch(() => null);
  if (!adm || !adm.exists()) return renderDenied();
  await loadAll();
  renderShell();
});

function renderLogin(err = '') {
  appEl.innerHTML = `<div class="login"><form class="box" id="login">
    <img src="../assets/brand/logo-mark-gold.webp" alt="ذِكرى" style="filter:brightness(.6)">
    <h1 style="text-align:center;font-size:22px">لوحة التحكم</h1>
    <div class="field"><label for="em">الإيميل</label><input id="em" type="email" autocomplete="username" required dir="ltr"></div>
    <div class="field"><label for="pw">الباسورد</label><input id="pw" type="password" autocomplete="current-password" required dir="ltr"></div>
    ${err ? `<p class="err">${esc(err)}</p>` : ''}
    <button class="btn btn-dark btn-block">دخول</button>
    <button type="button" class="c-remove" id="reset">نسيت الباسورد؟</button>
  </form></div>`;
  $('#login').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await signInWithEmailAndPassword(auth, $('#em').value.trim(), $('#pw').value); }
    catch (er) { renderLogin(er.code === 'auth/too-many-requests' ? 'محاولات كتير. استنى شوية.' : 'الإيميل أو الباسورد غلط.'); }
  });
  $('#reset').addEventListener('click', async () => {
    const em = $('#em').value.trim(); if (!em) return toast('اكتب الإيميل الأول');
    await sendPasswordResetEmail(auth, em).catch(() => {}); toast('لو الإيميل مسجّل، هيوصلك لينك تغيير الباسورد');
  });
}
function renderDenied() {
  appEl.innerHTML = `<div class="login"><div class="box"><h1 style="font-size:20px">الحساب ده مش أدمن</h1>
    <p>اتسجل دخول بـ <bdi>${esc(S.user.email)}</bdi> بس الحساب مش متضاف في قايمة الأدمن.</p>
    <p class="policy-note">UID: <bdi dir="ltr">${esc(S.user.uid)}</bdi></p>
    <button class="btn btn-line" id="out">خروج</button></div></div>`;
  $('#out').onclick = () => signOut(auth);
}

// ---------- Data ----------
async function loadAll() {
  const [st, ps, os, cs] = await Promise.all([
    getDoc(doc(db, 'settings', 'store')),
    getDocs(collection(db, 'products')),
    getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(150))),
    getDocs(collection(db, 'coupons'))
  ]);
  S.settings = st.exists() ? st.data() : null;
  S.products = ps.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  S.orders = os.docs.map((d) => ({ ...d.data(), id: d.id }));
  S.coupons = cs.docs.map((d) => ({ ...d.data(), code: d.id }));
  await loadThumbs(S.products.flatMap((p) => (p.images || []).filter((r) => r.startsWith('fs:')).map((r) => r.slice(3))));
}
async function loadThumbs(ids) {
  const need = [...new Set(ids)].filter((id) => !S.thumbs[id]);
  const snaps = await Promise.all(need.map((id) => getDoc(doc(db, 'productImages', id)).catch(() => null)));
  snaps.forEach((s, i) => { if (s && s.exists()) S.thumbs[need[i]] = s.data().thumb; });
}

// ---------- Shell ----------
const TABS = [['orders', 'الطلبات'], ['products', 'المنتجات'], ['coupons', 'أكواد الخصم'], ['visits', 'الزيارات'], ['settings', 'الشحن والإعدادات']];
function renderShell() {
  const newCount = S.orders.filter((o) => o.status === 'new').length;
  appEl.innerHTML = `<header class="a-top"><div class="wrap bar">
      <img src="../assets/brand/logo-mark-gold.webp" alt="ذِكرى">
      <div class="who"><bdi>${esc(S.user.email)}</bdi><button id="out">خروج</button></div></div>
    <nav class="a-tabs">${TABS.map(([k, l]) => `<button data-tab="${k}" class="${S.tab === k ? 'on' : ''}">${l}${k === 'orders' && newCount ? ` (${newCount})` : ''}</button>`).join('')}</nav></header>
    <main class="wrap a-main" id="view"></main>`;
  $('#out').onclick = () => signOut(auth);
  appEl.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { S.tab = b.dataset.tab; renderShell(); }));
  ({ orders: viewOrders, products: viewProducts, coupons: viewCoupons, visits: viewVisits, settings: viewSettings })[S.tab]();
}
const PUBLISH_URL = 'https://github.com/ZiadZakaria-creator/zikra/actions/workflows/deploy.yml';
const publishNote = `<div class="a-note">تعديلات المنتجات والأسعار والشحن بتظهر على الموقع في النشر الجاي: أوتوماتيك كل ساعة، أو فوراً من <a href="${PUBLISH_URL}" target="_blank" rel="noopener"><b>انشر دلوقتي</b></a> (Run workflow). الطلبات بتوصل هنا على طول.</div>`;

// ---------- Orders ----------
function priceIssues(o) {
  const issues = [];
  const sum = (o.items || []).reduce((n, i) => n + i.price * i.qty, 0);
  if (sum !== o.subtotal) issues.push('مجموع المنتجات مش مساوي للمجموع المكتوب');
  for (const i of o.items || []) {
    const p = S.products.find((x) => x.id === i.id); const v = p && (p.variants || []).find((x) => x.size === i.size);
    if (!p || !v) issues.push(`${i.name} (${i.size} مل) مش موجود دلوقتي في المنتجات`);
    else if (v.price !== i.price) issues.push(`سعر ${i.name} في الطلب ${money(i.price)} والسعر الحالي ${money(v.price)}`);
  }
  return issues;
}
function viewOrders() {
  const v = $('#view');
  const counts = Object.fromEntries(STATUS.map(([k]) => [k, S.orders.filter((o) => o.status === k).length]));
  const q = S.q.trim();
  const list = S.orders.filter((o) => (S.filter === 'all' || o.status === S.filter)
    && (!q || o.id.includes(q.toUpperCase()) || (o.customer?.phone || '').includes(q) || (o.customer?.name || '').includes(q)));
  v.innerHTML = `<div class="a-bar"><h1>الطلبات</h1><input class="a-search" id="q" placeholder="رقم الأوردر أو الموبايل أو الاسم" value="${esc(S.q)}"></div>
    <div class="chips" style="margin-bottom:14px"><button class="chip ${S.filter === 'all' ? 'on' : ''}" data-f="all">الكل (${S.orders.length})</button>
    ${STATUS.map(([k, l]) => `<button class="chip ${S.filter === k ? 'on' : ''}" data-f="${k}">${l} (${counts[k]})</button>`).join('')}</div>
    <div class="a-list">${list.length ? list.map((o) => `<div class="o-row"><button class="o-card" data-o="${esc(o.id)}">
      <div><div class="id"><bdi>${esc(o.id)}</bdi> ${priceIssues(o).length ? '<span class="warn-ic" title="فيه اختلاف في الأسعار">⚠</span>' : ''}</div><div class="meta">${fmtDate(o.createdAt)}</div></div>
      <div><div>${esc(o.customer?.name)}</div><div class="meta"><bdi dir="ltr">${esc(o.customer?.phone)}</bdi> · ${esc(o.address?.govName)}</div></div>
      <div class="tot">${money(o.total)}<div class="meta">${o.payment === 'wallet' ? 'محفظة' : depositOf(o) ? 'استلام · شحن مقدّم' : 'عند الاستلام'}</div></div>
      <span class="st st-${o.status}">${STATUS_L[o.status] || o.status}</span></button>
      <button class="o-del" data-del="${esc(o.id)}" aria-label="امسح الطلب ${esc(o.id)}" title="امسح الطلب نهائياً">${TRASH}</button></div>`).join('') : '<p class="empty">مفيش طلبات هنا.</p>'}</div>`;
  $('#q').oninput = (e) => { S.q = e.target.value; const pos = e.target.selectionStart; viewOrders(); const el = $('#q'); el.focus(); el.setSelectionRange(pos, pos); };
  v.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { S.filter = b.dataset.f; viewOrders(); }));
  v.querySelectorAll('[data-o]').forEach((b) => (b.onclick = () => openOrder(b.dataset.o)));
  v.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => deleteOrder(b.dataset.del)));
}

const TRASH = '<svg class="icon" viewBox="0 0 24 24" width="20" height="20"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>';
/* Only cancelled orders can be deleted: cancelling first gives the stock back,
   and a live order can't vanish by a mis-click. */
async function deleteOrder(id) {
  const o = S.orders.find((x) => x.id === id); if (!o) return;
  if (o.status !== 'cancelled') return alert('علشان المخزون يرجع ومايتمسحش طلب شغال بالغلط:\nافتح الطلب ودوس "اتلغى" الأول، وبعدين امسحه.');
  if (!confirm(`تمسح الطلب ${o.id} (${o.customer?.name || ''}) نهائياً؟ مش هتقدر ترجّعه.`)) return;
  await guard(() => deleteDoc(doc(db, 'orders', id)), 'اتمسح الطلب');
  S.orders = S.orders.filter((x) => x.id !== id);
  document.querySelector('.modal')?.remove();
  renderShell();
}

const depositOf = (o) => (o.payment !== 'wallet' && S.settings?.payment?.cod && S.settings.payment.codDeposit !== false ? o.shipping : 0);
const payLabel = (o) => (o.payment === 'wallet' ? 'محفظة / إنستاباي' : depositOf(o) ? `عند الاستلام · الشحن ${money(o.shipping)} مقدّم` : 'الدفع عند الاستلام');
function waTemplates(o) {
  const items = (o.items || []).map((i) => `- ${i.name} (${i.size} مل) × ${i.qty}`).join('\n');
  const addr = `${o.address.govName} - ${o.address.zoneName} - ${o.address.street}${o.address.landmark ? ' (' + o.address.landmark + ')' : ''}`;
  return [
    ['تأكيد الأوردر', `أهلاً ${o.customer.name} 👋\nمعاك ذِكرى. استلمنا طلبك رقم ${o.id}:\n${items}\nالإجمالي ${money(o.total)} شامل الشحن (${payLabel(o)}).${depositOf(o) ? `\nمن فضلك حوّل مصاريف الشحن ${money(o.shipping)} على ${S.settings.walletNumber || 'المحفظة'} وابعتلنا صورة التحويل، والباقي ${money(o.total - o.shipping)} للمندوب.` : ''}\nنأكد الطلب؟`],
    ['تأكيد العنوان + اللوكيشن', `ممكن تأكدلنا العنوان ده؟\n${addr}\nولو تقدر تبعتلنا اللوكيشن من واتساب (📎 ← الموقع) علشان المندوب يوصلك أسرع 🙏`],
    ['اتشحن', `طلبك ${o.id} اتشحن 🚚 وهيوصلك قريب إن شاء الله. لو عندك أي سؤال كلمنا هنا.`]
  ];
}

function openOrder(id) {
  const o = S.orders.find((x) => x.id === id); if (!o) return;
  const issues = priceIssues(o);
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="sheet" role="dialog" aria-label="تفاصيل الطلب">
    <div class="sheet-head"><h2><bdi>${esc(o.id)}</bdi> <span class="st st-${o.status}">${STATUS_L[o.status]}</span></h2><button class="icon-btn" data-close aria-label="اقفل">✕</button></div>
    ${issues.length ? `<div class="a-note"><b>⚠ راجع الأسعار قبل التأكيد:</b><br>${issues.map(esc).join('<br>')}</div>` : ''}
    <div class="grid2">
      <div class="box"><h3>العميل</h3><div class="kv"><span>الاسم</span><span>${esc(o.customer.name)}</span></div>
        <div class="kv"><span>الموبايل</span><bdi dir="ltr">${esc(o.customer.phone)}</bdi></div>
        ${o.customer.phone2 ? `<div class="kv"><span>رقم تاني</span><bdi dir="ltr">${esc(o.customer.phone2)}</bdi></div>` : ''}
        <div class="kv"><span>التاريخ</span><span>${fmtDate(o.createdAt)}</span></div></div>
      <div class="box"><h3>العنوان</h3><div>${esc(o.address.govName)} - ${esc(o.address.zoneName)}</div><div>${esc(o.address.street)}</div>
        ${o.address.landmark ? `<div class="meta">علامة: ${esc(o.address.landmark)}</div>` : ''}${o.notes ? `<div class="a-note" style="margin:0">ملاحظة العميل: ${esc(o.notes)}</div>` : ''}</div>
    </div>
    <div class="box" style="margin-top:12px"><h3>المنتجات</h3>
      <table class="a-table"><thead><tr><th>العطر</th><th>الحجم</th><th>السعر</th><th>الكمية</th><th>الإجمالي</th></tr></thead><tbody>
      ${o.items.map((i) => `<tr><td><bdi>${esc(i.name)}</bdi>${i.tester ? ' <small>+ تستر</small>' : ''}</td><td>${i.size} مل</td><td>${money(i.price)}</td><td>${i.qty}</td><td>${money(i.price * i.qty)}</td></tr>`).join('')}</tbody></table>
      <div class="kv"><span>المجموع</span><span>${money(o.subtotal)}</span></div>
      ${o.discount ? `<div class="kv"><span>خصم ${esc(o.coupon)}</span><span>−${money(o.discount)}</span></div>` : ''}
      <div class="kv"><span>الشحن</span><span>${money(o.shipping)}</span></div>
      <div class="kv"><b>الإجمالي</b><b>${money(o.total)}</b></div>
      <div class="kv"><span>الدفع</span><span>${payLabel(o)}</span></div>
      ${depositOf(o) ? `<div class="kv"><span>للمندوب يحصّل</span><b>${money(o.total - o.shipping)}</b></div>` : ''}
      <div class="kv"><span>المخزون</span><span>${o.stockApplied ? 'اتخصم' : 'لسه ماتخصمش (بيتخصم عند التأكيد)'}</span></div></div>
    <div class="box" style="margin-top:12px"><h3>الحالة</h3><div class="btn-row st-btns">${STATUS.map(([k, l]) => `<button data-st="${k}" class="${o.status === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <div class="box" style="margin-top:12px"><h3>رسايل واتساب جاهزة</h3><div class="btn-row">
      ${waTemplates(o).map(([l, t]) => `<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${waTo(o.customer.phone, t)}">${l}</a>`).join('')}</div></div>
    <div class="box" style="margin-top:12px"><h3>ملاحظة داخلية</h3><textarea id="anote" rows="2" class="a-search" style="border-radius:12px">${esc(o.adminNote || '')}</textarea>
      <div class="btn-row"><button class="btn btn-line btn-sm" id="savenote">احفظ الملاحظة</button><button class="btn btn-dark btn-sm" id="print">اطبع الفاتورة</button>${o.status === 'cancelled' ? '<button class="btn btn-danger btn-sm" id="delo">امسح الطلب نهائياً</button>' : ''}</div></div>
    ${(o.history || []).length ? `<div class="box" style="margin-top:12px"><h3>السجل</h3>${o.history.map((h) => `<div class="meta">${fmtDate(h.at)} · ${STATUS_L[h.status] || h.status} · ${esc(h.by || '')}</div>`).join('')}</div>` : ''}
  </div>`;
  document.body.appendChild(m);
  const close = () => { m.remove(); viewOrders(); };
  m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) close(); });
  m.querySelectorAll('[data-st]').forEach((b) => (b.onclick = async () => {
    const to = b.dataset.st; if (to === o.status) return;
    if (to === 'cancelled' && !confirm('تلغي الطلب؟ لو المخزون كان اتخصم هيرجع.')) return;
    await guard(() => changeStatus(o, to), 'اتحدّثت الحالة'); m.remove(); openOrder(o.id);
  }));
  $('#savenote', m).onclick = () => guard(async () => { await updateDoc(doc(db, 'orders', o.id), { adminNote: $('#anote', m).value.trim() }); o.adminNote = $('#anote', m).value.trim(); }, 'اتحفظت');
  $('#print', m).onclick = () => printInvoice(o);
  const delo = $('#delo', m); if (delo) delo.onclick = () => deleteOrder(o.id);
}

/* Stock moves with the order: taken on confirm, given back on cancel. */
async function changeStatus(o, to) {
  const ref = doc(db, 'orders', o.id);
  const entry = { status: to, at: Timestamp.now(), by: S.user.email };
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref); const cur = snap.data();
    const take = ['confirmed', 'shipped', 'delivered'].includes(to) && !cur.stockApplied;
    const give = to === 'cancelled' && cur.stockApplied;
    const patch = { status: to, history: arrayUnion(entry) };
    if (take || give) {
      const ids = [...new Set(cur.items.map((i) => i.id))];
      const prods = await Promise.all(ids.map((id) => tx.get(doc(db, 'products', id))));
      prods.forEach((ps, k) => {
        if (!ps.exists()) return;
        const variants = ps.data().variants.map((v) => {
          const qty = cur.items.filter((i) => i.id === ids[k] && i.size === v.size).reduce((n, i) => n + i.qty, 0);
          return qty ? { ...v, stock: Math.max(0, v.stock + (give ? qty : -qty)) } : v;
        });
        tx.update(doc(db, 'products', ids[k]), { variants });
      });
      patch.stockApplied = take;
    }
    tx.update(ref, patch);
  });
  const fresh = await getDoc(ref); Object.assign(o, fresh.data());
  const ps = await getDocs(collection(db, 'products')); S.products = ps.docs.map((d) => ({ ...d.data(), id: d.id }));
}

async function printInvoice(o) {
  const s = S.settings || {};
  const wa = (s.whatsapp || '').replace(/^20/, '0');
  const pay = payLabel(o);
  const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
  const testers = o.items.filter((i) => i.tester).reduce((n, i) => n + i.qty, 0);
  $('#invoice').innerHTML = `<div class="inv">
    <header class="inv-head">
      <img src="../assets/brand/logo-full-gold.webp" alt="ذِكرى" class="inv-logo">
      <div class="inv-meta"><div class="inv-title">فاتورة</div>
        <div class="inv-id" dir="ltr">${esc(o.id)}</div>
        <div>${d.toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })}</div></div>
    </header>
    <section class="inv-parties">
      <div class="inv-box"><h4>العميل</h4><b>${esc(o.customer.name)}</b><div dir="ltr" class="inv-ltr">${esc(o.customer.phone)}${o.customer.phone2 ? ' · ' + esc(o.customer.phone2) : ''}</div></div>
      <div class="inv-box"><h4>التوصيل</h4><b>${esc(o.address.govName)} - ${esc(o.address.zoneName)}</b><div>${esc(o.address.street)}</div>${o.address.landmark ? `<div class="inv-muted">${esc(o.address.landmark)}</div>` : ''}</div>
    </section>
    <table class="inv-table"><thead><tr><th>العطر</th><th>الحجم</th><th>السعر</th><th>الكمية</th><th>الإجمالي</th></tr></thead><tbody>
      ${o.items.map((i) => `<tr><td><b dir="auto">${esc(i.name)}</b>${i.tester ? '<div class="inv-gift">+ تستر 3 مل هدية</div>' : ''}</td><td>${i.size} مل</td><td>${money(i.price)}</td><td>${i.qty}</td><td>${money(i.price * i.qty)}</td></tr>`).join('')}
    </tbody></table>
    <section class="inv-bottom">
      <div class="inv-pay"><h4>طريقة الدفع</h4><span class="inv-pill">${pay}</span>
        ${o.payment === 'wallet' && s.walletNumber ? `<div class="inv-muted">على رقم <span dir="ltr">${esc(s.walletNumber)}</span></div>` : ''}
        ${o.payment !== 'wallet' ? `<div class="inv-muted">المطلوب من المندوب: <b>${money(o.total - depositOf(o))}</b>${depositOf(o) ? ` <span>(الشحن ${money(o.shipping)} اتدفع مقدّم)</span>` : ''}</div>` : ''}</div>
      <div class="inv-totals">
        <div><span>المجموع</span><span>${money(o.subtotal)}</span></div>
        ${o.discount ? `<div><span>خصم ${esc(o.coupon)}</span><span>−${money(o.discount)}</span></div>` : ''}
        <div><span>الشحن (${esc(o.address.govName)})</span><span>${money(o.shipping)}</span></div>
        <div class="inv-grand"><span>الإجمالي</span><span>${money(o.total)}</span></div>
      </div>
    </section>
    ${testers ? `<div class="inv-tip"><b>جرّب قبل ما تفتح:</b> جرّب التستر الأول وسيب الريحة تاخد وقتها، وخلّي الزجاجة الكبيرة مقفولة لحد ما تتأكد إنها ريحتك. الزجاجة المفتوحة مابتترجعش.</div>` : ''}
    <footer class="inv-foot">
      <div class="inv-orn" aria-hidden="true"><span></span>✦<span></span></div>
      <div class="inv-thanks">شكراً إنك اخترت ذِكرى</div>
      <div class="inv-tag" dir="ltr">Where memories linger</div>
      <div class="inv-policy">الاستبدال والاسترجاع خلال 14 يوم للزجاجة المقفولة في علبتها الأصلية. لو الأوردر وصلك فيه مشكلة كلمنا خلال 24 ساعة من الاستلام.</div>
      <div class="inv-contact">${wa ? `واتساب <span dir="ltr">${esc(wa)}</span>` : ''}${s.instagram ? ` · <span dir="ltr">${esc(s.instagram.replace(/^https?:\/\/(www\.)?/, ''))}</span>` : ''}</div>
    </footer>
  </div>`;
  // Wait for the logo so it is not missing on paper
  const img = $('#invoice img');
  if (img && !img.complete) await new Promise((r) => { img.onload = img.onerror = r; setTimeout(r, 3000); });
  window.print();
}

// ---------- Products ----------
function viewProducts() {
  const v = $('#view');
  v.innerHTML = `${publishNote}<div class="a-bar"><h1>المنتجات (${S.products.length})</h1><div class="btn-row">
    ${S.products.length ? '' : '<button class="btn btn-line btn-sm" id="seed">استورد العطور الحالية من الموقع</button>'}
    <button class="btn btn-line btn-sm" id="xexp">نزّل شيت Excel</button>
    <label class="btn btn-line btn-sm" for="ximp">استورد من Excel</label><input type="file" id="ximp" accept=".xlsx,.xls,.csv" hidden>
    <button class="btn btn-dark btn-sm" id="newp">+ منتج جديد</button></div></div>
    <div class="p-grid">${S.products.map((p) => {
      const stock = (p.variants || []).reduce((n, x) => n + Number(x.stock || 0), 0);
      const src = p.images?.[0] ? imgSrc(p.images[0], S.thumbs) : '';
      return `<button class="p-tile ${p.active === false ? 'off' : ''}" data-p="${esc(p.id)}">${src ? `<img src="${esc(src)}" alt="">` : '<div class="noimg">مفيش صورة</div>'}
        <div class="b"><b><bdi>${esc(p.name)}</bdi></b><small>${L.gender[p.gender] || ''} · ${(p.variants || []).map((x) => x.size + ' مل').join('، ')}</small>
        <small>${p.active === false ? 'مخفي' : stock ? 'المخزون: ' + stock : '<span class="warn-ic">خلص</span>'}</small></div></button>`;
    }).join('')}</div>`;
  $('#newp').onclick = () => openProduct(null);
  v.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => openProduct(b.dataset.p)));
  const seed = $('#seed'); if (seed) seed.onclick = seedFromSite;
  $('#xexp').onclick = () => guard(exportExcel);
  $('#ximp').onchange = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) guard(() => importExcel(f)); };
}

// ---------- Excel import / export ----------
// One row per product size. Rows with the same slug belong to the same product.
const XL = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';
const COLS = ['الرابط', 'اسم العطر', 'لمين', 'النوع', 'مستوحى من', 'عائلة الريحة', 'المناسبة', 'الحجم (مل)', 'السعر', 'المخزون', 'معاه تستر', 'ظاهر', 'المقدمة', 'القلب', 'القاعدة'];
const rev = (map) => Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
const yes = (v) => ['نعم', 'ايوه', 'أيوه', 'yes', 'y', 'true', '1', '✓'].includes(String(v ?? '').trim().toLowerCase());
const splitList = (v) => String(v ?? '').split(/[,،\/]/).map((x) => x.trim()).filter(Boolean);

async function exportExcel() {
  const X = await import(XL);
  const rows = [COLS];
  const src = S.products.length ? S.products : (await (await fetch('../data/catalog.json', { cache: 'no-cache' })).json()).products;
  for (const p of src) for (const v of p.variants || []) {
    rows.push([p.slug, p.name, L.gender[p.gender] || '', L.line[p.line] || '', p.inspiredBy || '', (p.families || []).map((f) => L.family[f]).join('، '),
      (p.occasions || []).map((o) => L.occasion[o]).join('، '), v.size, v.price, v.stock, v.tester ? 'نعم' : 'لا', p.active === false ? 'لا' : 'نعم',
      ...['top', 'heart', 'base'].map((k) => (p.notes?.[k] || []).join('، '))]);
  }
  const ws = X.utils.aoa_to_sheet(rows);
  ws['!cols'] = [16, 20, 10, 10, 18, 22, 22, 10, 10, 10, 10, 8, 30, 30, 36].map((w) => ({ wch: w }));
  ws['!views'] = [{ RTL: true }];
  const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'المنتجات');
  X.writeFile(wb, `zikra-products-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

async function importExcel(file) {
  const X = await import(XL);
  const wb = X.read(await file.arrayBuffer());
  const rows = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  const G = rev(L.gender), LN = rev(L.line), F = rev(L.family), O = rev(L.occasion);
  const errors = []; const groups = new Map();
  rows.forEach((r, i) => {
    const line = i + 2;
    const name = String(r['اسم العطر']).trim();
    const slug = slugify(r['الرابط'] || name);
    if (!name && !r['الرابط']) return; // empty row
    if (!slug) return errors.push(`صف ${line}: الرابط لازم يبقى حروف إنجليزي أو أرقام`);
    const size = Number(r['الحجم (مل)']), price = Number(r['السعر']), stock = Number(r['المخزون']);
    if (!(size > 0)) errors.push(`صف ${line}: الحجم مش صحيح`);
    if (!(price > 0) || !Number.isInteger(price)) errors.push(`صف ${line}: اكتب السعر رقم صحيح أكبر من صفر`);
    if (!(stock >= 0) || String(r['المخزون']).trim() === '' || !Number.isInteger(stock)) errors.push(`صف ${line}: اكتب المخزون رقم (صفر أو أكتر)`);
    const g = groups.get(slug) || { slug, name, rows: [], first: r, line };
    g.rows.push({ size, price, stock, tester: yes(r['معاه تستر']), line });
    groups.set(slug, g);
  });
  const plan = [];
  for (const g of groups.values()) {
    const r = g.first; const existing = S.products.find((p) => p.slug === g.slug);
    if (new Set(g.rows.map((x) => x.size)).size !== g.rows.length) errors.push(`${g.slug}: فيه حجم متكرر`);
    const pick = (col, map, fallback) => { const v = String(r[col]).trim(); if (!v) return fallback; if (!map[v]) { errors.push(`صف ${g.line}: "${v}" مش من الاختيارات في عمود ${col}`); return fallback; } return map[v]; };
    const pickList = (col, map, fallback) => { const vals = splitList(r[col]); if (!vals.length) return fallback; const bad = vals.filter((v) => !map[v]); if (bad.length) errors.push(`صف ${g.line}: "${bad.join('، ')}" مش من الاختيارات في عمود ${col}`); return vals.filter((v) => map[v]).map((v) => map[v]); };
    const base = existing ? structuredClone(existing) : { notes: { top: [], heart: [], base: [] }, longevity: 3, sillage: 3, likeIf: '', description: '', images: [], seasons: [], times: [], nonReturnable: false, createdAt: new Date().toISOString().slice(0, 10) };
    const p = {
      ...base, slug: g.slug, name: g.name || base.name,
      gender: pick('لمين', G, base.gender), line: pick('النوع', LN, base.line || 'zikra'),
      inspiredBy: String(r['مستوحى من']).trim() || base.inspiredBy || '',
      families: pickList('عائلة الريحة', F, base.families || []), occasions: pickList('المناسبة', O, base.occasions || []),
      // Notes: only replaced when at least one of the three columns is filled
      notes: ['المقدمة', 'القلب', 'القاعدة'].some((c) => String(r[c] ?? '').trim())
        ? { top: splitList(r['المقدمة']), heart: splitList(r['القلب']), base: splitList(r['القاعدة']) } : (base.notes || { top: [], heart: [], base: [] }),
      variants: g.rows.map(({ size, price, stock, tester }) => ({ size, price, stock, tester })).sort((a, b) => a.size - b.size),
      active: String(r['ظاهر']).trim() ? yes(r['ظاهر']) : base.active !== false
    };
    if (!p.name) errors.push(`${g.slug}: اسم العطر ناقص`);
    if (!p.gender) errors.push(`${g.slug}: عمود "لمين" ناقص (رجالي / حريمي / يونيسكس)`);
    if (!p.families.length) errors.push(`${g.slug}: اختار عائلة ريحة واحدة على الأقل`);
    if (p.line === 'inspired' && !p.inspiredBy) errors.push(`${g.slug}: العطر المستوحى لازم يتكتب "مستوحى من"`);
    plan.push({ id: existing ? existing.id : 'p-' + g.slug, p, isNew: !existing, before: existing });
  }
  showImportPreview(plan, errors, rows.length);
}

function showImportPreview(plan, errors, total) {
  const m = document.createElement('div'); m.className = 'modal';
  const diff = (x) => x.isNew ? '<span class="st st-new">جديد</span>' : (x.before.variants || []).map((v) => `${v.size}مل ${money(v.price)}/${v.stock}`).join('، ') + ' ← ';
  m.innerHTML = `<div class="sheet"><div class="sheet-head"><h2>مراجعة الاستيراد</h2><button class="icon-btn" data-close aria-label="اقفل">✕</button></div>
    ${errors.length ? `<div class="a-note"><b>لازم تصلّح دول في الشيت الأول (مفيش حاجة اتحفظت):</b><br>${errors.map(esc).join('<br>')}</div>` : `<p>${plan.filter((x) => x.isNew).length} منتج جديد، و${plan.filter((x) => !x.isNew).length} هيتحدّث. الصور والوصف مش بيتغيروا من الشيت. المكونات بتتغير لو كتبتها في أعمدة المقدمة / القلب / القاعدة.</p>`}
    <div class="box"><table class="a-table"><thead><tr><th>العطر</th><th>قبل ← بعد (الحجم السعر/المخزون)</th><th>ظاهر</th></tr></thead><tbody>
    ${plan.map((x) => `<tr><td><bdi>${esc(x.p.name)}</bdi><div class="meta" dir="ltr">${esc(x.p.slug)}</div></td><td>${diff(x)}<b>${x.p.variants.map((v) => `${v.size}مل ${money(v.price)}/${v.stock}${v.tester ? ' +تستر' : ''}`).join('، ')}</b></td><td>${x.p.active ? 'نعم' : 'لا'}</td></tr>`).join('')}
    </tbody></table></div>
    <div class="btn-row" style="margin-top:12px">${errors.length ? '' : '<button class="btn btn-gold" id="doimp">احفظ التغييرات</button>'}<button class="btn btn-line" data-close>إلغاء</button></div></div>`;
  document.body.appendChild(m);
  m.onclick = (e) => { if (e.target === m || e.target.closest('[data-close]')) m.remove(); };
  const go = $('#doimp', m);
  if (go) go.onclick = async () => {
    go.disabled = true;
    await guard(async () => {
      for (let i = 0; i < plan.length; i += 400) {
        const batch = writeBatch(db);
        plan.slice(i, i + 400).forEach(({ id, p }) => { const { id: _d, ...data } = p; data.updatedAt = new Date().toISOString(); batch.set(doc(db, 'products', id), data); });
        await batch.commit();
      }
      const ps = await getDocs(collection(db, 'products')); S.products = ps.docs.map((d) => ({ ...d.data(), id: d.id }));
    }, `اتحفظ ${plan.length} منتج`);
    m.remove(); viewProducts();
  };
}

const chk = (name, map, sel = []) => `<div class="chk">${Object.entries(map).map(([k, l]) => `<label><input type="checkbox" name="${name}" value="${k}" ${sel.includes(k) ? 'checked' : ''}>${l}</label>`).join('')}</div>`;
const radio = (name, map, val) => `<div class="chk">${Object.entries(map).map(([k, l]) => `<label><input type="radio" name="${name}" value="${k}" ${val === k ? 'checked' : ''}>${l}</label>`).join('')}</div>`;

function openProduct(id) {
  const p = id ? structuredClone(S.products.find((x) => x.id === id)) : {
    name: '', slug: '', line: 'zikra', inspiredBy: '', gender: 'unisex', families: [], occasions: [], seasons: [], times: [],
    notes: { top: [], heart: [], base: [] }, longevity: 3, sillage: 3, likeIf: '', description: '', images: [],
    variants: [{ size: 50, price: 0, stock: 0, tester: true }], active: true, nonReturnable: false
  };
  const pending = []; // new uploads: { id, data, thumb }
  const m = document.createElement('div'); m.className = 'modal';
  const draw = () => {
    m.innerHTML = `<div class="sheet"><div class="sheet-head"><h2>${id ? 'تعديل' : 'منتج جديد'}</h2><button class="icon-btn" data-close aria-label="اقفل">✕</button></div>
    <form class="form" id="pf">
      <div class="grid2"><div class="field"><label>اسم العطر</label><input name="name" value="${esc(p.name)}" required maxlength="60"></div>
        <div class="field"><label>الرابط (بالإنجليزي)</label><input name="slug" value="${esc(p.slug)}" dir="ltr" placeholder="يتعمل لوحده من الاسم"></div></div>
      <div class="field"><label>النوع</label>${radio('line', L.line, p.line)}</div>
      <div class="field" id="insp" ${p.line === 'inspired' ? '' : 'hidden'}><label>مستوحى من (إجباري للمستوحى)</label><input name="inspiredBy" value="${esc(p.inspiredBy)}" maxlength="80"></div>
      <div class="field"><label>لمين</label>${radio('gender', L.gender, p.gender)}</div>
      <div class="field"><label>عائلة الريحة</label>${chk('families', L.family, p.families)}</div>
      <div class="field"><label>المناسبة</label>${chk('occasions', L.occasion, p.occasions)}</div>
      <div class="grid2"><div class="field"><label>الموسم</label>${chk('seasons', L.season, p.seasons)}</div><div class="field"><label>الوقت</label>${chk('times', L.time, p.times || [])}</div></div>
      <div class="field"><label>الوصف</label><textarea name="description" rows="2" maxlength="300">${esc(p.description)}</textarea></div>
      <div class="field"><label>"هيعجبك لو…"</label><input name="likeIf" value="${esc(p.likeIf)}" maxlength="150"></div>
      <div class="grid2"><div class="field"><label>الوصف بالإنجليزي <span class="opt">(اختياري، للنسخة الإنجليزي)</span></label><textarea name="descriptionEn" rows="2" maxlength="300" dir="ltr">${esc(p.descriptionEn || '')}</textarea></div>
        <div class="field"><label>"هيعجبك لو" بالإنجليزي <span class="opt">(اختياري)</span></label><input name="likeIfEn" value="${esc(p.likeIfEn || '')}" maxlength="150" dir="ltr"></div></div>
      <div class="grid2"><div class="field"><label>المقدمة (افصل بفاصلة)</label><input name="top" value="${esc((p.notes?.top || []).join('، '))}"></div>
        <div class="field"><label>القلب</label><input name="heart" value="${esc((p.notes?.heart || []).join('، '))}"></div>
        <div class="field"><label>القاعدة</label><input name="base" value="${esc((p.notes?.base || []).join('، '))}"></div>
        <div class="grid2"><div class="field"><label>الثبات (1-5)</label><input name="longevity" type="number" min="1" max="5" value="${p.longevity}"></div>
          <div class="field"><label>الفوحان (1-5)</label><input name="sillage" type="number" min="1" max="5" value="${p.sillage}"></div></div></div>
      <div class="box variants"><h3>الأحجام والأسعار والمخزون</h3>
        <div class="row meta"><span>الحجم (مل)</span><span>السعر</span><span>المخزون</span><span>تستر</span><span></span></div>
        ${p.variants.map((x, i) => `<div class="row"><input type="number" min="1" data-v="${i}" data-k="size" value="${x.size}"><input type="number" min="0" data-v="${i}" data-k="price" value="${x.price}"><input type="number" min="0" data-v="${i}" data-k="stock" value="${x.stock}"><input type="checkbox" data-v="${i}" data-k="tester" ${x.tester ? 'checked' : ''} aria-label="معاه تستر"><button type="button" class="c-remove" data-delv="${i}">شيل</button></div>`).join('')}
        <button type="button" class="btn btn-line btn-sm" id="addv">+ حجم</button></div>
      <div class="box"><h3>الصور (أول صورة هي الأساسية)</h3><div class="imgs">
        ${p.images.map((r, i) => `<div class="im ${i ? '' : 'first'}"><img src="${esc(r.startsWith('fs:') ? (S.thumbs[r.slice(3)] || pending.find((x) => x.id === r.slice(3))?.thumb || '') : '../' + r.replace('.webp', '-sm.webp'))}" alt=""><button type="button" data-delimg="${i}">✕</button>${i ? `<button type="button" class="mk" data-first="${i}">أساسية</button>` : ''}</div>`).join('')}
      </div><input type="file" accept="image/*" multiple id="upl"><small class="meta">بتتحول WebP وتتصغر أوتوماتيك. يفضل خلفية فاتحة موحدة.</small></div>
      <label class="check"><input type="checkbox" name="active" ${p.active !== false ? 'checked' : ''}> ظاهر في الموقع</label>
      <label class="check"><input type="checkbox" name="nonReturnable" ${p.nonReturnable ? 'checked' : ''}> غير قابل للاسترجاع (هيتكتب في صفحته)</label>
      <div class="btn-row"><button class="btn btn-gold" id="savep">احفظ</button>${id ? '<button type="button" class="btn btn-danger btn-sm" id="delp">امسح المنتج</button>' : ''}</div>
    </form></div>`;
    wire();
  };
  const readForm = () => {
    const f = $('#pf', m); const fd = new FormData(f);
    const list = (k) => fd.getAll(k);
    const split = (s) => String(s || '').split(/[,،]/).map((x) => x.trim()).filter(Boolean);
    Object.assign(p, {
      name: fd.get('name').trim(), slug: slugify(fd.get('slug') || fd.get('name')), line: fd.get('line'), inspiredBy: (fd.get('inspiredBy') || '').trim(),
      gender: fd.get('gender'), families: list('families'), occasions: list('occasions'), seasons: list('seasons'), times: list('times'),
      description: fd.get('description').trim(), likeIf: fd.get('likeIf').trim(),
      descriptionEn: String(fd.get('descriptionEn') || '').trim(), likeIfEn: String(fd.get('likeIfEn') || '').trim(),
      notes: { top: split(fd.get('top')), heart: split(fd.get('heart')), base: split(fd.get('base')) },
      longevity: Math.min(5, Math.max(1, Number(fd.get('longevity')) || 3)), sillage: Math.min(5, Math.max(1, Number(fd.get('sillage')) || 3)),
      active: !!fd.get('active'), nonReturnable: !!fd.get('nonReturnable')
    });
    m.querySelectorAll('[data-v]').forEach((el) => { const v = p.variants[+el.dataset.v]; v[el.dataset.k] = el.type === 'checkbox' ? el.checked : Number(el.value); });
  };
  const wire = () => {
    m.onclick = (e) => { if (e.target === m || e.target.closest('[data-close]')) m.remove(); };
    m.querySelectorAll('input[name=line]').forEach((r) => (r.onchange = () => { $('#insp', m).hidden = r.value !== 'inspired'; }));
    $('#addv', m).onclick = () => { readForm(); p.variants.push({ size: 100, price: 0, stock: 0, tester: false }); draw(); };
    m.querySelectorAll('[data-delv]').forEach((b) => (b.onclick = () => { readForm(); if (p.variants.length > 1) p.variants.splice(+b.dataset.delv, 1); draw(); }));
    m.querySelectorAll('[data-delimg]').forEach((b) => (b.onclick = () => { readForm(); p.images.splice(+b.dataset.delimg, 1); draw(); }));
    m.querySelectorAll('[data-first]').forEach((b) => (b.onclick = () => { readForm(); const [x] = p.images.splice(+b.dataset.first, 1); p.images.unshift(x); draw(); }));
    $('#upl', m).onchange = async (e) => {
      readForm();
      for (const file of e.target.files) {
        try { const im = await processImage(file); pending.push(im); p.images.push('fs:' + im.id); } catch (er) { toast('مش قادرين نقرا الصورة: ' + file.name); }
      }
      draw();
    };
    const del = $('#delp', m);
    if (del) del.onclick = async () => {
      if (!confirm('تمسح المنتج نهائياً؟ لو عايز تخفيه بس، شيل علامة "ظاهر في الموقع".')) return;
      await guard(async () => {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'products', id));
        (p.images || []).filter((r) => r.startsWith('fs:')).forEach((r) => batch.delete(doc(db, 'productImages', r.slice(3))));
        await batch.commit();
        S.products = S.products.filter((x) => x.id !== id);
      }, 'اتمسح'); m.remove(); viewProducts();
    };
    $('#pf', m).onsubmit = async (e) => {
      e.preventDefault(); readForm();
      const errs = [];
      if (p.name.length < 2) errs.push('اكتب اسم العطر');
      if (!p.slug) errs.push('الرابط لازم يبقى حروف إنجليزي أو أرقام');
      if (S.products.some((x) => x.slug === p.slug && x.id !== id)) errs.push('الرابط ده مستخدم لمنتج تاني');
      if (p.line === 'inspired' && !p.inspiredBy) errs.push('اكتب "مستوحى من" للعطر المستوحى');
      if (!p.families.length) errs.push('اختار عائلة ريحة واحدة على الأقل');
      if (p.variants.some((v) => !v.size || v.price <= 0 || v.stock < 0)) errs.push('كل حجم لازم يبقى ليه سعر أكبر من صفر');
      if (new Set(p.variants.map((v) => v.size)).size !== p.variants.length) errs.push('فيه حجم متكرر');
      if (errs.length) return alert(errs.join('\n'));
      $('#savep', m).disabled = true;
      await guard(async () => {
        const pid = id || 'p-' + p.slug;
        const batch = writeBatch(db);
        for (const im of pending.filter((x) => p.images.includes('fs:' + x.id))) batch.set(doc(db, 'productImages', im.id), { productId: pid, data: im.data, thumb: im.thumb, createdAt: Timestamp.now() });
        const { id: _drop, ...data } = p;
        data.updatedAt = new Date().toISOString(); if (!data.createdAt) data.createdAt = new Date().toISOString().slice(0, 10);
        batch.set(doc(db, 'products', pid), data);
        await batch.commit();
        pending.forEach((im) => { S.thumbs[im.id] = im.thumb; });
        const i = S.products.findIndex((x) => x.id === pid); const saved = { ...data, id: pid };
        if (i >= 0) S.products[i] = saved; else S.products.unshift(saved);
      }, 'اتحفظ المنتج').catch(() => { $('#savep', m).disabled = false; throw new Error('save failed'); });
      m.remove(); viewProducts();
    };
  };
  document.body.appendChild(m); draw();
}

/* Resize in the browser and store WebP as base64 in Firestore (Spark has no Storage);
   the deploy build turns these into real image files. */
async function processImage(file) {
  const bmp = await createImageBitmap(file);
  const draw = (w, h, sx, sy, sw, sh, q) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h); return c.toDataURL('image/webp', q); };
  const scale = Math.min(1, 1000 / Math.max(bmp.width, bmp.height));
  let q = 0.82, data = draw(Math.round(bmp.width * scale), Math.round(bmp.height * scale), 0, 0, bmp.width, bmp.height, q);
  while (data.length > 700000 && q > 0.5) { q -= 0.1; data = draw(Math.round(bmp.width * scale), Math.round(bmp.height * scale), 0, 0, bmp.width, bmp.height, q); }
  const side = Math.min(bmp.width, bmp.height);
  const thumb = draw(480, 480, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0.78);
  const id = 'img-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  return { id, data, thumb };
}

async function seedFromSite() {
  if (!confirm('هنستورد العطور والإعدادات الموجودة حالياً في الموقع لقاعدة البيانات. نكمل؟')) return;
  await guard(async () => {
    const cat = await (await fetch('../data/catalog.json', { cache: 'no-cache' })).json();
    const batch = writeBatch(db);
    for (const p of cat.products) { const { id, ...d } = p; batch.set(doc(db, 'products', id), { ...d, active: true, nonReturnable: false }); }
    if (!S.settings) batch.set(doc(db, 'settings', 'store'), settingsDoc(cat.settings));
    await batch.commit();
    await loadAll();
  }, 'اتستوردت العطور');
  renderShell();
}
function settingsDoc(s) {
  const governorates = (s.governorates || []).map((g) => ({ id: g.id, name: g.name, fee: Number(g.fee) || 0, days: g.days || '' }));
  const { shippingZones, ...rest } = s;
  return { ...rest, governorates, shippingFees: Object.fromEntries(governorates.map((g) => [g.id, g.fee])) };
}

// ---------- Coupons ----------
function couponState(c) {
  if (!c.active) return ['متوقف', 'st-cancelled'];
  if (c.expiresAt?.toDate && c.expiresAt.toDate() < new Date()) return ['منتهي (اتقفل لوحده)', 'st-cancelled'];
  return ['شغال', 'st-delivered'];
}
// ---------- Visits ----------
const SRC = [['direct', 'دخول مباشر'], ['instagram', 'إنستجرام'], ['facebook', 'فيسبوك'], ['tiktok', 'تيك توك'], ['google', 'جوجل'], ['whatsapp', 'واتساب'], ['qr', 'كود QR'], ['other', 'مواقع تانية']];
const cairoDay = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(d);
async function viewVisits() {
  const v = $('#view');
  v.innerHTML = '<div class="a-bar"><h1>الزيارات</h1></div><p class="empty">بيحمّل...</p>';
  let days = [];
  try {
    const from = cairoDay(new Date(Date.now() - 40 * 864e5)); // ascending id range needs no extra index
    const snap = await getDocs(query(collection(db, 'stats'), where(documentId(), '>=', from)));
    days = snap.docs.map((d) => ({ day: d.id, ...d.data() }));
  } catch (e) {
    v.innerHTML = `<div class="a-bar"><h1>الزيارات</h1></div><div class="a-note">مش قادر يقرا الزيارات. اتأكد إنك نشرت قواعد الأمان الجديدة في Firebase (Firestore ← Rules).<br><small dir="ltr">${esc(e.code || e.message)}</small></div>`;
    return;
  }
  if (S.tab !== 'visits') return;
  const byDay = Object.fromEntries(days.map((d) => [d.day, d]));
  const ordersOn = {};
  for (const o of S.orders) { if (o.status === 'cancelled' || !o.createdAt?.toDate) continue; const k = cairoDay(o.createdAt.toDate()); ordersOn[k] = (ordersOn[k] || 0) + 1; }
  const today = new Date(); const back = (n) => cairoDay(new Date(today.getTime() - n * 864e5));
  const range = (n) => Array.from({ length: n }, (_, i) => back(i));
  const sum = (keys, f) => keys.reduce((t, k) => t + (f(k) || 0), 0);
  const card = (label, keys) => {
    const vis = sum(keys, (k) => byDay[k]?.v), ord = sum(keys, (k) => ordersOn[k]);
    return `<div class="stat"><span>${label}</span><b>${vis.toLocaleString('en-US')}</b><small>زائر · ${ord} طلب${vis ? ` · ${(ord / vis * 100).toFixed(1)}%` : ''}</small></div>`;
  };
  const last30 = range(30);
  const srcTot = SRC.map(([k, l]) => [l, sum(last30, (d) => byDay[d]?.['s_' + k])]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]);
  const srcMax = Math.max(1, ...srcTot.map(([, n]) => n));
  const rows = range(14);
  v.innerHTML = `<div class="a-bar"><h1>الزيارات</h1></div>
    <div class="stats">${card('النهارده', [back(0)])}${card('امبارح', [back(1)])}${card('آخر 7 أيام', range(7))}${card('آخر 30 يوم', last30)}</div>
    <div class="box" style="margin-top:12px"><h3>جم منين؟ (آخر 30 يوم)</h3>
      ${srcTot.length ? srcTot.map(([l, n]) => `<div class="bar-row"><span>${l}</span><i style="--w:${(n / srcMax * 100).toFixed(1)}%"></i><b>${n}</b></div>`).join('') : '<p class="meta">لسه مفيش زيارات.</p>'}</div>
    <div class="box" style="margin-top:12px"><h3>يوم بيوم (آخر 14 يوم)</h3>
      <table class="a-table"><thead><tr><th>اليوم</th><th>زوار</th><th>طلبات</th><th>نسبة الشرا</th></tr></thead><tbody>
      ${rows.map((d) => { const vis = byDay[d]?.v || 0, ord = ordersOn[d] || 0; return `<tr><td>${new Date(d + 'T12:00:00').toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'short', day: 'numeric', month: 'numeric' })}</td><td>${vis}</td><td>${ord}</td><td>${vis ? (ord / vis * 100).toFixed(1) + '%' : '—'}</td></tr>`; }).join('')}
      </tbody></table></div>
    <div class="a-note" style="margin-top:12px">الرقم ده عدد <b>الأجهزة</b> اللي فتحت الموقع في اليوم (نفس الموبايل بيتحسب مرة واحدة في اليوم مهما فتح صفحات). الطلبات من غير الملغية. "جم منين" بتتحدد من أول صفحة دخلها الزائر؛ ولو عايز تفرّق بين إعلان وبوست، حط في لينك الإعلان <bdi dir="ltr">?utm_source=instagram</bdi> مثلاً.</div>`;
}

function viewCoupons() {
  const v = $('#view');
  const today = new Date(); today.setDate(today.getDate() + 30);
  v.innerHTML = `<div class="a-bar"><h1>أكواد الخصم</h1></div>
    <form class="box" id="cf" style="margin-bottom:16px"><h3>كود جديد / تعديل</h3>
      <div class="grid2"><div class="field"><label>الكود</label><input name="code" required dir="ltr" pattern="[A-Za-z0-9]{3,20}" placeholder="ZIKRA10"></div>
        <div class="field"><label>نسبة الخصم %</label><input name="percent" type="number" min="1" max="90" required value="10"></div>
        <div class="field"><label>آخر يوم</label><input name="expires" type="date" required value="${today.toISOString().slice(0, 10)}"></div>
        <label class="check" style="align-self:end"><input type="checkbox" name="active" checked> شغال</label></div>
      <button class="btn btn-dark btn-sm">احفظ الكود</button>
      <small class="meta">الكود بيتقفل لوحده بعد آخر يوم. لو كتبت كود موجود هيتعدّل.</small></form>
    <div class="box"><table class="a-table"><thead><tr><th>الكود</th><th>الخصم</th><th>آخر يوم</th><th>الحالة</th><th></th></tr></thead><tbody>
    ${S.coupons.map((c) => { const [l, cls] = couponState(c); return `<tr><td dir="ltr" style="text-align:right">${esc(c.code)}</td><td>${c.percent}%</td><td>${c.expiresAt?.toDate ? c.expiresAt.toDate().toLocaleDateString('ar-EG') : '—'}</td><td><span class="st ${cls}">${l}</span></td>
      <td class="btn-row"><button class="c-remove" data-tog="${esc(c.code)}">${c.active ? 'وقّف' : 'شغّل'}</button><button class="c-remove" data-delc="${esc(c.code)}">امسح</button></td></tr>`; }).join('') || '<tr><td colspan="5">مفيش أكواد لسه.</td></tr>'}
    </tbody></table></div>`;
  $('#cf').onsubmit = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target);
    const code = String(fd.get('code')).trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(code)) return alert('الكود حروف إنجليزي وأرقام بس (3-20)');
    const exp = new Date(fd.get('expires') + 'T23:59:59');
    const data = { percent: Number(fd.get('percent')), active: !!fd.get('active'), expiresAt: Timestamp.fromDate(exp), updatedAt: Timestamp.now() };
    await guard(() => setDoc(doc(db, 'coupons', code), data), 'اتحفظ الكود');
    S.coupons = S.coupons.filter((c) => c.code !== code).concat([{ ...data, code }]); viewCoupons();
  };
  v.querySelectorAll('[data-tog]').forEach((b) => (b.onclick = async () => {
    const c = S.coupons.find((x) => x.code === b.dataset.tog);
    await guard(() => updateDoc(doc(db, 'coupons', c.code), { active: !c.active })); c.active = !c.active; viewCoupons();
  }));
  v.querySelectorAll('[data-delc]').forEach((b) => (b.onclick = async () => {
    if (!confirm('تمسح الكود؟')) return;
    await guard(() => deleteDoc(doc(db, 'coupons', b.dataset.delc)), 'اتمسح'); S.coupons = S.coupons.filter((x) => x.code !== b.dataset.delc); viewCoupons();
  }));
}

// ---------- Settings & shipping ----------
async function viewSettings() {
  const v = $('#view');
  let s = S.settings;
  if (!s) { const cat = await (await fetch('../data/catalog.json', { cache: 'no-cache' })).json(); s = settingsDoc(cat.settings); }
  v.innerHTML = `${publishNote}<form class="form" id="sf">
    <div class="box"><h3>بيانات المتجر</h3><div class="grid2">
      <div class="field"><label>رقم واتساب المتجر</label><input name="whatsapp" dir="ltr" value="${esc((s.whatsapp || '').replace(/^20/, '0'))}" placeholder="01xxxxxxxxx"></div>
      <div class="field"><label>رقم المحفظة / إنستاباي</label><input name="walletNumber" dir="ltr" value="${esc(s.walletNumber || '')}"></div>
      <div class="field"><label>اسم صاحب المحفظة (زي ما بيظهر في التحويل)</label><input name="walletName" value="${esc(s.walletName || '')}"></div>
      <div class="field"><label>الشريط اللي فوق الموقع</label><input name="announcement" value="${esc(s.announcement || '')}" maxlength="90"></div>
      <div class="field"><label>لينك إنستجرام</label><input name="instagram" dir="ltr" value="${esc(s.instagram || '')}"></div>
      <div class="field"><label>لينك تيك توك</label><input name="tiktok" dir="ltr" value="${esc(s.tiktok || '')}"></div>
      <div class="field"><label>Meta Pixel ID <span class="opt">(اختياري، أرقام بس)</span></label><input name="pixelId" dir="ltr" value="${esc(s.pixelId || '')}"></div>
      <div class="field"><label>Google Analytics ID <span class="opt">(اختياري، بيبدأ بـ G-)</span></label><input name="gaId" dir="ltr" value="${esc(s.gaId || '')}"></div></div>
      <label class="check"><input type="checkbox" name="cod" ${s.payment?.cod !== false ? 'checked' : ''}> الدفع عند الاستلام</label>
      <label class="check"><input type="checkbox" name="codDeposit" ${s.payment?.codDeposit !== false ? 'checked' : ''}> مع الدفع عند الاستلام: العميل يحوّل مصاريف الشحن مقدّم</label>
      <label class="check"><input type="checkbox" name="wallet" ${s.payment?.wallet !== false ? 'checked' : ''}> محفظة / إنستاباي</label></div>
    <div class="box"><h3>مصاريف الشحن لكل محافظة</h3>
      <div class="btn-row"><button type="button" class="btn btn-line btn-sm" data-bulk="85">القاهرة والجيزة = ؟</button><small class="meta">غيّر الرقم جنب أي محافظة. المدة اختيارية (لو فاضية بنقول للعميل هنأكدها على واتساب).</small></div>
      <div class="ship-grid"><div class="row meta"><span>المحافظة</span><span>الشحن (ج)</span><span>مدة التوصيل</span></div>
      ${(s.governorates || []).map((g, i) => `<div class="row"><span>${esc(g.name)}</span><input type="number" min="0" data-g="${i}" data-k="fee" value="${g.fee}"><input data-g="${i}" data-k="days" value="${esc(g.days || '')}" placeholder="مثلاً 3 أيام عمل"></div>`).join('')}</div></div>
    <button class="btn btn-gold">احفظ الإعدادات</button></form>`;
  v.querySelector('[data-bulk]').onclick = () => {
    const val = prompt('سعر الشحن للقاهرة والجيزة؟', '85'); if (val === null) return;
    v.querySelectorAll('[data-g][data-k=fee]').forEach((el) => { const g = s.governorates[+el.dataset.g]; if (['cairo', 'giza'].includes(g.id)) el.value = val; });
  };
  $('#sf').onsubmit = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target);
    const wa = String(fd.get('whatsapp')).replace(/\D/g, '');
    if (wa && !/^01[0125]\d{8}$/.test(wa)) return alert('رقم الواتساب لازم يبقى موبايل مصري 11 رقم');
    const governorates = s.governorates.map((g, i) => ({ ...g, fee: Number($(`[data-g="${i}"][data-k=fee]`).value) || 0, days: $(`[data-g="${i}"][data-k=days]`).value.trim() }));
    const data = settingsDoc({
      ...s, whatsapp: wa ? '2' + wa : '', walletNumber: String(fd.get('walletNumber')).trim(), walletName: String(fd.get('walletName')).trim(),
      announcement: String(fd.get('announcement')).trim(), instagram: String(fd.get('instagram')).trim(), tiktok: String(fd.get('tiktok')).trim(),
      pixelId: String(fd.get('pixelId')).replace(/\D/g, ''), gaId: String(fd.get('gaId')).trim().toUpperCase(),
      payment: { cod: !!fd.get('cod'), codDeposit: !!fd.get('codDeposit'), wallet: !!fd.get('wallet') }, governorates
    });
    await guard(() => setDoc(doc(db, 'settings', 'store'), data), 'اتحفظت الإعدادات');
    S.settings = data;
  };
}
