/* Static pages: inject contact info from settings */
Z.boot(document.body.dataset.page || '').then((cat) => {
  const s = cat.settings;
  const cards = document.getElementById('contact-cards');
  if (cards) {
    const rows = [];
    rows.push(s.whatsapp
      ? `<a class="btn btn-wa btn-block" href="${Z.waLink(s, 'أهلاً ذِكرى، عندي سؤال')}" target="_blank" rel="noopener">كلمنا على واتساب</a>`
      : '<p class="todo">[مطلوب] رقم واتساب المتجر لسه ماتحطش في الإعدادات.</p>');
    if (s.instagram) rows.push(`<a class="btn btn-line btn-block" href="${Z.esc(s.instagram)}" rel="noopener">إنستجرام</a>`);
    if (s.tiktok) rows.push(`<a class="btn btn-line btn-block" href="${Z.esc(s.tiktok)}" rel="noopener">تيك توك</a>`);
    rows.push(`<p>أونلاين فقط، مفيش فرع. بنوصل ${Z.esc(s.areas)}.</p>`);
    cards.innerHTML = rows.join('');
  }
  // Shipping fee table, grouped by price
  const ship = document.getElementById('ship-table');
  if (ship) {
    const groups = {};
    s.governorates.forEach((g) => { (groups[g.fee] = groups[g.fee] || []).push(g.name); });
    ship.innerHTML = '<table class="ship-table"><thead><tr><th>المحافظة</th><th>الشحن</th></tr></thead><tbody>' +
      Object.keys(groups).map(Number).sort((a, b) => a - b).map((fee) => `<tr><td>${groups[fee].map(Z.esc).join('، ')}</td><td>${Z.money(fee)}</td></tr>`).join('') + '</tbody></table>';
  }
});
