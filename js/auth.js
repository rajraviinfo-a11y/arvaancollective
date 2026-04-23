/* =============================================
   AUTH.JS — Arvaan Collective (Firebase Auth)
   Buyer login/register via Firebase Authentication
   Profiles stored in Firestore users/{uid}
   ============================================= */
'use strict';

const Auth = {

  // ── Register a new buyer (Firebase Auth + Firestore profile) ───────────────
  async registerBuyer({ name, email, password }) {
    // Firebase Auth available?
    if (typeof firebase !== 'undefined' && firebase.auth) {
      try {
        const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const uid  = cred.user.uid;
        const profile = {
          id: uid, name, email,
          avatar: '🧑',
          joinDate: new Date().toISOString().slice(0, 10),
          points: 0, tier: 'Silver'
        };
        // Save profile to Firestore (no password stored)
        if (window.CloudDB) await CloudDB.saveUserProfile(uid, profile);
        // Also cache locally
        Store.setCurrentBuyer({ ...profile });
        return { ok: true, user: profile };
      } catch (err) {
        const msg = err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : err.message;
        return { ok: false, message: msg };
      }
    }

    // Fallback: localStorage only (when Firebase not configured)
    const buyers = Store.getBuyers();
    if (buyers.find(u => u.email === email)) {
      return { ok: false, message: 'An account with this email already exists.' };
    }
    const user = {
      id: Store.genId('u'), name, email, password,
      avatar: '🧑', joinDate: new Date().toISOString().slice(0, 10)
    };
    buyers.push(user);
    Store.setBuyers(buyers);
    Store.setCurrentBuyer(user);
    return { ok: true, user };
  },

  // ── Login a buyer (Firebase Auth) ─────────────────────────────────────────
  async loginBuyer({ email, password }) {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      try {
        const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
        const uid  = cred.user.uid;
        // Load Firestore profile
        let profile = null;
        if (window.CloudDB) profile = await CloudDB.getUserProfile(uid);
        if (!profile) profile = { id: uid, name: cred.user.displayName || email.split('@')[0], email };
        Store.setCurrentBuyer(profile);
        // Pull cart & wishlist from Firestore
        if (window.CloudDB) {
          await CloudDB.pullCart(uid);
          await CloudDB.pullWishlist(uid);
        }
        return { ok: true, user: profile };
      } catch (err) {
        return { ok: false, message: 'Invalid email or password.' };
      }
    }

    // Fallback: localStorage
    const buyers = Store.getBuyers();
    const user = buyers.find(u => u.email === email && u.password === password);
    if (!user) return { ok: false, message: 'Invalid email or password.' };
    Store.setCurrentBuyer(user);
    return { ok: true, user };
  },

  // ── Login a seller (localStorage — sellers stay in localStorage for MVP) ───
  loginSeller({ email, password }) {
    const sellers = Store.getSellers();
    const seller  = sellers.find(s => s.email === email && s.password === password);
    if (!seller) return { ok: false, message: 'Invalid seller credentials.' };
    Store.setCurrentSeller(seller);
    return { ok: true, seller };
  },

  // ── Register a new seller ──────────────────────────────────────────────────
  registerSeller({ name, email, password, shopName, phone, category, taxId, address }) {
    const sellers = Store.getSellers();
    if (sellers.find(s => s.email === email)) {
      return { ok: false, message: 'A seller account with this email already exists.' };
    }
    const seller = {
      id: Store.genId('seller'), name, email, password,
      shopName, phone, category, taxId, address,
      avatar: '🏪', rating: 0, totalSales: 0,
      joinDate: new Date().toISOString().slice(0, 10),
      social: { x: '', ig: '' }
    };
    sellers.push(seller);
    Store.setSellers(sellers);
    return { ok: true, seller };
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  async logoutBuyer() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      try { await firebase.auth().signOut(); } catch(e) {}
    }
    Store.clearCurrentBuyer();
  },

  logoutSeller() { Store.clearCurrentSeller(); },

  // ── Session getters ───────────────────────────────────────────────────────
  getBuyer()         { return Store.getCurrentBuyer(); },
  getSeller()        { return Store.getCurrentSeller(); },
  isLoggedInBuyer()  { return !!Store.getCurrentBuyer(); },
  isLoggedInSeller() { return !!Store.getCurrentSeller(); },

  // ── Update buyer profile ──────────────────────────────────────────────────
  async updateBuyer(updates) {
    const current = Store.getCurrentBuyer();
    if (!current) return;
    const updated = { ...current, ...updates };
    Store.setCurrentBuyer(updated);
    // Sync buyers array (for localStorage fallback)
    const buyers = Store.getBuyers();
    const idx    = buyers.findIndex(u => u.id === current.id || u.email === current.email);
    if (idx !== -1) { buyers[idx] = updated; Store.setBuyers(buyers); }
    // Sync to Firestore
    if (window.CloudDB && current.id) {
      await CloudDB.saveUserProfile(current.id, updated);
    }
    return updated;
  },

  // ── Listen to Firebase Auth state changes ────────────────────────────────
  // Called once on page load to restore session from Firebase
  listenAuthState() {
    if (typeof firebase === 'undefined' || !firebase.auth) return;
    firebase.auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in — ensure local session is populated
        const localUser = Store.getCurrentBuyer();
        if (!localUser || localUser.id !== firebaseUser.uid) {
          let profile = null;
          if (window.CloudDB) profile = await CloudDB.getUserProfile(firebaseUser.uid);
          if (!profile) profile = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            email: firebaseUser.email
          };
          Store.setCurrentBuyer(profile);
        }
      } else {
        // Not signed in via Firebase — clear local session too
        Store.clearCurrentBuyer();
      }
      // Update UI if updateAuthUI is defined
      if (typeof updateAuthUI === 'function') updateAuthUI();
    });
  }
};

// ── Auth UI (Store-side modals) ──────────────────────────────────────────────
Auth.initListeners = function() {
  // Tabs
  const buttons = document.querySelectorAll('.auth-tab-btn');
  const panels  = document.querySelectorAll('.auth-tab-panel');
  buttons.forEach(el => {
    el.addEventListener('click', () => {
      const target = el.dataset.authSwitch;
      if (!target) return;
      panels.forEach(p  => p.classList.remove('active'));
      buttons.forEach(b => b.classList.remove('active'));
      const targetPanel = document.getElementById(`auth-${target}`);
      if (targetPanel) targetPanel.classList.add('active');
      el.classList.add('active');
    });
  });

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      clearErrors(loginForm);
      const email    = loginForm.querySelector('#login-email').value.trim();
      const password = loginForm.querySelector('#login-password').value;
      if (!email || !password) { showFormError(loginForm, '#login-email', 'Please fill all fields.'); return; }

      const btn = loginForm.querySelector('button[type=submit]');
      if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }

      const result = await Auth.loginBuyer({ email, password });

      if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }

      if (result.ok) {
        if (typeof closeModal === 'function') closeModal('auth-modal');
        updateAuthUI();
        if (typeof showToast === 'function') showToast('Welcome back!', `Hello, ${result.user.name.split(' ')[0]} 👋`, 'success');
        loginForm.reset();
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
    registerForm.onsubmit = async (e) => {
      e.preventDefault();
      clearErrors(registerForm);
      const name     = registerForm.querySelector('#reg-name').value.trim();
      const email    = registerForm.querySelector('#reg-email').value.trim();
      const password = registerForm.querySelector('#reg-password').value;
      const confirm  = registerForm.querySelector('#reg-confirm').value;

      if (!name || !email || !password) { showFormError(registerForm, '#reg-name', 'All fields required.'); return; }
      if (password !== confirm) { showFormError(registerForm, '#reg-confirm', 'Passwords do not match.'); return; }

      const btn = registerForm.querySelector('button[type=submit]');
      if (btn) { btn.disabled = true; btn.textContent = 'Creating account…'; }

      const result = await Auth.registerBuyer({ name, email, password });

      if (btn) { btn.disabled = false; btn.textContent = 'Create Account'; }

      if (result.ok) {
        if (typeof closeModal === 'function') closeModal('auth-modal');
        updateAuthUI();
        if (typeof showToast === 'function') showToast('Account Created!', `Welcome to Arvaan, ${name.split(' ')[0]} ✨`, 'success');
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
  form.querySelectorAll('.error').forEach(el  => el.classList.remove('error'));
  form.querySelectorAll('.form-error').forEach(el => el.remove());
}

function updateAuthUI() {
  const user      = Auth.getBuyer();
  const loginBtn  = document.getElementById('nav-login-btn');
  const userMenu  = document.getElementById('nav-user-menu');
  const navName   = document.getElementById('nav-user-name');
  const navEmail  = document.getElementById('nav-user-email');
  const navAvatar = document.getElementById('nav-avatar-initials');

  if (user) {
    if (loginBtn)  loginBtn.classList.add('hidden');
    if (userMenu)  userMenu.classList.remove('hidden');
    if (navName)   navName.textContent  = user.name;
    if (navEmail)  navEmail.textContent = user.email;
    if (navAvatar) navAvatar.textContent = (user.name || 'U').charAt(0).toUpperCase();
  } else {
    if (loginBtn)  loginBtn.classList.remove('hidden');
    if (userMenu)  userMenu.classList.add('hidden');
  }
}

// Expose globally
window.Auth         = Auth;
window.updateAuthUI = updateAuthUI;

// Auto-listen to Firebase auth state on page load
document.addEventListener('DOMContentLoaded', () => {
  Auth.listenAuthState();
});
