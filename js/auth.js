// auth.js — Walmart Employee Authentication Gate
// Loads after config.js (Firebase initialized). Blocks the entire UI until
// a valid @walmart.com user is confirmed by Firebase Auth.

(function () {
  'use strict';

  const ALLOWED_DOMAIN = 'walmart.com';

  // ── Helpers ───────────────────────────────────────────────────────────────

  function isWalmartEmail(email) {
    return typeof email === 'string' && email.toLowerCase().endsWith('@' + ALLOWED_DOMAIN);
  }

  function friendlyError(code) {
    const map = {
      'auth/user-not-found':        'No account found with that email.',
      'auth/wrong-password':        'Incorrect password. Try again.',
      'auth/invalid-credential':    'Incorrect email or password.',
      'auth/email-already-in-use':  'An account already exists with that email.',
      'auth/too-many-requests':     'Too many attempts. Please try again later.',
      'auth/invalid-email':         'Invalid email address.',
      'auth/weak-password':         'Password must be at least 6 characters.',
      'auth/network-request-failed':'Network error. Check your connection.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  }

  // ── Overlay UI ────────────────────────────────────────────────────────────

  function injectOverlay() {
    if (document.getElementById('auth-overlay')) return; // already mounted
    const el = document.createElement('div');
    el.id = 'auth-overlay';
    el.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9999',
      'display:flex', 'align-items:center', 'justify-content:center',
      'background:#0d1117', 'padding:16px', 'overflow-y:auto',
    ].join(';');

    el.innerHTML = `
      <div style="width:100%;max-width:420px;background:#1a2030;border:1px solid #2d3748;
                  border-radius:16px;padding:32px;box-shadow:0 25px 50px rgba(0,0,0,.5);">

        <!-- Header -->
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:48px;margin-bottom:8px;">🔨</div>
          <h1 style="color:#ffc220;font-size:20px;font-weight:700;margin:0 0 4px;">
            Cell Hardening Audit
          </h1>
          <p style="color:#6b7280;font-size:13px;margin:0;">
            Walmart Employees Only &middot; @walmart.com required
          </p>
        </div>

        <!-- Alerts -->
        <div id="auth-error"
             style="display:none;background:#450a0a;border:1px solid #7f1d1d;color:#fca5a5;
                    border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:16px;"></div>
        <div id="auth-success"
             style="display:none;background:#052e16;border:1px solid #166534;color:#86efac;
                    border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:16px;"></div>

        <!-- Sign-In Form -->
        <div id="auth-signin-form">
          ${inputHtml('auth-email',    'Walmart Email',   'email',    'yourname@walmart.com', 'email')}
          ${inputHtml('auth-password', 'Password',        'password', '••••••••',             'current-password')}
          <button id="auth-signin-btn" onclick="authSignIn()" ${btnStyle('#ffc220','#0d1117')}>
            Sign In
          </button>
          <div style="display:flex;gap:8px;justify-content:center;font-size:13px;margin-top:12px;">
            <button onclick="authShowRegister()" ${linkStyle('#ffc220')}>Create Account</button>
            <span style="color:#4b5563;">&middot;</span>
            <button onclick="authForgotPassword()" ${linkStyle('#9ca3af')}>Forgot Password?</button>
          </div>
        </div>

        <!-- Register Form -->
        <div id="auth-register-form" style="display:none;">
          ${inputHtml('auth-reg-email',    'Walmart Email',        'email',    'yourname@walmart.com', 'email')}
          ${inputHtml('auth-reg-password', 'Password (min 6)',     'password', '••••••••',             'new-password')}
          ${inputHtml('auth-reg-confirm',  'Confirm Password',     'password', '••••••••',             'new-password')}
          <button onclick="authRegister()" ${btnStyle('#ffc220','#0d1117')} style="margin-top:4px;">
            Create Account
          </button>
          <div style="text-align:center;margin-top:12px;">
            <button onclick="authShowSignIn()" ${linkStyle('#9ca3af')}>Back to Sign In</button>
          </div>
        </div>
      </div>`;

    document.body.prepend(el);
  }

  // Tiny template helpers so we're not repeating inline style walls
  function inputHtml(id, label, type, placeholder, autocomplete) {
    return `
      <div style="margin-bottom:14px;">
        <label style="display:block;font-size:12px;font-weight:600;color:#9ca3af;
                      margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;">
          ${label}
        </label>
        <input id="${id}" type="${type}" placeholder="${placeholder}"
               autocomplete="${autocomplete}"
               style="width:100%;box-sizing:border-box;background:#0d1117;border:1px solid #2d3748;
                      color:#f3f4f6;border-radius:8px;padding:10px 12px;font-size:14px;outline:none;" />
      </div>`;
  }

  function btnStyle(bg, color) {
    return `style="width:100%;background:${bg};color:${color};font-weight:700;border:none;
                   border-radius:8px;padding:12px;font-size:15px;cursor:pointer;"`;
  }

  function linkStyle(color) {
    return `style="background:none;border:none;color:${color};cursor:pointer;text-decoration:underline;"`;
  }

  function removeOverlay() {
    document.getElementById('auth-overlay')?.remove();
  }

  function showError(msg) {
    document.getElementById('auth-success')?.style && (document.getElementById('auth-success').style.display = 'none');
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  function showSuccess(msg) {
    document.getElementById('auth-error')?.style && (document.getElementById('auth-error').style.display = 'none');
    const el = document.getElementById('auth-success');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  function clearAlerts() {
    document.getElementById('auth-error')  ?.style && (document.getElementById('auth-error').style.display   = 'none');
    document.getElementById('auth-success')?.style && (document.getElementById('auth-success').style.display = 'none');
  }

  // ── Public actions (global so inline onclick="" handlers can call them) ────

  window.authShowRegister = function () {
    clearAlerts();
    document.getElementById('auth-signin-form').style.display   = 'none';
    document.getElementById('auth-register-form').style.display = 'block';
  };

  window.authShowSignIn = function () {
    clearAlerts();
    document.getElementById('auth-register-form').style.display = 'none';
    document.getElementById('auth-signin-form').style.display   = 'block';
  };

  window.authSignIn = async function () {
    const email    = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    clearAlerts();

    if (!isWalmartEmail(email)) { showError('Only @walmart.com addresses are allowed.'); return; }

    const btn = document.getElementById('auth-signin-btn');
    btn.textContent = 'Signing in…';
    btn.disabled    = true;

    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      // onAuthStateChanged handles the rest
    } catch (err) {
      btn.textContent = 'Sign In';
      btn.disabled    = false;
      showError(friendlyError(err.code));
    }
  };

  window.authRegister = async function () {
    const email   = document.getElementById('auth-reg-email').value.trim();
    const pw      = document.getElementById('auth-reg-password').value;
    const confirm = document.getElementById('auth-reg-confirm').value;
    clearAlerts();

    if (!isWalmartEmail(email))  { showError('Only @walmart.com addresses are allowed.'); return; }
    if (pw.length < 6)           { showError('Password must be at least 6 characters.'); return; }
    if (pw !== confirm)          { showError('Passwords do not match.'); return; }

    try {
      await firebase.auth().createUserWithEmailAndPassword(email, pw);
    } catch (err) {
      showError(friendlyError(err.code));
    }
  };

  window.authForgotPassword = async function () {
    const email = document.getElementById('auth-email').value.trim();
    clearAlerts();
    if (!email)                  { showError('Enter your @walmart.com email first.'); return; }
    if (!isWalmartEmail(email))  { showError('Only @walmart.com addresses are allowed.'); return; }
    try {
      await firebase.auth().sendPasswordResetEmail(email);
      showSuccess('Password reset email sent — check your inbox!');
    } catch (err) {
      showError(friendlyError(err.code));
    }
  };

  window.authSignOut = async function () {
    await firebase.auth().signOut();
    window.location.reload();
  };

  // ── Auth state listener ───────────────────────────────────────────────────

  injectOverlay(); // show gate immediately — page content is hidden beneath it

  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      injectOverlay(); // ensure gate is visible if signed out
      return;
    }

    if (!isWalmartEmail(user.email)) {
      firebase.auth().signOut();
      injectOverlay();
      showError('Only @walmart.com accounts are permitted. You have been signed out.');
      return;
    }

    // ✅ Valid Walmart employee — open the gates
    window.currentUser = user;
    removeOverlay();

    // Re-render nav now that we have user info
    const navEl = document.getElementById('nav');
    if (navEl && typeof renderNav === 'function') navEl.innerHTML = renderNav();
  });

  // Enter key submits the active form
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !document.getElementById('auth-overlay')) return;
    const isRegister = document.getElementById('auth-register-form')?.style.display !== 'none';
    isRegister ? authRegister() : authSignIn();
  });

})();
