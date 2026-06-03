const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// تفعيل قراءة البيانات القادمة من الفورم (POST)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// تشغيل الملفات الساكنة (التصاميم، الفيديوهات، الصور) من نفس المجلد
app.use(express.static(__dirname));

// === 1. استقبال بيانات الاستبيان وحفظها مرتبة من الأحدث للأقدم ===
app.post('/submit-survey', (req, res) => {
    const { user_name, user_email, fav_program, suggestion } = req.body;
    
    if (!user_name || !user_email || !fav_program) {
        return res.send("برجاء ملء الحقول الأساسية (الاسم، الإيميل، واختيار البرنامج) ⚠️");
    }

    const date = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // تنسيق السطر المراد حفظه
    let dataLine = `التاريخ: ${date} | الاسم: ${user_name} | الإيميل: ${user_email} | البرنامج المفضل: ${fav_program} | الاقتراح: ${suggestion || '-'}\n`;
    dataLine += "---------------------------------------------------------------------------------\n";

    const filePath = path.join(__dirname, 'responses.txt');

    // جلب المحتوى القديم ودمج السطر الجديد فوقه
    let oldData = '';
    if (fs.existsSync(filePath)) {
        oldData = fs.readFileSync(filePath, 'utf8');
    }

    const combinedData = dataLine + oldData;
    fs.writeFileSync(filePath, combinedData, 'utf8');

    res.send("تم إرسال استبيانك بنجاح وشكراً لوقتك يا مبدع! ✨🚀");
});

// === 2. معالجة كلمة السر وعرض لوحة البيانات في جدول ===
app.post('/admin-data', (req, res) => {
    const { admin_password } = req.body;

    // كلمة السر الخاصة بك
    if (admin_password !== 'Mahmoud2026') {
        return res.send({ success: false, msg: "كلمة السر خاطئة! حاول مجدداً يا فنان ⚠️" });
    }

    const filePath = path.join(__dirname, 'responses.txt');
    let tableRows = '';

    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split('\n');

        lines.forEach(line => {
            if (!line.trim() || line.includes('---')) return;

            const parts = line.split('|');
            if (parts.length >= 3) {
                const date = parts[0].replace('التاريخ:', '').trim();
                const name = parts[1].replace('الاسم:', '').trim();
                const email = parts[2].replace('الإيميل:', '').trim();
                const program = parts[3] ? parts[3].replace('البرنامج المفضل:', '').trim() : '-';
                const sgg = parts[4] ? parts[4].replace('الاقتراح:', '').trim() : '-';

                tableRows += `
                    <tr>
                        <td style="color: #a0a0a5; font-family: monospace;">${date}</td>
                        <td style="font-weight: 600; color: #fff;">${name}</td>
                        <td style="color: #00e5ff;">${email}</td>
                        <td><span class="badge-program">${program}</span></td>
                        <td style="max-width: 300px;">${sgg}</td>
                    </tr>`;
            }
        });
    }

    res.send({ success: true, rows: tableRows });
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`Server is running`);
});
