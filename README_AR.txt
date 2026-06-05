طريقة التشغيل:
1) افتح المجلد في PowerShell أو Terminal.
2) نفّذ: npm install
3) جهّز متغيرات البيئة:
   GOOGLE_SCRIPT_URL=رابط Google Apps Script
   ADMIN_PASSWORD=كلمة سر قوية
4) شغّل الموقع: npm start
5) افتح: http://localhost:3000

مهم:
- ضع ملف الفيديو smart-cities.mp4 داخل public إذا أردت تشغيل المعرض.
- ضع صورة poster.jpg داخل public لتظهر قبل تشغيل الفيديو، أو احذف poster من وسم الفيديو.
- رابط لوحة الإدارة: /?show_me_the_magic=true

أهم التحسينات:
- فصل CSS و JavaScript عن HTML.
- إيقاف تحميل الفيديو تلقائياً على الجوال: preload="metadata" بدل auto وإزالة autoplay.
- حماية أفضل للسيرفر عبر helmet و compression و rate limiting.
- نقل كلمة سر الإدارة ورابط Google Script إلى متغيرات البيئة بدلاً من كتابتها في الكود.
- إرسال واستقبال JSON بدل HTML جاهز لتقليل مخاطر XSS.
- تحسين الموبايل: تخفيف blur والظلال، شبكة مرنة، ومساحات أصغر.
