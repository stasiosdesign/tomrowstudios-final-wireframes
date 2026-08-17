/* Slide-out side panels (case study + contact), animated with GSAP.
   Triggers:  <a data-panel-open="contact">   Closers: [data-panel-close] or Escape */

if (window.gsap && window.CustomEase) {
  gsap.registerPlugin(CustomEase);
  CustomEase.create("main", "0.65, 0.01, 0.05, 0.99");
  gsap.defaults({ ease: "main", duration: 0.7 });
}

function initSidePanels() {
  var panels = document.querySelectorAll("[data-panel]");
  if (!panels.length) return;

  var hasGsap = !!window.gsap;
  var openPanel = null;

  // Lenis hijacks the wheel for the whole document, so pause it while a panel
  // is open — otherwise the page behind scrolls instead of the panel.
  function getLenis() {
    if (window.lenis) return window.lenis;
    try { return lenis; } catch (e) { return null; }
  }
  function pausePageScroll() {
    var l = getLenis();
    if (l && l.stop) l.stop();
    document.body.style.overflow = "hidden";
  }
  function resumePageScroll() {
    var l = getLenis();
    if (l && l.start) l.start();
    document.body.style.overflow = "";
  }

  panels.forEach(function (panel) {
    var dialog = panel.querySelector("[data-panel-dialog]");
    var overlay = panel.querySelector("[data-panel-backdrop]");
    var sheets = panel.querySelectorAll("[data-panel-bg]");
    var content = panel.querySelector("[data-panel-inner]");
    var tl = hasGsap ? gsap.timeline() : null;

    panel.open = function () {
      if (openPanel && openPanel !== panel) openPanel.close();
      openPanel = panel;
      panel.setAttribute("data-panel-state", "open");
      pausePageScroll();
      if (content) content.scrollTop = 0;

      if (!hasGsap) {
        panel.style.display = "block";
        return;
      }

      tl.clear()
        .set(panel, { display: "block" })
        .set(dialog, { xPercent: 0 }, "<")
        .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1 }, "<")
        .fromTo(sheets, { xPercent: 101 }, { xPercent: 0, stagger: 0.12, duration: 0.575 }, "<")
        .fromTo(content, { autoAlpha: 0, xPercent: 15 }, { autoAlpha: 1, xPercent: 0 }, "<+=0.35");
    };

    panel.close = function () {
      panel.setAttribute("data-panel-state", "closed");
      resumePageScroll();
      if (openPanel === panel) openPanel = null;

      if (!hasGsap) {
        panel.style.display = "none";
        return;
      }

      tl.clear()
        .to(overlay, { autoAlpha: 0 })
        .to(dialog, { xPercent: 120 }, "<")
        .set(panel, { display: "none" })
        .set(content, { clearProps: "all" });
    };

    panel.querySelectorAll("[data-panel-close]").forEach(function (closer) {
      closer.addEventListener("click", function (e) {
        e.preventDefault();
        panel.close();
      });
    });
  });

  // Any link or button that opens a panel by id
  document.querySelectorAll("[data-panel-open]").forEach(function (trigger) {
    trigger.addEventListener("click", function (e) {
      var target = document.getElementById(trigger.getAttribute("data-panel-open"));
      if (!target) return; // fall through to the href so the link still works
      e.preventDefault();
      target.open();
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openPanel) openPanel.close();
  });
}

document.addEventListener("DOMContentLoaded", initSidePanels);
