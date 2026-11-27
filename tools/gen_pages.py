"""One-off generator for the static page shells (header/footer are injected by app.js)."""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent

HEAD = '''<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0f0e0c">
<link rel="icon" type="image/png" sizes="32x32" href="assets/brand/favicon-32.png">
<link rel="apple-touch-icon" href="assets/brand/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600&family=Cormorant+Garamond:wght@500&family=El+Messiri:wght@500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/main.css">
</head>
<body>
<div id="site-header"></div>
<main id="main">
{body}
</main>
<div id="site-footer"></div>
<script src="assets/js/app.js"></script>
<script src="assets/js/{script}.js"></script>
</body>
</html>
'''

def page(name, title, desc, body, script):
    (ROOT / name).write_text(HEAD.format(title=title, desc=desc, body=body.strip(), script=script), encoding='utf-8')

FAMILIES = [('oud','عود','OUD'),('floral','ورد','ROSE'),('fruity','فواكه','FRUITY'),('oriental','شرقي','ORIENTAL'),('fresh','فريش','FRESH'),('woody','خشبي','WOODY')]
fam_html = ''.join(f'<a class="fam" href="shop.html?family={k}"><div class="sw sw-{k}"></div><b>{a}</b><small>{e}</small></a>' for k,a,e in reversed(FAMILIES))

page('index.html', 'ذِكرى | عطور أونلاين بتوصيل لكل مصر',
 'متجر ذِكرى للعطور: رجالي وحريمي ويونيسكس، توصيل لكل محافظات مصر والدفع عند الاستلام.', f'''
<section class="hero">
  <div class="hero-img"><img src="assets/img/products/mambo-no-05-3.webp" alt="" fetchpriority="high" width="1121" height="1403"></div>
  <div class="content">
    <div class="tagline">Where memories linger</div>
    <h1>ريحة <em>تفضل</em><br>في الذاكرة</h1>
    <p>اختار عطرك حسب ذوقك والمناسبة والميزانية، وإحنا نوصلهولك لحد البيت.</p>
    <div class="ctas"><a class="btn btn-gold" href="shop.html">تسوّق العطور</a><a class="btn btn-ghost" href="quiz.html">اعرف ريحتك</a></div>
    <div class="facts"><div><b>لكل مصر</b><span>توصيل لكل المحافظات</span></div><div><b>عند الاستلام</b><span>أو محفظة / إنستاباي</span></div><div><b>واتساب</b><span>نرد على أسئلتك</span></div></div>
  </div>
</section>

<section class="sec"><div class="wrap">
  <div class="sec-head"><div><div class="eyebrow">Shop by</div><h2>تسوّق حسب النوع</h2></div><a class="more" href="shop.html">كل العطور ←</a></div>
  <div class="genders">
    <a class="g-card" href="shop.html?gender=men"><img src="assets/img/products/007-2.webp" alt="" loading="lazy"><div class="txt"><div class="eyebrow">For him</div><b>رجالي</b><span data-gcount="men">تسوّق ←</span></div></a>
    <a class="g-card" href="shop.html?gender=women"><img src="assets/img/products/tre-lychee-3.webp" alt="" loading="lazy"><div class="txt"><div class="eyebrow">For her</div><b>حريمي</b><span data-gcount="women">تسوّق ←</span></div></a>
    <a class="g-card" href="shop.html?gender=unisex"><img src="assets/img/products/oudsession-no-01-3.webp" alt="" loading="lazy"><div class="txt"><div class="eyebrow">For everyone</div><b>يونيسكس</b><span data-gcount="unisex">تسوّق ←</span></div></a>
  </div>
</div></section>

<section class="sec"><div class="wrap two-col">
  <div><div class="sec-head"><div><div class="eyebrow">Occasion</div><h2>حسب المناسبة</h2></div></div>
    <div class="chips"><a class="chip" href="shop.html?occasion=daily">يومي</a><a class="chip" href="shop.html?occasion=evening">سهرة</a><a class="chip" href="shop.html?occasion=summer">صيفي</a><a class="chip" href="shop.html?occasion=winter">شتوي</a><a class="chip" href="shop.html?occasion=gift">هدايا</a></div></div>
  <div class="budget-col"><div class="sec-head"><div><div class="eyebrow">Budget</div><h2>حسب الميزانية</h2></div></div>
    <div class="chips" id="budget-chips"></div></div>
</div></section>

<section class="sec"><div class="wrap">
  <div class="sec-head"><div><div class="eyebrow">Scent family</div><h2>عائلة الريحة</h2></div></div>
  <div class="families">{fam_html}</div>
</div></section>

<section class="sec"><div class="wrap">
  <div class="sec-head"><div><div class="eyebrow">New arrivals</div><h2>وصل حديثاً</h2></div><a class="more" href="shop.html?sort=new">كل العطور ←</a></div>
  <div class="grid" id="new-grid"></div>
</div></section>

<section class="sec"><div class="wrap banner-row">
  <div class="tester-card">
    <div class="eyebrow">Try before you open</div>
    <h3>جرّب قبل ما تفتح</h3>
    <p>كل زجاجة 50 مل معاها تستر 3 مل من نفس الريحة. جرّبه على جلدك وسيبه ياخد وقته، وخلّي الزجاجة الكبيرة مقفولة لحد ما تتأكد إنها ريحتك.</p>
    <div class="sizes"><div class="n"><b>50</b><span>مل زجاجتك</span></div><div class="plus">+</div><div class="n"><b>3</b><span>مل تستر مجاناً</span></div></div>
  </div>
  <a class="quiz-banner" href="quiz.html"><img src="assets/img/products/four-loko-3.webp" alt="" loading="lazy">
    <div class="txt"><div class="eyebrow" style="color:var(--gold-2)">Scent quiz</div><h3>مش عارف تختار؟</h3><p>جاوب على 5 أسئلة في دقيقة، ونرشحلك 3 عطور على ذوقك.</p><span class="btn btn-gold">ابدأ الاختبار</span></div></a>
</div>
<div class="wrap"><div class="gift-banner" style="margin-top:16px">
  <img src="assets/img/products/tre-lychee-2.webp" alt="" loading="lazy">
  <div><div class="eyebrow">Gift sets</div><h3>باكدجات الهدايا</h3><p>هدية جاهزة في علبة ذِكرى، لأي مناسبة.</p><a class="btn btn-gold" href="shop.html?occasion=gift">شوف الهدايا</a></div>
</div></div></section>

<section class="sec"><div class="wrap facts-row">
  <div class="fact"><svg class="icon" viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17" r="1.6"/><circle cx="17" cy="17" r="1.6"/></svg><div><b>لكل مصر</b><span>توصيل لكل المحافظات</span></div></div>
  <div class="fact"><svg class="icon" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg><div><b>عند الاستلام</b><span>أو محفظة / إنستاباي</span></div></div>
  <div class="fact"><svg class="icon" viewBox="0 0 24 24"><path d="M4 20l1.5-4A8 8 0 1 1 8 18.5z"/></svg><div><b>واتساب</b><span>نرد على أسئلتك</span></div></div>
</div></section>

<section class="statement">
  <img src="assets/brand/logo-full-gold.webp" alt="ذِكرى — Where memories linger" loading="lazy" width="300" height="268">
  <p>كل ريحة بتحكي ذكرى.<br>اختار اللي تفضل معاك.</p>
</section>
''', 'home')

page('shop.html', 'كل العطور | ذِكرى', 'كل عطور ذِكرى: فلتر بالنوع وعائلة الريحة والمناسبة والحجم والسعر.', '''
<section class="page-head"><div class="wrap"><div class="eyebrow">Shop</div><h1 id="shop-title">كل العطور</h1><p id="shop-sub">رجالي وحريمي ويونيسكس، كل الأحجام.</p></div></section>
<div class="wrap">
  <div class="shop-bar">
    <button class="btn btn-line open-filters" data-open-filters style="min-height:40px;padding:0 16px">فلتر</button>
    <span class="count" id="count"></span>
    <label class="sr-only" for="sort">الترتيب</label>
    <select id="sort"><option value="new">الأحدث</option><option value="price-asc">السعر: من الأقل</option><option value="price-desc">السعر: من الأعلى</option></select>
  </div>
  <div class="shop-layout">
    <aside class="filters" id="filters" aria-label="الفلاتر">
      <div class="f-head"><h2 style="font-size:20px">فلتر</h2><button class="icon-btn close" data-close-filters aria-label="اقفل">✕</button></div>
      <div id="filter-groups"></div>
      <div class="f-actions"><button class="btn btn-line" data-clear>امسح الكل</button><button class="btn btn-dark btn-block" data-close-filters>اعرض النتايج</button></div>
    </aside>
    <div>
      <div class="active-filters" id="active-filters"></div>
      <div class="grid" id="grid"></div>
      <p class="empty" id="empty" hidden>مفيش عطور بالفلاتر دي. <button class="chip" data-clear>امسح الفلاتر</button></p>
    </div>
  </div>
</div>
''', 'shop')

page('product.html', 'عطر | ذِكرى', 'تفاصيل العطر: الأحجام والأسعار والهرم العطري والثبات.', '''
<div class="wrap"><nav class="crumbs" id="crumbs" aria-label="مكانك"><a href="index.html">الرئيسية</a> / <a href="shop.html">كل العطور</a></nav>
<div id="pdp"></div>
<section class="sec" id="similar-sec" hidden><div class="sec-head"><div><div class="eyebrow">You may also like</div><h2>عطور شبهه</h2></div></div><div class="grid" id="similar"></div></section>
</div>
''', 'product')

page('quiz.html', 'اعرف ريحتك | ذِكرى', 'جاوب على 5 أسئلة ونرشحلك 3 عطور تناسب ذوقك.', '''
<section class="page-head"><div class="wrap"><div class="eyebrow">Scent quiz</div><h1>اعرف ريحتك</h1><p>5 أسئلة في دقيقة، وفي الآخر 3 ترشيحات.</p></div></section>
<div class="wrap"><div class="quiz" id="quiz"></div></div>
''', 'quiz')

def prose(name, title, desc, eyebrow, h1, sub, inner):
    page(name, f'{h1} | ذِكرى', desc, f'''
<section class="page-head"><div class="wrap"><div class="eyebrow">{eyebrow}</div><h1>{h1}</h1><p>{sub}</p></div></section>
<div class="wrap"><article class="prose">{inner}</article></div>
''', 'static')

prose('about.html','عننا','عن متجر ذِكرى للعطور.','About','عننا','حكاية ذِكرى.','''
<p class="todo">[نص مطلوب من صاحب المتجر] إمتى بدأت ذِكرى، وليه اخترت العطور، وإيه اللي يميّزكم. مش هنكتب قصة من عندنا.</p>
<h2>اللي بنقدمه</h2>
<ul><li>عطور رجالي وحريمي ويونيسكس.</li><li>كل زجاجة 50 مل معاها تستر 3 مل من نفس الريحة.</li><li>توصيل لكل محافظات مصر، والقاهرة والجيزة خلال 3 أيام عمل.</li><li>الدفع عند الاستلام، أو محفظة إلكترونية / إنستاباي.</li></ul>
''')

prose('shipping.html','الشحن','مصاريف ومواعيد الشحن لكل محافظات مصر في ذِكرى.','Shipping','الشحن والتوصيل','بنوصل لكل محافظات مصر.','''
<h2>بنوصل فين؟</h2><p>لكل محافظات مصر.</p>
<h2>التوصيل بياخد قد إيه؟</h2><p>القاهرة والجيزة: 3 أيام عمل من تأكيد الأوردر. باقي المحافظات: هنأكدلك الميعاد على واتساب وقت تأكيد الطلب.</p>
<h2>مصاريف الشحن</h2><p>بتتحسب حسب محافظتك، وبتظهرلك قبل ما تأكد الطلب.</p>
<div id="ship-table"></div>
<h2>الدفع</h2><p>الدفع عند الاستلام، أو تحويل على محفظة إلكترونية / إنستاباي.</p>
<h2>تأكيد الأوردر</h2><p>بعد ما تطلب، هنكلمك على واتساب نأكد الطلب والعنوان.</p>
''')

prose('returns.html','الاستبدال والاسترجاع','سياسة الاستبدال والاسترجاع في ذِكرى.','Returns','الاستبدال والاسترجاع','اقرا الشروط قبل ما تفتح الزجاجة.','''
<p>اختيار العطر حاجة شخصية جداً. علشان كده عملنا السياسة دي على أساس حاجتين: تاخد وقتك وانت بتجرّب، ونحافظ على جودة كل زجاجة.</p>
<h2>1. جرّب الأول</h2><ul><li>كل زجاجة 50 مل معاها <b>تستر 3 مل مجاناً</b> من نفس الريحة.</li><li>جرّب التستر على جلدك، وسيب الريحة تاخد وقتها، وبعدها افتح الزجاجة الكبيرة.</li><li><b>الزجاجة الـ 50 مل لما تتفتح أو تُستخدم، مابتترجعش ولا بتتبدل.</b></li></ul>
<h2>2. الاستبدال والاسترجاع</h2><p>تقدر تطلب استبدال أو استرجاع خلال <b>14 يوم من استلام الأوردر</b>، بالشروط دي:</p><ul><li>الزجاجة مقفولة تماماً، ومحدش استخدمها.</li><li>في علبتها الأصلية، والعلبة والليبل والسيل وأي إكسسوارات معاها سليمة.</li><li>حالتها زي ما وصلتلك بالظبط.</li></ul><p>كل طلب بنراجعه الأول قبل الموافقة.</p>
<h2>3. حاجات مابتترجعش</h2><ul><li>زجاجة 50 مل مفتوحة أو مستخدمة.</li><li>التستر 3 مل.</li><li>منتج اتأذى بعد الاستلام.</li><li>منتج حد عدّل فيه أو فتح السيل بتاعه.</li><li>أي منتج مكتوب عليه "غير قابل للاسترجاع" في صفحته قبل الشراء.</li></ul>
<h2>4. لو الأوردر وصلك فيه مشكلة</h2><p>لو وصل مكسور، أو فيه عيب، أو ناقص، أو مش اللي طلبته، <b>كلّمنا على واتساب خلال 24 ساعة من الاستلام</b> وابعت رقم الأوردر وصور واضحة للمنتج والعلبة ووصف قصير. ولما نتأكد هنعرض عليك منتج بديل لو متوفر، أو فلوسك كاملة.</p>
<h2>5. مصاريف شحن المرتجع</h2><ul><li><b>لو غيّرت رأيك أو الريحة ماناسبتكش:</b> مصاريف الشحن عليك.</li><li><b>لو الغلط مننا</b> (منتج غلط، ناقص، عيب، أو اتأذى في الشحن): مصاريف الشحن علينا.</li></ul>
<h2>6. استرداد الفلوس</h2><ul><li>بعد ما المرتجع يوصلنا ونفحصه ونوافق عليه، الفلوس بترجعلك على محفظة إلكترونية أو إنستاباي.</li><li>لو الأوردر كان دفع عند الاستلام، الفلوس بترجعلك على محفظة إلكترونية باسمك أو برقمك.</li><li>خلال 7 أيام عمل من الموافقة.</li><li>مصاريف الشحن الأصلية بترجع بس لو المشكلة كانت مننا.</li></ul>
<h2>7. إزاي تطلب استرجاع</h2><ol><li>كلّمنا على واتساب، وقولّنا رقم الأوردر والسبب.</li><li>هنراجع طلبك ونقولك لو مطابق للشروط.</li><li>لو اتوافق عليه، هنبعتلك خطوات الإرجاع.</li></ol><p><b>ماتبعتش أي منتج من غير موافقتنا.</b></p>
<h2>8. إلغاء الأوردر</h2><p>تقدر تلغي خلال 24 ساعة من الطلب، بشرط إنه لسه ماتجهزش ولا اتشحن.</p>
<h2>9. حماية السياسة</h2><p>من حقنا نقفل الاسترجاع أو بعض طرق الدفع لو فيه إساءة استخدام متكررة.</p>
''')

prose('faq.html','الأسئلة الشائعة','أسئلة شائعة عن الطلب والشحن والدفع والاسترجاع في ذِكرى.','FAQ','الأسئلة الشائعة','لو سؤالك مش هنا، كلمنا على واتساب.','''
<details class="faq"><summary>بتوصلوا فين؟</summary><p>لكل محافظات مصر. القاهرة والجيزة خلال 3 أيام عمل، وباقي المحافظات بنأكد الميعاد على واتساب.</p></details>
<details class="faq"><summary>الشحن بكام؟</summary><p>حسب المحافظة، والسعر بيظهرلك في صفحة تأكيد الطلب قبل ما تأكد. التفاصيل في <a href="shipping.html">صفحة الشحن</a>.</p></details>
<details class="faq"><summary>إزاي أدفع؟</summary><p>الدفع عند الاستلام، أو تحويل على محفظة إلكترونية / إنستاباي.</p></details>
<details class="faq"><summary>محتاج أعمل حساب علشان أطلب؟</summary><p>لأ. بتكتب اسمك وتليفونك وعنوانك بس.</p></details>
<details class="faq"><summary>إيه هو التستر 3 مل؟</summary><p>زجاجة صغيرة من نفس الريحة بتيجي مجاناً مع كل 50 مل، علشان تجرّب قبل ما تفتح الزجاجة الكبيرة.</p></details>
<details class="faq"><summary>ينفع أرجّع العطر؟</summary><p>أيوه خلال 14 يوم لو الزجاجة مقفولة وفي علبتها. التفاصيل في <a href="returns.html">سياسة الاستبدال والاسترجاع</a>.</p></details>
<details class="faq"><summary>إزاي أعرف الريحة مناسبة ليا؟</summary><p>جرّب <a href="quiz.html">اختبار اعرف ريحتك</a>، أو كلمنا على واتساب ونساعدك.</p></details>
''')

prose('contact.html','تواصل معانا','تواصل مع ذِكرى على واتساب أو إنستجرام أو تيك توك.','Contact','تواصل معانا','أسرع طريقة هي واتساب.','''
<div class="contact-cards" id="contact-cards"></div>
''')
print('ok')

# ---------- Phase B: cart, checkout, order confirmation ----------
NOINDEX = '<meta name="robots" content="noindex">'
def page_noindex(name, title, body, script):
    html = HEAD.format(title=title, desc='', body=body.strip(), script=script)
    html = html.replace('<meta name="description" content="">', NOINDEX)
    (ROOT / name).write_text(html, encoding='utf-8')

page_noindex('cart.html', 'السلة | ذِكرى', '''
<section class="page-head"><div class="wrap"><div class="eyebrow">Cart</div><h1>السلة</h1></div></section>
<div class="wrap"><div class="cart-layout" id="cart"></div></div>
''', 'cart')

page_noindex('checkout.html', 'تأكيد الطلب | ذِكرى', '''
<section class="page-head"><div class="wrap"><div class="eyebrow">Checkout</div><h1>تأكيد الطلب</h1><p>من غير تسجيل دخول. بياناتك بنستخدمها للتوصيل بس.</p></div></section>
<div class="wrap"><form class="checkout" id="checkout" novalidate>
  <div class="co-main">
    <fieldset class="co-box"><legend>بياناتك</legend>
      <div class="field"><label for="name">الاسم</label><input id="name" name="name" autocomplete="name" required maxlength="60"><small class="err"></small></div>
      <div class="field"><label for="phone">رقم الموبايل</label><input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="01xxxxxxxxx" required dir="ltr"><small class="err"></small></div>
      <div class="field"><label for="phone2">رقم تاني <span class="opt">(اختياري)</span></label><input id="phone2" name="phone2" type="tel" inputmode="tel" dir="ltr"><small class="err"></small></div>
    </fieldset>
    <fieldset class="co-box"><legend>العنوان</legend>
      <div class="field-row">
        <div class="field"><label for="gov">المحافظة</label><select id="gov" name="gov" required></select><small class="err"></small></div>
        <div class="field"><label for="zone">المنطقة / المدينة</label><input id="zone" name="zone" required maxlength="60" placeholder="مثلاً: مدينة نصر"><small class="err"></small></div>
      </div>
      <div class="field"><label for="street">العنوان بالتفصيل</label><textarea id="street" name="street" rows="2" required maxlength="250" placeholder="الشارع، رقم العمارة، الدور، الشقة"></textarea><small class="err"></small></div>
      <div class="field"><label for="landmark">علامة مميزة <span class="opt">(اختياري)</span></label><input id="landmark" name="landmark" maxlength="100"></div>
    </fieldset>
    <fieldset class="co-box"><legend>طريقة الدفع</legend>
      <div class="pay-opts" id="pay-opts"></div>
    </fieldset>
    <fieldset class="co-box"><legend>ملاحظات <span class="opt">(اختياري)</span></legend>
      <div class="field"><textarea id="notes" name="notes" rows="2" maxlength="300" aria-label="ملاحظات"></textarea></div>
      <label class="check"><input type="checkbox" id="remember" checked> احفظ بياناتي على الجهاز ده للمرة الجاية</label>
    </fieldset>
  </div>
  <aside class="co-summary" id="summary"></aside>
</form></div>
''', 'checkout')

page_noindex('order.html', 'تم الطلب | ذِكرى', '''
<div class="wrap"><div class="order-done" id="order"></div></div>
''', 'order')
print('phase b pages ok')
