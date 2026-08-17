/* Scaling hamburger navigation */

var navDocListenersBound = false;

function setNavStatus(status) {
  var navStatusEl = document.querySelector("[data-navigation-status]");
  if (!navStatusEl) return;
  navStatusEl.setAttribute("data-navigation-status", status);

  var group = document.querySelector(".hamburger-nav__group");
  var groupLenis = typeof createNestedLenis === "function" ? createNestedLenis(group) : null;

  // Freeze page scrolling while the menu is open, and hand scrolling to the menu
  var l = window.lenis;
  if (status === "active") {
    if (l && l.stop) l.stop();
    if (groupLenis) {
      groupLenis.resize();
      groupLenis.start();
    }
  } else {
    if (groupLenis && groupLenis.stop) groupLenis.stop();
    if (l && l.start) l.start();
  }
}

function markCurrentNavLink() {
  var page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".hamburger-nav__a").forEach(function (link) {
    var href = link.getAttribute("href");
    if (href === page) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function initScalingHamburgerNavigation() {
  markCurrentNavLink();

  // Toggle Navigation
  document.querySelectorAll('[data-navigation-toggle="toggle"]').forEach(function (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      var navStatusEl = document.querySelector("[data-navigation-status]");
      if (!navStatusEl) return;
      setNavStatus(
        navStatusEl.getAttribute("data-navigation-status") === "not-active" ? "active" : "not-active"
      );
    });
  });

  // Close Navigation
  document.querySelectorAll('[data-navigation-toggle="close"]').forEach(function (closeBtn) {
    closeBtn.addEventListener("click", function () {
      setNavStatus("not-active");
    });
  });

  // Links close the menu on the way out, so the next page starts clean
  document.querySelectorAll(".hamburger-nav__a").forEach(function (link) {
    link.addEventListener("click", function () {
      setNavStatus("not-active");
    });
  });

  // Bound once — the nav is replaced on every page transition
  if (navDocListenersBound) return;
  navDocListenersBound = true;

  // Key ESC - Close Navigation
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var navStatusEl = document.querySelector("[data-navigation-status]");
    if (!navStatusEl) return;
    if (navStatusEl.getAttribute("data-navigation-status") === "active") {
      setNavStatus("not-active");
    }
  });
}

// Initialize Scaling Hamburger Navigation
document.addEventListener("DOMContentLoaded", function () {
  initScalingHamburgerNavigation();
});
