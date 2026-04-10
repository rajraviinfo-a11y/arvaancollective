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
      const taxId = document.getElementById('reg-seller-taxid').value.trim();
      const address = document.getElementById('reg-seller-address').value.trim();

      // Basic Validation
      if (!shopName || !ownerName || !email || !password || !phone || !category || !taxId || !address) {
        return showToast('Details Required', 'Please fill all mandatory fields to continue.', 'warning');
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
        taxId,
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
