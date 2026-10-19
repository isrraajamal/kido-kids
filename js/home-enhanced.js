/**
 * Kido Kids - Home Page Enhanced Interactions
 * Enhances UX with professional e-commerce features:
 * - Top announcement bar dismissal
 * - Scrolled header states
 * - Wishlist toggles & badges
 * - Owl Carousel custom Prev/Next controls & filter tabs
 * - Quick View Modal & direct Add to Cart
 * - Live Countdown timer for promotions
 * - One-click coupon code copy
 * - Newsletter subscription handling
 * - Floating Back to Top button
 * - Real-time Toast Notifications
 */

document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------------------
  // 1. Toast Notification Utility
  // ------------------------------------------------------------------------
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

  // ------------------------------------------------------------------------
  // 2. Top Announcement Bar
  // ------------------------------------------------------------------------
  const announcementBar = document.querySelector(".top-announcement-bar");
  const closeAnnouncementBtn = document.querySelector(".bar-close-btn");
  const promoCodeSnippet = document.querySelector(".top-announcement-bar .promo-code");

  if (closeAnnouncementBtn && announcementBar) {
    closeAnnouncementBtn.addEventListener("click", () => {
      announcementBar.style.marginTop = `-${announcementBar.offsetHeight}px`;
      announcementBar.style.opacity = "0";
      setTimeout(() => {
        announcementBar.style.display = "none";
      }, 300);
    });
  }

  if (promoCodeSnippet) {
    promoCodeSnippet.addEventListener("click", () => {
      const code = promoCodeSnippet.textContent.trim().replace(/['"]/g, "");
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
          showKidoToast(`Code ${code} copied to clipboard. Enjoy 15% off.`);
        });
      }
    });
  }

  // ------------------------------------------------------------------------
  // 3. Header Scroll Effect
  // ------------------------------------------------------------------------
  const header = document.querySelector("header");
  if (header) {
    window.addEventListener(
      "scroll",
      () => {
        if (window.scrollY > 30) {
          header.classList.add("scrolled");
        } else {
          header.classList.remove("scrolled");
        }
      },
      { passive: true }
    );
  }

  // ------------------------------------------------------------------------
  // 4. Wishlist System (Clear, Big, Filled & Persistent on Refresh)
  // ------------------------------------------------------------------------
  function getWishlist() {
    if (window.KidoWishlist && typeof window.KidoWishlist.get === "function") {
      return window.KidoWishlist.get();
    }
    const stored = localStorage.getItem("kido_wishlist");
    if (stored === null) {
      const defaultIds = [1, 2, 3, 5];
      localStorage.setItem("kido_wishlist", JSON.stringify(defaultIds));
      return defaultIds;
    }
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0
        ? parsed.map((x) => parseInt(x, 10))
        : [1, 2, 3, 5];
    } catch (e) {
      return [1, 2, 3, 5];
    }
  }

  function getHeartSvg(filled = false) {
    if (filled) {
      return `<svg class="heart-icon filled" width="22" height="22" viewBox="0 0 24 24" fill="#ff4757" stroke="#ff4757" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
    }
    return `<svg class="heart-icon outline" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2d3748" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
  }

  function updateWishlistBadge() {
    const list = getWishlist();
    const badges = document.querySelectorAll(".wishlist-count-badge");
    badges.forEach((b) => (b.textContent = list.length));
  }

  function syncWishlistButtons() {
    const wishlist = getWishlist();
    const buttons = document.querySelectorAll(".wishlist-toggle-btn");
    buttons.forEach((btn) => {
      const id = parseInt(btn.dataset.id || "0", 10);
      const isFav = wishlist.includes(id);
      if (isFav) {
        btn.classList.add("active");
        btn.setAttribute("aria-label", "Remove from Wishlist");
        btn.setAttribute("title", "Saved in Wishlist");
        btn.innerHTML = getHeartSvg(true);
      } else {
        btn.classList.remove("active");
        btn.setAttribute("aria-label", "Save to Wishlist");
        btn.setAttribute("title", "Save to Wishlist");
        btn.innerHTML = getHeartSvg(false);
      }
    });
    updateWishlistBadge();
  }

  // Initial sync on page load - keeps wishlist hearts filled even when refreshed!
  syncWishlistButtons();
  window.syncWishlistButtons = syncWishlistButtons;

  // Sync again after carousel clones slides (for Owl Carousel loop)
  setTimeout(syncWishlistButtons, 100);
  setTimeout(syncWishlistButtons, 400);

  // Sync across tabs/windows
  window.addEventListener("storage", function (e) {
    if (e.key === "kido_wishlist") {
      syncWishlistButtons();
    }
  });

  // Attach wishlist click delegates
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".wishlist-toggle-btn");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    const productId = parseInt(btn.dataset.id || "1", 10);
    let list = getWishlist();
    const index = list.indexOf(productId);
    const isRemoving = index > -1;

    if (isRemoving) {
      list.splice(index, 1);
    } else {
      list.push(productId);
    }

    if (window.KidoWishlist && typeof window.KidoWishlist.set === "function") {
      window.KidoWishlist.set(list);
    } else {
      localStorage.setItem("kido_wishlist", JSON.stringify(list));
    }

    // Update ALL matching buttons (including cloned slides in Owl Carousel)
    const matching = document.querySelectorAll(`.wishlist-toggle-btn[data-id="${productId}"]`);
    matching.forEach((b) => {
      if (isRemoving) {
        b.classList.remove("active");
        b.setAttribute("aria-label", "Save to Wishlist");
        b.setAttribute("title", "Save to Wishlist");
        b.innerHTML = getHeartSvg(false);
      } else {
        b.classList.add("active");
        b.setAttribute("aria-label", "Remove from Wishlist");
        b.setAttribute("title", "Saved in Wishlist");
        b.innerHTML = getHeartSvg(true);
      }
    });

    updateWishlistBadge();

    const product = typeof getProductById === "function" ? getProductById(productId) : null;
    const prodName = product ? product.name : "Item";
    showKidoToast(
      isRemoving
        ? `Removed "${prodName}" from your wishlist.`
        : `Added "${prodName}" to your wishlist.`
    );
  });

  // ------------------------------------------------------------------------
  // 5. Owl Carousel Controls & Dynamic Category Filter
  // ------------------------------------------------------------------------
  const $carousel = $("#products .owl-carousel");
  const prevBtn = document.getElementById("carouselPrev");
  const nextBtn = document.getElementById("carouselNext");

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => {
      $carousel.trigger("prev.owl.carousel");
    });
    nextBtn.addEventListener("click", () => {
      $carousel.trigger("next.owl.carousel");
    });
  }

  // Category filter tabs on carousel
  const filterTabs = document.querySelectorAll(".filter-tab-btn");
  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      filterTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const category = tab.dataset.category;
      if (typeof ProductsList === "undefined") return;

      const filtered =
        category === "all"
          ? ProductsList
          : ProductsList.filter((p) => p.category === category);

      // Re-populate carousel items
      if ($carousel.length && filtered.length > 0) {
        $carousel.trigger("destroy.owl.carousel");
        let html = "";
        filtered.forEach((item) => {
          const isFav = getWishlist().includes(item.id);
          html += `
            <div class="item">
              <div class="product-card" data-id="${item.id}">
                <div class="product-img">
                  <span class="product-badge-pill ${
                    item.category === "eco-friendly" ? "badge-eco" : "badge-new"
                  }">${item.category.replace("-", " ")}</span>
                  <button class="wishlist-toggle-btn ${isFav ? "active" : ""}" data-id="${item.id}" aria-label="${isFav ? "Remove from Wishlist" : "Save to Wishlist"}" title="${isFav ? "Saved in Wishlist" : "Save to Wishlist"}">
                    ${getHeartSvg(isFav)}
                  </button>
                  <div class="quick-view" data-id="${item.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    Quick View
                  </div>
                  <img src="${item.image}" alt="${item.name}" />
                </div>
                <div class="card-content-wrap">
                  <div class="card-rating">
                    ★★★★★ <span class="rating-count">(4.9)</span>
                  </div>
                  <a href="product-details.html?id=${item.id}">
                    <p>${item.name}</p>
                  </a>
                  <div class="card-footer-flex">
                    <span class="price-tag">$${item.price.toFixed(2)}</span>
                    <button class="quick-add-icon-btn" data-id="${item.id}">+ Add</button>
                  </div>
                </div>
              </div>
            </div>
          `;
        });
        $carousel.html(html);
        $carousel.owlCarousel({
          loop: filtered.length > 3,
          margin: 24,
          nav: false,
          dots: false,
          autoplay: true,
          autoplayTimeout: 3500,
          autoplayHoverPause: true,
          rtl: $("html").attr("dir") === "rtl",
          responsive: {
            0: { items: 1, margin: 0 },
            600: { items: 2, margin: 24 },
            800: { items: 3, margin: 24 },
            1200: { items: 4, margin: 24 },
          },
        });
        setTimeout(syncWishlistButtons, 100);
      }
    });
  });

  // ------------------------------------------------------------------------
  // 5b. Testimonials Owl Carousel
  // ------------------------------------------------------------------------
  if (typeof window.$ !== "undefined" && $(".testimonials-carousel").length) {
    $(".testimonials-carousel").owlCarousel({
      loop: true,
      margin: 24,
      nav: false,
      dots: true,
      autoplay: true,
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      rtl: $("html").attr("dir") === "rtl",
      responsive: {
        0: { items: 1, margin: 12 },
        768: { items: 2, margin: 20 },
        1024: { items: 3, margin: 24 },
      },
    });
  }

  // ------------------------------------------------------------------------
  // 6. Interactive Quick View Modal
  // ------------------------------------------------------------------------
  const modal = document.getElementById("quickViewModal");
  let activeModalProductId = null;
  let activeModalQty = 1;
  let activeModalSize = "4Y";

  function openQuickView(id) {
    if (typeof getProductById !== "function") return;
    const product = getProductById(id);
    if (!product || !modal) return;

    activeModalProductId = product.id;
    activeModalQty = 1;

    // Populate data
    const modalImg = modal.querySelector(".modal-img-col img");
    const modalCategory = modal.querySelector(".modal-product-category");
    const modalTitle = modal.querySelector(".modal-product-title");
    const modalPrice = modal.querySelector(".modal-product-price");
    const modalDesc = modal.querySelector(".modal-product-desc");
    const sizeChipsContainer = modal.querySelector(".size-chips");
    const qtyNumber = modal.querySelector(".qty-number");

    if (modalImg) modalImg.src = product.image;
    if (modalCategory) modalCategory.textContent = product.category.replace("-", " ");
    if (modalTitle) modalTitle.textContent = product.name;
    if (modalPrice) modalPrice.textContent = `$${product.price.toFixed(2)}`;
    if (modalDesc) modalDesc.textContent = product.description;
    if (qtyNumber) qtyNumber.textContent = "1";

    const modalFullDetailsLink = modal.querySelector("#modalViewFullDetails");
    if (modalFullDetailsLink) {
      modalFullDetailsLink.href = `product-details.html?id=${product.id}`;
    }

    // Generate sizes
    if (sizeChipsContainer) {
      sizeChipsContainer.innerHTML = "";
      const sizes = product.sizes || ["2Y", "4Y", "6Y", "8Y"];
      activeModalSize = sizes[0];
      sizes.forEach((sz, idx) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = `size-chip ${idx === 0 ? "active" : ""}`;
        chip.textContent = sz;
        chip.addEventListener("click", () => {
          modal.querySelectorAll(".size-chip").forEach((c) => c.classList.remove("active"));
          chip.classList.add("active");
          activeModalSize = sz;
        });
        sizeChipsContainer.appendChild(chip);
      });
    }

    function preventModalScroll(e) {
      if (!e.target.closest(".quick-view-dialog")) {
        e.preventDefault();
      }
    }
    window._preventModalScroll = preventModalScroll;

    modal.classList.add("active");
    window.addEventListener("wheel", preventModalScroll, { passive: false });
    window.addEventListener("touchmove", preventModalScroll, { passive: false });
  }

  function closeQuickView() {
    if (!modal) return;
    modal.classList.remove("active");
    if (window._preventModalScroll) {
      window.removeEventListener("wheel", window._preventModalScroll);
      window.removeEventListener("touchmove", window._preventModalScroll);
    }
  }

  // Open triggers: click on quick-view button OR product image
  document.addEventListener("click", function (e) {
    // 1. Wishlist button takes precedence - do NOT open quick view or navigate
    if (e.target.closest(".wishlist-toggle-btn")) {
      return;
    }

    // 2. Click specifically on Quick View pill button -> Open Quick View Modal
    const qvTrigger = e.target.closest(".quick-view");
    if (qvTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const card = qvTrigger.closest(".product-card");
      const id = qvTrigger.dataset.id || card?.dataset.id || "1";
      openQuickView(id);
      return;
    }

    // 3. Click on product image container -> Navigate directly to Full Product Page
    const imgTrigger = e.target.closest(".product-img");
    if (imgTrigger) {
      const card = imgTrigger.closest(".product-card");
      const id = card?.dataset.id || imgTrigger.querySelector(".quick-view")?.dataset.id || "1";
      window.location.href = `product-details.html?id=${id}`;
      return;
    }

    const quickAddTrigger = e.target.closest(".quick-add-icon-btn");
    if (quickAddTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const id = quickAddTrigger.dataset.id || "1";
      const product = typeof getProductById === "function" ? getProductById(id) : null;
      const count = parseInt(localStorage.getItem("kido_cart_count") || "0", 10);
      localStorage.setItem("kido_cart_count", count + 1);
      
      // Persist into kido_cart_items for cart.html
      try {
        let items = JSON.parse(localStorage.getItem("kido_cart_items") || "[]");
        if (product) {
          const existing = items.find((i) => i.id == id);
          if (existing) {
            existing.qty += 1;
          } else {
            items.push({
              id: parseInt(id, 10),
              name: product.name,
              price: product.price,
              qty: 1,
              image: product.image,
              size: "4Y",
              color: "Default",
            });
          }
          localStorage.setItem("kido_cart_items", JSON.stringify(items));
        }
      } catch (err) {}

      if (window.updateCartBadge) window.updateCartBadge();

      // Animate badge
      const cartLink = document.querySelector(".custom-btn[aria-label='Cart']");
      if (cartLink) {
        cartLink.classList.remove("cart-badge-pulse");
        void cartLink.offsetWidth;
        cartLink.classList.add("cart-badge-pulse");
      }

      showKidoToast(`${product ? product.name : "Item"} added to your bag.`);
    }
  });

  // Modal close listeners
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.closest(".modal-close-icon")) {
        closeQuickView();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("active")) {
        closeQuickView();
      }
    });

    // Quantity controls inside modal
    const minusBtn = modal.querySelector(".qty-minus");
    const plusBtn = modal.querySelector(".qty-plus");
    const qtySpan = modal.querySelector(".qty-number");

    if (minusBtn && plusBtn && qtySpan) {
      minusBtn.addEventListener("click", () => {
        if (activeModalQty > 1) {
          activeModalQty--;
          qtySpan.textContent = activeModalQty;
        }
      });
      plusBtn.addEventListener("click", () => {
        activeModalQty++;
        qtySpan.textContent = activeModalQty;
      });
    }

    // Modal Add To Cart
    const modalAddBtn = modal.querySelector(".modal-add-cart-btn");
    if (modalAddBtn) {
      modalAddBtn.addEventListener("click", () => {
        const count = parseInt(localStorage.getItem("kido_cart_count") || "0", 10);
        localStorage.setItem("kido_cart_count", count + activeModalQty);

        const product = typeof getProductById === "function" ? getProductById(activeModalProductId) : null;
        const name = product ? product.name : "Item";

        // Persist into kido_cart_items for cart.html
        try {
          let items = JSON.parse(localStorage.getItem("kido_cart_items") || "[]");
          if (product) {
            const existing = items.find(
              (i) => i.id == activeModalProductId
            );
            if (existing) {
              existing.qty += activeModalQty;
              if (activeModalSize) existing.size = activeModalSize;
            } else {
              items.push({
                id: parseInt(activeModalProductId, 10),
                name: product.name,
                price: product.price,
                qty: activeModalQty,
                image: product.image,
                size: activeModalSize,
                color: "Default",
              });
            }
            localStorage.setItem("kido_cart_items", JSON.stringify(items));
          }
        } catch (err) {}

        if (window.updateCartBadge) window.updateCartBadge();

        const cartLink = document.querySelector(".custom-btn[aria-label='Cart']");
        if (cartLink) {
          cartLink.classList.remove("cart-badge-pulse");
          void cartLink.offsetWidth;
          cartLink.classList.add("cart-badge-pulse");
        }

        showKidoToast(`Added ${activeModalQty}x ${name} (${activeModalSize}) to bag.`);
        closeQuickView();
      });
    }
  }

  // ------------------------------------------------------------------------
  // 7. Live Countdown Timer for Offers Section
  // ------------------------------------------------------------------------
  const daysEl = document.getElementById("offerDays");
  const hoursEl = document.getElementById("offerHours");
  const minutesEl = document.getElementById("offerMinutes");
  const secondsEl = document.getElementById("offerSeconds");

  if (daysEl && hoursEl && minutesEl && secondsEl) {
    // Set target date 3 days from now if not already in session
    let targetTime = sessionStorage.getItem("kido_offer_target");
    if (!targetTime) {
      targetTime = Date.now() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000;
      sessionStorage.setItem("kido_offer_target", targetTime);
    } else {
      targetTime = parseInt(targetTime, 10);
    }

    function updateTimer() {
      const now = Date.now();
      let diff = Math.max(0, targetTime - now);

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff -= d * (1000 * 60 * 60 * 24);

      const h = Math.floor(diff / (1000 * 60 * 60));
      diff -= h * (1000 * 60 * 60);

      const m = Math.floor(diff / (1000 * 60));
      diff -= m * (1000 * 60);

      const s = Math.floor(diff / 1000);

      daysEl.textContent = String(d).padStart(2, "0");
      hoursEl.textContent = String(h).padStart(2, "0");
      minutesEl.textContent = String(m).padStart(2, "0");
      secondsEl.textContent = String(s).padStart(2, "0");
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  // ------------------------------------------------------------------------
  // 8. Copy Coupon Code Button
  // ------------------------------------------------------------------------
  const copyCouponBtn = document.getElementById("copyCouponBtn");
  if (copyCouponBtn) {
    copyCouponBtn.addEventListener("click", () => {
      const code = document.querySelector(".coupon-code-text")?.textContent.trim() || "KIDOFUN20";
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
          copyCouponBtn.textContent = "Copied! ✓";
          copyCouponBtn.classList.add("copied");
          showKidoToast(`Coupon ${code} copied to clipboard. Enjoy 20% off.`);
          setTimeout(() => {
            copyCouponBtn.textContent = "Copy Code";
            copyCouponBtn.classList.remove("copied");
          }, 2500);
        });
      }
    });
  }

  // ------------------------------------------------------------------------
  // 9. Newsletter Subscription Handler
  // ------------------------------------------------------------------------
  const newsletterForm = document.getElementById("newsletterForm");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector(".newsletter-input");
      if (input && input.value) {
        showKidoToast("Welcome to the Kido Club. Check your email for your 10% voucher.");
        input.value = "";
      }
    });
  }

  // ------------------------------------------------------------------------
  // 10. Back to Top Floating Button
  // ------------------------------------------------------------------------
  const backToTopBtn = document.getElementById("backToTopBtn");
  if (backToTopBtn) {
    window.addEventListener(
      "scroll",
      () => {
        if (window.scrollY > 400) {
          backToTopBtn.classList.add("visible");
        } else {
          backToTopBtn.classList.remove("visible");
        }
      },
      { passive: true }
    );

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});
