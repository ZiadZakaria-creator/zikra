/* Checkout: guest form, zone-based shipping, coupon, order creation */
Z.boot('cart').then((cat) => {
  const s = cat.settings, esc = Z.esc;
  const form = document.getElementById('checkout');
  const lines = Z.cart.lines(cat).filter((l) => l.qty > 0);
  if (!lines.length) { location.replace('cart.html'); return; }

  const $ = (id) => document.getElementById(id);
  const gov = $('gov'), zone = $('zone');
  gov.innerHTML = '<option value="">اختار</option>' + s.governorates.map((g) => `<option value="${g.id}">${esc(g.name)}</option>`).join('');
  function fillZones() {
    const list = s.shippingZones.filter((z) => z.gov === gov.value);
    zone.innerHTML = list.length ? '<option value="">اختار المنطقة</option>' + list.map((z) => `<option value="${z.id}">${esc(z.name)} (${Z.money(z.fee)})</option>`).join('') : '<option value="">اختار المحافظة الأول</option>';
  }
  gov.addEventListener('change', () => { fillZones(); renderSummary(); });
  zone.addEventListener('change', renderSummary);

  const pays = [];
  if (s.payment.cod) pays.push(['cod', 'الدفع عند الاستلام', 'كاش للمندوب وقت ما الأوردر يوصلك.']);
  if (s.payment.wallet) pays.push(['wallet', 'محفظة إلكترونية / إنستاباي', 'هتظهرلك بيانات التحويل بعد ما تأكد الطلب.']);
  $('pay-opts').innerHTML = pays.map(([v, t, d], i) => `<label class="pay"><input type="radio" name="payment" value="${v}" ${i ? '' : 'checked'}><span><b>${t}</b><small>${d}</small></span></label>`).join('');

  // Restore saved details (per-device convenience only)
  const saved = Z.store.get('zikra_customer', null);
  if (saved) {
    ['name', 'phone', 'phone2', 'street', 'landmark'].forEach((k) => { if (saved[k]) $(k).value = saved[k]; });
    if (saved.gov) { gov.value = saved.gov; fillZones(); if (saved.zone) zone.value = saved.zone; }
  }

  let coupon = null;
  function totals() {
    const subtotal = lines.reduce((n, l) => n + l.total, 0);
    const z = s.shippingZones.find((x) => x.id === zone.value);
    const shipping = z ? z.fee : null;
    const discount = coupon ? Math.round(subtotal * coupon.percent / 100) : 0;
    return { subtotal, shipping, discount, total: subtotal - discount + (shipping || 0), zone: z };
  }

  function renderSummary() {
    const t = totals();
    $('summary').innerHTML = `<div class="co-box">
      <h2>طلبك</h2>
      <ul class="sum-items">${lines.map((l) => `<li><span><bdi>${esc(l.p.name)}</bdi> <small>${l.v.size} مل × ${l.qty}</small></span><b>${Z.money(l.total)}</b></li>`).join('')}</ul>
      <div class="coupon"><label for="coupon" class="sr-only">كود الخصم</label><input id="coupon" placeholder="كود خصم" value="${coupon ? esc(coupon.code) : ''}" dir="ltr" autocomplete="off"><button type="button" class="btn btn-line" id="apply">${coupon ? 'شيل' : 'طبّق'}</button></div>
      <small class="err" id="coupon-err"></small>
      <div class="sum-row"><span>المجموع</span><span>${Z.money(t.subtotal)}</span></div>
      ${t.discount ? `<div class="sum-row good"><span>خصم ${esc(coupon.code)} (${coupon.percent}%)</span><span>−${Z.money(t.discount)}</span></div>` : ''}
      <div class="sum-row"><span>الشحن</span><span>${t.shipping === null ? 'اختار المنطقة' : Z.money(t.shipping)}</span></div>
      <div class="sum-row total"><span>الإجمالي</span><b>${t.shipping === null ? '—' : Z.money(t.total)}</b></div>
      <button type="submit" class="btn btn-gold btn-block" id="submit">أكّد الطلب</button>
      <p class="policy-note">بتأكيد الطلب انت موافق على <a href="returns.html">سياسة الاستبدال والاسترجاع</a>. هنكلمك على واتساب نأكد الأوردر والعنوان.</p>
      ${cat.demo ? '<p class="demo-note">وضع تجريبي: الطلب بيتحفظ على جهازك بس لحد ما نربط لوحة التحكم.</p>' : ''}
    </div>`;
  }

  $('summary').addEventListener('click', async (e) => {
    if (!e.target.closest('#apply')) return;
    const err = $('coupon-err');
    if (coupon) { coupon = null; renderSummary(); return; }
    const res = await Z.checkCoupon($('coupon').value, cat.demo);
    if (!res) return;
    if (!res.ok) { err.textContent = res.msg; return; }
    coupon = res; renderSummary();
  });

  function setErr(id, msg) {
    const f = $(id).closest('.field'); f.classList.toggle('bad', !!msg); f.querySelector('.err').textContent = msg || '';
    $(id).setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function validate() {
    const errs = {
      name: $('name').value.trim().length < 3 ? 'اكتب اسمك' : '',
      phone: !Z.validPhone($('phone').value) ? 'رقم موبايل مصري من 11 رقم يبدأ بـ 01' : '',
      phone2: $('phone2').value.trim() && !Z.validPhone($('phone2').value) ? 'الرقم ده مش صحيح' : '',
      gov: !gov.value ? 'اختار المحافظة' : '',
      zone: !zone.value ? 'اختار المنطقة' : '',
      street: $('street').value.trim().length < 8 ? 'اكتب العنوان بالتفصيل' : ''
    };
    Object.entries(errs).forEach(([k, v]) => setErr(k, v));
    const first = Object.keys(errs).find((k) => errs[k]);
    if (first) $(first).focus();
    return !first;
  }

  // Clear a field's error as soon as the customer edits it
  form.addEventListener('input', (e) => { const f = e.target.closest('.field.bad'); if (f && e.target.id) setErr(e.target.id, ''); });
  form.addEventListener('change', (e) => { const f = e.target.closest('.field.bad'); if (f && e.target.id) setErr(e.target.id, ''); });

  let sending = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending || !validate()) return;
    // Re-check stock against the latest catalog before saving
    const fresh = Z.cart.lines(cat);
    if (fresh.some((l) => l.qty < l.wanted)) { location.href = 'cart.html'; return; }
    sending = true; $('submit').disabled = true; $('submit').textContent = 'بنسجّل طلبك…';
    const t = totals();
    const g = s.governorates.find((x) => x.id === gov.value);
    const order = {
      id: Z.orders.newId(),
      createdAt: new Date().toISOString(),
      status: 'new',
      customer: { name: $('name').value.trim(), phone: Z.normPhone($('phone').value), phone2: $('phone2').value.trim() ? Z.normPhone($('phone2').value) : '' },
      address: { gov: g.id, govName: g.name, zone: t.zone.id, zoneName: t.zone.name, street: $('street').value.trim(), landmark: $('landmark').value.trim() },
      items: lines.map((l) => ({ id: l.p.id, name: l.p.name, size: l.v.size, price: l.v.price, qty: l.qty, total: l.total, tester: !!l.v.tester })),
      subtotal: t.subtotal, shipping: t.shipping, discount: t.discount, coupon: coupon ? coupon.code : '', total: t.total,
      payment: form.payment.value, notes: $('notes').value.trim()
    };
    try {
      await Z.orders.save(order);
      if ($('remember').checked) Z.store.set('zikra_customer', { name: order.customer.name, phone: order.customer.phone, phone2: order.customer.phone2, gov: g.id, zone: t.zone.id, street: order.address.street, landmark: order.address.landmark });
      else Z.store.set('zikra_customer', null);
      Z.cart.clear();
      location.href = 'order.html?id=' + encodeURIComponent(order.id);
    } catch (err) {
      sending = false; $('submit').disabled = false; $('submit').textContent = 'أكّد الطلب';
      Z.toast('حصلت مشكلة وطلبك ماتسجلش. جرّب تاني.');
    }
  });
  renderSummary();
});
