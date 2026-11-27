/* Zikra — language (ar/en) and theme (light/dark).
   Arabic is the source. In English mode every Arabic text node, attribute and option
   is swapped through the dictionary below; a MutationObserver catches content that the
   page scripts render later. Choice is kept per device (localStorage) and applied in
   <head> before first paint (see the inline script in each page). */
(function () {
  'use strict';
  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } };
  const LANG = get('zikra_lang') === 'en' ? 'en' : 'ar';
  const THEME = get('zikra_theme') === 'dark' ? 'dark' : 'light';

  const EN = {
    // Layout & navigation
    'الرئيسية': 'Home', 'كل العطور': 'All perfumes', 'رجالي': 'Men', 'حريمي': 'Women', 'يونيسكس': 'Unisex', 'الهدايا': 'Gifts',
    'اعرف ريحتك': 'Find your scent', 'العطور': 'Perfumes', 'السلة': 'Cart', 'القائمة': 'Menu', 'اقفل': 'Close', 'ابحث في العطور': 'Search perfumes',
    'تنقل سريع': 'Quick navigation', 'ذِكرى — الرئيسية': 'Zikra — Home', 'ذِكرى': 'Zikra', 'مكانك': 'Breadcrumb',
    'عننا': 'About us', 'الشحن': 'Shipping', 'الاستبدال والاسترجاع': 'Returns & exchanges', 'الأسئلة الشائعة': 'FAQ', 'تواصل معانا': 'Contact us',
    'المتجر': 'Shop', 'مساعدة': 'Help', '© 2026 ذِكرى. أونلاين فقط.': '© 2026 Zikra. Online only.',
    'عطور مختارة بعناية، بتوصلك لحد البيت في كل محافظات مصر.': 'Carefully chosen perfumes, delivered to your door anywhere in Egypt.',
    'توصيل لكل محافظات مصر · الدفع عند الاستلام': 'Delivery all over Egypt · Cash on delivery',
    'نسخة تجريبية: الأسعار والمخزون والمكونات للعرض بس لحد ما تتظبط من لوحة التحكم.': 'Preview version: prices, stock and notes are for display only.',
    'كلمنا على واتساب': 'Chat with us on WhatsApp', 'إنستجرام': 'Instagram', 'تيك توك': 'TikTok', 'واتساب': 'WhatsApp',
    // Home
    'ريحة': 'A scent', 'تفضل': 'that lingers', 'في الذاكرة': 'in memory',
    'اختار عطرك حسب ذوقك والمناسبة والميزانية، وإحنا نوصلهولك لحد البيت.': 'Choose your perfume by taste, occasion and budget, and we deliver it to your door.',
    'تسوّق العطور': 'Shop perfumes', 'لكل مصر': 'All Egypt', 'توصيل لكل المحافظات': 'Delivery to every governorate',
    'عند الاستلام': 'On delivery', 'أو محفظة / إنستاباي': 'or wallet / InstaPay', 'نرد على أسئلتك': 'We answer your questions',
    'تسوّق حسب النوع': 'Shop by type', 'كل العطور ←': 'All perfumes →', 'تسوّق ←': 'Shop →',
    'حسب المناسبة': 'By occasion', 'حسب الميزانية': 'By budget', 'عائلة الريحة': 'Scent family', 'وصل حديثاً': 'New arrivals',
    'يومي': 'Daily', 'سهرة': 'Evening', 'صيفي': 'Summer', 'شتوي': 'Winter', 'هدايا': 'Gifts',
    'خشبي': 'Woody', 'فريش': 'Fresh', 'شرقي': 'Oriental', 'فواكه': 'Fruity', 'ورد': 'Floral', 'عود': 'Oud',
    'أقل من 300 ج': 'Under EGP 300', '300 – 600 ج': 'EGP 300 – 600', '600 – 1000 ج': 'EGP 600 – 1,000', 'أكتر من 1000 ج': 'Over EGP 1,000',
    'جرّب قبل ما تفتح': 'Try before you open',
    'كل زجاجة 50 مل معاها تستر 3 مل من نفس الريحة. جرّبه على جلدك وسيبه ياخد وقته، وخلّي الزجاجة الكبيرة مقفولة لحد ما تتأكد إنها ريحتك.': 'Every 50 ml bottle comes with a free 3 ml tester of the same scent. Try it on your skin, give it time, and keep the big bottle sealed until you are sure.',
    'مل زجاجتك': 'ml your bottle', 'مل تستر مجاناً': 'ml free tester', 'مش عارف تختار؟': "Can't decide?",
    'جاوب على 5 أسئلة في دقيقة، ونرشحلك 3 عطور على ذوقك.': 'Answer 5 questions in a minute and get 3 perfumes picked for you.',
    'ابدأ الاختبار': 'Start the quiz', 'باكدجات الهدايا': 'Gift sets', 'هدية جاهزة في علبة ذِكرى، لأي مناسبة.': 'A ready gift in a Zikra box, for any occasion.',
    'شوف الهدايا': 'See gifts', 'كل ريحة بتحكي ذكرى.': 'Every scent tells a memory.', 'اختار اللي تفضل معاك.': 'Pick the one that stays with you.',
    'ذِكرى — Where memories linger': 'Zikra — Where memories linger',
    // Product card & page
    'تركيبتنا': 'Our blend', 'مستوحى': 'Inspired', 'خلص': 'Sold out', 'معاه تستر 3 مل': 'Free 3 ml tester', 'الصورة قريباً': 'Photo coming soon', 'يبدأ من': 'From',
    'اطلب دلوقتي': 'Order now', 'اسأل على واتساب': 'Ask on WhatsApp', 'متوفر': 'In stock', 'خلص حالياً': 'Currently sold out',
    'معاه تستر 3 مل مجاناً': 'Comes with a free 3 ml tester', 'من نفس الريحة. جرّبه الأول وخلّي الزجاجة مقفولة لحد ما تتأكد.': 'of the same scent. Try it first and keep the bottle sealed until you are sure.',
    'الزجاجة المفتوحة مابتترجعش.': 'Opened bottles cannot be returned.', 'سياسة الاستبدال والاسترجاع': 'Returns & exchanges policy',
    'الهرم العطري': 'Fragrance notes', 'المقدمة': 'Top', 'القلب': 'Heart', 'القاعدة': 'Base', 'الثبات والفوحان': 'Longevity & projection',
    'الثبات': 'Longevity', 'الفوحان': 'Projection', 'خفيف': 'Light', 'هادي': 'Soft', 'متوسط': 'Moderate', 'قوي': 'Strong', 'قوي جداً': 'Very strong',
    'يناسب إمتى؟': 'When to wear it', 'صيف': 'Summer', 'شتا': 'Winter', 'طول السنة': 'All year', 'بالنهار': 'Daytime', 'بالليل': 'Night',
    'هيعجبك:': "You'll like it:", 'عطور شبهه': 'You may also like', 'الحجم': 'Size',
    'العطر ده مش موجود.': 'This perfume does not exist.', 'شوف كل العطور': 'See all perfumes', 'مستوحى من: ': 'Inspired by: ',
    // Shop
    'رجالي وحريمي ويونيسكس، كل الأحجام.': 'Men, women and unisex, all sizes.', 'فلتر': 'Filter', 'الترتيب': 'Sort', 'الأحدث': 'Newest',
    'السعر: من الأقل': 'Price: low to high', 'السعر: من الأعلى': 'Price: high to low', 'الفلاتر': 'Filters', 'النوع': 'Type', 'المناسبة': 'Occasion', 'السعر': 'Price',
    'امسح الكل': 'Clear all', 'اعرض النتايج': 'Show results', 'مفيش عطور بالفلاتر دي.': 'No perfumes match these filters.', 'امسح الفلاتر': 'Clear filters',
    'عطور رجالي': "Men's perfumes", 'عطور حريمي': "Women's perfumes", 'عطور يونيسكس': 'Unisex perfumes',
    // Quiz
    '5 أسئلة في دقيقة، وفي الآخر 3 ترشيحات.': '5 questions in a minute, then 3 picks.', 'العطر ده لمين؟': 'Who is it for?', 'ليا (رجالي)': 'Me (men)', 'ليا (حريمي)': 'Me (women)',
    'مش فارقة / هدية': "Doesn't matter / a gift", 'هتلبسه إمتى أكتر؟': 'When will you wear it most?', 'كل يوم وفي الشغل': 'Every day & at work', 'سهرات وخروجات': 'Evenings & going out',
    'مناسبات وهدايا': 'Occasions & gifts', 'أنهي موسم؟': 'Which season?', 'الصيف': 'Summer', 'الشتا': 'Winter', 'أنهي ريحة بتشدك؟': 'Which scents do you like?',
    'اختار واحدة أو أكتر': 'Pick one or more', 'عايزها قد إيه؟': 'How strong?', 'خفيفة وهادية': 'Light & soft', 'متوسطة': 'Moderate', 'قوية وتفضل': 'Strong & lasting',
    'التالي': 'Next', 'رجوع': 'Back', 'ترشيحاتنا ليك': 'Our picks for you', 'على حسب إجاباتك، دول أقرب 3 عطور لذوقك.': 'Based on your answers, these 3 are closest to your taste.',
    'عيد الاختبار': 'Retake the quiz', 'اختبار اعرف ريحتك': 'the scent quiz',
    // Cart & checkout
    'السلة فاضية.': 'Your cart is empty.', 'زوّد': 'Increase', 'قلّل': 'Decrease', 'الكمية': 'Quantity', 'شيل': 'Remove', 'المجموع': 'Subtotal',
    'بيتحسب حسب منطقتك في الخطوة الجاية': 'Calculated at checkout', 'كمّل الطلب': 'Checkout', 'كمّل تسوّق': 'Continue shopping',
    'الدفع عند الاستلام أو محفظة / إنستاباي.': 'Cash on delivery or wallet / InstaPay.', 'سياسة الاسترجاع': 'Returns policy',
    'خلص من المخزون. شيله من السلة علشان تكمل.': 'Out of stock. Remove it to continue.',
    'تأكيد الطلب': 'Checkout', 'من غير تسجيل دخول. بياناتك بنستخدمها للتوصيل بس.': 'No account needed. Your details are used for delivery only.',
    'بياناتك': 'Your details', 'الاسم': 'Name', 'رقم الموبايل': 'Mobile number', 'رقم تاني': 'Second number', '(اختياري)': '(optional)',
    'العنوان': 'Address', 'المحافظة': 'Governorate', 'المنطقة / المدينة': 'Area / city', 'مثلاً: مدينة نصر': 'e.g. Nasr City', 'العنوان بالتفصيل': 'Full address',
    'الشارع، رقم العمارة، الدور، الشقة': 'Street, building, floor, apartment', 'علامة مميزة': 'Landmark', 'طريقة الدفع': 'Payment method',
    'الدفع عند الاستلام': 'Cash on delivery', 'كاش للمندوب وقت ما الأوردر يوصلك.': 'Pay the courier in cash when it arrives.',
    'محفظة إلكترونية / إنستاباي': 'Mobile wallet / InstaPay', 'هتظهرلك بيانات التحويل بعد ما تأكد الطلب.': 'Transfer details appear after you place the order.',
    'ملاحظات': 'Notes', 'احفظ بياناتي على الجهاز ده للمرة الجاية': 'Remember my details on this device', 'اختار المحافظة': 'Choose governorate',
    'طلبك': 'Your order', 'كود الخصم': 'Discount code', 'كود خصم': 'Discount code', 'طبّق': 'Apply', 'الإجمالي': 'Total', 'أكّد الطلب': 'Place order',
    'بتأكيد الطلب انت موافق على': 'By placing the order you agree to the', '. هنكلمك على واتساب نأكد الأوردر والعنوان.': '. We will message you on WhatsApp to confirm.',
    'اكتب اسمك': 'Enter your name', 'رقم موبايل مصري من 11 رقم يبدأ بـ 01': 'An 11-digit Egyptian mobile starting with 01', 'الرقم ده مش صحيح': 'This number is not valid',
    'اكتب المنطقة أو المدينة': 'Enter your area or city', 'اكتب العنوان بالتفصيل': 'Enter your full address',
    'الكود ده مش صحيح': 'This code is not valid', 'الكود ده انتهى': 'This code has expired', 'الكود ده متوقف': 'This code is disabled',
    'مش قادرين نتأكد من الكود دلوقتي. جرّب تاني.': "We couldn't check the code. Try again.", 'بنسجّل طلبك…': 'Placing your order…',
    'حصلت مشكلة وطلبك ماتسجلش. جرّب تاني.': 'Something went wrong and your order was not placed. Try again.',
    // Order confirmation
    'تم الطلب | ذِكرى': 'Order placed | Zikra', 'طلبك اتسجّل': 'Your order is placed', 'رقم الأوردر': 'Order number', 'انسخ': 'Copy', 'الخطوة الجاية': 'Next step',
    'استلمنا طلبك. ابعتلنا نسخة على واتساب لو حابب نأكده أسرع، وهنرد عليك نأكد العنوان وميعاد التوصيل.': 'We received your order. Send us a copy on WhatsApp to confirm faster; we will reply to confirm the address and delivery time.',
    'ابعت تفاصيل الطلب على واتساب، وهنرد عليك نأكد العنوان وميعاد التوصيل.': 'Send your order details on WhatsApp and we will confirm the address and delivery time.',
    'طلبك ماوصلناش أونلاين.': "Your order didn't reach us online.", 'لازم تبعته على واتساب من الزرار ده علشان نقدر نجهزه.': 'Please send it on WhatsApp with this button so we can prepare it.',
    'ابعت الطلب على واتساب': 'Send order on WhatsApp', 'انسخ تفاصيل الطلب': 'Copy order details', 'بيانات التحويل': 'Transfer details', 'حوّل': 'Transfer',
    'الشحن بس مقدّم': 'Only shipping upfront', 'مقدّم دلوقتي (مصاريف الشحن)': 'Pay now (shipping fee)', 'للمندوب عند الاستلام': 'To the courier on delivery',
    'بتحوّل مصاريف الشحن بس مقدّم على محفظة / إنستاباي علشان نأكد الأوردر، والباقي كاش للمندوب.': 'You transfer only the shipping fee upfront by wallet / InstaPay to confirm the order, and pay the rest in cash to the courier.',
    'هتظهرلك بيانات التحويل بعد ما تأكد الطلب. بنجهّز الأوردر بعد ما نتأكد من تحويل الشحن.': 'Transfer details appear after you place the order. We prepare it once the shipping transfer is confirmed.',
    'حوّل مصاريف الشحن مقدّم': 'Transfer the shipping fee upfront', 'كاش للمندوب وقت الاستلام.': 'in cash to the courier on delivery.',
    'ابعت صورة التحويل على واتساب مع رقم الأوردر. هنبدأ نجهّز الطلب بعد ما نتأكد من التحويل. والباقي': 'Send a screenshot of the transfer on WhatsApp with your order number. We start preparing once the transfer is confirmed. The remaining',
    'الدفع عند الاستلام (الشحن بس مقدّم) أو محفظة / إنستاباي.': 'Cash on delivery (only shipping upfront) or wallet / InstaPay.',
    'الدفع عند الاستلام: بتحوّل مصاريف الشحن بس مقدّم على محفظة إلكترونية / إنستاباي علشان نأكد الأوردر، والباقي كاش للمندوب. أو تحوّل المبلغ كله على المحفظة / إنستاباي.': 'Cash on delivery: you transfer only the shipping fee upfront by mobile wallet / InstaPay to confirm the order, and pay the rest in cash to the courier. Or transfer the full amount by wallet / InstaPay.',
    'الدفع عند الاستلام (مصاريف الشحن بس مقدّم)، أو محفظة إلكترونية / إنستاباي.': 'Cash on delivery (only the shipping fee upfront), or mobile wallet / InstaPay.',
    'توصيل لكل محافظات مصر · الدفع عند الاستلام (الشحن مقدّم)': 'Delivery all over Egypt · Cash on delivery (shipping upfront)',
    'على المحفظة أو إنستاباي:': 'to the wallet or InstaPay:', 'اتأكد إن الاسم اللي هيظهرلك وانت بتحوّل:': 'Check that the name shown when you transfer is:',
    'ابعت صورة التحويل على واتساب مع رقم الأوردر. هنبدأ نجهّز الطلب بعد ما نتأكد من التحويل.': 'Send a screenshot of the transfer on WhatsApp with your order number. We start preparing once it is confirmed.',
    'ملخص الطلب': 'Order summary', 'لو الأوردر وصلك فيه مشكلة، كلمنا خلال 24 ساعة من الاستلام.': 'If something is wrong with your order, contact us within 24 hours of delivery.',
    'مش لاقيين الأوردر ده على الجهاز ده. لو عملت طلب، كلمنا على واتساب برقم الأوردر.': "We can't find this order on this device. If you ordered, message us on WhatsApp with your order number.",
    'اتنسخ رقم الأوردر': 'Order number copied', 'اتنسخ رقم المحفظة': 'Wallet number copied', 'اتنسخت تفاصيل الطلب': 'Order details copied',
    'حصلت مشكلة في تحميل العطور. جرّب تعمل refresh.': 'Could not load the perfumes. Please refresh.',
    // Static pages
    'حكاية ذِكرى.': 'The Zikra story.', 'اللي بنقدمه': 'What we offer', 'عطور رجالي وحريمي ويونيسكس.': "Men's, women's and unisex perfumes.",
    'كل زجاجة 50 مل معاها تستر 3 مل من نفس الريحة.': 'Every 50 ml bottle comes with a 3 ml tester of the same scent.',
    'توصيل لكل محافظات مصر، والقاهرة والجيزة خلال 3 أيام عمل.': 'Delivery all over Egypt; Cairo and Giza within 3 working days.',
    'الدفع عند الاستلام، أو محفظة إلكترونية / إنستاباي.': 'Cash on delivery, or mobile wallet / InstaPay.',
    '[نص مطلوب من صاحب المتجر] إمتى بدأت ذِكرى، وليه اخترت العطور، وإيه اللي يميّزكم. مش هنكتب قصة من عندنا.': '[Text needed from the owner] Our story is coming soon.',
    'الشحن والتوصيل': 'Shipping & delivery', 'بنوصل لكل محافظات مصر.': 'We deliver to every governorate in Egypt.', 'بنوصل فين؟': 'Where do you deliver?',
    'لكل محافظات مصر.': 'To every governorate in Egypt.', 'التوصيل بياخد قد إيه؟': 'How long does delivery take?',
    'القاهرة والجيزة: 3 أيام عمل من تأكيد الأوردر. باقي المحافظات: هنأكدلك الميعاد على واتساب وقت تأكيد الطلب.': 'Cairo and Giza: 3 working days after confirmation. Other governorates: we confirm the date on WhatsApp.',
    'مصاريف الشحن': 'Shipping fees', 'بتتحسب حسب محافظتك، وبتظهرلك قبل ما تأكد الطلب.': 'Based on your governorate, shown before you place the order.',
    'الدفع': 'Payment', 'الدفع عند الاستلام، أو تحويل على محفظة إلكترونية / إنستاباي.': 'Cash on delivery, or transfer to a mobile wallet / InstaPay.',
    'تأكيد الأوردر': 'Order confirmation', 'بعد ما تطلب، هنكلمك على واتساب نأكد الطلب والعنوان.': 'After you order, we message you on WhatsApp to confirm the order and address.',
    'القاهرة، الجيزة': 'Cairo, Giza',
    'الإسكندرية، القليوبية، الشرقية، الدقهلية، الغربية، المنوفية، البحيرة، كفر الشيخ، دمياط، بورسعيد، الإسماعيلية، السويس، الفيوم، بني سويف، المنيا، أسيوط، سوهاج': 'Alexandria, Qalyubia, Sharqia, Dakahlia, Gharbia, Monufia, Beheira, Kafr El Sheikh, Damietta, Port Said, Ismailia, Suez, Fayoum, Beni Suef, Minya, Assiut, Sohag',
    'قنا، الأقصر، أسوان، البحر الأحمر، الوادي الجديد، مطروح، شمال سيناء، جنوب سيناء': 'Qena, Luxor, Aswan, Red Sea, New Valley, Matrouh, North Sinai, South Sinai',
    'اقرا الشروط قبل ما تفتح الزجاجة.': 'Read the terms before opening the bottle.',
    'اختيار العطر حاجة شخصية جداً. علشان كده عملنا السياسة دي على أساس حاجتين: تاخد وقتك وانت بتجرّب، ونحافظ على جودة كل زجاجة.': 'Choosing a scent is personal, so this policy is built on two things: giving you time to try, and protecting the quality of every bottle.',
    '1. جرّب الأول': '1. Try it first', 'تستر 3 مل مجاناً': 'a free 3 ml tester', 'من نفس الريحة.': 'of the same scent.', 'كل زجاجة 50 مل معاها': 'Every 50 ml bottle comes with',
    'جرّب التستر على جلدك، وسيب الريحة تاخد وقتها، وبعدها افتح الزجاجة الكبيرة.': 'Try the tester on your skin, let it develop, then open the big bottle.',
    'الزجاجة الـ 50 مل لما تتفتح أو تُستخدم، مابتترجعش ولا بتتبدل.': 'Once the 50 ml bottle is opened or used, it cannot be returned or exchanged.',
    '2. الاستبدال والاسترجاع': '2. Returns & exchanges', 'تقدر تطلب استبدال أو استرجاع خلال': 'You can request a return or exchange within', '14 يوم من استلام الأوردر': '14 days of delivery',
    '، بالشروط دي:': ', if:', 'الزجاجة مقفولة تماماً، ومحدش استخدمها.': 'The bottle is completely sealed and unused.',
    'في علبتها الأصلية، والعلبة والليبل والسيل وأي إكسسوارات معاها سليمة.': 'It is in its original box, with the box, label, seal and accessories intact.',
    'حالتها زي ما وصلتلك بالظبط.': 'It is exactly as it arrived.', 'كل طلب بنراجعه الأول قبل الموافقة.': 'Every request is reviewed before approval.',
    '3. حاجات مابتترجعش': '3. Non-returnable items', 'زجاجة 50 مل مفتوحة أو مستخدمة.': 'An opened or used 50 ml bottle.', 'التستر 3 مل.': 'The 3 ml tester.',
    'منتج اتأذى بعد الاستلام.': 'Products damaged after delivery.', 'منتج حد عدّل فيه أو فتح السيل بتاعه.': 'Products altered or with a broken seal.',
    'أي منتج مكتوب عليه "غير قابل للاسترجاع" في صفحته قبل الشراء.': 'Any product marked "non-returnable" on its page.',
    '4. لو الأوردر وصلك فيه مشكلة': '4. If your order arrives with a problem', 'لو وصل مكسور، أو فيه عيب، أو ناقص، أو مش اللي طلبته،': 'If it arrives broken, defective, incomplete or wrong,',
    'كلّمنا على واتساب خلال 24 ساعة من الاستلام': 'message us on WhatsApp within 24 hours of delivery',
    'وابعت رقم الأوردر وصور واضحة للمنتج والعلبة ووصف قصير. ولما نتأكد هنعرض عليك منتج بديل لو متوفر، أو فلوسك كاملة.': 'with your order number, clear photos of the product and box, and a short description. Once verified, we offer a replacement if available or a full refund.',
    '5. مصاريف شحن المرتجع': '5. Return shipping', 'لو غيّرت رأيك أو الريحة ماناسبتكش:': 'If you changed your mind or the scent did not suit you:', 'مصاريف الشحن عليك.': 'you pay the shipping.',
    'لو الغلط مننا': 'If the mistake is ours', '(منتج غلط، ناقص، عيب، أو اتأذى في الشحن): مصاريف الشحن علينا.': '(wrong, missing, defective or damaged in shipping): we pay the shipping.',
    '6. استرداد الفلوس': '6. Refunds', 'بعد ما المرتجع يوصلنا ونفحصه ونوافق عليه، الفلوس بترجعلك على محفظة إلكترونية أو إنستاباي.': 'After the return arrives, is inspected and approved, the refund goes to a mobile wallet or InstaPay.',
    'لو الأوردر كان دفع عند الاستلام، الفلوس بترجعلك على محفظة إلكترونية باسمك أو برقمك.': 'For cash-on-delivery orders, the refund goes to a mobile wallet in your name or number.',
    'خلال 7 أيام عمل من الموافقة.': 'Within 7 working days of approval.', 'مصاريف الشحن الأصلية بترجع بس لو المشكلة كانت مننا.': 'Original shipping fees are refunded only if the problem was ours.',
    '7. إزاي تطلب استرجاع': '7. How to request a return', 'كلّمنا على واتساب، وقولّنا رقم الأوردر والسبب.': 'Message us on WhatsApp with your order number and the reason.',
    'هنراجع طلبك ونقولك لو مطابق للشروط.': 'We review it and tell you if it qualifies.', 'لو اتوافق عليه، هنبعتلك خطوات الإرجاع.': 'If approved, we send you the return steps.',
    'ماتبعتش أي منتج من غير موافقتنا.': 'Do not send anything back without our approval.', '8. إلغاء الأوردر': '8. Cancelling an order',
    'تقدر تلغي خلال 24 ساعة من الطلب، بشرط إنه لسه ماتجهزش ولا اتشحن.': 'You can cancel within 24 hours of ordering, as long as it has not been prepared or shipped.',
    '9. حماية السياسة': '9. Fair use', 'من حقنا نقفل الاسترجاع أو بعض طرق الدفع لو فيه إساءة استخدام متكررة.': 'We may restrict returns or payment options in cases of repeated misuse.',
    'لو سؤالك مش هنا، كلمنا على واتساب.': 'If your question is not here, message us on WhatsApp.', 'بتوصلوا فين؟': 'Where do you deliver?',
    'لكل محافظات مصر. القاهرة والجيزة خلال 3 أيام عمل، وباقي المحافظات بنأكد الميعاد على واتساب.': 'Everywhere in Egypt. Cairo and Giza within 3 working days; for other governorates we confirm the date on WhatsApp.',
    'الشحن بكام؟': 'How much is shipping?', 'حسب المحافظة، والسعر بيظهرلك في صفحة تأكيد الطلب قبل ما تأكد. التفاصيل في': 'It depends on the governorate and is shown at checkout. Details on the',
    'صفحة الشحن': 'shipping page', 'إزاي أدفع؟': 'How do I pay?', 'محتاج أعمل حساب علشان أطلب؟': 'Do I need an account?', 'لأ. بتكتب اسمك وتليفونك وعنوانك بس.': 'No. Just your name, phone and address.',
    'إيه هو التستر 3 مل؟': 'What is the 3 ml tester?', 'زجاجة صغيرة من نفس الريحة بتيجي مجاناً مع كل 50 مل، علشان تجرّب قبل ما تفتح الزجاجة الكبيرة.': 'A small bottle of the same scent, free with every 50 ml, so you can try before opening the big bottle.',
    'ينفع أرجّع العطر؟': 'Can I return a perfume?', 'أيوه خلال 14 يوم لو الزجاجة مقفولة وفي علبتها. التفاصيل في': 'Yes, within 14 days if the bottle is sealed and in its box. Details in our',
    'إزاي أعرف الريحة مناسبة ليا؟': 'How do I know a scent suits me?', 'جرّب': 'Try', '، أو كلمنا على واتساب ونساعدك.': ', or message us on WhatsApp and we will help.',
    'أسرع طريقة هي واتساب.': 'WhatsApp is the fastest way.', 'أونلاين فقط، مفيش فرع. بنوصل كل محافظات مصر.': 'Online only, no branches. We deliver all over Egypt.',
    // Titles
    'ذِكرى | عطور أونلاين بتوصيل لكل مصر': 'Zikra | Perfumes delivered all over Egypt', 'كل العطور | ذِكرى': 'All perfumes | Zikra', 'اعرف ريحتك | ذِكرى': 'Find your scent | Zikra',
    'عننا | ذِكرى': 'About | Zikra', 'الشحن والتوصيل | ذِكرى': 'Shipping | Zikra', 'الاستبدال والاسترجاع | ذِكرى': 'Returns | Zikra', 'الأسئلة الشائعة | ذِكرى': 'FAQ | Zikra',
    'تواصل معانا | ذِكرى': 'Contact | Zikra', 'السلة | ذِكرى': 'Cart | Zikra', 'تأكيد الطلب | ذِكرى': 'Checkout | Zikra', 'عطر | ذِكرى': 'Perfume | Zikra'
  };
  const GOV = { 'القاهرة': 'Cairo', 'الجيزة': 'Giza', 'الإسكندرية': 'Alexandria', 'القليوبية': 'Qalyubia', 'الشرقية': 'Sharqia', 'الدقهلية': 'Dakahlia', 'الغربية': 'Gharbia', 'المنوفية': 'Monufia', 'البحيرة': 'Beheira', 'كفر الشيخ': 'Kafr El Sheikh', 'دمياط': 'Damietta', 'بورسعيد': 'Port Said', 'الإسماعيلية': 'Ismailia', 'السويس': 'Suez', 'الفيوم': 'Fayoum', 'بني سويف': 'Beni Suef', 'المنيا': 'Minya', 'أسيوط': 'Assiut', 'سوهاج': 'Sohag', 'قنا': 'Qena', 'الأقصر': 'Luxor', 'أسوان': 'Aswan', 'البحر الأحمر': 'Red Sea', 'الوادي الجديد': 'New Valley', 'مطروح': 'Matrouh', 'شمال سيناء': 'North Sinai', 'جنوب سيناء': 'South Sinai' };
  const NOTES = { 'برجموت': 'Bergamot', 'فلفل وردي': 'Pink pepper', 'لافندر': 'Lavender', 'جلد': 'Leather', 'أرز': 'Cedar', 'مسك': 'Musk', 'ليتشي': 'Lychee', 'كمثرى': 'Pear', 'فاوانيا': 'Peony', 'مسك أبيض': 'White musk', 'فانيليا': 'Vanilla', 'زعفران': 'Saffron', 'هيل': 'Cardamom', 'عنبر': 'Amber', 'باتشولي': 'Patchouli', 'توت أحمر': 'Red berries', 'ياسمين': 'Jasmine', 'جريب فروت': 'Grapefruit', 'سوسن': 'Iris', 'فيتيفر': 'Vetiver', 'باشن فروت': 'Passion fruit', 'برتقال': 'Orange', 'قرفة': 'Cinnamon', 'كاكاو': 'Cocoa', 'تونكا': 'Tonka', 'عود': 'Oud', 'ورد': 'Rose', 'فانيلا': 'Vanilla' };
  const mapList = (s, dict, sep = '، ') => s.split(/\s*[،,]\s*/).map((x) => dict[x] || FAM[x] || x).join(sep === '، ' ? ', ' : sep);
  const FAM = { 'خشبي': 'Woody', 'فريش': 'Fresh', 'شرقي': 'Oriental', 'فواكه': 'Fruity', 'ورد': 'Floral', 'عود': 'Oud' };
  const money = (n) => `EGP ${n}`;
  const PATTERNS = [
    [/^([\d,]+) ج$/, (m) => money(m[1])],
    [/^(.+) \(شحن ([\d,]+) ج\)$/, (m) => `${GOV[m[1]] || m[1]} (shipping ${money(m[2])})`],
    [/^الشحن \((.+)\)$/, (m) => `Shipping (${GOV[m[1]] || m[1]})`],
    [/^(\d+) عطر$/, (m) => `${m[1]} perfume${m[1] === '1' ? '' : 's'}`],
    [/^(\d+) (?:عطر|عطور) · تسوّق ←$/, (m) => `${m[1]} perfume${m[1] === '1' ? '' : 's'} · Shop →`],
    [/^(\d+) مل$/, (m) => `${m[1]} ml`],
    [/^مستوحى من: (.+)\. ده مش العطر الأصلي\.$/, (m) => `Inspired by ${m[1]}. This is not the original perfume.`],
    [/^مستوحى من: (.+)$/, (m) => `Inspired by ${m[1]}`],
    [/^(\d+) مل × (\d+)$/, (m) => `${m[1]} ml × ${m[2]}`],
    [/^(\d+) مل · ([\d,]+) ج(?: · معاه تستر 3 مل)?$/, (m) => `${m[1]} ml · ${money(m[2])}${m[0].includes('تستر') ? ' · free 3 ml tester' : ''}`],
    [/^\((\d+) مل\) للسلة$/, (m) => `(${m[1]} ml) added to cart`], [/^اتضاف$/, () => ''],
    [/^أضف (.+) للسلة$/, (m) => `Add ${m[1]} to cart`],
    [/^سؤال (\d) من (\d)$/, (m) => `Question ${m[1]} of ${m[2]}`],
    [/^صورة (\d+)$/, (m) => `Photo ${m[1]}`],
    [/^(.+) ✕$/, (m) => `${tr(m[1])} ✕`],
    [/^(.+) · (.+)$/, (m) => (FAM[m[1]] ? m[0].split(' · ').map((x) => FAM[x] || x).join(' · ') : null)],
    [/^(.+) \| ذِكرى$/, (m) => `${m[1]} | Zikra`],
    [/^التوصيل لـ (.+): 3 أيام عمل\.$/, (m) => `Delivery to ${GOV[m[1]] || m[1]}: 3 working days.`],
    [/^هنأكدلك ميعاد التوصيل لـ (.+) على واتساب\.$/, (m) => `We will confirm the delivery date to ${GOV[m[1]] || m[1]} on WhatsApp.`],
    [/^التوصيل لـ: (.+) ·$/, (m) => `Deliver to: ${m[1]} ·`],
    [/^خصم (\S+) \((\d+)%\)$/, (m) => `Discount ${m[1]} (${m[2]}%)`], [/^خصم (\S+)$/, (m) => `Discount ${m[1]}`],
    [/^المتاح (\d+) بس، فعدّلنا الكمية\.$/, (m) => `Only ${m[1]} available, quantity updated.`],
    [/^(.+) - (.+) - (.+)$/, (m) => (GOV[m[1]] ? `${GOV[m[1]]} - ${m[2]} - ${m[3]}` : null)],
    [/^[^؀-ۿ]*$/, () => null]
  ];
  function tr(s) {
    if (LANG !== 'en' || !s) return s;
    if (EN[s] !== undefined) return EN[s];
    if (GOV[s]) return GOV[s];
    for (const [re, fn] of PATTERNS) { const m = s.match(re); if (m) { const r = fn(m); if (r !== null && r !== undefined) return r; } }
    if (/[،,]/.test(s) && s.split(/\s*[،,]\s*/).every((x) => NOTES[x] || FAM[x])) return mapList(s, NOTES);
    return s;
  }
  function trNode(n) {
    const raw = n.nodeValue; const t = raw.trim();
    if (!t || !/[؀-ۿ]/.test(t)) return;
    const out = tr(t);
    if (out !== t) n.nodeValue = raw.replace(t, out);
  }
  function translate(root) {
    if (LANG !== 'en' || !root) return;
    if (root.nodeType === 3) return trNode(root);
    if (root.nodeType !== 1 || root.closest?.('script,style,[data-no-i18n]')) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement && !n.parentElement.closest('script,style,[data-no-i18n]') ? 1 : 2) });
    let n; while ((n = w.nextNode())) trNode(n);
    const els = [root, ...root.querySelectorAll('[placeholder],[aria-label],[title],[alt]')];
    for (const el of els) for (const a of ['placeholder', 'aria-label', 'title', 'alt']) {
      const v = el.getAttribute && el.getAttribute(a); if (v && /[؀-ۿ]/.test(v)) el.setAttribute(a, tr(v.trim()));
    }
  }
  // Product content written in the admin: use English fields when present
  const pick = (p, field) => (LANG === 'en' && p[field + 'En'] ? p[field + 'En'] : p[field]);

  const SUN = '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON = '<svg class="icon" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';
  const themeLabel = (t) => (LANG === 'en' ? (t === 'dark' ? 'Light mode' : 'Dark mode') : (t === 'dark' ? 'الوضع الفاتح' : 'الوضع الغامق'));
  const themeBtn = (t) => `<button class="icon-btn" data-toggle-theme aria-label="${themeLabel(t)}">${t === 'dark' ? SUN : MOON}</button>`;
  function toggles() {
    return `<button class="icon-btn lang-btn" data-toggle-lang data-no-i18n aria-label="${LANG === 'en' ? 'التحويل للعربي' : 'Switch to English'}" lang="${LANG === 'en' ? 'ar' : 'en'}">${LANG === 'en' ? 'ع' : 'EN'}</button>${themeBtn(document.documentElement.dataset.theme || THEME)}`;
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-toggle-lang]')) { set('zikra_lang', LANG === 'en' ? 'ar' : 'en'); location.reload(); }
    const tb = e.target.closest('[data-toggle-theme]');
    if (tb) {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      set('zikra_theme', next); document.documentElement.dataset.theme = next;
      tb.outerHTML = themeBtn(next);
    }
  });

  if (LANG === 'en') {
    const go = () => {
      translate(document.body); document.title = tr(document.title);
      new MutationObserver((ms) => { for (const m of ms) m.addedNodes.forEach((n) => translate(n)); }).observe(document.body, { childList: true, subtree: true });
    };
    if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
  }
  window.I18N = { lang: LANG, theme: THEME, tr, pick, toggles, notes: (list) => list.map((x) => (LANG === 'en' ? NOTES[x] || x : x)) };
})();
