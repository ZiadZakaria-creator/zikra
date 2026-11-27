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
    rows.push(`<p>أونلاين فقط، مفيش فرع. بنوصل ${Z.esc(s.areas)} خلال ${Z.esc(s.deliveryDays)}.</p>`);
    cards.innerHTML = rows.join('');
  }
});
