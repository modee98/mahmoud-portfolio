'use strict';

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const PUBLIC_DIR = path.join(__dirname, 'public');

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.json({ limit: '20kb' }));

app.use(express.static(PUBLIC_DIR, {
  etag: true,
  maxAge: '7d',
  extensions: ['html']
}));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, msg: 'محاولات كثيرة. حاول لاحقاً ⚠️' }
});

function cleanText(value, max = 500) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function requireConfig(res) {
  if (!GOOGLE_SCRIPT_URL) {
    res.status(500).json({ success: false, msg: 'إعداد GOOGLE_SCRIPT_URL غير موجود على السيرفر ⚠️' });
    return false;
  }
  return true;
}

app.post('/submit-survey', apiLimiter, async (req, res) => {
  if (!requireConfig(res)) return;

  try {
    const userName = cleanText(req.body.user_name, 80);
    const userEmail = cleanText(req.body.user_email, 120).toLowerCase();
    const favProgram = cleanText(req.body.fav_program, 60);
    const suggestion = cleanText(req.body.suggestion, 700);

    const allowedPrograms = new Set(['After Effects', 'Blender 3D', 'Adobe Illustrator', 'Premiere Pro']);

    if (!userName || !userEmail || !favProgram) {
      return res.status(400).json({ success: false, msg: 'برجاء ملء الحقول الأساسية ⚠️' });
    }

    if (!isValidEmail(userEmail)) {
      return res.status(400).json({ success: false, msg: 'صيغة البريد الإلكتروني غير صحيحة ⚠️' });
    }

    if (!allowedPrograms.has(favProgram)) {
      return res.status(400).json({ success: false, msg: 'اختيار البرنامج غير صحيح ⚠️' });
    }

    const params = new URLSearchParams({
      user_name: userName,
      user_email: userEmail,
      fav_program: favProgram,
      suggestion
    });

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const resultText = await response.text();

    if (!response.ok) {
      return res.status(502).json({ success: false, msg: 'تعذر الاتصال بخدمة Google Sheets ⚠️' });
    }

    res.json({ success: true, msg: resultText || 'تم إرسال الاستبيان بنجاح ✅' });
  } catch (error) {
    console.error('submit-survey error:', error);
    res.status(500).json({ success: false, msg: 'حدث خطأ أثناء إرسال الاستبيان ⚠️' });
  }
});

app.post('/admin-data', adminLimiter, async (req, res) => {
  if (!requireConfig(res)) return;

  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ success: false, msg: 'إعداد ADMIN_PASSWORD غير موجود على السيرفر ⚠️' });
  }

  const password = String(req.body.admin_password || '');
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, msg: 'كلمة السر خاطئة ⚠️' });
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL);
    if (!response.ok) {
      return res.status(502).json({ success: false, msg: 'تعذر جلب البيانات من Google Sheets ⚠️' });
    }

    const data = await response.json();
    const rows = Array.isArray(data) ? data.map((row) => ({
      date: cleanText(row.date, 40),
      name: cleanText(row.name, 80),
      email: cleanText(row.email, 120),
      program: cleanText(row.program, 60),
      suggestion: cleanText(row.suggestion || '-', 700)
    })) : [];

    res.json({ success: true, rows });
  } catch (error) {
    console.error('admin-data error:', error);
    res.status(500).json({ success: false, msg: 'حدث خطأ أثناء جلب البيانات ⚠️' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Mahmoud portfolio is running on port ${PORT}`);
});
