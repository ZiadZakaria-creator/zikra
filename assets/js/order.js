/* Order confirmation: number, summary, WhatsApp copy, wallet instructions */
Z.boot('cart').then((cat) => {
  const s = cat.settings, esc = Z.esc;
  const id = new URLSearchParams(location.search).get('id');
  const o = id && Z.orders.get(id);
  const box = document.getElementById('order');
  if (!o) { box.innerHTML = '<p class="empty">مش لاقيين الأوردر ده على الجهاز ده. لو عملت طلب، كلمنا على واتساب برقم الأوردر.</p>'; return; }
  const text = Z.orderText(o, s);
  const dep = o.payment !== 'wallet' && Z.codDeposit(s);
  const payNow = o.payment === 'wallet' ? o.total : dep ? o.shipping : 0;
  const hasWa = !!(s.whatsapp || '').replace(/\D/g, '');
  box.innerHTML = `
    <div class="done-head"><div class="check-ic">✓</div><h1>طلبك اتسجّل</h1><p>رقم الأوردر</p>
      <div class="order-id"><bdi>${esc(o.id)}</bdi><button class="chip" data-copy-id>انسخ</button></div></div>
    <div class="co-box">
      <h2>الخطوة الجاية</h2>
      ${o.synced === false ? '<p class="demo-note"><b>طلبك ماوصلناش أونلاين.</b> لازم تبعته على واتساب من الزرار ده علشان نقدر نجهزه.</p>' : ''}
      <p>${o.synced === false ? 'ابعت تفاصيل الطلب على واتساب، وهنرد عليك نأكد العنوان وميعاد التوصيل.' : 'استلمنا طلبك. ابعتلنا نسخة على واتساب لو حابب نأكده أسرع، وهنرد عليك نأكد العنوان وميعاد التوصيل.'}</p>
      ${hasWa ? `<a class="btn btn-wa btn-block" href="${Z.waLink(s, text)}" target="_blank" rel="noopener">ابعت الطلب على واتساب</a>`
        : '<p class="demo-note">رقم واتساب المتجر لسه ماتحطش، فالزرار مش شغال في النسخة التجريبية.</p>'}
      <button class="btn btn-line btn-block" data-copy-text style="margin-top:10px">انسخ تفاصيل الطلب</button>
    </div>
    ${payNow ? `<div class="co-box"><h2>${dep ? 'حوّل مصاريف الشحن مقدّم' : 'بيانات التحويل'}</h2>
      <p>حوّل <b>${Z.money(payNow)}</b> على المحفظة أو إنستاباي:</p>
      <div class="order-id"><bdi dir="ltr">${esc(s.walletNumber)}</bdi><button class="chip" data-copy-wallet>انسخ</button></div>
      ${s.walletName ? `<p class="policy-note">اتأكد إن الاسم اللي هيظهرلك وانت بتحوّل: <b>${esc(s.walletName)}</b></p>` : ''}
      <p class="policy-note">ابعت صورة التحويل على واتساب مع رقم الأوردر. هنبدأ نجهّز الطلب بعد ما نتأكد من التحويل.${dep ? ` والباقي <b>${Z.money(o.total - o.shipping)}</b> كاش للمندوب وقت الاستلام.` : ''}</p></div>` : ''}
    <div class="co-box"><h2>ملخص الطلب</h2>
      <ul class="sum-items">${o.items.map((i) => `<li><span><bdi>${esc(i.name)}</bdi> <small>${i.size} مل × ${i.qty}</small></span><b>${Z.money(i.total)}</b></li>`).join('')}</ul>
      <div class="sum-row"><span>المجموع</span><span>${Z.money(o.subtotal)}</span></div>
      ${o.discount ? `<div class="sum-row good"><span>خصم ${esc(o.coupon)}</span><span>−${Z.money(o.discount)}</span></div>` : ''}
      <div class="sum-row"><span>الشحن (${esc(o.address.govName)})</span><span>${Z.money(o.shipping)}</span></div>
      <div class="sum-row total"><span>الإجمالي</span><b>${Z.money(o.total)}</b></div>
      <p class="policy-note">التوصيل لـ: ${esc(o.customer.name)} · <bdi dir="ltr">${esc(o.customer.phone)}</bdi><br>${esc(o.address.govName)} - ${esc(o.address.zoneName)} - ${esc(o.address.street)}</p>
    </div>
    <p class="policy-note">لو الأوردر وصلك فيه مشكلة، كلمنا خلال 24 ساعة من الاستلام. <a href="returns.html">سياسة الاسترجاع</a></p>
    <a class="btn btn-dark btn-block" href="shop.html">كمّل تسوّق</a>`;
  const copy = async (t, msg) => { try { await navigator.clipboard.writeText(t); Z.toast(msg); } catch (e) { Z.toast('انسخ يدوي: ' + esc(t.slice(0, 40))); } };
  box.addEventListener('click', (e) => {
    if (e.target.closest('[data-copy-id]')) copy(o.id, 'اتنسخ رقم الأوردر');
    if (e.target.closest('[data-copy-text]')) copy(text, 'اتنسخت تفاصيل الطلب');
    if (e.target.closest('[data-copy-wallet]')) copy(s.walletNumber, 'اتنسخ رقم المحفظة');
  });
});
