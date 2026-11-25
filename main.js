/* Abril Fox Studio — interacciones mínimas: cabecera, menú móvil, entrada de portada,
   bucle de destinos, visor de fotos y formulario. Sin dependencias. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Cabecera: fondo sólido al dejar la portada */
  const head = $('[data-head]');
  const hero = $('.hero');
  if (head) {
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => head.classList.toggle('is-solid', !e.isIntersecting), { rootMargin: '-80px 0px 0px 0px', threshold: 0 })
        .observe($('.hero__text') || hero);
    } else head.classList.add('is-solid');
  }

  /* Menú móvil */
  const btn = $('[data-menu-btn]');
  const menu = $('#menu');
  if (btn && menu) {
    const set = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Close' : 'Menu';
      menu.classList.toggle('is-open', open);
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); }
    });
  }

  /* Submenú de Gallery: se abre al pulsar y se cierra al elegir, al pulsar fuera o con Escape */
  $$('[data-sub]').forEach((li) => {
    const b = $('.sub-btn', li);
    const set = (open) => { li.classList.toggle('is-open', open); b.setAttribute('aria-expanded', String(open)); };
    let byHover = false;   // si se abrió al pasar el ratón, el clic no debe cerrarlo
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      if (byHover) { byHover = false; set(true); return; }
      set(!li.classList.contains('is-open'));
    });
    li.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('click', (e) => { if (!li.contains(e.target)) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && li.classList.contains('is-open')) { set(false); b.focus(); } });
    if (matchMedia('(hover: hover)').matches) {
      li.addEventListener('mouseenter', () => { if (!li.classList.contains('is-open')) byHover = true; set(true); });
      li.addEventListener('mouseleave', () => { byHover = false; set(false); });
    }
  });

  /* Foto que cambia cada 5 s (Contact) */
  $$('[data-rotate]').forEach((box) => {
    const figs = $$('.ph', box); let k = 0, over = false;
    if (figs.length < 2 || reduce) return;
    box.addEventListener('mouseenter', () => { over = true; });
    box.addEventListener('mouseleave', () => { over = false; });
    setInterval(() => {
      if (over || document.hidden) return;
      figs[k].classList.remove('is-on'); figs[k].setAttribute('aria-hidden', 'true');
      k = (k + 1) % figs.length;
      figs[k].classList.add('is-on'); figs[k].removeAttribute('aria-hidden');
    }, 5000);
  });

  /* Inicio: las cuatro fotos aparecen en fundido, una tras otra */
  const mosaic = $('.mosaic');
  if (mosaic) {
    requestAnimationFrame(() => requestAnimationFrame(() => mosaic.classList.add('is-in')));
    // Cada 5 s, los cuatro huecos pasan a su siguiente foto (con un pequeño desfase entre ellos).
    // Se para al pasar el ratón por encima y no arranca con reduce-motion.
    const slots = $$('[data-slot]', mosaic).map((el) => ({ el, figs: $$('.ph', el), k: 0 }));
    let over = false;
    mosaic.addEventListener('mouseenter', () => { over = true; });
    mosaic.addEventListener('mouseleave', () => { over = false; });
    const step = (s) => {
      s.figs[s.k].classList.remove('is-on'); s.figs[s.k].setAttribute('aria-hidden', 'true');
      s.k = (s.k + 1) % s.figs.length;
      s.figs[s.k].classList.add('is-on'); s.figs[s.k].removeAttribute('aria-hidden');
    };
    if (!reduce) setInterval(() => {
      if (over || document.hidden) return;
      slots.forEach((s, n) => setTimeout(() => step(s), n * 180));
    }, 5000);
  }

  /* Entrada de la portada, cuando la foto ya ha cargado */
  if (hero) {
    const img = $('.slide img');
    const go = () => requestAnimationFrame(() => hero.classList.add('is-in'));
    if (!img || img.complete) go(); else { img.addEventListener('load', go, { once: true }); img.addEventListener('error', go, { once: true }); setTimeout(go, 2500); }
  }

  /* Pase de fotos de la portada: cambia cada 5 s; se para al pasar el ratón, y no arranca solo con reduce-motion */
  const slidesEl = $('[data-slides]');
  if (slidesEl) {
    const slides = $$('.slide', slidesEl);
    let k = 0, timer = null, hover = false; const paused = reduce;
    const showSlide = (n) => {
      slides[k].classList.remove('is-on'); slides[k].setAttribute('aria-hidden', 'true');
      k = (n + slides.length) % slides.length;
      slides[k].classList.add('is-on'); slides[k].setAttribute('aria-hidden', 'false');
    };
    const tick = () => { if (!paused && !hover && !document.hidden) showSlide(k + 1); };
    slidesEl.addEventListener('mouseenter', () => { hover = true; });
    slidesEl.addEventListener('mouseleave', () => { hover = false; });
    if (slides.length > 1) timer = setInterval(tick, 5000);
    void timer;
  }

  /* Bucle de destinos: se duplica la lista para que no tenga cortes */
  const loop = $('[data-loop]');
  if (loop && !reduce) {
    const track = $('.loop__track', loop);
    const items = [...track.children];
    const w0 = track.scrollWidth;
    // repetir hasta cubrir dos anchos de pantalla, luego duplicar una vez
    while (track.scrollWidth < innerWidth * 2) items.forEach((li) => track.append(clone(li)));
    const w = track.scrollWidth;
    [...track.children].forEach((li) => track.append(clone(li)));
    track.style.setProperty('--loop-w', w + 'px');
    track.style.setProperty('--loop-t', Math.round(w / 60) + 's');   // ~60 px por segundo
    loop.classList.add('is-running');
    function clone(li) { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); return c; }
    void w0;
  }

  /* Visor de fotos (páginas de historia) */
  const lb = $('[data-lb]');
  if (lb && typeof lb.showModal === 'function') {
    const opens = $$('.lb-open');
    const img = $('img', lb);
    const count = $('.lb__count', lb);
    let i = 0, last = null;
    const show = (n) => {
      i = (n + opens.length) % opens.length;
      const b = opens[i];
      img.src = b.dataset.full; img.alt = b.dataset.alt;
      img.width = b.dataset.w; img.height = b.dataset.h;
      count.textContent = `${i + 1} / ${opens.length}`;
    };
    opens.forEach((b, n) => b.addEventListener('click', () => { last = b; show(n); lb.showModal(); }));
    $('.lb__prev', lb).addEventListener('click', () => show(i - 1));
    $('.lb__next', lb).addEventListener('click', () => show(i + 1));
    $('.lb__close', lb).addEventListener('click', () => lb.close());
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(i - 1);
      if (e.key === 'ArrowRight') show(i + 1);
    });
    lb.addEventListener('close', () => { img.removeAttribute('src'); last && last.focus(); });
    // gesto de deslizar en móvil
    let x0 = null;
    lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1));
    });
  }

  /* Formulario de contacto */
  const form = $('[data-form]');
  if (form) {
    const status = $('.form__status', form);
    const send = $('button[type=submit]', form);
    const msgs = {
      valueMissing: 'Falta este dato.',
      typeMismatch: 'Revisad el email: parece incompleto.',
    };
    const check = (el) => {
      const v = el.validity;
      let err = el.parentElement.querySelector('.err');
      if (v.valid) { el.removeAttribute('aria-invalid'); err && err.remove(); return true; }
      el.setAttribute('aria-invalid', 'true');
      if (!err) { err = document.createElement('p'); err.className = 'err'; err.id = el.id + '-err'; el.after(err); el.setAttribute('aria-describedby', err.id); }
      err.textContent = v.valueMissing ? msgs.valueMissing : (v.typeMismatch ? msgs.typeMismatch : el.validationMessage);
      return false;
    };
    const msg = $('#f-msg', form), cnt = $('[data-count]', form);
    if (msg && cnt) msg.addEventListener('input', () => { cnt.textContent = `${msg.value.length} / 5000`; });
    $$('input, textarea, select', form).forEach((el) => el.addEventListener('blur', () => { if (el.hasAttribute('aria-invalid') || el.value) check(el); }));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fields = $$('input, textarea, select', form);
      const bad = fields.filter((el) => !check(el));
      if (bad.length) { status.textContent = 'Revisad los campos marcados.'; bad[0].focus(); return; }
      const data = Object.fromEntries(new FormData(form));
      const endpoint = form.dataset.endpoint;
      if (endpoint) {
        // Envío real cuando se conecte un servicio (Formspree, Getform, Netlify Forms…)
        send.disabled = true; status.textContent = 'Enviando…';
        try {
          const r = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
          if (!r.ok) throw new Error(r.status);
          form.reset(); status.textContent = 'Mensaje enviado. Os escribimos en cuanto lo leamos.';
        } catch {
          status.textContent = 'No se ha podido enviar. Probad otra vez o escribidnos por Instagram.';
        } finally { send.disabled = false; }
      } else {
        // Sin servicio conectado: se abre el correo con el mensaje ya escrito
        const body = Object.entries(data).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
        location.href = `mailto:${form.dataset.mail}?subject=${encodeURIComponent('Boda de ' + (data['Tu nombre'] || '') + (data['Pareja'] ? ' y ' + data['Pareja'] : ''))}&body=${encodeURIComponent(body)}`;
        status.textContent = `Hemos preparado el mensaje en vuestro correo. Si no se ha abierto, escribidnos a ${form.dataset.mail}.`;
      }
    });
  }
})();
