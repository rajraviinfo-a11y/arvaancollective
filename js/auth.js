/* =============================================
   AUTH.JS — Login / Register Logic
   ============================================= */

'use strict';

const Auth = {
  // Register a new buyer
  registerBuyer({ name, email, password }) {
    const buyers = Store.getBuyers();
    if (buyers.find(u => u.email === email)) {
      return { ok: false, message: 'An account with this email already exists.' };
    }
    const user = { id: Store.genId('u'), name, email, password, avatar: '🧑', joinDate: new Date().toISOString().slice(0, 10) };
    buyers.push(user);
    Store.setBuyers(buyers);
    Store.setCurrentBuyer(user);
    return { ok: true, user };
  },

  // Login a buyer
  loginBuyer({ email, password }) {
    const buyers = Store.getBuyers();
    const user = buyers.find(u => u.email === email && u.password === password);
    if (!user) return { ok: false, message: 'Invalid email or password.' };
    Store.setCurrentBuyer(user);
    return { ok: true, user };
  },

  // Login a seller
  loginSeller({ email, password }) {
    const sellers = Store.getSellers();
    const seller = sellers.find(s => s.email === email && s.password === password);
    if (!seller) return { ok: false, message: 'Invalid seller credentials.' };
    Store.setCurrentSeller(seller);
    return { ok: true, seller };
  },

  // Register a new seller
  registerSeller({ name, email, password, shopName, phone, category, taxId, address }) {
    const sellers = Store.getSellers();
    if (sellers.find(s => s.email === email)) {
      return { ok: false, message: 'A seller account with this email already exists.' };
    }
    const seller = {
      id: Store.genId('seller'),
      name,
      email,
      password,
      shopName,
      phone,
      category,
      taxId,
      address,
      avatar: '🏪',
      rating: 0,
      totalSales: 0,
      joinDate: new Date().toISOString().slice(0, 10),
      social: { x: '', ig: '' }
    };
    sellers.push(seller);
    Store.setSellers(sellers);
    return { ok: true, seller };
  },

  // Logout
  logoutBuyer() { Store.clearCurrentBuyer(); },
  logoutSeller() { Store.clearCurrentSeller(); },

  // Get current session
  getBuyer() { return Store.getCurrentBuyer(); },
  getSeller() { return Store.getCurrentSeller(); },
  isLoggedInBuyer() { return !!Store.getCurrentBuyer(); },
  isLoggedInSeller() { return !!Store.getCurrentSeller(); },

  // Update buyer profile
  updateBuyer(updates) {
    const current = Store.getCurrentBuyer();
    if (!current) return;
    const buyers = Store.getBuyers();
    const idx = buyers.findIndex(u => u.id === current.id);
    if (idx === -1) return;
    const updated = { ...current, ...updates };
    buyers[idx] = updated;
    Store.setBuyers(buyers);
    Store.setCurrentBuyer(updated);
    return updated;
  }
};

// ── Auth UI (Store-side modals) ─────────────────────────────────────────────────
Auth.initListeners = function() {
  // Tabs
  const buttons = document.querySelectorAll('.auth-tab-btn');
  const panels = document.querySelectorAll('.auth-tab-panel');
  
  buttons.forEach(el => {
    el.addEventListener('click', () => {
      const target = el.dataset.authSwitch;
      if (!target) return;
      
      panels.forEach(p => p.classList.remove('active'));
      buttons.forEach(b => b.classList.remove('active'));
      
      const targetPanel = document.getElementById(`auth-${target}`);
      if (targetPanel) targetPanel.classList.add('active');
      el.classList.add('active');
    });
  });

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      clearErrors(loginForm);
      const email = loginForm.querySelector('#login-email').value.trim();
      const password = loginForm.querySelector('#login-password').value;
      if (!email || !password) { showFormError(loginForm, '#login-email', 'Please fill all fields.'); return; }
      const result = Auth.loginBuyer({ email, password });
      if (result.ok) {
        closeModal('auth-modal');
        updateAuthUI();
        showToast('Welcome back!', `Hello, ${result.user.name.split(' ')[0]} 👋`, 'success');
        loginForm.reset();
        // If user was trying to checkout, redirect there; otherwise stay on page
        const pendingCheckout = sessionStorage.getItem('arvaan_checkout_intent');
        if (pendingCheckout) {
          sessionStorage.removeItem('arvaan_checkout_intent');
          setTimeout(() => { window.location.href = 'checkout.html'; }, 500);
        }
      } else {
        showFormError(loginForm, '#login-email', result.message);
      }
    };
  }


  // Register form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.onsubmit = (e) => {
      e.preventDefault();
      clearErrors(registerForm);
      const name = registerForm.querySelector('#reg-name').value.trim();
      const email = registerForm.querySelector('#reg-email').value.trim();
      const password = registerForm.querySelector('#reg-password').value;
      const confirm = registerForm.querySelector('#reg-confirm').value;

      if (!name || !email || !password) { showFormError(registerForm, '#reg-name', 'All fields required.'); return; }
      if (password !== confirm) { showFormError(registerForm, '#reg-confirm', 'Passwords do not match.'); return; }

      const result = Auth.registerBuyer({ name, email, password });
      if (result.ok) {
        closeModal('auth-modal');
        updateAuthUI();
        showToast('Account Created!', `Welcome to Arvaan, ${name.split(' ')[0]} ✨`, 'success');
        registerForm.reset();
      } else {
        showFormError(registerForm, '#reg-email', result.message);
      }
    };
  }
};

function showFormError(form, selector, msg) {
  const field = form.querySelector(selector);
  if (field) {
    field.classList.add('error');
    let err = field.parentElement.querySelector('.form-error');
    if (!err) { err = document.createElement('div'); err.className = 'form-error'; field.parentElement.appendChild(err); }
    err.textContent = msg;
  }
}

function clearErrors(form) {
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  form.querySelectorAll('.form-error').forEach(el => el.remove());
}

function updateAuthUI() {
  const user = Auth.getBuyer();
  const loginBtn = document.getElementById('nav-login-btn');
  const userMenu = document.getElementById('nav-user-menu');
  const navName = document.getElementById('nav-user-name');
  const navEmail = document.getElementById('nav-user-email');
  const navAvatar = document.getElementById('nav-avatar-initials');

  if (user) {
    if (loginBtn) loginBtn.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
    if (navName) navName.textContent = user.name;
    if (navEmail) navEmail.textContent = user.email;
    if (navAvatar) navAvatar.textContent = user.name.charAt(0).toUpperCase();
  } else {
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
  }
}

// Expose to window for global access
window.Auth = Auth;
window.updateAuthUI = updateAuthUI;
