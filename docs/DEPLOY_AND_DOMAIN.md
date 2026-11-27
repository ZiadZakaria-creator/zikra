# النشر والدومين و SEO

## إزاي النشر بيشتغل دلوقتي
- GitHub Actions بيشغّل `tools/build.py`:
  - **كل ساعة** أوتوماتيك.
  - **مع كل دمج** على `main`.
  - **وقت ما تحب** من زرار **Run workflow** (اللوحة فيها لينك "انشر دلوقتي").
- الـ build بيقرا المنتجات والإعدادات والصور من Firestore، ويبني:
  - `data/catalog.json`
  - صفحة لكل عطر `p/<slug>/` فيها بيانات Product لجوجل.
  - صور مشاركة واتساب/فيسبوك.
  - `sitemap.xml` و `feed.xml` (Google Merchant).
- **لو أي حاجة فشلت (Firestore رفض، سعر صفر، رابط مكرر...) النشر بيقف، والموقع بيفضل على آخر نسخة سليمة.**

## خطوة لازم تتعمل مرة واحدة (قبل دمج مرحلة د)
GitHub ← الريبو ← **Settings** ← **Pages** ← **Source**: اختار **GitHub Actions** بدل "Deploy from a branch".

## ربط دومين خاص (لما تشتريه)
1. اشتري الدومين (مثلاً `zikra-eg.com`) من أي مسجّل (Namecheap، GoDaddy، Cloudflare...).
2. في إعدادات الـ DNS عند المسجّل:
   - 4 سجلات **A** للدومين الأساسي (`@`):
     `185.199.108.153` · `185.199.109.153` · `185.199.110.153` · `185.199.111.153`
   - سجل **CNAME** لـ `www` يشاور على `ziadzakaria-creator.github.io`
3. GitHub ← **Settings** ← **Secrets and variables** ← **Actions** ← تبويب **Variables** ← **New repository variable**:
   - `CUSTOM_DOMAIN` = `zikra-eg.com`
   - `SITE_URL` = `https://zikra-eg.com/`
4. GitHub ← **Settings** ← **Pages** ← **Custom domain**: اكتب الدومين ودوس Save. استنى لحد ما يتأكد، وبعدين علّم على **Enforce HTTPS**.
5. **مهم للوحة التحكم:** Firebase Console ← **Authentication** ← **Settings** ← **Authorized domains** ← **Add domain** ← اكتب الدومين. من غير الخطوة دي تسجيل دخول الأدمن مش هيشتغل على الدومين الجديد.
6. شغّل النشر (Run workflow).

## جوجل
- **Search Console**: ضيف الموقع، وبعدين **Sitemaps** ← `sitemap.xml`.
  `robots.txt` بيبقى فعّال بس على الدومين الخاص، لأن جوجل بيقراه من أول الدومين بس.
- **Google Merchant Center** (اختياري، لظهور العطور في Google Shopping): **Products** ← **Feeds** ← **Scheduled fetch** ← `https://<الدومين>/feed.xml`.
  جوجل ممكن يرفض أسماء فيها علامات تجارية معروفة.

## Meta Pixel / Google Analytics (اختياري)
من اللوحة ← **الشحن والإعدادات**: حط الـ Pixel ID أو الـ GA ID، وبعدين انشر.
بيتحمّلوا بعد ما الصفحة تخلص علشان السرعة. الأحداث اللي بتتسجل: PageView، ViewContent، AddToCart، Purchase.

## تشغيل الـ build على جهازك
```bash
pip install pillow
python3 tools/build.py              # من Firestore الحقيقي
BUILD_OFFLINE=1 python3 tools/build.py   # من data/catalog.json
cd _site && python3 -m http.server 8080
```
