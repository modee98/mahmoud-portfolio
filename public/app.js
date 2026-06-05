'use strict';

const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-links a');
const statusMsg = document.getElementById('survey-status-msg');
const surveyForm = document.getElementById('surveyForm');
const submitBtn = document.getElementById('submitBtn');

const isSecretAdminPage = window.location.search.includes("show_me_the_magic=true");

if (isSecretAdminPage) {
  document.documentElement.classList.add("admin-mode");
  document.body.classList.add("admin-mode");
}

function switchPage(pageId) {
  if (!window.location.search.includes("show_me_the_magic=true")) {
  document.documentElement.classList.remove("admin-mode");
  document.body.classList.remove("admin-mode");
}
  pages.forEach((page) => page.classList.remove('active'));
  navLinks.forEach((link) => link.classList.remove('active'));

  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) targetPage.classList.add('active');

  const targetLink = document.getElementById(`link-${pageId}`);
  if (targetLink) targetLink.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'instant' });
}

document.addEventListener('click', (event) => {
  const pageButton = event.target.closest('[data-page]');
  if (!pageButton) return;
  event.preventDefault();
  const pageId = pageButton.getAttribute('data-page');
  if (pageId) {
    history.replaceState(null, '', `#${pageId}`);
    switchPage(pageId);
  }
});

function setStatus(message, isError = false) {
  if (!statusMsg) return;
  statusMsg.textContent = message;
  statusMsg.classList.toggle('error', isError);
  statusMsg.style.display = 'block';
}

if (surveyForm) {
  surveyForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitBtn.textContent = 'جاري الإرسال... ⏳';
    submitBtn.disabled = true;

    try {
      const response = await fetch('/submit-survey', {
        method: 'POST',
        body: new URLSearchParams(new FormData(surveyForm))
      });
      const data = await response.json();
      setStatus(data.msg || 'تمت العملية.', !data.success);
      if (data.success) surveyForm.reset();
    } catch (error) {
      setStatus('حدث خطأ في الاتصال بالسيرفر ⚠️', true);
    } finally {
      submitBtn.textContent = 'إرسال الاستبيان الآن 🚀';
      submitBtn.disabled = false;
    }
  });
}

function formatDate(value) {
  if (!value) return '-';
  return String(value).replace('T', ' ').split('.')[0];
}

function appendCell(row, text, className = '') {
  const cell = document.createElement('td');
  if (className) cell.className = className;
  cell.textContent = text || '-';
  row.appendChild(cell);
}

function renderRows(rows) {
  const tableBody = document.getElementById('tableBody');
  tableBody.innerHTML = '';

  if (!rows || rows.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'لا توجد استبيانات حالياً.';
    cell.style.textAlign = 'center';
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  rows.forEach((item) => {
    const row = document.createElement('tr');
    appendCell(row, formatDate(item.date));
    appendCell(row, item.name);
    appendCell(row, item.email);

    const programCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge-program';
    badge.textContent = item.program || '-';
    programCell.appendChild(badge);
    row.appendChild(programCell);

    appendCell(row, item.suggestion || '-');
    tableBody.appendChild(row);
  });
}

function showAdminLogin() {
  document.documentElement.classList.add("admin-mode");
  document.body.classList.add("admin-mode");
  const template = document.getElementById('adminTemplate');
  const homePage = document.getElementById('page-home');
  homePage.innerHTML = '';
  homePage.appendChild(template.content.cloneNode(true));
  switchPage('home');

  const form = document.getElementById('adminForm');
  const errorDiv = document.getElementById('adminError');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorDiv.style.display = 'none';

    try {
      const response = await fetch('/admin-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_password: document.getElementById('adminPass').value })
      });
      const data = await response.json();

      if (data.success) {
        document.getElementById('adminBox').hidden = true;
        document.getElementById('adminTableContainer').hidden = false;
        renderRows(data.rows);
      } else {
        errorDiv.textContent = data.msg || 'حدث خطأ.';
        errorDiv.style.display = 'block';
      }
    } catch (error) {
      errorDiv.textContent = 'حدث خطأ في الاتصال بالسيرفر ⚠️';
      errorDiv.style.display = 'block';
    }
  });
}

const initialHash = window.location.hash.replace('#', '');
if (initialHash && document.getElementById(`page-${initialHash}`)) switchPage(initialHash);

if (new URLSearchParams(window.location.search).get('show_me_the_magic') === 'true') {
  showAdminLogin();
}
