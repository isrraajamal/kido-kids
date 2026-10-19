/**
 * Kido Kids - Product Details Management (js/product-details.js)
 * High-converting luxury e-commerce product experience:
 * Dynamic gallery, size & design chip selection, quantity controls,
 * Wishlist syncing, accordion tabs, size guide modal, and related products.
 */

function initProductDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = parseInt(urlParams.get("id") || "1", 10);
  const product = window.__KIDO_PRELOADED_PRODUCT || (typeof getProductById === "function" ? getProductById(productId) : null);

  if (!product) return;

  // 1. Bind Product Information
  const breadcrumbCurrent = document.querySelector(".breadcrumb-product-name");
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = product.name;

  const titleEl = document.querySelector(".product-title");
  if (titleEl) titleEl.textContent = product.name;

  const priceEl = document.querySelector(".product-price");
  if (priceEl) priceEl.textContent = `$${product.price.toFixed(2)}`;

  const descEl = document.querySelector(".product-description");
  if (descEl) descEl.textContent = product.description;

  const categoryTag = document.getElementById("pdpCategoryTag");
  if (categoryTag && product.category) {
    categoryTag.textContent = product.category.replace("-", " ").toUpperCase();
  }

  const badgeText = document.getElementById("pdpBadgeText");
  if (badgeText) {
    if (product.category === "eco-friendly") {
      badgeText.textContent = "Eco-Certified Recycled Blend";
    } else if (product.category === "party-wear") {
      badgeText.textContent = "Luxury Organic Partywear";
    } else {
      badgeText.textContent = "100% GOTS Organic Cotton";
    }
  }

  // 2. Interactive Image Gallery & Thumbnails
  const mainImg = document.getElementById("mainProductImg");
  const modalImg = document.querySelector(".modal-image");
  const thumbList = document.getElementById("pdpThumbList");

  // Load genuine multiple views of the same piece
  const galleryImages = (product.gallery && product.gallery.length > 0)
    ? product.gallery
    : [product.image];

  if (mainImg) {
    mainImg.src = galleryImages[0];
    mainImg.alt = product.name;
    mainImg.style.transition = "opacity 0.25s ease";
  }
  if (modalImg) {
    modalImg.src = galleryImages[0];
    modalImg.alt = product.name;
  }

  // Populate thumbnails
  if (thumbList) {
    thumbList.innerHTML = galleryImages
      .map(
        (imgUrl, idx) => `
        <div class="pdp-thumb-item ${idx === 0 ? "active" : ""}" data-img="${imgUrl}">
          <img src="${imgUrl}" alt="${product.name} view ${idx + 1}" />
        </div>
      `
      )
      .join("");

    thumbList.querySelectorAll(".pdp-thumb-item").forEach((thumb) => {
      thumb.addEventListener("click", function () {
        thumbList.querySelectorAll(".pdp-thumb-item").forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");
        const targetImg = thumb.getAttribute("data-img");
        if (mainImg) {
          mainImg.src = targetImg;
        }
        if (modalImg) modalImg.src = targetImg;
      });
    });
  }

  // 3. Dynamic Size Chips
  const sizeChipsRow = document.getElementById("sizeChipsRow");
  const selectedSizeDisplay = document.getElementById("selectedSizeDisplay");
  let selectedSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : "4Y";

  const sizeAgeMap = {
    "2Y": "18–24M",
    "3Y": "2–3 Yrs",
    "4Y": "3–4 Yrs",
    "5Y": "4–5 Yrs",
    "6Y": "5–6 Yrs",
    "7Y": "6–7 Yrs",
    "8Y": "7–8 Yrs",
    "9Y": "8–9 Yrs",
    "10Y": "9–10 Yrs",
    "S": "Small",
    "M": "Medium",
    "L": "Large",
  };

  function getFormattedSize(size) {
    const age = sizeAgeMap[size];
    return age ? `${size} (${age})` : size;
  }

  if (sizeChipsRow && product.sizes) {
    sizeChipsRow.innerHTML = product.sizes
      .map(
        (size, idx) => `
        <button type="button" class="pdp-size-chip ${idx === 0 ? "active" : ""}" data-size="${size}" aria-label="Select size ${size}">
          <span class="pdp-size-tag">${size}</span>
          <span class="pdp-size-sub">${sizeAgeMap[size] || "Standard"}</span>
        </button>
      `
      )
      .join("");

    if (selectedSizeDisplay) {
      selectedSizeDisplay.textContent = getFormattedSize(selectedSize);
    }

    sizeChipsRow.querySelectorAll(".pdp-size-chip, .pdp-chip-btn").forEach((chip) => {
      chip.addEventListener("click", function () {
        sizeChipsRow.querySelectorAll(".pdp-size-chip, .pdp-chip-btn").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        selectedSize = chip.getAttribute("data-size");
        if (selectedSizeDisplay) {
          selectedSizeDisplay.textContent = getFormattedSize(selectedSize);
        }
      });
    });
  }

  // 4. Design / Pattern Chips
  const designChipsRow = document.getElementById("designChipsRow");
  const designDisplay = document.getElementById("selectedDesignDisplay");
  let selectedDesign = "Soft Lavender";

  if (designChipsRow) {
    const activeChip = designChipsRow.querySelector(".pdp-swatch-chip.active, .pdp-chip-btn.active");
    if (activeChip) {
      selectedDesign = activeChip.getAttribute("data-design") || "Soft Lavender";
      if (designDisplay) designDisplay.textContent = selectedDesign;
    }

    designChipsRow.querySelectorAll(".pdp-swatch-chip, .pdp-chip-btn").forEach((chip) => {
      chip.addEventListener("click", function () {
        designChipsRow.querySelectorAll(".pdp-swatch-chip, .pdp-chip-btn").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        selectedDesign = chip.getAttribute("data-design");
        if (designDisplay) designDisplay.textContent = selectedDesign;
      });
    });
  }

  // 5. Quantity Stepper Controls
  const qtyInput = document.querySelector(".quantity-input");
  const decBtn = document.querySelector(".quantity-decrement");
  const incBtn = document.querySelector(".quantity-increment");

  if (qtyInput && decBtn && incBtn) {
    const maxStock = product.quantity || 50;
    qtyInput.max = maxStock;
    let currentQty = 1;

    function updateQty(val) {
      currentQty = Math.max(1, Math.min(maxStock, val));
      qtyInput.value = currentQty;
      decBtn.disabled = currentQty <= 1;
      incBtn.disabled = currentQty >= maxStock;
    }

    decBtn.addEventListener("click", () => updateQty(currentQty - 1));
    incBtn.addEventListener("click", () => updateQty(currentQty + 1));
    updateQty(1);
  }

  // 6. Wishlist Button Management
  const wishlistBtn = document.getElementById("pdpWishlistBtn");
  function getWishlistIds() {
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

  function syncWishlistButton() {
    const wishlist = getWishlistIds();
    document.querySelectorAll(".wishlist-count-badge").forEach((b) => {
      b.textContent = wishlist.length;
    });

    if (!wishlistBtn || !product) return;
    const isSaved = wishlist.includes(parseInt(product.id, 10));
    if (isSaved) {
      wishlistBtn.classList.add("is-active");
      wishlistBtn.title = "Saved in Wishlist";
    } else {
      wishlistBtn.classList.remove("is-active");
      wishlistBtn.title = "Save to Favorites";
    }
  }

  syncWishlistButton();

  if (wishlistBtn) {
    wishlistBtn.addEventListener("click", function () {
      if (!product) return;
      const pid = parseInt(product.id, 10);
      let wishlist = getWishlistIds();
      const idx = wishlist.indexOf(pid);
      let isNowSaved = false;

      if (idx > -1) {
        wishlist.splice(idx, 1);
        isNowSaved = false;
      } else {
        wishlist.push(pid);
        isNowSaved = true;
      }

      if (window.KidoWishlist && typeof window.KidoWishlist.set === "function") {
        window.KidoWishlist.set(wishlist);
      } else {
        localStorage.setItem("kido_wishlist", JSON.stringify(wishlist));
      }
      syncWishlistButton();

      // Update header badges
      document.querySelectorAll(".wishlist-count-badge").forEach((b) => {
        b.textContent = wishlist.length;
      });

      // Quick toast notification
      if (typeof window.showKidoToast === "function") {
        window.showKidoToast(
          isNowSaved ? `Added "${product.name}" to your saved favorites!` : `Removed "${product.name}" from favorites.`
        );
      }
    });
  }

  // 7. Add to Cart Handling
  const addToCartBtn = document.getElementById("pdpAddToCartBtn") || document.querySelector(".add-to-cart-btn");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", function () {
      const qty = parseInt(qtyInput ? qtyInput.value : "1", 10) || 1;

      try {
        let items = JSON.parse(localStorage.getItem("kido_cart_items") || "[]");
        const existingIdx = items.findIndex((i) => i.id === product.id);

        if (existingIdx > -1) {
          items[existingIdx].qty = (items[existingIdx].qty || 1) + qty;
          if (selectedSize) items[existingIdx].size = selectedSize;
          if (selectedDesign) items[existingIdx].color = selectedDesign;
        } else {
          items.push({
            id: product.id,
            name: product.name,
            price: product.price,
            qty: qty,
            image: product.image,
            size: selectedSize,
            color: selectedDesign || product.color || "Organic Natural",
          });
        }

        localStorage.setItem("kido_cart_items", JSON.stringify(items));
        const totalCount = items.reduce((sum, i) => sum + (i.qty || 1), 0);
        localStorage.setItem("kido_cart_count", totalCount.toString());
      } catch (e) {
        console.error("Cart update error", e);
      }

      if (typeof window.updateCartBadge === "function") {
        window.updateCartBadge();
      }

      // Visual success state
      const origHtml = addToCartBtn.innerHTML;
      addToCartBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Added to Bag!</span>
      `;
      addToCartBtn.style.backgroundColor = "#166534";
      addToCartBtn.style.color = "#ffffff";
      addToCartBtn.style.borderColor = "#166534";

      setTimeout(() => {
        addToCartBtn.innerHTML = origHtml;
        addToCartBtn.style.backgroundColor = "";
        addToCartBtn.style.color = "";
        addToCartBtn.style.borderColor = "";
      }, 1600);
    });
  }

  // 8. Accordion Tabs Toggle (Strict Single-Open Behavior)
  const accordionItems = document.querySelectorAll(".pdp-accordion-item");
  accordionItems.forEach((item) => {
    const trigger = item.querySelector(".pdp-accordion-trigger");
    if (trigger) {
      trigger.addEventListener("click", function () {
        const isCurrentlyOpen = item.classList.contains("open");

        // Close all other accordion items so only one can be open at a time
        accordionItems.forEach((otherItem) => {
          otherItem.classList.remove("open");
        });

        // If the clicked one was closed, open it; if it was already open, toggle it closed
        if (!isCurrentlyOpen) {
          item.classList.add("open");
        }
      });
    }
  });

  // 9. Size Guide Modal
  const sizeModal = document.getElementById("pdpSizeModal");
  const openSizeBtn = document.getElementById("btnOpenSizeGuide");
  const closeSizeBtn = document.getElementById("btnCloseSizeModal");

  if (sizeModal && openSizeBtn) {
    openSizeBtn.addEventListener("click", () => sizeModal.classList.add("active"));
  }
  if (sizeModal && closeSizeBtn) {
    closeSizeBtn.addEventListener("click", () => sizeModal.classList.remove("active"));
  }
  if (sizeModal) {
    sizeModal.addEventListener("click", function (e) {
      if (e.target === sizeModal) sizeModal.classList.remove("active");
    });
  }

  // 10. Image Zoom Modal
  const zoomBtn = document.getElementById("pdpZoomBtn") || document.querySelector(".image-zoom-btn");
  const imageModal = document.getElementById("imageModal");
  const modalCloseBtn = document.querySelector(".modal-close-btn");
  const zoomInBtn = document.querySelector(".zoom-in");
  const zoomOutBtn = document.querySelector(".zoom-out");
  const zoomLevelText = document.querySelector(".zoom-level");
  let zoomScale = 1;

  function syncHeaderHeight() {
    const header = document.querySelector("header");
    if (header) {
      const h = header.offsetHeight;
      document.documentElement.style.setProperty("--header-height", `${h}px`);
    }
  }
  syncHeaderHeight();
  window.addEventListener("resize", syncHeaderHeight);

  if (zoomBtn && imageModal) {
    function openImageModal() {
      syncHeaderHeight();
      zoomScale = 1;
      updateZoom();
      imageModal.style.display = "flex";
    }

    function closeImageModal() {
      imageModal.style.display = "none";
      zoomScale = 1;
      updateZoom();
    }

    zoomBtn.addEventListener("click", openImageModal);
    const mainImgWrap = document.getElementById("mainImgWrap");
    if (mainImgWrap) {
      mainImgWrap.addEventListener("click", (e) => {
        if (!e.target.closest("#pdpBadge") && !e.target.closest("#pdpZoomBtn")) {
          openImageModal();
        }
      });
    }
    modalCloseBtn?.addEventListener("click", closeImageModal);

    imageModal.addEventListener("click", (e) => {
      if (e.target === imageModal || e.target.classList.contains("modal-image-wrapper")) {
        closeImageModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && imageModal.style.display === "flex") {
        closeImageModal();
      }
    });

    function updateZoom() {
      if (modalImg) modalImg.style.transform = `scale(${zoomScale})`;
      if (zoomLevelText) zoomLevelText.textContent = `${Math.round(zoomScale * 100)}%`;
    }

    zoomInBtn?.addEventListener("click", () => {
      zoomScale = Math.min(zoomScale + 0.25, 3);
      updateZoom();
    });

    zoomOutBtn?.addEventListener("click", () => {
      zoomScale = Math.max(zoomScale - 0.25, 0.5);
      updateZoom();
    });
  }

  // 11. Populate "Complete The Outfit" Related Products
  const relatedGrid = document.getElementById("pdpRelatedGrid");
  if (relatedGrid && typeof ProductsList !== "undefined") {
    // Select 4 other products
    const relatedItems = ProductsList.filter((item) => item.id !== product.id).slice(0, 4);

    relatedGrid.innerHTML = relatedItems
      .map(
        (item) => `
        <div class="pdp-related-card" data-id="${item.id}">
          <div class="pdp-related-img-wrap">
            <a href="product-details.html?id=${item.id}" class="pdp-related-img-link" aria-label="View ${item.name}">
              <img src="${item.image}" alt="${item.name}" loading="lazy" />
            </a>
            <button type="button" class="quick-view" data-id="${item.id}" aria-label="Quick preview ${item.name}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Quick View</span>
            </button>
          </div>
          <div class="pdp-related-info">
            <div class="pdp-related-rating">★★★★★ <span style="color: rgba(64,62,62,0.6); font-size: 11px;">(4.9)</span></div>
            <h4 class="pdp-related-title">
              <a href="product-details.html?id=${item.id}" style="color: inherit;">${item.name}</a>
            </h4>
            <div class="pdp-related-bottom">
              <span class="pdp-related-price">$${item.price.toFixed(2)}</span>
              <a href="product-details.html?id=${item.id}" class="pdp-related-view-btn">View Item &rarr;</a>
            </div>
          </div>
        </div>
      `
      )
      .join("");
  }

  // 12. Interactive Quick View Modal for Related Products
  const qvModal = document.getElementById("quickViewModal");
  let activeModalProductId = null;
  let activeModalQty = 1;
  let activeModalSize = "4Y";

  function openQuickView(id) {
    if (typeof getProductById !== "function") return;
    const targetProduct = getProductById(id);
    if (!targetProduct || !qvModal) return;

    activeModalProductId = targetProduct.id;
    activeModalQty = 1;

    // Populate data
    const modalImg = qvModal.querySelector(".modal-img-col img");
    const modalCategory = qvModal.querySelector(".modal-product-category");
    const modalTitle = qvModal.querySelector(".modal-product-title");
    const modalPrice = qvModal.querySelector(".modal-product-price");
    const modalDesc = qvModal.querySelector(".modal-product-desc");
    const sizeChipsContainer = qvModal.querySelector(".size-chips");
    const qtyNumber = qvModal.querySelector(".qty-number");

    if (modalImg) modalImg.src = targetProduct.image;
    if (modalCategory) modalCategory.textContent = (targetProduct.category || "Apparel").replace("-", " ");
    if (modalTitle) modalTitle.textContent = targetProduct.name;
    if (modalPrice) modalPrice.textContent = `$${targetProduct.price.toFixed(2)}`;
    if (modalDesc) modalDesc.textContent = targetProduct.description || "Soft, comfortable, and breathable children's garment crafted from organic cotton.";
    if (qtyNumber) qtyNumber.textContent = "1";

    const modalFullDetailsLink = qvModal.querySelector("#modalViewFullDetails");
    if (modalFullDetailsLink) {
      modalFullDetailsLink.href = `product-details.html?id=${targetProduct.id}`;
    }

    // Generate sizes
    if (sizeChipsContainer) {
      sizeChipsContainer.innerHTML = "";
      const sizes = targetProduct.sizes || ["2Y", "4Y", "6Y", "8Y"];
      activeModalSize = sizes[0];
      sizes.forEach((sz, idx) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = `size-chip ${idx === 0 ? "active" : ""}`;
        chip.textContent = sz;
        chip.addEventListener("click", () => {
          qvModal.querySelectorAll(".size-chip").forEach((c) => c.classList.remove("active"));
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

    qvModal.classList.add("active");
    window.addEventListener("wheel", preventModalScroll, { passive: false });
    window.addEventListener("touchmove", preventModalScroll, { passive: false });
  }

  function closeQuickView() {
    if (!qvModal) return;
    qvModal.classList.remove("active");
    if (window._preventModalScroll) {
      window.removeEventListener("wheel", window._preventModalScroll);
      window.removeEventListener("touchmove", window._preventModalScroll);
    }
  }

  // Click handler for Quick View button
  document.addEventListener("click", function (e) {
    const qvBtn = e.target.closest(".quick-view");
    if (qvBtn) {
      e.preventDefault();
      e.stopPropagation();
      const card = qvBtn.closest(".pdp-related-card") || qvBtn.closest(".product-card");
      const id = qvBtn.dataset.id || card?.dataset.id || "1";
      openQuickView(id);
      return;
    }
  });

  if (qvModal) {
    qvModal.addEventListener("click", (e) => {
      if (e.target === qvModal || e.target.closest(".modal-close-icon")) {
        closeQuickView();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && qvModal.classList.contains("active")) {
        closeQuickView();
      }
    });

    // Quantity controls inside modal
    const minusBtn = qvModal.querySelector(".qty-minus");
    const plusBtn = qvModal.querySelector(".qty-plus");
    const qtySpan = qvModal.querySelector(".qty-number");

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
    const modalAddBtn = qvModal.querySelector(".modal-add-cart-btn");
    if (modalAddBtn) {
      modalAddBtn.addEventListener("click", () => {
        const count = parseInt(localStorage.getItem("kido_cart_count") || "0", 10);
        localStorage.setItem("kido_cart_count", count + activeModalQty);

        const targetProduct = typeof getProductById === "function" ? getProductById(activeModalProductId) : null;
        const name = targetProduct ? targetProduct.name : "Item";

        try {
          let items = JSON.parse(localStorage.getItem("kido_cart_items") || "[]");
          if (targetProduct) {
            const existing = items.find(
              (i) => i.id == activeModalProductId
            );
            if (existing) {
              existing.qty += activeModalQty;
              if (activeModalSize) existing.size = activeModalSize;
            } else {
              items.push({
                id: parseInt(activeModalProductId, 10),
                name: targetProduct.name,
                price: targetProduct.price,
                qty: activeModalQty,
                image: targetProduct.image,
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

        if (typeof window.showKidoToast === "function") {
          window.showKidoToast(`Added ${activeModalQty}x "${name}" (${activeModalSize}) to your bag.`);
        }

        closeQuickView();
      });
    }
  }

  // Smooth scroll to reviews if clicked
  const reviewsJump = document.getElementById("pdpReviewsJump");
  if (reviewsJump) {
    reviewsJump.addEventListener("click", function () {
      const revSection = document.getElementById("testimonials") || document.getElementById("pdpReviewsSection");
      if (revSection) {
        revSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // Testimonials Carousel (Matches index.html exactly)
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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProductDetails);
} else {
  initProductDetails();
}
