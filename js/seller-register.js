/* =============================================
   SELLER-REGISTER.JS — Standalone Registration
   ============================================= */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('seller-register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const shopName = document.getElementById('reg-shop-name').value.trim();
      const ownerName = document.getElementById('reg-owner-name').value.trim();
      const email = document.getElementById('reg-seller-email').value.trim();
      const password = document.getElementById('reg-seller-password').value;
      const confirm = document.getElementById('reg-confirm-password').value;
      const phone = document.getElementById('reg-seller-phone').value.trim();
      const category = document.getElementById('reg-seller-category').value;
      const gstNumber = document.getElementById('reg-seller-gst').value.trim().toUpperCase();
      const panNumber = document.getElementById('reg-seller-pan').value.trim().toUpperCase();
      const address = document.getElementById('reg-seller-address').value.trim();

      // Basic Validation
      if (!shopName || !ownerName || !email || !password || !phone || !category || !gstNumber || !panNumber || !address) {
        return showToast('Details Required', 'Please fill all mandatory fields to continue.', 'warning');
      }

      // GST Validation (India)
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstNumber)) {
        return showToast('Invalid GSTIN', 'Please enter a valid 15-digit GST number (e.g. 29ABCDE1234F1Z5).', 'error');
      }

      // PAN Validation (India)
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(panNumber)) {
        return showToast('Invalid PAN', 'Please enter a valid 10-digit PAN number (e.g. ABCDE1234F).', 'error');
      }

      if (password !== confirm) {
        return showToast('Password Mismatch', 'Confirmation password does not match.', 'error');
      }

      if (password.length < 8) {
        return showToast('Security Alert', 'Password must be at least 8 characters for vendor security.', 'warning');
      }

      // Call Auth registration
      const result = Auth.registerSeller({
        name: ownerName,
        email,
        password,
        shopName,
        phone,
        category,
        gstNumber,
        panNumber,
        address
      });

      if (result.ok) {
        showToast('Application Successful', `Welcome, ${shopName}! Redirecting to your dashboard...`, 'success');
        setTimeout(() => {
          window.location.href = 'seller.html';
        }, 2000);
      } else {
        showToast('Registration Error', result.message, 'error');
      }
    });
  }
});

// Toast Helper (Local Copy or global)
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}
