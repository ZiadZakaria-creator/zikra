/* Homepage: newest products, gender counts, budget chips */
Z.boot('home').then((cat) => {
  const live = cat.products;
  // Newest first, but products with photos take priority on the homepage
  const newest = [...live].sort((a, b) => (b.images.length > 0) - (a.images.length > 0) || b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  document.getElementById('new-grid').innerHTML = newest.map(Z.card).join('');
  document.querySelectorAll('[data-gcount]').forEach((el) => {
    const n = live.filter((p) => p.gender === el.dataset.gcount).length;
    el.textContent = n ? `${n} ${n === 1 ? 'عطر' : 'عطور'} · تسوّق ←` : 'تسوّق ←';
  });
  // Only show budget ranges that actually contain products
  const chips = Z.BUDGETS.filter((b) => live.some((p) => { const m = Z.minPrice(p); return m >= b.min && m <= b.max; }));
  const box = document.getElementById('budget-chips');
  if (chips.length) box.innerHTML = chips.map((b) => `<a class="chip" href="shop.html?budget=${b.id}">${b.label}</a>`).join('');
  else box.closest('.budget-col').hidden = true;
});
