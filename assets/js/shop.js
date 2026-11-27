/* Shop: filters synced with the URL so links can be shared */
Z.boot('shop').then((cat) => {
  const L = Z.LABELS;
  const all = cat.products;
  const sizes = [...new Set(all.flatMap((p) => p.variants.map((v) => v.size)))].sort((a, b) => a - b);
  const GROUPS = [
    { key: 'gender', title: 'النوع', opts: Object.entries(L.gender) },
    { key: 'family', title: 'عائلة الريحة', opts: Object.entries(L.family) },
    { key: 'occasion', title: 'المناسبة', opts: Object.entries(L.occasion) },
    { key: 'size', title: 'الحجم', opts: sizes.map((s) => [String(s), s + ' مل']) },
    { key: 'budget', title: 'السعر', opts: Z.BUDGETS.map((b) => [b.id, b.label]) }
  ];
  const params = new URLSearchParams(location.search);
  const state = {};
  GROUPS.forEach((g) => { state[g.key] = new Set((params.get(g.key) || '').split(',').filter(Boolean)); });
  const sortSel = document.getElementById('sort');
  sortSel.value = params.get('sort') || 'new';

  document.getElementById('filter-groups').innerHTML = GROUPS.map((g) => `
    <div class="f-group"><h3>${g.title}</h3><div class="f-opts">
      ${g.opts.map(([v, l]) => `<button class="chip" data-f="${g.key}" data-v="${v}" aria-pressed="false">${l}</button>`).join('')}
    </div></div>`).join('');

  const match = (p) => {
    const s = state;
    if (s.gender.size && !s.gender.has(p.gender)) return false;
    if (s.family.size && !p.families.some((f) => s.family.has(f))) return false;
    if (s.occasion.size && !p.occasions.some((o) => s.occasion.has(o))) return false;
    if (s.size.size && !p.variants.some((v) => s.size.has(String(v.size)))) return false;
    if (s.budget.size) {
      const m = Z.minPrice(p);
      if (![...s.budget].some((id) => { const b = Z.BUDGETS.find((x) => x.id === id); return b && m >= b.min && m <= b.max; })) return false;
    }
    return true;
  };

  function render() {
    let list = all.filter(match);
    const sort = sortSel.value;
    if (sort === 'price-asc') list.sort((a, b) => Z.minPrice(a) - Z.minPrice(b));
    else if (sort === 'price-desc') list.sort((a, b) => Z.minPrice(b) - Z.minPrice(a));
    else list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    // Out-of-stock items go last
    list.sort((a, b) => Z.inStock(b) - Z.inStock(a));
    document.getElementById('grid').innerHTML = list.map(Z.card).join('');
    document.getElementById('count').textContent = `${list.length} عطر`;
    document.getElementById('empty').hidden = list.length > 0;
    document.querySelectorAll('[data-f]').forEach((b) => b.setAttribute('aria-pressed', state[b.dataset.f].has(b.dataset.v)));
    const chips = [];
    GROUPS.forEach((g) => state[g.key].forEach((v) => { const o = g.opts.find(([k]) => k === v); if (o) chips.push(`<button data-rm="${g.key}:${v}">${o[1]} ✕</button>`); }));
    document.getElementById('active-filters').innerHTML = chips.join('');
    const g = [...state.gender];
    document.getElementById('shop-title').textContent = g.length === 1 ? `عطور ${L.gender[g[0]]}` : 'كل العطور';
    // Sync URL
    const q = new URLSearchParams();
    GROUPS.forEach((gr) => { if (state[gr.key].size) q.set(gr.key, [...state[gr.key]].join(',')); });
    if (sort !== 'new') q.set('sort', sort);
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
  }

  const filters = document.getElementById('filters');
  document.addEventListener('click', (e) => {
    const f = e.target.closest('[data-f]');
    if (f) { const s = state[f.dataset.f]; s.has(f.dataset.v) ? s.delete(f.dataset.v) : s.add(f.dataset.v); render(); }
    const rm = e.target.closest('[data-rm]');
    if (rm) { const [k, v] = rm.dataset.rm.split(':'); state[k].delete(v); render(); }
    if (e.target.closest('[data-clear]')) { GROUPS.forEach((gr) => state[gr.key].clear()); render(); }
    if (e.target.closest('[data-open-filters]')) filters.classList.add('open');
    if (e.target.closest('[data-close-filters]')) filters.classList.remove('open');
  });
  sortSel.addEventListener('change', render);
  render();
});
