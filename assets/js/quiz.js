/* "Know your scent" quiz: 5 questions -> top 3 by tag score */
Z.boot('quiz').then((cat) => {
  const Q = [
    { k: 'gender', t: 'العطر ده لمين؟', o: [['men', 'ليا (رجالي)'], ['women', 'ليا (حريمي)'], ['any', 'مش فارقة / هدية']] },
    { k: 'occasion', t: 'هتلبسه إمتى أكتر؟', o: [['daily', 'كل يوم وفي الشغل'], ['evening', 'سهرات وخروجات'], ['gift', 'مناسبات وهدايا']] },
    { k: 'season', t: 'أنهي موسم؟', o: [['summer', 'الصيف'], ['winter', 'الشتا'], ['all', 'طول السنة']] },
    { k: 'family', t: 'أنهي ريحة بتشدك؟', h: 'اختار واحدة أو أكتر', multi: true, o: Object.entries(Z.LABELS.family) },
    { k: 'strength', t: 'عايزها قد إيه؟', o: [['1', 'خفيفة وهادية'], ['3', 'متوسطة'], ['5', 'قوية وتفضل']] }
  ];
  const ans = {}; let i = 0;
  const box = document.getElementById('quiz');

  function step() {
    const q = Q[i];
    const sel = ans[q.k] || (q.multi ? [] : null);
    box.innerHTML = `<div class="progress"><div style="width:${(i / Q.length) * 100}%"></div></div>
      <div class="q-hint">سؤال ${i + 1} من ${Q.length}</div>
      <h2 class="q-title">${q.t}</h2>${q.h ? `<p class="q-hint">${q.h}</p>` : ''}
      <div class="q-opts">${q.o.map(([v, l]) => { const on = q.multi ? sel.includes(v) : sel === v; return `<button class="q-opt ${on ? 'on' : ''}" data-v="${v}" aria-pressed="${on}">${l}<span>${on ? '✓' : ''}</span></button>`; }).join('')}</div>
      <div class="q-nav">${i ? '<button class="btn btn-line" data-back>رجوع</button>' : '<span></span>'}
      ${q.multi ? `<button class="btn btn-dark" data-next ${sel.length ? '' : 'disabled'}>التالي</button>` : ''}</div>`;
  }
  function score(p) {
    let sc = 0;
    if (ans.gender === 'any' || p.gender === ans.gender || p.gender === 'unisex') sc += 3; else sc -= 5;
    if (p.occasions.includes(ans.occasion)) sc += 2;
    if (p.seasons.includes(ans.season) || p.seasons.includes('all')) sc += 1;
    sc += p.families.filter((f) => (ans.family || []).includes(f)).length * 3;
    sc -= Math.abs(((p.longevity + p.sillage) / 2) - Number(ans.strength || 3)) * 0.8;
    if (!Z.inStock(p)) sc -= 2;
    return sc;
  }
  function result() {
    const top = cat.products.map((p) => [score(p), p]).sort((a, b) => b[0] - a[0]).slice(0, 3).map(([, p]) => p);
    box.innerHTML = `<div class="progress"><div style="width:100%"></div></div>
      <h2 class="q-title">ترشيحاتنا ليك</h2><p class="q-hint">على حسب إجاباتك، دول أقرب 3 عطور لذوقك.</p>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">${top.map(Z.card).join('')}</div>
      <div class="q-nav"><button class="btn btn-line" data-restart>عيد الاختبار</button><a class="btn btn-dark" href="shop.html">كل العطور</a></div>`;
  }
  box.addEventListener('click', (e) => {
    const q = Q[i];
    const o = e.target.closest('[data-v]');
    if (o && q) {
      if (q.multi) { const a = ans[q.k] = ans[q.k] || []; const ix = a.indexOf(o.dataset.v); ix >= 0 ? a.splice(ix, 1) : a.push(o.dataset.v); step(); return; }
      ans[q.k] = o.dataset.v; i++; i < Q.length ? step() : result(); return;
    }
    if (e.target.closest('[data-next]')) { i++; i < Q.length ? step() : result(); }
    if (e.target.closest('[data-back]')) { i--; step(); }
    if (e.target.closest('[data-restart]')) { Object.keys(ans).forEach((k) => delete ans[k]); i = 0; step(); }
  });
  step();
});
