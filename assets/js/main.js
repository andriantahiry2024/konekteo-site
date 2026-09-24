/* ==========================================================================
   Konekteo — interactions (aucune dépendance, aucun appel réseau)
   Chaque module est autonome : si un élément manque, les autres continuent.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------------------------------------------------------------- 1. Préchargeur */
  var Preloader = (function () {
    var el = $('#preloader');
    if (!el || reduceMotion) { if (el) el.classList.add('is-gone'); return { ready: true }; }

    var countEl = $('#preloaderCount');
    var barEl   = $('#preloaderBar');
    var done    = false;
    var start   = performance.now();
    var DURATION = 1150;

    body.classList.add('is-locked');

    function finish() {
      if (done) return;
      done = true;
      if (countEl) countEl.textContent = '100';
      if (barEl) barEl.style.width = '100%';
      el.classList.add('is-done');
      body.classList.remove('is-locked');
      root.classList.add('is-ready');
      window.setTimeout(function () { el.classList.add('is-gone'); }, 1100);
      document.dispatchEvent(new CustomEvent('konekteo:ready'));
    }

    function tick(now) {
      if (done) return;
      var p = Math.min(1, (now - start) / DURATION);
      var eased = 1 - Math.pow(1 - p, 3);
      var value = Math.round(eased * 100);
      if (countEl) countEl.textContent = String(value);
      if (barEl) barEl.style.width = value + '%';
      if (p < 1) requestAnimationFrame(tick); else finish();
    }

    requestAnimationFrame(tick);
    // Filet de sécurité : onglet en arrière-plan, rAF suspendue, etc.
    window.setTimeout(finish, 4000);

    // Le préchargeur ne doit jamais bloquer la navigation clavier
    el.addEventListener('click', finish);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') finish(); });

    return { ready: false };
  })();

  /* ---------------------------------------------------------------- 2. Découpage des titres */
  function splitText() {
    $$('[data-split]').forEach(function (el) {
      var text = (el.textContent || '').trim().replace(/\s+/g, ' ');
      if (!text) return;
      var words = text.split(' ');
      var step  = parseFloat(el.getAttribute('data-split-delay') || '45');
      var frag  = document.createDocumentFragment();

      words.forEach(function (word, i) {
        var outer = document.createElement('span');
        outer.className = 'w';
        outer.style.setProperty('--wd', (i * step) + 'ms');
        var inner = document.createElement('span');
        inner.className = 'w__i';
        inner.textContent = word;
        outer.appendChild(inner);
        frag.appendChild(outer);
        if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
      });

      el.textContent = '';
      el.appendChild(frag);
    });
  }

  /* ---------------------------------------------------------------- 3. Apparitions au défilement */
  function reveals() {
    var targets = $$('[data-reveal], [data-split]');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    function observe() { targets.forEach(function (el) { io.observe(el); }); }

    if ($('#preloader') && !reduceMotion) {
      document.addEventListener('konekteo:ready', observe, { once: true });
      window.setTimeout(observe, 2500); // rattrapage
    } else {
      observe();
    }
  }

  /* ---------------------------------------------------------------- 4. Compteurs */
  function counters() {
    var els = $$('[data-count]');
    if (!els.length) return;

    function animate(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      if (reduceMotion) { el.textContent = String(target); return; }
      var start = performance.now();
      var dur = 1500;
      function step(now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) { els.forEach(animate); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        animate(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------- 5. En-tête, progression, navigation active */
  function chrome() {
    var header = $('#header');
    var bar    = $('#scrollBar');
    var lastY  = window.scrollY;

    function onScroll() {
      var y = window.scrollY;

      if (header) {
        header.classList.toggle('is-stuck', y > 40);
        var goingDown = y > lastY && y > 500;
        header.classList.toggle('is-hidden', goingDown && !body.classList.contains('is-locked'));
      }

      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      }

      lastY = y;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Section visible → lien de navigation actif
    var links = $$('[data-nav]');
    if (links.length && 'IntersectionObserver' in window) {
      var map = {};
      links.forEach(function (a) {
        var id = a.getAttribute('href');
        if (id && id.charAt(0) === '#') map[id.slice(1)] = a;
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var link = map[e.target.id];
          if (!link) return;
          if (e.isIntersecting) {
            links.forEach(function (a) { a.classList.remove('is-active'); });
            link.classList.add('is-active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) {
        var section = document.getElementById(id);
        if (section) io.observe(section);
      });
    }
  }

  /* ---------------------------------------------------------------- 6. Menu plein écran */
  function menu() {
    var el     = $('#menu');
    var burger = $('#burger');
    if (!el || !burger) return;

    el.hidden = false;
    root.classList.add('js'); // rappel : le HTML porte déjà .js
    var open = false;
    var lastFocused = null;

    function setOpen(next) {
      open = next;
      el.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      body.classList.toggle('is-locked', open);
      if (open) {
        lastFocused = document.activeElement;
        var first = el.querySelector('a');
        // Le voile passe de visibility:hidden à visible : on laisse une frame passer
        if (first) window.setTimeout(function () { first.focus(); }, 60);
      } else if (lastFocused && lastFocused.focus) {
        lastFocused.focus();
      }
    }

    burger.addEventListener('click', function () { setOpen(!open); });
    $$('[data-menu-link]', el).forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) setOpen(false);
      if (e.key !== 'Tab' || !open) return;
      var focusables = $$('a[href], button:not([disabled])', el).filter(function (n) { return n.offsetParent !== null; });
      if (!focusables.length) return;
      var first = focusables[0];
      var last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024 && open) setOpen(false);
    });
  }

  /* ---------------------------------------------------------------- 7. Curseur personnalisé */
  function cursor() {
    var el = $('#cursor');
    var label = $('#cursorLabel');
    if (!el || !finePointer || reduceMotion) { if (el) el.style.display = 'none'; return; }

    body.classList.add('has-cursor');
    var x = window.innerWidth / 2, y = window.innerHeight / 2;
    var cx = x, cy = y;
    var shown = false;

    window.addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!shown) { // le curseur n'apparaît qu'une fois la souris réellement utilisée
        shown = true;
        cx = x; cy = y;
        el.style.opacity = '1';
      }
    }, { passive: true });
    window.addEventListener('mouseleave', function () { el.style.opacity = '0'; });
    window.addEventListener('mouseenter', function () { if (shown) el.style.opacity = '1'; });

    document.addEventListener('pointerover', function (e) {
      var target = e.target.closest ? e.target.closest('[data-cursor]') : null;
      if (!target) return;
      el.classList.add('is-large');
      if (label) label.textContent = target.getAttribute('data-cursor') || '';
    });
    document.addEventListener('pointerout', function (e) {
      var target = e.target.closest ? e.target.closest('[data-cursor]') : null;
      if (!target) return;
      // On ne rétrécit pas le curseur quand on passe d'un enfant à un autre
      if (e.relatedTarget && target.contains(e.relatedTarget)) return;
      el.classList.remove('is-large');
    });

    return function tick() {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      el.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      // La boucle s'arrête dès que le curseur a rattrapé la souris.
      return shown && (Math.abs(x - cx) > 0.2 || Math.abs(y - cy) > 0.2);
    };
  }

  /* ---------------------------------------------------------------- 8. Boutons magnétiques */
  function magnetic() {
    if (!finePointer || reduceMotion) return;
    $$('[data-magnetic]').forEach(function (btn) {
      var strength = 0.22;
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * strength;
        var dy = (e.clientY - (r.top + r.height / 2)) * strength;
        btn.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------------- 9. Galerie « méthode » pilotée au défilement */
  function rail() {
    var rail  = $('#rail');
    var track = $('#railTrack');
    var bar   = $('#railBar');
    if (!rail || !track) return null;

    var distance = 0;
    var current  = 0;
    var progress = 0;
    var top      = 0;

    function layout() {
      if (window.innerWidth <= 900 || reduceMotion) {
        rail.style.height = '';
        track.style.transform = '';
        distance = 0;
        return;
      }
      distance = Math.max(0, track.scrollWidth - window.innerWidth + 80);
      rail.style.height = (window.innerHeight + distance) + 'px';
      top = rail.getBoundingClientRect().top + window.scrollY;
    }

    function measure() {
      var p = distance > 0 ? (window.scrollY - top) / distance : 0;
      progress = Math.max(0, Math.min(1, p));
      if (bar) bar.style.width = (progress * 100) + '%';
    }

    layout();
    measure();
    window.addEventListener('resize', function () { layout(); measure(); });
    window.addEventListener('load', function () { layout(); measure(); });

    return function tick() {
      if (window.innerWidth <= 900 || reduceMotion || distance === 0) return false;
      measure();
      current += (progress - current) * 0.12;
      track.style.transform = 'translate3d(' + (-current * distance) + 'px,0,0)';
      return Math.abs(progress - current) > 0.0005;
    };
  }

  /* ---------------------------------------------------------------- 10. Tilt du cube au défilement */
  function cubeTilt() {
    var stage = $('#stage');
    if (!stage || reduceMotion) return;
    var value = 0, target = 0;
    function onScroll() { target = Math.min(1, window.scrollY / Math.max(1, window.innerHeight)); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return function tick() {
      value += (target - value) * 0.08;
      stage.style.transform = 'rotate(' + (value * 26) + 'deg) scale(' + (1 - value * 0.08) + ')';
      return Math.abs(target - value) > 0.001;
    };
  }

  /* ---------------------------------------------------------------- 11. Services dépliables */
  function services() {
    $$('[data-service]').forEach(function (card) {
      var head   = $('.service__head', card);
      var toggle = $('.service__toggle', card);
      if (!head) return;

      function setOpen(next) {
        card.classList.toggle('is-open', next);
        if (toggle) {
          toggle.setAttribute('aria-expanded', String(next));
          var label = toggle.querySelector('.sr-only');
          if (label) {
            var base = label.textContent.replace(/^(Afficher|Masquer) le détail : /, '');
            label.textContent = (next ? 'Masquer' : 'Afficher') + ' le détail : ' + base;
          }
        }
      }

      function toggleCard() { setOpen(!card.classList.contains('is-open')); }

      head.addEventListener('click', function (e) {
        if (toggle && toggle.contains(e.target)) return; // le bouton gère son propre clic
        toggleCard();
      });
      if (toggle) toggle.addEventListener('click', function () { toggleCard(); });
    });
  }

  /* ---------------------------------------------------------------- 12. Détails horaires, formulaire, divers */
  function clockAndYear() {
    var clock = $('#clock');
    var year  = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());
    if (!clock) return;
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch (err) { fmt = null; }
    function update() { if (fmt) clock.textContent = fmt.format(new Date()); }
    update();
    window.setInterval(update, 30000);
  }

  function form() {
    var form = $('#projectForm');
    if (!form) return;
    var status = $('#formStatus');
    var error  = $('#formError');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (error) { error.hidden = true; error.textContent = ''; }

      var nom     = ($('#f-nom') || {}).value || '';
      var email   = ($('#f-email') || {}).value || '';
      var type    = ($('#f-type') || {}).value || '';
      var budget  = ($('#f-budget') || {}).value || '';
      var message = ($('#f-msg') || {}).value || '';
      var problems = [];

      [['#f-nom', nom], ['#f-email', email], ['#f-msg', message]].forEach(function (pair) {
        var field = $(pair[0]);
        var invalid = !String(pair[1]).trim();
        if (field) field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
        if (invalid) problems.push(field);
      });
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        problems.push($('#f-email'));
        if (error) { error.hidden = false; error.textContent = 'Vérifiez l’adresse e-mail indiquée.'; }
      }

      if (problems.length) {
        if (error && error.hidden) { error.hidden = false; error.textContent = 'Merci de compléter les champs obligatoires.'; }
        var first = problems.filter(Boolean)[0];
        if (first) first.focus();
        return;
      }

      var subject = 'Demande de projet — ' + type + ' (' + nom + ')';
      var bodyText = [
        'Nom : ' + nom,
        'E-mail : ' + email,
        'Type de projet : ' + type,
        'Budget envisagé : ' + budget,
        '',
        'Projet :',
        message
      ].join('\r\n');

      var href = 'mailto:contact@konekteo.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(bodyText);

      if (status) status.textContent = 'Merci ' + nom.split(' ')[0] + ' — votre logiciel de messagerie va s’ouvrir avec la demande pré-remplie.';
      window.location.href = href;
    });
  }

  /* ---------------------------------------------------------------- 13. Ancres : compensation d'en-tête */
  function anchors() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link) return;
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      var header = $('#header');
      var offset = header ? header.offsetHeight + 12 : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  }

  /* ---------------------------------------------------------------- 13. Sobriété : rien ne tourne sans raison */
  function sobriete() {
    // Verrou 1 : onglet en arrière-plan → tout se met en pause
    function appliquerVisibilite() {
      root.classList.toggle('onglet-cache', document.hidden);
    }
    document.addEventListener('visibilitychange', appliquerVisibilite);
    appliquerVisibilite();

    // Verrou 2 : section hors écran → elle seule se met en pause
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (entree) {
        entree.target.classList.toggle('hors-ecran', !entree.isIntersecting);
      });
    }, { rootMargin: '25% 0px 25% 0px' });
    $$('section, .band').forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------- Démarrage */
  function boot() {
    splitText();
    reveals();
    counters();
    chrome();
    menu();
    services();
    clockAndYear();
    form();
    anchors();

    var tickers = [];
    var cursorTick = cursor(); if (cursorTick) tickers.push(cursorTick);
    var railTick = rail();     if (railTick) tickers.push(railTick);
    var cubeTick = cubeTilt(); if (cubeTick) tickers.push(cubeTick);

    // La boucle ne tourne que tant qu'un mouvement est en cours, puis s'arrête.
    // Sans cela, elle consommait un rappel par image, indéfiniment, même à l'arrêt.
    if (tickers.length && !reduceMotion) {
      var enMarche = false;
      var boucle = function () {
        var encore = false;
        for (var i = 0; i < tickers.length; i++) {
          try { if (tickers[i]() === true) encore = true; } catch (err) { /* isolé */ }
        }
        if (encore && !document.hidden) { requestAnimationFrame(boucle); } else { enMarche = false; }
      };
      var relancer = function () {
        if (enMarche || document.hidden) return;
        enMarche = true;
        requestAnimationFrame(boucle);
      };
      window.addEventListener('scroll', relancer, { passive: true });
      window.addEventListener('pointermove', relancer, { passive: true });
      window.addEventListener('resize', relancer);
      document.addEventListener('visibilitychange', relancer);
      relancer();
    }

    magnetic();
    sobriete();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
