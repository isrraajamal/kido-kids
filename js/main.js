document.addEventListener("DOMContentLoaded", function () {
  // 1. Highlight active navigation link
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll(".navbar-nav li a");
  navLinks.forEach((link) => {
    const linkPath = link.getAttribute("href")?.split("/").pop();
    const parentLi = link.closest("li");
    if (parentLi) {
      if (
        (currentPath === "" || currentPath === "index.html") &&
        (linkPath === "" || linkPath === "/" || linkPath === "index.html")
      ) {
        parentLi.classList.add("active");
      } else if (linkPath && currentPath === linkPath) {
        parentLi.classList.add("active");
      } else {
        parentLi.classList.remove("active");
      }
    }
  });

  // 2. Cart counter management
  function getCartCount() {
    return parseInt(localStorage.getItem("kido_cart_count") || "0", 10);
  }

  function updateCartBadge() {
    const count = getCartCount();
    const countElements = document.querySelectorAll("[data-hook='items-count']");
    countElements.forEach((el) => {
      el.textContent = count;
    });
  }
  updateCartBadge();
  window.updateCartBadge = updateCartBadge;

  // 2a. Global Toast Notification Utility
  if (!window.showKidoToast) {
    function showKidoToast(message, type = "success", duration = 3200) {
      let container = document.querySelector(".toast-container-custom");
      if (!container) {
        container = document.createElement("div");
        container.className = "toast-container-custom";
        document.body.appendChild(container);
      }

      const toast = document.createElement("div");
      toast.className = `kido-toast ${type === "success" ? "toast-success" : ""}`;
      const iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 8px; flex-shrink: 0;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      toast.innerHTML = `<span style="display:inline-flex;align-items:center;">${iconSvg}<span>${message}</span></span>`;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(15px) scale(0.95)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
    window.showKidoToast = showKidoToast;
  }

  // 2b. Global Kido Kids Custom Modal System (Eliminates native alert/confirm/prompt)
  function createKidoModalContainer() {
    let overlay = document.getElementById("kidoCustomModalOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "kidoCustomModalOverlay";
      overlay.className = "kido-custom-modal-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.innerHTML = `
        <div class="kido-custom-modal-card">
          <button type="button" class="kido-modal-close-btn" aria-label="Close dialog">&times;</button>
          <div class="kido-modal-icon-wrap" id="kidoModalIcon"></div>
          <h3 class="kido-modal-title" id="kidoModalTitle"></h3>
          <div class="kido-modal-body" id="kidoModalBody"></div>
          <div class="kido-modal-input-wrap" id="kidoModalInputWrap" style="display:none;">
            <input type="text" class="kido-modal-input" id="kidoModalInput" />
          </div>
          <div class="kido-modal-actions" id="kidoModalActions"></div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  const KIDO_MODAL_ICONS = {
    checkout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
    danger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  };

  function showKidoModal(options = {}) {
    return new Promise((resolve) => {
      const overlay = createKidoModalContainer();
      const iconWrap = overlay.querySelector("#kidoModalIcon");
      const titleEl = overlay.querySelector("#kidoModalTitle");
      const bodyEl = overlay.querySelector("#kidoModalBody");
      const inputWrap = overlay.querySelector("#kidoModalInputWrap");
      const inputEl = overlay.querySelector("#kidoModalInput");
      const actionsEl = overlay.querySelector("#kidoModalActions");
      const closeBtn = overlay.querySelector(".kido-modal-close-btn");

      const type = options.type || "info";
      iconWrap.className = `kido-modal-icon-wrap type-${type}`;
      iconWrap.innerHTML = options.iconSvg || KIDO_MODAL_ICONS[type] || KIDO_MODAL_ICONS.info;

      titleEl.textContent = options.title || "Kido Kids";

      if (options.html) {
        bodyEl.innerHTML = options.html;
      } else if (options.message) {
        const paragraphs = options.message.split("\n\n").filter(Boolean);
        bodyEl.innerHTML = paragraphs.map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
      } else {
        bodyEl.innerHTML = "";
      }

      if (options.highlight) {
        const hl = document.createElement("div");
        hl.className = "kido-modal-highlight";
        hl.textContent = options.highlight;
        bodyEl.appendChild(hl);
      }

      // Input support (Prompt)
      if (options.showInput) {
        inputWrap.style.display = "block";
        inputEl.value = options.inputValue || "";
        inputEl.placeholder = options.inputPlaceholder || "";
      } else {
        inputWrap.style.display = "none";
      }

      // Action Buttons
      actionsEl.innerHTML = "";

      if (options.showCancel) {
        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "kido-modal-btn kido-modal-btn-cancel";
        cancelBtn.textContent = options.cancelText || "Cancel";
        cancelBtn.addEventListener("click", () => {
          close();
          if (typeof options.onCancel === "function") options.onCancel();
          resolve({ confirmed: false, value: null });
        });
        actionsEl.appendChild(cancelBtn);
      }

      const confirmBtn = document.createElement("button");
      confirmBtn.type = "button";
      confirmBtn.className = `kido-modal-btn ${options.danger ? "kido-modal-btn-danger" : "kido-modal-btn-primary"}`;
      confirmBtn.textContent = options.confirmText || (options.showCancel ? "Confirm" : "Got It");
      confirmBtn.addEventListener("click", () => {
        const val = options.showInput ? inputEl.value.trim() : true;
        close();
        if (typeof options.onConfirm === "function") options.onConfirm(val);
        resolve({ confirmed: true, value: val });
      });
      actionsEl.appendChild(confirmBtn);

      function close() {
        overlay.classList.remove("active");
        document.removeEventListener("keydown", onKeyDown);
        overlay.removeEventListener("click", onOverlayClick);
      }

      function onKeyDown(e) {
        if (e.key === "Escape") {
          close();
          if (typeof options.onCancel === "function") options.onCancel();
          resolve({ confirmed: false, value: null });
        } else if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          confirmBtn.click();
        }
      }

      function onOverlayClick(e) {
        if (e.target === overlay) {
          close();
          if (typeof options.onCancel === "function") options.onCancel();
          resolve({ confirmed: false, value: null });
        }
      }

      closeBtn.onclick = () => {
        close();
        if (typeof options.onCancel === "function") options.onCancel();
        resolve({ confirmed: false, value: null });
      };

      document.addEventListener("keydown", onKeyDown);
      overlay.addEventListener("click", onOverlayClick);

      // Open modal
      overlay.classList.add("active");
      if (options.showInput) {
        setTimeout(() => inputEl.focus(), 80);
      } else {
        setTimeout(() => confirmBtn.focus(), 80);
      }
    });
  }

  window.showKidoModal = showKidoModal;
  window.showKidoAlert = function (title, message, options = {}) {
    return showKidoModal({ title, message, ...options });
  };
  window.showKidoConfirm = function (title, message, options = {}) {
    return showKidoModal({ title, message, showCancel: true, ...options });
  };
  window.showKidoPrompt = function (title, message, defaultValue = "", options = {}) {
    return showKidoModal({ title, message, showInput: true, inputValue: defaultValue, showCancel: true, ...options });
  };

  // Safe global override for window.alert so no native browser popup can ever appear
  window.alert = function (msg) {
    const raw = String(msg || "");
    const parts = raw.split("\n\n");
    let title = "Notice";
    let body = raw;
    let type = "info";

    if (parts.length > 1) {
      title = parts[0].trim();
      body = parts.slice(1).join("\n\n").trim();
    } else if (raw.toLowerCase().includes("checkout")) {
      title = "Checkout";
      type = "checkout";
    } else if (raw.toLowerCase().includes("empty") || raw.toLowerCase().includes("error")) {
      title = "Shopping Bag";
      type = "warning";
    }

    if (raw.toLowerCase().includes("checkout")) {
      type = "checkout";
    }

    showKidoModal({
      title: title,
      message: body,
      type: type,
      confirmText: "Continue Shopping",
    });
  };

  // 2c. Wishlist counter management & unified central store
  const DEFAULT_WISHLIST = [1, 2, 3, 5];

  window.KidoWishlist = {
    defaults: DEFAULT_WISHLIST,
    get: function () {
      try {
        const stored = localStorage.getItem("kido_wishlist");
        if (stored === null) {
          localStorage.setItem("kido_wishlist", JSON.stringify(DEFAULT_WISHLIST));
          return [...DEFAULT_WISHLIST];
        }
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((x) => parseInt(x, 10));
        }
        return Array.isArray(parsed) ? parsed : [...DEFAULT_WISHLIST];
      } catch (e) {
        return [...DEFAULT_WISHLIST];
      }
    },
    set: function (ids) {
      try {
        const cleanIds = Array.isArray(ids) ? ids.map((x) => parseInt(x, 10)) : [...DEFAULT_WISHLIST];
        localStorage.setItem("kido_wishlist", JSON.stringify(cleanIds));
        window.KidoWishlist.updateDisplays(cleanIds.length);
      } catch (e) {}
    },
    updateDisplays: function (count) {
      if (typeof count !== "number") {
        count = window.KidoWishlist.get().length;
      }
      // Update header badges across all pages
      document.querySelectorAll(".wishlist-count-badge").forEach((badge) => {
        badge.textContent = count;
      });
      // Update wishlist page title count
      const headerCount = document.getElementById("wishlistHeaderCount");
      if (headerCount) {
        headerCount.textContent = `${count} item${count === 1 ? "" : "s"}`;
      }
      // Update wishlist page toolbar count
      const toolbarCount = document.getElementById("wishlistToolbarCount");
      if (toolbarCount) {
        toolbarCount.textContent = `${count} saved favorite${count === 1 ? "" : "s"}`;
      }
    }
  };

  // Immediate sync on script execution
  window.KidoWishlist.updateDisplays();
  window.updateWishlistBadge = window.KidoWishlist.updateDisplays;

  // Real-time synchronization across browser tabs & storage events
  window.addEventListener("storage", function (e) {
    if (e.key === "kido_wishlist") {
      window.KidoWishlist.updateDisplays();
    }
  });

  // 2c. Customer login header state management
  function updateHeaderUserDisplay() {
    try {
      const data = localStorage.getItem("kido_user");
      let user = data ? JSON.parse(data) : null;
      if (user && (user.name === "Happy Parent" || user.name === "Happy")) {
        user.name = "Parent";
        localStorage.setItem("kido_user", JSON.stringify(user));
      }
      const loginBtns = document.querySelectorAll(".header-login-btn");
      const drawerNames = document.querySelectorAll(".drawer-user-name");
      const drawerLinks = document.querySelectorAll(".user-card-link");

      const isLoggedIn = user && user.loggedIn;
      const rawName = (user && user.name ? user.name : "Parent").trim();
      const displayName = (rawName.toLowerCase().includes("happy") || rawName === "") ? "Parent" : rawName.split(" ")[0];

      loginBtns.forEach((btn) => {
        const span = btn.querySelector("span");
        if (span) {
          if (isLoggedIn) {
            span.textContent = `Hi, ${displayName}!`;
            btn.title = `Logged in as ${displayName} (${user.email || ""})`;
          } else {
            span.textContent = "Log in";
            btn.title = "Customer Log in";
          }
        }
      });

      drawerNames.forEach((el) => {
        el.textContent = isLoggedIn ? `Hi, ${displayName}!` : "Welcome to Kido!";
      });

      drawerLinks.forEach((el) => {
        el.textContent = isLoggedIn ? "My Account & Orders ›" : "Sign In / Join Family ›";
      });
    } catch (e) {}
  }
  updateHeaderUserDisplay();
  window.updateHeaderUserDisplay = updateHeaderUserDisplay;

  // 3. Hero content animation on intersection
  const heroElements = document.querySelectorAll(".hero-content");
  if (heroElements.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    heroElements.forEach((el) => observer.observe(el));
  }

  // 4. Owl Carousel for Home Page New Collection
  if (typeof window.$ !== "undefined" && $("#products .owl-carousel").length) {
    const $carousel = $("#products .owl-carousel");
    
    // Populate carousel products if container is empty
    if ($carousel.children().length === 0 && typeof ProductsList !== "undefined") {
      let itemsHtml = "";
      ProductsList.forEach((item) => {
        itemsHtml += `
          <div class="item">
            <a href="product-details.html?id=${item.id}" class="product-card">
              <div class="product-img">
                <div class="quick-view">Quick View</div>
                <img src="${item.image}" alt="${item.name}" />
              </div>
              <p>${item.name}</p>
              <span>$${item.price.toFixed(2)}</span>
            </a>
          </div>
        `;
      });
      $carousel.html(itemsHtml);
    }

    $carousel.owlCarousel({
      loop: true,
      margin: 24,
      nav: false,
      dots: false,
      autoplay: true,
      autoplayTimeout: 3000,
      autoplayHoverPause: true,
      rtl: $("html").attr("dir") === "rtl",
      responsive: {
        0: { items: 1, margin: 0 },
        600: { items: 2, margin: 24 },
        800: { items: 3, margin: 24 },
        1200: { items: 4, margin: 24 },
      },
    });
  }

  // 5. Swiper initialization if exists
  if (typeof Swiper !== "undefined" && document.querySelector(".swiper")) {
    new Swiper(".swiper", {
      loop: true,
      autoplay: { delay: 5000, disableOnInteraction: false },
      pagination: { el: ".swiper-pagination", clickable: true },
    });
  }

  // 6. FAQ Accordion logic
  const faqQuestions = document.querySelectorAll(".faq-question");
  faqQuestions.forEach((q) => {
    q.addEventListener("click", () => {
      const item = q.parentElement;
      const isAlreadyActive = item.classList.contains("active");

      // Close all other items
      document.querySelectorAll(".faq-item").forEach((i) => {
        i.classList.remove("active");
      });

      // Toggle clicked item
      if (!isAlreadyActive) {
        item.classList.add("active");
      }
    });
  });

  // 7. Contact Form submission and feedback
  const contactForm = document.querySelector("#get-in-touch .custom-form");
  const topicPills = document.querySelectorAll(".topic-pill-btn");
  const topicInput = document.getElementById("inquiry_topic");
  const successState = document.getElementById("contactSuccessState");
  const btnSendAnother = document.getElementById("btnSendAnother");

  // Topic pill click handling
  if (topicPills.length > 0 && topicInput) {
    topicPills.forEach((pill) => {
      pill.addEventListener("click", () => {
        topicPills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        topicInput.value = pill.getAttribute("data-topic") || pill.textContent.trim();
      });
    });
  }

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.classList.add("was-validated");
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]') || contactForm.querySelector('input[type="submit"]');
      let originalBtnContent = "";
      if (submitBtn) {
        if (submitBtn.tagName === "BUTTON") {
          originalBtnContent = submitBtn.innerHTML;
          submitBtn.innerHTML = `<span>Sending...</span>`;
        } else {
          originalBtnContent = submitBtn.value;
          submitBtn.value = "Sending...";
        }
        submitBtn.disabled = true;
      }

      setTimeout(() => {
        if (successState) {
          contactForm.style.display = "none";
          successState.classList.add("active");
        } else {
          showKidoModal({
            title: "Message Sent Successfully!",
            message: "Thank you for reaching out to Kido Kids. Our friendly team will review your note and get back to you shortly.",
            type: "success",
            confirmText: "Awesome",
          });
        }

        contactForm.reset();
        contactForm.classList.remove("was-validated");
        if (submitBtn) {
          if (submitBtn.tagName === "BUTTON") {
            submitBtn.innerHTML = originalBtnContent;
          } else {
            submitBtn.value = originalBtnContent;
          }
          submitBtn.disabled = false;
        }
      }, 700);
    });
  }

  if (btnSendAnother && successState && contactForm) {
    btnSendAnother.addEventListener("click", () => {
      successState.classList.remove("active");
      contactForm.style.display = "flex";
    });
  }

  // 8. Global Announcement Bar Dismissal
  const announcementBar = document.querySelector(".top-announcement-bar");
  const closeAnnouncementBtn = document.querySelector(".bar-close-btn");
  if (closeAnnouncementBtn && announcementBar) {
    closeAnnouncementBtn.addEventListener("click", () => {
      announcementBar.style.transition = "all 0.3s ease";
      announcementBar.style.transform = "translateY(-100%)";
      announcementBar.style.opacity = "0";
      setTimeout(() => (announcementBar.style.display = "none"), 300);
    });
  }

  // 9. Global Footer Newsletter Subscription
  const newsletterForm = document.getElementById("newsletterForm");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const input = newsletterForm.querySelector(".newsletter-input");
      if (input && input.value) {
        const btn = newsletterForm.querySelector(".newsletter-submit-btn, .newsletter-btn");
        const origText = btn ? btn.innerHTML : "Subscribe";
        if (btn) btn.innerHTML = "<span>Subscribed! ✓</span>";

        if (typeof window.showKidoToast === "function") {
          window.showKidoToast("Welcome to the Kido Club. Check your inbox for your 10% coupon code.");
        } else if (typeof window.showKidoModal === "function") {
          window.showKidoModal({
            title: "Welcome to the Kido Club!",
            message: "Check your inbox for your exclusive 10% welcome voucher code.",
            type: "success",
            confirmText: "Explore Collection",
          });
        }

        input.value = "";
        setTimeout(() => {
          if (btn) btn.innerHTML = origText;
        }, 3000);
      }
    });
  }

  // 10. Mobile Offcanvas Teleportation & Scroll Preservation Fix
  // Teleports the offcanvas drawer directly into <body> on mobile so position: fixed is 100%
  // relative to the active viewport, completely resolving the issue where opening the drawer
  // redirects or scrolls the page to the top.
  const menuElement = document.getElementById("menu");
  let menuPlaceholder = null;
  let menuOriginalParent = null;

  if (menuElement) {
    menuOriginalParent = menuElement.parentElement;
    menuPlaceholder = document.createComment("kido-offcanvas-slot");
    if (menuOriginalParent) {
      menuOriginalParent.insertBefore(menuPlaceholder, menuElement);
    }

    function syncOffcanvasDOMPosition() {
      if (window.innerWidth < 1160) {
        if (menuElement.parentElement !== document.body) {
          document.body.appendChild(menuElement);
        }
      } else {
        if (menuOriginalParent && menuPlaceholder && menuPlaceholder.parentNode) {
          if (menuElement.parentElement !== menuOriginalParent) {
            menuOriginalParent.insertBefore(menuElement, menuPlaceholder);
          }
        }
      }
    }

    // Run on initial load
    syncOffcanvasDOMPosition();

    // Preserve scroll position so opening or closing the drawer never scrolls the page to top
    let savedScrollY = 0;
    menuElement.addEventListener("show.bs.offcanvas", () => {
      savedScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    });

    menuElement.addEventListener("shown.bs.offcanvas", () => {
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (Math.abs(currentScrollY - savedScrollY) > 2) {
        window.scrollTo(0, savedScrollY);
      }
    });

    menuElement.addEventListener("hide.bs.offcanvas", () => {
      savedScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    });

    menuElement.addEventListener("hidden.bs.offcanvas", () => {
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (Math.abs(currentScrollY - savedScrollY) > 2) {
        window.scrollTo(0, savedScrollY);
      }
    });
  }

  // 11. Automatically reset mobile navbar toggler when screen is enlarged to desktop
  function handleNavbarScreenResize() {
    if (typeof syncOffcanvasDOMPosition === "function") {
      syncOffcanvasDOMPosition();
    }
    if (window.innerWidth >= 1160) {
      const menu = document.getElementById("menu");
      if (menu) {
        menu.classList.remove("show");
        if (typeof bootstrap !== "undefined") {
          if (bootstrap.Collapse) {
            const bsCollapse = bootstrap.Collapse.getInstance(menu);
            if (bsCollapse) bsCollapse.hide();
          }
          if (bootstrap.Offcanvas) {
            const bsOffcanvas = bootstrap.Offcanvas.getInstance(menu);
            if (bsOffcanvas) bsOffcanvas.hide();
          }
        }
      }
      const togglers = document.querySelectorAll(".navbar-toggler");
      togglers.forEach((btn) => {
        btn.setAttribute("aria-expanded", "false");
        btn.classList.add("collapsed");
      });
      // Remove any lingering backdrops
      document.querySelectorAll(".offcanvas-backdrop").forEach((b) => b.remove());
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("padding-right");
    }
  }
  window.addEventListener("resize", handleNavbarScreenResize);

  // 12. Auto-close offcanvas drawer on mobile when clicking navigation links
  if (menuElement) {
    const clickableLinks = menuElement.querySelectorAll(".nav-menu a, .user-card-link");
    clickableLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth < 1160 && typeof bootstrap !== "undefined" && bootstrap.Offcanvas) {
          const bsOffcanvas = bootstrap.Offcanvas.getInstance(menuElement);
          if (bsOffcanvas) {
            bsOffcanvas.hide();
          }
        }
      });
    });
  }
});

