/* =========================================================
   VIRTUE EAT WORLD — script.js
   Shared behaviour for every page
   ========================================================= */

/* ---------- Storage Keys ---------- */
const STORE = {
  CART: 'vew_cart',
  ORDERS: 'vew_orders',
  MESSAGES: 'vew_messages'
};

/* ---------- Local Storage Helpers ---------- */
function getStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    return [];
  }
}

function setStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage Error:", e);
  }
}

function makeId(prefix) {
  return (
    prefix +
    "-" +
    Date.now().toString(36).toUpperCase() +
    Math.floor(Math.random() * 900 + 100)
  );
}

/* ---------- Page Initialisation ---------- */
document.addEventListener("DOMContentLoaded", () => {

  initNav();
  initScrollEffects();
  initTestimonials();
  initGallery();
  initMenuSearch();
  markActiveNavLink();

  // Restore Recently Ordered Item
  const recent = localStorage.getItem("recentItem");
  if (recent) {
    console.log("Last Ordered Item:", recent);
  }

});

/* =========================================================
   NAVIGATION
   ========================================================= */

function initNav() {

  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");

  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {

    const isOpen = links.classList.toggle("open");

    toggle.classList.toggle("open", isOpen);

    toggle.setAttribute(
      "aria-expanded",
      isOpen ? "true" : "false"
    );

  });

  links.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", () => {

      links.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");

    });

  });

  document.addEventListener("click", e => {

    if (!links.classList.contains("open")) return;

    if (
      !links.contains(e.target) &&
      !toggle.contains(e.target)
    ) {

      links.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");

    }

  });

}

/* =========================================================
   ACTIVE NAVBAR LINK
   ========================================================= */

function markActiveNavLink() {

  const links = document.querySelectorAll(".nav-links a");

  const currentPage = decodeURIComponent(
    location.pathname.split("/").pop() || "index.html"
  ).toLowerCase();

  links.forEach(link => {

    const href = decodeURIComponent(
      link.getAttribute("href") || ""
    ).toLowerCase();

    if (
      href === currentPage ||
      (currentPage === "" && href === "index.html")
    ) {

      link.classList.add("active");

    } else {

      link.classList.remove("active");

    }

  });

}

/* =========================================================
   SCROLL EFFECTS
   Sticky Header + Back To Top Button
   ========================================================= */

function initScrollEffects() {

  const header = document.querySelector(".site-header");
  const fabTop = document.getElementById("fabTop");

  function onScroll() {

    const y = window.scrollY || window.pageYOffset;

    if (header) {
      header.classList.toggle("scrolled", y > 12);
    }

    if (fabTop) {
      fabTop.classList.toggle("show", y > 420);
    }

  }

  window.addEventListener("scroll", onScroll, {
    passive: true
  });

  onScroll();

  if (fabTop) {

    fabTop.addEventListener("click", () => {

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    });

  }

}


/* =========================================================
   TESTIMONIALS
   ========================================================= */

function initTestimonials() {

  const wrap = document.querySelector(".testimonial-wrap");

  if (!wrap) return;

  injectFeedbackReviews(wrap);

  const slides = Array.from(
    wrap.querySelectorAll(".testimonial-slide")
  );

  const dots = Array.from(
    wrap.querySelectorAll(".dot")
  );

  let current = Math.max(
    0,
    slides.findIndex(slide =>
      slide.classList.contains("active")
    )
  );

  if (current === -1) current = 0;

  function show(index) {

    slides.forEach((slide, i) => {

      slide.classList.toggle("active", i === index);

    });

    dots.forEach((dot, i) => {

      dot.classList.toggle("active", i === index);

    });

    current = index;

  }

  function next() {

    show((current + 1) % slides.length);

  }

  function prev() {

    show((current - 1 + slides.length) % slides.length);

  }

  const prevBtn = wrap.querySelector(".carousel-arrow.prev");
  const nextBtn = wrap.querySelector(".carousel-arrow.next");

  if (prevBtn) {
    prevBtn.addEventListener("click", prev);
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", next);
  }

  dots.forEach((dot, i) => {

    dot.addEventListener("click", () => {

      show(i);

    });

  });

  if (slides.length > 1) {

    setInterval(next, 7000);

  }

}


/* =========================================================
   Inject Customer Feedback into Testimonials
   ========================================================= */

function injectFeedbackReviews(wrap) {

  const navHost = wrap.querySelector(".testimonial-nav");
  const template = wrap.querySelector(".testimonial-slide");

  if (!template || !navHost) return;

  const messages = getStore(STORE.MESSAGES)
    .filter(msg =>
      msg.type === "feedback" &&
      Number(msg.rating) >= 4
    )
    .slice(-4);

  messages.forEach(msg => {

    const slide = document.createElement("div");

    slide.className = "testimonial-slide";

    slide.innerHTML = `
      <div class="quote-mark">"</div>

      <p class="quote">
        ${escapeHtml(msg.message)}
      </p>

      <div class="testimonial-author">

        <div>

          <strong>
            ${escapeHtml(msg.name || "Happy Customer")}
          </strong>

          <span>
            ${"★".repeat(Number(msg.rating))}
          </span>

        </div>

      </div>
    `;

    navHost.parentElement.insertBefore(
      slide,
      navHost
    );

    const dot = document.createElement("button");

    dot.className = "dot";

    dot.setAttribute(
      "aria-label",
      "Testimonial"
    );

    navHost.appendChild(dot);

  });

}


/* =========================================================
   Escape HTML
   ========================================================= */

function escapeHtml(str) {

  const div = document.createElement("div");

  div.textContent = str || "";

  return div.innerHTML;

}


/* =========================================================
   GALLERY
   Filter + Lightbox
   ========================================================= */

function initGallery() {

  const grid = document.querySelector(".gallery-grid");

  if (!grid) return;

  const chips = document.querySelectorAll(
    ".gallery-filter .chip"
  );

  const items = Array.from(
    grid.querySelectorAll(".gallery-item")
  );

  chips.forEach(chip => {

    chip.addEventListener("click", () => {

      chips.forEach(c =>
        c.classList.remove("active")
      );

      chip.classList.add("active");

      const category = chip.dataset.category;

      items.forEach(item => {

        const visible =
          category === "all" ||
          item.dataset.category === category;

        item.classList.toggle(
          "hidden",
          !visible
        );

      });

    });

  });

  const lightbox =
    document.querySelector(".lightbox");

  if (!lightbox) return;

  const lightboxImg =
    lightbox.querySelector("img");

  const closeBtn =
    lightbox.querySelector(".lightbox-close");

  const prevBtn =
    lightbox.querySelector(".lightbox-nav.prev");

  const nextBtn =
    lightbox.querySelector(".lightbox-nav.next");

  let visibleItems = [];
  let index = 0;

  function render() {

    const img =
      visibleItems[index].querySelector("img");

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;

  }

  function open(item) {

    visibleItems = items.filter(item =>
      !item.classList.contains("hidden")
    );

    index = visibleItems.indexOf(item);

    render();

    lightbox.classList.add("open");

    document.body.style.overflow = "hidden";

  }

  function close() {

    lightbox.classList.remove("open");

    document.body.style.overflow = "";

  }

  items.forEach(item => {

    item.addEventListener("click", () => {

      open(item);

    });

  });

  if (closeBtn) {
    closeBtn.addEventListener("click", close);
  }

  lightbox.addEventListener("click", e => {

    if (e.target === lightbox) {

      close();

    }

  });

  if (prevBtn) {

    prevBtn.addEventListener("click", () => {

      index =
        (index - 1 + visibleItems.length) %
        visibleItems.length;

      render();

    });

  }

  if (nextBtn) {

    nextBtn.addEventListener("click", () => {

      index =
        (index + 1) %
        visibleItems.length;

      render();

    });

  }

  document.addEventListener("keydown", e => {

    if (!lightbox.classList.contains("open"))
      return;

    if (e.key === "Escape") {

      close();

    }

    if (e.key === "ArrowLeft" && prevBtn) {

      prevBtn.click();

    }

    if (e.key === "ArrowRight" && nextBtn) {

      nextBtn.click();

    }

  });

}

/* =========================================================
   MENU SEARCH + CATEGORY FILTER
   ========================================================= */

function initMenuSearch() {

  const searchInput = document.getElementById("menuSearch");

  const chips = document.querySelectorAll(
    ".menu-toolbar .chip"
  );

  const items = Array.from(
    document.querySelectorAll(".menu-item")
  );

  const categories = Array.from(
    document.querySelectorAll(".menu-category")
  );

  const noResults =
    document.querySelector(".no-results");

  if (!searchInput && !chips.length) return;

  let activeCategory = "all";

  function applyFilters() {

    const term = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    let anyVisible = false;

    items.forEach(item => {

      const name =
        (item.dataset.name || "").toLowerCase();

      const matchesCategory =
        activeCategory === "all" ||
        item.dataset.category === activeCategory;

      const matchesSearch =
        !term || name.includes(term);

      const visible =
        matchesCategory && matchesSearch;

      item.classList.toggle(
        "hidden",
        !visible
      );

      if (visible) anyVisible = true;

    });

    categories.forEach(category => {

      const hasVisible =
        category.querySelectorAll(
          ".menu-item:not(.hidden)"
        ).length > 0;

      category.style.display =
        hasVisible ? "" : "none";

    });

    if (noResults) {

      noResults.classList.toggle(
        "show",
        !anyVisible
      );

    }

  }

  if (searchInput) {

    searchInput.addEventListener(
      "input",
      applyFilters
    );

  }

  chips.forEach(chip => {

    chip.addEventListener("click", () => {

      chips.forEach(c =>
        c.classList.remove("active")
      );

      chip.classList.add("active");

      activeCategory =
        chip.dataset.category;

      applyFilters();

    });

  });

  // Apply filters immediately on page load
  applyFilters();

}

/* Cart add-to-cart handling, rendering, and badge updates now live
   entirely in cart.js — keeping a second implementation here caused
   it to fight with cart.js over the same buttons and localStorage
   key, corrupting entries (missing image/qty). See cart.js. */ 


const themeToggle = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('vew-theme');

if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  themeToggle.checked = true;
}

themeToggle.addEventListener('change', () => {
  document.body.classList.toggle('dark-mode', themeToggle.checked);
  localStorage.setItem('vew-theme', themeToggle.checked ? 'dark' : 'light');
});