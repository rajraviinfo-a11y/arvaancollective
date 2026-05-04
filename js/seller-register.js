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

      // Final Validation
      if (!shopName || !ownerName || !email || !password || !phone || !category || !gstNumber || !panNumber || !address) {
        return showToast('Details Required', 'Please ensure all steps are complete.', 'warning');
      }

      if (password !== confirm) return showToast('Password Mismatch', 'Confirmation password does not match.', 'error');

      // Call Auth registration
      const result = Auth.registerSeller({
        name: ownerName, email, password, shopName, phone, category, gstNumber, panNumber, address
      });

      if (result.ok) {
        showToast('Application Successful', `Welcome, ${shopName}! Redirecting to Dashboard...`, 'success');
        setTimeout(() => { window.location.href = 'seller-dashboard.html'; }, 2000);
      } else {
        showToast('Registration Error', result.message, 'error');
      }
    });
  }
});

function nextStep(step) {
  // Validation for current step
  if (step === 2) {
    const shop = document.getElementById('reg-shop-name').value;
    const owner = document.getElementById('reg-owner-name').value;
    const cat = document.getElementById('reg-seller-category').value;
    if (!shop || !owner || !cat) return showToast('Step 1 Incomplete', 'Please fill all brand details.', 'warning');
  }
  if (step === 3) {
    const email = document.getElementById('reg-seller-email').value;
    const pwd = document.getElementById('reg-seller-password').value;
    const conf = document.getElementById('reg-confirm-password').value;
    if (!email || !pwd || !conf) return showToast('Step 2 Incomplete', 'Please set your login credentials.', 'warning');
    if (pwd.length < 8) return showToast('Weak Password', 'Password must be at least 8 characters.', 'warning');
    if (pwd !== conf) return showToast('Mismatch', 'Passwords do not match.', 'error');
  }

  // Update UI
  document.querySelectorAll('.step-pane').forEach(el => el.style.display = 'none');
  document.getElementById(`step-${step}`).style.display = 'block';

  // Update dots
  document.querySelectorAll('.step-dot').forEach((dot, idx) => {
    if (idx + 1 < step) {
      dot.style.background = 'var(--clr-success, #00D4AA)';
    } else if (idx + 1 === step) {
      dot.style.background = 'var(--clr-primary)';
    } else {
      dot.style.background = 'rgba(255,255,255,0.1)';
    }
  });

  // Update description
  const descs = [
    'Tell us about your brand and start selling today.',
    'Set up your secure access credentials.',
    'Final verification steps for business compliance.'
  ];
  document.getElementById('step-desc').textContent = descs[step-1];
}

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
