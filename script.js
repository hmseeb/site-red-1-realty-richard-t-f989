/* Richard Tebbe, Realtor — Red 1 Realty. Progressive enhancement only:
   the page and the contact form work fully without this file. */
(function () {
  'use strict';

  var FORM_ENDPOINT = 'https://vision.leadrai.com/api/forms/3665deaa1968efdaea929b2ebe76c9ec';

  /* ---- current year in footer ---- */
  var yearEl = document.getElementById('year');
  if (yearEl) { yearEl.textContent = String(new Date().getFullYear()); }

  /* ---- hidden _page field = current URL (so visitors return here) ---- */
  var pageField = document.getElementById('form-page');
  if (pageField) { pageField.value = window.location.href; }

  /* ---- keep the sticky call bar from covering page content ---- */
  var callBar = document.querySelector('.call-bar');
  function padForCallBar() {
    if (!callBar) { return; }
    var visible = window.getComputedStyle(callBar).display !== 'none';
    document.body.style.paddingBottom = visible ? (callBar.offsetHeight + 8) + 'px' : '';
  }
  padForCallBar();
  window.addEventListener('resize', padForCallBar);
  window.addEventListener('orientationchange', padForCallBar);
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(padForCallBar).catch(function () {});
  }

  /* ---- confirmation ---- */
  var form = document.getElementById('contact-form');
  var success = document.getElementById('form-success');
  var errorBox = document.getElementById('form-error');
  var submitBtn = document.getElementById('form-submit');

  function showSuccess(scroll) {
    if (!success) { return; }
    success.hidden = false;
    if (form) { form.hidden = true; }
    if (scroll) {
      try { success.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      catch (e) { success.scrollIntoView(); }
    }
  }

  function showError(msg) {
    if (!errorBox) { return; }
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }

  function clearError() {
    if (errorBox) { errorBox.hidden = true; errorBox.textContent = ''; }
  }

  /* Plain HTML submission returns here with ?submitted=1 */
  try {
    if (new URLSearchParams(window.location.search).get('submitted') === '1') {
      showSuccess(true);
    }
  } catch (e) { /* older browsers: plain form flow still shows the server response */ }

  /* ---- fetch submission (same endpoint, same fields) ---- */
  if (form && window.fetch) {
    form.addEventListener('submit', function (ev) {
      clearError();

      var name = form.elements['name'];
      var phone = form.elements['phone'];
      var email = form.elements['email'];
      var invalid = null;

      [name, phone, email].forEach(function (el) { if (el) { el.removeAttribute('aria-invalid'); } });

      if (name && !name.value.trim()) { invalid = name; }
      else if (phone && !phone.value.trim()) { invalid = phone; }
      else if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { invalid = email; }

      if (invalid) {
        ev.preventDefault();
        invalid.setAttribute('aria-invalid', 'true');
        showError('Please add your name and a phone number so Rick can call you back.');
        invalid.focus();
        return;
      }

      // Honeypot filled in => silently stop (bot).
      var gotcha = form.elements['_gotcha'];
      if (gotcha && gotcha.value) { ev.preventDefault(); return; }

      ev.preventDefault();

      if (pageField) { pageField.value = window.location.href; }

      var payload = {};
      new FormData(form).forEach(function (value, key) { payload[key] = value; });
      payload._page = window.location.href;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.label = submitBtn.textContent;
        submitBtn.textContent = 'Sending…';
      }

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) { throw new Error('Request failed'); }
          return res.json().catch(function () { return { ok: true }; });
        })
        .then(function (data) {
          if (data && data.ok === false) { throw new Error('Rejected'); }
          showSuccess(true);
        })
        .catch(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            if (submitBtn.dataset.label) { submitBtn.textContent = submitBtn.dataset.label; }
          }
          showError('Sorry — that did not go through. Please call (937) 474-5334 and Rick will help you directly.');
        });
    });
  }
})();
