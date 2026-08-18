/* Home page intro.

   Runs only on a first load or refresh of the home page: transitions.js calls
   it from Barba's `once` hook, which fires once per full page load and never on
   a Barba navigation. Arriving at the home page from another page therefore
   leaves the section on `is--hidden` (display:none) and plays the usual page
   transition instead. Only index.html carries the markup, so the guard below
   makes this a no-op everywhere else. */

/* Show the hero without the loading animation. Used when the home page is
   reached through a Barba navigation: the section is the page's hero either
   way, only the intro is restricted to a first load. `is--settled` puts the
   panel and cover image straight into the state the timeline ends on.

   Only ever called from the transition's `enter`, which runs on navigations
   and never on a first load, so it always acts on a freshly fetched container
   and can never touch a hero whose intro is playing. */
function settleHomeHero(scope) {
  const container = (scope || document).querySelector(".willem-header");
  if (!container) return;

  container.classList.remove("is--hidden", "is--loading");
  container.classList.add("is--settled");
}

function initWillemLoadingAnimation() {

  const container = document.querySelector(".willem-header");
  if (!container) return; // not the home page

  const loadingLetter = container.querySelectorAll(".willem__letter");
  const box = container.querySelectorAll(".willem-loader__box");
  const growingImage = container.querySelectorAll(".willem__growing-image");
  const headingStart = container.querySelectorAll(".willem__h1-start");
  const headingEnd = container.querySelectorAll(".willem__h1-end");
  const coverImageExtra = container.querySelectorAll(".willem__cover-image-extra");
  // The hero copy and CTAs take the place of the original wordmark letters
  const headerLetter = container.querySelectorAll(".willem__letter-white, .willem__reveal");
  // The nav is now the fixed site bar, outside the hero section
  const navLinks = document.querySelectorAll(".site-nav a");


  /* GSAP Timeline */
  const tl = gsap.timeline({
    defaults: {
      ease: "expo.inOut",
    },
    onStart: () => {
      container.classList.remove('is--hidden');
      // Hold the page at the top for the length of the intro
      window.scrollTo(0, 0);
      if (window.lenis && window.lenis.stop) window.lenis.stop();
    },
    onComplete: () => {
      // Release the height lock so the rest of the page can scroll
      container.classList.remove('is--loading');
      container.classList.add('is--settled');
      if (window.lenis) {
        window.lenis.resize();
        if (window.lenis.start) window.lenis.start();
      }
    }
  });

  /* Start of Timeline */
  if (loadingLetter) {
    tl.from(loadingLetter, {
      yPercent: 100,
      stagger: 0.025,
      duration: 1.25
    });
  }

  if (box.length) {
    tl.fromTo(box, {
      width: "0em",
    },{
      width: "1em",
      duration: 1.25
    }, "< 1.25");
  }

  if (box.length) {
    tl.fromTo(growingImage, {
      width: "0%",
    },{
      width: "100%",
      duration: 1.25
    }, "<");
  }

  if (headingStart.length) {
    tl.fromTo(headingStart, {
      x: "0em",
    },{
      x: "-0.05em",
      duration: 1.25
    }, "<");
  }

  if (headingEnd.length) {
    tl.fromTo(headingEnd, {
      x: "0em",
    },{
      x: "0.05em",
      duration: 1.25
    }, "<");
  }

  if (coverImageExtra.length) {
    tl.fromTo(coverImageExtra, {
      opacity: 1,
    },{
      opacity: 0,
      duration: 0.05,
      ease: "none",
      stagger: 0.5
    }, "-=0.05");
  }

  if (growingImage.length) {
    tl.to(growingImage, {
      width: "100vw",
      height: "100dvh",
      duration: 2
    }, "< 1.25");
  }

  if (box.length) {
    tl.to(box, {
      width: "110vw",
      duration: 2
    }, "<");
  }

  if (headerLetter.length) {
    tl.from(headerLetter, {
      yPercent: 100,
      duration: 1.25,
      ease: "expo.out",
      stagger: 0.025
    }, "< 1.2");
  }

  if (navLinks.length) {
    tl.from(navLinks, {
      yPercent: 100,
      duration: 1.25,
      ease: "expo.out",
      stagger: 0.1
    }, "<");
  }
}
