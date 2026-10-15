(function () {
  // Header: transparent over hero, solid after scrolling
  var header = document.querySelector('.site-header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 40 || document.body.classList.contains('solid-header')); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hero: text drifts down slowly and fades late, so it stays readable while scrolling
  var hero = document.querySelector('.hero');
  var heroInner = hero && hero.querySelector('.hero-inner');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroInner && !still) {
    var ticking = false;
    function heroScroll() {
      ticking = false;
      var h = hero.offsetHeight, y = Math.min(window.scrollY, h);
      var fade = Math.min(1, Math.max(0, (y - h * 0.45) / (h * 0.5)));
      heroInner.style.transform = 'translate3d(0,' + (y * 0.5).toFixed(1) + 'px,0)';
      heroInner.style.opacity = (1 - fade).toFixed(3);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(heroScroll); }
    }, { passive: true });
    heroScroll();
  }

  // Mobile menu
  var toggle = document.getElementById('menuToggle');
  var links = document.getElementById('navLinks');
  function setMenu(open) {
    links.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', function () { setMenu(!links.classList.contains('open')); });
  links.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  // Reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // FAQ flip cards
  document.querySelectorAll('.flip-inner').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.flip');
      var open = card.classList.toggle('flipped');
      btn.setAttribute('aria-expanded', open);
    });
  });

  // Membership buttons pre-select the membership in the form
  var membershipSelect = document.getElementById('membership');
  document.querySelectorAll('[data-interest]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      membershipSelect.value = btn.getAttribute('data-interest');
      if (btn.getAttribute('data-interest') === 'Family Add-On') {
        document.querySelector('input[name="Inquiry Type"][value^="Add"]').checked = true;
        updateSubject();
      }
    });
  });

  // Form
  var form = document.getElementById('contactForm');
  var subject = document.getElementById('formSubject');
  var status = document.getElementById('formStatus');
  var submitBtn = document.getElementById('submitBtn');

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  if (!form) return; // legal pages have no form

  function updateSubject() {
    var addMember = form.querySelector('input[name="Inquiry Type"]:checked').value.indexOf('Add') === 0;
    subject.value = addMember
      ? 'Add Family Member Request — Level Health New York'
      : 'New Private Consultation Request — Level Health New York';
  }
  form.querySelectorAll('input[name="Inquiry Type"]').forEach(function (r) { r.addEventListener('change', updateSubject); });

  function validate() {
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (el) {
      var field = el.closest('.field') || el.closest('.check');
      var valid = el.type === 'checkbox' ? el.checked : el.checkValidity() && el.value.trim() !== '';
      if (field) field.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'form-status';
    if (!validate()) {
      status.textContent = 'Please complete the required fields, including NYC residency confirmation.';
      status.classList.add('error');
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok || String(res.data.success) === 'false') throw new Error(res.data.message || 'Submission failed');
        document.getElementById('formWrap').innerHTML =
          '<div class="form-success"><p class="eyebrow">Request Received</p><h3>Thank you.</h3>' +
          '<p>Our care team will be in touch shortly — typically within a few hours — to arrange your private Discovery Call.</p></div>';
      })
      .catch(function () {
        status.textContent = 'Something went wrong. Please email support@levelhealth.io directly.';
        status.classList.add('error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request Private Consultation';
      });
  });

})();
