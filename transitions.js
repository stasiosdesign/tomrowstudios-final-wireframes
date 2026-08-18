// -----------------------------------------
// PAGE TRANSITIONS (Barba + GSAP)
// -----------------------------------------

gsap.registerPlugin(CustomEase);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;

const hasLenis = typeof window.Lenis !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", e => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);

let durationDefault = 0.6;

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
gsap.defaults({ ease: "osmo", duration: durationDefault });


// -----------------------------------------
// FUNCTION REGISTRY
// -----------------------------------------

function initOnceFunctions() {
  initLenis();
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  // Side panels bind themselves on DOMContentLoaded for the first page.
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;

  // The incoming container carries its own panels and triggers, so rebind them
  if (typeof initSidePanels === "function") initSidePanels();

  if (hasLenis) {
    lenis.resize();
  }
}


// -----------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  tl.call(() => {
    resetPage(next);
  }, null, 0);

  return tl;
}

function runPageLeaveAnimation(current, next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionColumns = transitionWrap.querySelectorAll("[data-transition-column]");
  const transitionLabel = transitionWrap.querySelector("[data-transition-label]");
  const transitionLabelText = transitionWrap.querySelector("[data-transition-label-text]");

  // Name of the page we are heading to
  const nextPageName = next.getAttribute("data-page-name");
  transitionLabelText.innerText = nextPageName || "Hi there";

  const tl = gsap.timeline({
    onComplete: () => { current.remove() }
  });

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.set(next, {
    autoAlpha: 0,
  }, 0);

  tl.fromTo(transitionColumns, {
    yPercent: 0
  },{
    yPercent: -100,
    duration: 0.6,
    stagger: {
      each: 0.06,
      from: "end"
    },
  }, 0);

  tl.fromTo(transitionLabel, {
    autoAlpha: 0
  },{
    autoAlpha: 1
  }, "<+=0.2");

  return tl;
}

function runPageEnterAnimation(next){
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionColumns = transitionWrap.querySelectorAll("[data-transition-column]");
  const transitionLabel = transitionWrap.querySelector("[data-transition-label]");

  const tl = gsap.timeline();

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady")
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  tl.add("startEnter", 1);

  tl.set(next, {
    autoAlpha: 1,
  }, "startEnter");

  tl.to(transitionColumns, {
    yPercent: -200,
    duration: 0.6,
    stagger: 0.06,
    overwrite: "auto",
  }, "startEnter");

  tl.fromTo(transitionLabel, {
    autoAlpha: 1
  },{
    autoAlpha: 0,
    duration: 0.4,
    overwrite: "auto",
    immediateRender: false
  }, "startEnter+=0.1");

  // Subtle swipe up: the incoming page is drawn upward as the panels clear
  tl.from(next, {
    y: "10vh",
    duration: 0.9,
  }, "startEnter");

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}


// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------

barba.hooks.beforeEnter(data => {
  // Position new container on top
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });

  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
  }

  initBeforeEnterFunctions(data.next.container);
});

barba.hooks.afterEnter(data => {
  // Run page functions
  initAfterEnterFunctions(data.next.container);

  // Settle
  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }
});

// Barba fetches the next page over HTTP, which the file:// protocol blocks.
// Opening a page straight from disk falls back to normal navigation.
if (location.protocol === "file:") {
  initOnceFunctions();
  if (typeof initWillemLoadingAnimation === "function") {
    initWillemLoadingAnimation();
  }
} else {
barba.init({
  debug: false,
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "default",
      sync: true,

      // First load
      async once(data) {
        initOnceFunctions();

        // Home intro — `once` only fires on a full page load, never on a
        // Barba navigation, so this is the first-load / refresh restriction.
        if (typeof initWillemLoadingAnimation === "function") {
          initWillemLoadingAnimation();
        }

        return runPageOnceAnimation(data.next.container);
      },

      // Current page leaves
      async leave(data) {
        return runPageLeaveAnimation(data.current.container, data.next.container);
      },

      // New page enters
      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      }
    }
  ],
});
}


// -----------------------------------------
// GENERIC + HELPERS
// -----------------------------------------

function initLenis() {
  if (lenis) return; // already created
  if (!hasLenis) return;

  lenis = new Lenis({
    lerp: 0.165,
    wheelMultiplier: 1.25,
  });

  // The side panels need to pause page scrolling while they are open
  window.lenis = lenis;

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

function resetPage(container){
  window.scrollTo(0, 0);
  // The transform must go too — it would make the container the containing
  // block for the fixed navbar and side panels.
  gsap.set(container, { clearProps: "position,top,left,right,transform" });

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }
}
