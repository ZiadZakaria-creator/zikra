/* Cart page: quantities, stock caps, subtotal */
Z.boot('cart').then((cat) => {
  const box = document.getElementById('cart');
  const esc = Z.esc;

  function render() {
    const lines = Z.cart.lines(cat);
    if (!lines.length) {
      box.innerHTML = '<div class="empty"><p>السلة فاضية.</p><a class="btn btn-gold" href="shop.html">تسوّق العطور</a></div>';
      return;
    }
    const subtotal = lines.reduce((n, l) => n + l.total, 0);
    const blocked = lines.some((l) => l.qty === 0);
    box.innerHTML = `<div class="cart-items">${lines.map((l) => {
      const img = l.p.images[0] ? `<img src="${esc(l.p.images[0].replace('.webp', '-sm.webp'))}" alt="" width="88" height="88">` : '<div class="noimg"></div>';
      const warn = l.qty === 0 ? '<p class="warn">خلص من المخزون. شيله من السلة علشان تكمل.</p>'
        : l.qty < l.wanted ? `<p class="warn">المتاح ${l.v.stock} بس، فعدّلنا الكمية.</p>` : '';
      return `<div class="c-item">
        <a href="${Z.productUrl(l.p)}" class="c-img">${img}</a>
        <div class="c-info">
          <a href="${Z.productUrl(l.p)}" class="c-name"><bdi>${esc(l.p.name)}</bdi></a>
          <div class="c-meta">${l.v.size} مل · ${Z.money(l.v.price)}${l.v.tester ? ' · معاه تستر 3 مل' : ''}</div>
          ${warn}
          <div class="c-row">
            <div class="qty" role="group" aria-label="الكمية">
              <button type="button" data-q="+1" data-id="${esc(l.p.id)}" data-size="${l.v.size}" aria-label="زوّد" ${l.qty >= l.v.stock ? 'disabled' : ''}>+</button>
              <span aria-live="polite">${l.qty}</span>
              <button type="button" data-q="-1" data-id="${esc(l.p.id)}" data-size="${l.v.size}" aria-label="قلّل" ${l.qty <= 1 ? 'disabled' : ''}>−</button>
            </div>
            <button type="button" class="c-remove" data-rm data-id="${esc(l.p.id)}" data-size="${l.v.size}">شيل</button>
            <b class="c-total">${Z.money(l.total)}</b>
          </div>
        </div>
      </div>`;
    }).join('')}</div>
    <aside class="cart-sum">
      <div class="sum-row"><span>المجموع</span><b>${Z.money(subtotal)}</b></div>
      <div class="sum-row muted"><span>الشحن</span><span>بيتحسب حسب منطقتك في الخطوة الجاية</span></div>
      <a class="btn btn-gold btn-block ${blocked ? 'is-disabled' : ''}" href="${blocked ? '#' : 'checkout.html'}" ${blocked ? 'aria-disabled="true"' : ''}>كمّل الطلب</a>
      <a class="btn btn-line btn-block" href="shop.html">كمّل تسوّق</a>
      <p class="policy-note">الدفع عند الاستلام (الشحن بس مقدّم) أو محفظة / إنستاباي. <a href="returns.html">سياسة الاسترجاع</a></p>
    </aside>`;
  }

  box.addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]');
    if (q) {
      const line = Z.cart.lines(cat).find((l) => l.p.id === q.dataset.id && l.v.size === +q.dataset.size);
      if (line) Z.cart.setQty(line.p.id, line.v.size, Math.min(line.v.stock, Math.max(1, line.qty + Number(q.dataset.q))));
      render();
    }
    const rm = e.target.closest('[data-rm]');
    if (rm) { Z.cart.remove(rm.dataset.id, +rm.dataset.size); render(); }
  });
  render();
});
