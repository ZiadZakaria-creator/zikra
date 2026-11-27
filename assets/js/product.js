/* Product page: gallery, size picker, pyramid, meters, similar */
Z.boot('shop').then((cat) => {
  const L = Z.LABELS, esc = Z.esc, s = cat.settings;
  const param = new URLSearchParams(location.search).get('p');
  const slug = param || document.body.dataset.slug;
  // Old links (product.html?p=) move to the pre-rendered page
  if (param && cat.built) { location.replace('p/' + encodeURIComponent(param) + '/'); return; }
  const p = cat.products.find((x) => x.slug === slug);
  const root = document.getElementById('pdp');
  if (!p) { root.innerHTML = '<p class="empty">العطر ده مش موجود. <a class="chip" href="shop.html">شوف كل العطور</a></p>'; return; }

  if (!document.body.dataset.slug) { // pre-rendered pages already carry SEO title/description
    document.title = I18N.tr(`${p.name} | ذِكرى`);
    const md = document.querySelector('meta[name=description]');
    if (md) md.content = `${p.name}: ${p.description} ${L.gender[p.gender]}، ${Z.familyLine(p)}.`;
  }
  document.getElementById('crumbs').insertAdjacentHTML('beforeend', ` / <bdi>${esc(p.name)}</bdi>`);

  let variant = p.variants.find((v) => v.stock > 0) || p.variants[0];
  const imgs = p.images.length ? p.images : [];
  const meter = (label, v) => `<div class="meter"><span>${label}</span><div class="track" role="meter" aria-valuemin="1" aria-valuemax="5" aria-valuenow="${v}" aria-label="${label}"><div class="fill" style="width:${v * 20}%"></div></div><em>${L.level[v]}</em></div>`;
  const notes = (k, t) => p.notes[k] && p.notes[k].length ? `<div class="lvl"><b>${t}</b><span>${I18N.notes(p.notes[k]).map(esc).join(I18N.lang === 'en' ? ', ' : '، ')}</span></div>` : '';

  root.innerHTML = `<div class="pdp">
    <div class="gallery">
      <div class="main">${imgs[0] ? `<img id="main-img" src="${esc(imgs[0])}" alt="${esc(p.name)}" width="1000" height="1000">` : '<div class="noimg" style="height:100%;display:grid;place-items:center;color:var(--muted)">الصورة قريباً</div>'}</div>
      ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((src, i) => `<button class="${i ? '' : 'on'}" data-img="${esc(src)}" aria-label="صورة ${i + 1}"><img src="${esc(src.replace('.webp', '-sm.webp'))}" alt=""></button>`).join('')}</div>` : ''}
    </div>
    <div>
      <div class="line"><span class="pill">${esc(L.line[p.line] || '')}</span><span class="pill light">${L.gender[p.gender]}</span><span>${esc(Z.familyLine(p))}</span></div>
      <h1><bdi>${esc(p.name)}</bdi></h1>
      ${p.line === 'inspired' && p.inspiredBy ? `<p class="line">مستوحى من: ${esc(p.inspiredBy)}. ده مش العطر الأصلي.</p>` : ''}
      <p style="margin-top:8px" dir="auto">${esc(I18N.pick(p, 'description'))}</p>
      <div class="big-price" id="price"></div>
      <div class="size-opts" role="radiogroup" aria-label="الحجم">${p.variants.map((v) => `<button role="radio" data-size="${v.size}" ${v.stock > 0 ? '' : 'disabled'}>${v.size} مل</button>`).join('')}</div>
      <div class="stock" id="stock"></div>
      <div id="tester-note"></div>
      <div class="buy">
        <button class="btn btn-gold" id="order-now">اطلب دلوقتي</button>
        <a class="btn btn-wa" id="wa-btn" ${s.whatsapp ? 'target="_blank" rel="noopener"' : ''}>اسأل على واتساب</a>
      </div>
      <p class="policy-note">الزجاجة المفتوحة مابتترجعش. <a href="returns.html">سياسة الاستبدال والاسترجاع</a></p>

      <div class="info-block"><h2>الهرم العطري</h2><div class="pyramid">${notes('top', 'المقدمة')}${notes('heart', 'القلب')}${notes('base', 'القاعدة')}</div></div>
      <div class="info-block"><h2>الثبات والفوحان</h2>${meter('الثبات', p.longevity)}${meter('الفوحان', p.sillage)}</div>
      <div class="info-block"><h2>يناسب إمتى؟</h2>
        <div class="tags">${p.seasons.map((x) => `<span class="pill light">${L.season[x]}</span>`).join('')}${(p.times || []).map((x) => `<span class="pill light">${L.time[x]}</span>`).join('')}${p.occasions.map((x) => `<span class="pill light">${L.occasion[x]}</span>`).join('')}</div>
        ${p.likeIf ? `<p style="margin-top:12px"><b>هيعجبك:</b> ${esc(I18N.pick(p, 'likeIf'))}</p>` : ''}
      </div>
    </div>
  </div>
  <div class="sticky-buy"><div class="price" id="sticky-price"></div><button class="btn btn-gold" data-order>اطلب دلوقتي</button></div>`;

  function update() {
    document.getElementById('price').textContent = Z.money(variant.price);
    document.getElementById('sticky-price').textContent = Z.money(variant.price);
    document.querySelectorAll('[data-size]').forEach((b) => { const on = +b.dataset.size === variant.size; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    const ok = variant.stock > 0;
    const st = document.getElementById('stock');
    st.className = 'stock ' + (ok ? 'ok' : 'no');
    st.textContent = ok ? 'متوفر' : 'خلص حالياً';
    document.querySelectorAll('#order-now,[data-order]').forEach((b) => { b.disabled = !ok; });
    document.getElementById('tester-note').innerHTML = variant.tester
      ? '<div class="tester-note"><span>🎁</span><div><b>معاه تستر 3 مل مجاناً</b> من نفس الريحة. جرّبه الأول وخلّي الزجاجة مقفولة لحد ما تتأكد.</div></div>' : '';
    const url = location.href;
    document.getElementById('wa-btn').href = Z.waLink(s, `أهلاً ذِكرى، عايز أسأل عن ${p.name} (${variant.size} مل)\n${url}`);
  }
  document.addEventListener('click', (e) => {
    const sz = e.target.closest('[data-size]');
    if (sz) { variant = p.variants.find((v) => v.size === +sz.dataset.size); update(); }
    const th = e.target.closest('[data-img]');
    if (th) { document.getElementById('main-img').src = th.dataset.img; document.querySelectorAll('[data-img]').forEach((b) => b.classList.toggle('on', b === th)); }
    if (e.target.closest('#order-now,[data-order]')) { Z.track('AddToCart', { content_ids: [p.id], value: variant.price, currency: 'EGP' }); Z.cart.add(p.id, variant.size); location.href = 'checkout.html'; }
  });
  update();
  Z.track('ViewContent', { content_ids: [p.id], content_type: 'product', value: variant.price, currency: 'EGP' });

  // Similar: shares a family, same gender or unisex scores higher
  const score = (x) => x.families.filter((f) => p.families.includes(f)).length * 2 + (x.gender === p.gender ? 1 : 0) + (x.gender === 'unisex' || p.gender === 'unisex' ? 0.5 : 0);
  const sim = cat.products.filter((x) => x.id !== p.id).map((x) => [score(x), x]).filter(([sc]) => sc > 0).sort((a, b) => b[0] - a[0]).slice(0, 4).map(([, x]) => x);
  if (sim.length) { document.getElementById('similar').innerHTML = sim.map(Z.card).join(''); document.getElementById('similar-sec').hidden = false; }
});
