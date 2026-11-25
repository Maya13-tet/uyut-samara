// Оживление демо: проявления при прокрутке, анимированные цифры, ползунок «до/после»
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1. Проявления: помечаем внутренние элементы и показываем при входе в экран
  // (сами секции уже проявляет style.js через .s-reveal – не дублируем)
  const targets = document.querySelectorAll(
    ".s-steps__item, .s-promises li, .s-reviews li, .s-faq details, .s-board__group, .s-incl li, .s-photos figure"
  );
  if (!reduced && "IntersectionObserver" in window) {
    const seen = new WeakSet();
    const io = new IntersectionObserver((entries) => {
      let batch = 0;
      entries.forEach((en) => {
        if (!en.isIntersecting || seen.has(en.target)) return;
        seen.add(en.target);
        en.target.style.transitionDelay = Math.min(batch * 90, 450) + "ms";
        en.target.classList.add("a-in");
        io.unobserve(en.target);
        batch++;
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    targets.forEach((t) => { t.classList.add("a-rv"); io.observe(t); });
  } else {
    targets.forEach((t) => t.classList.add("a-in"));
  }

  // 2. Анимированные цифры: рейтинг и число отзывов набираются при появлении
  const animateNumber = (el, final, opts = {}) => {
    if (reduced) return;
    const dur = opts.dur || 1200;
    const dec = opts.dec || 0;
    const suffix = opts.suffix || "";
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      let v = (final * eased).toFixed(dec);
      if (dec) v = v.replace(".", ",");
      el.textContent = v + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const numIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      numIO.unobserve(el);
      const rating = parseFloat((el.dataset.aRating || "").replace(",", "."));
      const count = parseInt(el.dataset.aCount || "", 10);
      if (!isNaN(rating)) animateNumber(el, rating, { dec: 1 });
      else if (!isNaN(count)) animateNumber(el, count, { suffix: el.dataset.aSuffix || "" });
    });
  }, { threshold: 0.6 });
  const ratingB = document.querySelector(".s-rating b");
  if (ratingB && /^[\d,]+$/.test(ratingB.textContent.trim())) {
    ratingB.dataset.aRating = ratingB.textContent.trim();
    numIO.observe(ratingB);
  }
  const revNum = document.querySelector(".s-reviews__num");
  if (revNum && /^[\d,]+$/.test(revNum.textContent.trim())) {
    revNum.dataset.aRating = revNum.textContent.trim();
    numIO.observe(revNum);
  }
  document.querySelectorAll(".s-reviews__count, .s-rating").forEach((el) => {
    const m = el.textContent.match(/(\d+)\s+(отзыв\w*)/);
    if (m && !el.querySelector("b[data-a-rating]")) {
      // не анимируем текст целиком, только отдельные числа выше; пропускаем
    }
  });

  // 3. Ползунок «до/после»
  document.querySelectorAll("[data-a-ba]").forEach((ba) => {
    const set = (clientX) => {
      const r = ba.getBoundingClientRect();
      let p = ((clientX - r.left) / r.width) * 100;
      p = Math.max(4, Math.min(96, p));
      ba.style.setProperty("--ba", p + "%");
    };
    let active = false;
    ba.addEventListener("pointerdown", (e) => { active = true; ba.setPointerCapture(e.pointerId); set(e.clientX); });
    ba.addEventListener("pointermove", (e) => { if (active) set(e.clientX); });
    ["pointerup", "pointercancel"].forEach((ev) => ba.addEventListener(ev, () => { active = false; }));
    // Подсказка при первом появлении: ползунок чуть шевелится
    if (!reduced && "IntersectionObserver" in window) {
      const hintIO = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          hintIO.unobserve(ba);
          const t0 = performance.now();
          const wobble = (t) => {
            const p = (t - t0) / 1400;
            if (p >= 1 || active) { ba.style.setProperty("--ba", "50%"); return; }
            ba.style.setProperty("--ba", 50 + Math.sin(p * Math.PI * 2) * 12 + "%");
            requestAnimationFrame(wobble);
          };
          setTimeout(() => requestAnimationFrame(wobble), 500);
        });
      }, { threshold: 0.4 });
      hintIO.observe(ba);
    }
  });
})();
