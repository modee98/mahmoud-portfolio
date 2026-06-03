const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// رابط Google Apps Script الخاص بك
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxzly8i0cjAKy44VaQgKtXwKY3XnjBTy9oMKbclE5ft-SzR2mMWoU0p_D44Mn0bqPJh/exec";

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// تشغيل الملفات الثابتة للموقع (HTML, CSS, JS)
app.use(express.static(__dirname));

// 1. استقبال بيانات الاستبيان من الموقع وإرسالها لجوجل شيت
app.post('/submit-survey', async (req, res) => {
    try {
        const { user_name, user_email, fav_program, suggestion } = req.body;

        if (!user_name || !user_email || !fav_program) {
            return res.send("برجاء ملء الحقول الأساسية (الاسم، الإيميل، واختيار البرنامج) ⚠️");
        }

        // إرسال البيانات إلى Google Sheets في الخلفية
        const params = new URLSearchParams({
            user_name,
            user_email,
            fav_program,
            suggestion
        });

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const resultText = await response.text();
        res.send(resultText);

    } catch (error) {
        console.error("Error sending to Google Sheets:", error);
        res.send("حدث خطأ أثناء إرسال الاستبيان، برجاء المحاولة مرة أخرى ⚠️");
    }
});

// 2. التحقق من كلمة السر وجلب البيانات من جوجل شيت للوحة السرية
app.post('/admin-data', async (req, res) => {
    const { admin_password } = req.body;

    // كلمة السر الخاصة بك Mahmoud2026
    if (admin_password === 'Mahmoud2026') {
        try {
            // جلب البيانات المخزنة من جوجل شيت
            const response = await fetch(GOOGLE_SCRIPT_URL);
            const data = await response.json();

            if (data && data.length > 0) {
                let htmlRows = '';
                data.forEach(row => {
                    // تحويل صيغة التاريخ لتكون مقروءة بشكل جميل
                    let formattedDate = row.date;
                    if(row.date.includes('T')) {
                        formattedDate = row.date.replace('T', ' ').split('.')[0];
                    }

                    htmlRows += `
                        <tr>
                            <td style="color: #a0a0a5; font-family: monospace;">${formattedDate}</td>
                            <td style="font-weight: 600; color: #fff;">${row.name}</td>
                            <td style="color: #00e5ff;">${row.email}</td>
                            <td><span class="badge-program">${row.program}</span></td>
                            <td style="max-width: 300px;">${row.suggestion || '-'}</td>
                        </tr>`;
                });
                res.json({ success: true, rows: htmlRows });
            } else {
                res.json({ success: true, rows: '<tr><td colspan="5" style="text-align:center; padding:30px; color:#a0a0a5;">لا توجد استبيانات مُرسلة حتى الآن يا فنان... 📥</td></tr>' });
            }
        } catch (error) {
            console.error("Error fetching from Google Sheets:", error);
            res.json({ success: false, msg: "حدث خطأ أثناء جلب البيانات من جوجل ⚠️" });
        }
    } else {
        res.json({ success: false, msg: "كلمة السر خاطئة! حاول مجدداً يا فنان ⚠️" });
    }
});

// توجيه أي مسار آخر لصفحة index.html الرئيسية
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running perfectly on port ${PORT}`);
});
