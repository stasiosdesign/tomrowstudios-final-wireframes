// -----------------------------------------
// IMAGE ZOOM (click any plate to open it full size)
// -----------------------------------------
// Every image on a project page carries [data-zoom], whatever size it is
// rendered at — a masonry tile and a full-bleed plate open the same way. The
// overlay is built once and reused, so a page with twenty plates still only
// ever has one lightbox in the DOM.

function initImageZoom() {
  const targets = document.querySelectorAll("[data-zoom]");
  if (!targets.length) return;

  const ui = buildZoomOverlay();

  // The set the arrows step through is rebuilt on open, so a Barba navigation
  // that swaps the container never leaves us pointing at detached images.
  targets.forEach((el) => {
    if (el.__zoomBound) return;
    el.__zoomBound = true;
    el.classList.add("is--zoomable");
    el.addEventListener("click", () => openZoom(ui, el));
  });
}

function buildZoomOverlay() {
  if (window.__zoomUI) return window.__zoomUI;

  const root = document.createElement("div");
  root.className = "zoom";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <div class="zoom__backdrop" data-zoom-close></div>
    <figure class="zoom__figure">
      <img class="zoom__img" alt="">
    </figure>
    <button class="zoom__close" type="button" data-zoom-close aria-label="Close">&times;</button>
    <button class="zoom__arrow is--prev" type="button" data-zoom-prev aria-label="Previous image"></button>
    <button class="zoom__arrow is--next" type="button" data-zoom-next aria-label="Next image"></button>
    <p class="zoom__counter"><span data-zoom-index>1</span> / <span data-zoom-total>1</span></p>
  `;
  document.body.appendChild(root);

  const ui = {
    root,
    backdrop: root.querySelector(".zoom__backdrop"),
    figure: root.querySelector(".zoom__figure"),
    img: root.querySelector(".zoom__img"),
    prev: root.querySelector("[data-zoom-prev]"),
    next: root.querySelector("[data-zoom-next]"),
    index: root.querySelector("[data-zoom-index]"),
    total: root.querySelector("[data-zoom-total]"),
    group: [],
    at: 0,
    open: false,
    magnified: false
  };

  root.querySelectorAll("[data-zoom-close]").forEach((el) => {
    el.addEventListener("click", () => closeZoom(ui));
  });
  ui.prev.addEventListener("click", (e) => { e.stopPropagation(); stepZoom(ui, -1); });
  ui.next.addEventListener("click", (e) => { e.stopPropagation(); stepZoom(ui, 1); });

  // Inside the overlay a click magnifies further, and the pointer pans around
  // the enlarged image rather than scrolling it
  ui.figure.addEventListener("click", () => toggleMagnify(ui));
  ui.figure.addEventListener("pointermove", (e) => {
    if (!ui.magnified) return;
    const r = ui.figure.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    gsap.to(ui.img, { transformOrigin: `${x}% ${y}%`, duration: 0.4, overwrite: "auto" });
  });

  document.addEventListener("keydown", (e) => {
    if (!ui.open) return;
    if (e.key === "Escape") closeZoom(ui);
    if (e.key === "ArrowLeft") stepZoom(ui, -1);
    if (e.key === "ArrowRight") stepZoom(ui, 1);
  });

  window.addEventListener("resize", () => {
    if (ui.open) gsap.set(ui.figure, fitZoomRect(ui.img));
  });

  window.__zoomUI = ui;
  return ui;
}

// Where the image sits once it is open: the largest landscape-safe box that
// fits the viewport without ever enlarging past the file's own pixels
function fitZoomRect(img) {
  const nw = img.naturalWidth || img.width || 1;
  const nh = img.naturalHeight || img.height || 1;
  const maxW = window.innerWidth * 0.92;
  const maxH = window.innerHeight * 0.86;
  const scale = Math.min(maxW / nw, maxH / nh);
  const w = nw * scale;
  const h = nh * scale;
  return {
    left: (window.innerWidth - w) / 2,
    top: (window.innerHeight - h) / 2,
    width: w,
    height: h
  };
}

function openZoom(ui, source) {
  if (ui.open) return;

  // Everything zoomable that is currently on the page, in document order
  ui.group = Array.from(document.querySelectorAll("[data-zoom]"));
  ui.at = ui.group.indexOf(source);
  ui.open = true;
  ui.magnified = false;

  const from = source.getBoundingClientRect();

  ui.img.src = source.currentSrc || source.src;
  ui.img.alt = source.alt || "";
  ui.total.textContent = ui.group.length;
  ui.index.textContent = ui.at + 1;
  ui.root.setAttribute("aria-hidden", "false");
  ui.root.classList.add("is--open");
  ui.root.classList.toggle("is--single", ui.group.length < 2);
  document.documentElement.classList.add("has--zoom");

  if (window.lenis && typeof window.lenis.stop === "function") window.lenis.stop();

  gsap.set(ui.img, { scale: 1, transformOrigin: "50% 50%" });
  gsap.set(ui.figure, { left: from.left, top: from.top, width: from.width, height: from.height });
  gsap.to(ui.backdrop, { autoAlpha: 1, duration: 0.4 });
  gsap.to(ui.figure, { ...fitZoomRect(ui.img), duration: 0.6, ease: "osmo" });
  gsap.fromTo(
    [ui.prev, ui.next, ui.root.querySelector(".zoom__close"), ui.root.querySelector(".zoom__counter")],
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: 0.3, delay: 0.25 }
  );
}

function stepZoom(ui, direction) {
  if (!ui.open || ui.group.length < 2) return;
  const next = (ui.at + direction + ui.group.length) % ui.group.length;
  ui.at = next;
  ui.magnified = false;

  const source = ui.group[next];
  gsap.to(ui.img, {
    autoAlpha: 0,
    scale: 1,
    duration: 0.2,
    onComplete: () => {
      ui.img.src = source.currentSrc || source.src;
      ui.img.alt = source.alt || "";
      ui.index.textContent = next + 1;
      const settle = () => {
        gsap.to(ui.figure, { ...fitZoomRect(ui.img), duration: 0.45, ease: "osmo" });
        gsap.to(ui.img, { autoAlpha: 1, duration: 0.3 });
      };
      if (ui.img.complete) settle();
      else ui.img.onload = settle;
    }
  });
}

function toggleMagnify(ui) {
  ui.magnified = !ui.magnified;
  ui.figure.classList.toggle("is--magnified", ui.magnified);
  gsap.to(ui.img, { scale: ui.magnified ? 2.2 : 1, duration: 0.5, ease: "osmo" });
}

function closeZoom(ui) {
  if (!ui.open) return;
  ui.open = false;
  ui.magnified = false;
  ui.figure.classList.remove("is--magnified");
  document.documentElement.classList.remove("has--zoom");

  const source = ui.group[ui.at];
  const to = source ? source.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };

  gsap.to(ui.img, { scale: 1, duration: 0.3 });
  gsap.to([ui.prev, ui.next, ui.root.querySelector(".zoom__close"), ui.root.querySelector(".zoom__counter")], { autoAlpha: 0, duration: 0.2 });
  gsap.to(ui.figure, {
    left: to.left,
    top: to.top,
    width: to.width,
    height: to.height,
    duration: 0.5,
    ease: "osmo"
  });
  gsap.to(ui.backdrop, {
    autoAlpha: 0,
    duration: 0.4,
    onComplete: () => {
      ui.root.classList.remove("is--open");
      ui.root.setAttribute("aria-hidden", "true");
      if (window.lenis && typeof window.lenis.start === "function") window.lenis.start();
    }
  });
}

// Initialize Image Zoom
document.addEventListener("DOMContentLoaded", () => {
  initImageZoom();
});
