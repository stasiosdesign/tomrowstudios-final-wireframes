/* Parallax image slider (Smooothy), with prev / next buttons. */

function initParallaxImageSlider() {
  document.querySelectorAll("[data-parallax-init]").forEach((root) => {
    // The smooothy list
    const wrapper = root.querySelector("[data-parallax-slider]");
    if (!wrapper) return;

    // Barba re-runs this on every navigation; never bind the same track twice
    if (wrapper.__smooothy) return;

    // One parallax layer per slide (optional)
    const parallaxItems = [...wrapper.children].map((slide) => slide.querySelector("[data-parallax-inner]"));

    // Parallax amount
    const amountAttr = wrapper.getAttribute("data-parallax-amount");
    const amount = amountAttr !== null ? parseFloat(amountAttr) : 12;

    // Snap to a slide
    const snap = wrapper.getAttribute("data-parallax-snap") !== "false";

    // Loop
    const infinite = wrapper.getAttribute("data-parallax-infinite") !== "false";

    // Slide smoothing
    const lerpAttr = wrapper.getAttribute("data-parallax-lerp");
    const lerp = lerpAttr !== null ? parseFloat(lerpAttr) : 0.3;

    const maxOffset = 25;

    const slider = new Smooothy(wrapper, {
      infinite,
      snap,
      lerpFactor: lerp,
      onUpdate: ({ parallaxValues }) => {
        parallaxItems.forEach((item, i) => {
          if (!item) return;
          const offset = gsap.utils.clamp(-maxOffset, maxOffset, parallaxValues[i] * amount);
          item.style.transform = `translateX(${offset}%)`;
        });
      },
    });

    wrapper.__smooothy = slider;
    gsap.ticker.add(() => slider.update());

    // Buttons
    const prev = root.querySelector("[data-parallax-prev]");
    const next = root.querySelector("[data-parallax-next]");

    if (prev) prev.addEventListener("click", () => slider.goToPrev());
    if (next) next.addEventListener("click", () => slider.goToNext());
  });
}

// Initialize Parallax Image Slider (Smooothy)
document.addEventListener("DOMContentLoaded", () => {
  initParallaxImageSlider();
});
