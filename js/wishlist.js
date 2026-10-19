/**
 * Kido Kids - Wishlist Management Script (js/wishlist.js)
 * Handles wishlist retrieval, removal, dynamic size selection, single & batch "Add to Bag",
 * wishlist sharing, and synchronization with header badges and localStorage.
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Toast Notification Helper
  function showToast(message, type = "success") {
    if (typeof window.showKidoToast === "function") {
      window.showKidoToast(message, type);
      return;
    }
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
    }, 3200);
  }

  // 2. Wishlist Storage Management
  function getWishlistIds() {
    if (window.KidoWishlist && typeof window.KidoWishlist.get === "function") {
      return window.KidoWishlist.get();
    }
    const stored = localStorage.getItem("kido_wishlist");
    if (!stored) {
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

  function saveWishlistIds(ids) {
    if (window.KidoWishlist && typeof window.KidoWishlist.set === "function") {
      window.KidoWishlist.set(ids);
    } else {
      localStorage.setItem("kido_wishlist", JSON.stringify(ids));
      updateWishlistBadges(ids.length);
    }
  }

  function updateWishlistBadges(count) {
    if (window.KidoWishlist && typeof window.KidoWishlist.updateDisplays === "function") {
      window.KidoWishlist.updateDisplays(count);
      return;
    }
    document.querySelectorAll(".wishlist-count-badge").forEach((badge) => {
      badge.textContent = count;
    });

    const headerCount = document.getElementById("wishlistHeaderCount");
    if (headerCount) {
      headerCount.textContent = `${count} item${count === 1 ? "" : "s"}`;
    }

    const toolbarCount = document.getElementById("wishlistToolbarCount");
    if (toolbarCount) {
      toolbarCount.textContent = `${count} saved favorite${count === 1 ? "" : "s"}`;
    }
  }

  // 3. Cart Storage Management
  function getCartItems() {
    try {
      const stored = localStorage.getItem("kido_cart_items");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCartItems(items) {
    localStorage.setItem("kido_cart_items", JSON.stringify(items));
    const totalCount = items.reduce((acc, item) => acc + (item.qty || 1), 0);
    localStorage.setItem("kido_cart_count", totalCount.toString());

    document.querySelectorAll("[data-hook='items-count']").forEach((el) => {
      el.textContent = totalCount;
    });

    // Pulse cart button
    const cartWrapper = document.querySelector(".cart-btn-wrapper");
    if (cartWrapper) {
      cartWrapper.classList.remove("pulse-badge");
      void cartWrapper.offsetWidth; // trigger reflow
      cartWrapper.classList.add("pulse-badge");
    }
  }

  function addItemToCart(product, size = "4Y") {
    const items = getCartItems();
    const existingIndex = items.findIndex((item) => item.id === product.id);

    if (existingIndex > -1) {
      items[existingIndex].qty = (items[existingIndex].qty || 1) + 1;
      if (size) items[existingIndex].size = size;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        image: product.image,
        size: size,
        color: product.color || "Organic Natural",
      });
    }

    saveCartItems(items);
  }

  // 4. DOM Elements
  const wishlistGrid = document.getElementById("wishlistGrid");
  const emptyWishlistCard = document.getElementById("emptyWishlistCard");
  const wishlistToolbar = document.getElementById("wishlistToolbar");
  const addAllToCartBtn = document.getElementById("addAllToCartBtn");
  const shareWishlistBtn = document.getElementById("shareWishlistBtn");
  const wishlistRecGrid = document.getElementById("wishlistRecGrid");

  // Helper to fetch product details from ProductsList or fallback
  function findProduct(id) {
    if (typeof getProductById === "function") {
      return getProductById(id);
    }
    if (typeof ProductsList !== "undefined") {
      return (
        ProductsList.find((p) => p.id === parseInt(id, 10)) || ProductsList[0]
      );
    }
    return {
      id: id,
      name: "Organic Kids Clothing",
      price: 29.99,
      image: "images/product-1.jpg",
      sizes: ["2Y", "4Y", "6Y", "8Y"],
      category: "party-wear",
      description: "Crafted with love from 100% certified organic cotton.",
    };
  }

  // 5. Render Wishlist Items
  function renderWishlist() {
    const ids = getWishlistIds();
    updateWishlistBadges(ids.length);

    if (ids.length === 0) {
      if (wishlistGrid) wishlistGrid.style.display = "none";
      if (wishlistToolbar) wishlistToolbar.style.display = "none";
      if (emptyWishlistCard) emptyWishlistCard.classList.add("show");
      renderRecommendations(ids);
      return;
    }

    if (emptyWishlistCard) emptyWishlistCard.classList.remove("show");
    if (wishlistGrid) wishlistGrid.style.display = "grid";
    if (wishlistToolbar) wishlistToolbar.style.display = "flex";

    let html = "";
    ids.forEach((id) => {
      const product = findProduct(id);
      if (!product) return;

      const sizes = product.sizes && product.sizes.length ? product.sizes : ["2Y", "4Y", "6Y", "8Y"];
      const defaultSize = sizes[0];

      let sizeChipsHtml = "";
      sizes.forEach((sz, idx) => {
        const isActive = idx === 0 ? "active" : "";
        sizeChipsHtml += `<button type="button" class="wishlist-size-chip ${isActive}" data-size="${sz}">${sz}</button>`;
      });

      html += `
        <article class="wishlist-card" data-product-id="${product.id}" data-selected-size="${defaultSize}">
          <div class="wishlist-img-box">
            <span class="wishlist-badge badge-stock">In Stock</span>
            <button type="button" class="wishlist-delete-btn" data-id="${product.id}" title="Remove from wishlist" aria-label="Remove ${product.name}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
            <a href="product-details.html?id=${product.id}">
              <img src="${product.image}" alt="${product.name}" loading="lazy" />
            </a>
          </div>

          <div class="wishlist-card-content">
            <div class="rating">
              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              <span>(4.9)</span>
            </div>

            <h3 class="wishlist-card-title">
              <a href="product-details.html?id=${product.id}">${product.name}</a>
            </h3>

            <div class="wishlist-price-row">
              <div class="wishlist-price">$${Number(product.price).toFixed(2)}</div>
              <div class="wishlist-stock-text">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Ready to ship
              </div>
            </div>

            <div class="wishlist-size-row">
              <label>Select Size:</label>
              ${sizeChipsHtml}
            </div>

            <button type="button" class="wishlist-add-bag-btn" data-id="${product.id}">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span>+ Add to Bag</span>
            </button>
          </div>
        </article>
      `;
    });

    if (wishlistGrid) {
      wishlistGrid.innerHTML = html;
      attachCardListeners();
    }

    renderRecommendations(ids);
  }

  // 6. Attach Card Interaction Listeners
  function attachCardListeners() {
    if (!wishlistGrid) return;

    // Size chip selection
    wishlistGrid.querySelectorAll(".wishlist-size-chip").forEach((chip) => {
      chip.addEventListener("click", function () {
        const card = chip.closest(".wishlist-card");
        if (!card) return;
        card.querySelectorAll(".wishlist-size-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        card.dataset.selectedSize = chip.dataset.size;
      });
    });

    // Remove item from wishlist
    wishlistGrid.querySelectorAll(".wishlist-delete-btn").forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const productId = parseInt(btn.dataset.id, 10);
        const card = btn.closest(".wishlist-card");

        if (card) {
          card.classList.add("removing");
        }

        setTimeout(() => {
          let ids = getWishlistIds();
          ids = ids.filter((id) => id !== productId);
          saveWishlistIds(ids);

          showToast("Item removed from your wishlist.");
          renderWishlist();
        }, 320);
      });
    });

    // Add single item to bag
    wishlistGrid.querySelectorAll(".wishlist-add-bag-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const productId = parseInt(btn.dataset.id, 10);
        const card = btn.closest(".wishlist-card");
        const size = (card && card.dataset.selectedSize) || "4Y";
        const product = findProduct(productId);

        if (!product) return;

        addItemToCart(product, size);

        // Visual feedback on button
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<span>Added to Bag ✓</span>`;
        btn.style.background = "var(--text-color)";
        btn.style.color = "#ffffff";

        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.style.background = "";
          btn.style.color = "";
        }, 1500);

        showToast(`${product.name} (${size}) added to your shopping bag.`);
      });
    });
  }

  // 7. Add All to Cart Button
  if (addAllToCartBtn) {
    addAllToCartBtn.addEventListener("click", function () {
      const ids = getWishlistIds();
      if (ids.length === 0) return;

      ids.forEach((id) => {
        const card = wishlistGrid ? wishlistGrid.querySelector(`.wishlist-card[data-product-id="${id}"]`) : null;
        const size = (card && card.dataset.selectedSize) || "4Y";
        const product = findProduct(id);
        if (product) {
          addItemToCart(product, size);
        }
      });

      const originalHtml = addAllToCartBtn.innerHTML;
      addAllToCartBtn.innerHTML = `<span>All Added to Bag ✓</span>`;
      addAllToCartBtn.style.background = "#059669";
      addAllToCartBtn.style.borderColor = "#059669";

      setTimeout(() => {
        addAllToCartBtn.innerHTML = originalHtml;
        addAllToCartBtn.style.background = "";
        addAllToCartBtn.style.borderColor = "";
      }, 2000);

      showToast(`All ${ids.length} saved items added to your shopping bag.`);
    });
  }

  // 8. Share Wishlist Button
  if (shareWishlistBtn) {
    shareWishlistBtn.addEventListener("click", function () {
      const url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          const originalText = shareWishlistBtn.innerHTML;
          shareWishlistBtn.innerHTML = `<span>Link Copied! ✓</span>`;
          setTimeout(() => {
            shareWishlistBtn.innerHTML = originalText;
          }, 2000);
          showToast("Wishlist link copied to clipboard.");
        }).catch(() => {
          fallbackCopyText(url);
        });
      } else {
        fallbackCopyText(url);
      }
    });
  }

  function fallbackCopyText(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      showToast("Wishlist link copied to clipboard.");
    } catch (err) {
      if (typeof window.showKidoModal === "function") {
        window.showKidoModal({
          title: "Share Your Wishlist",
          message: "Copy the link below to share your wishlist with family & friends:",
          showInput: true,
          inputValue: text,
          type: "info",
          confirmText: "Done",
        });
      }
    }
    document.body.removeChild(textArea);
  }

  // 9. Recommendations / "You May Also Love" Section
  function renderRecommendations(wishlistIds) {
    if (!wishlistRecGrid || typeof ProductsList === "undefined") return;

    // Pick products not in wishlist
    const recs = ProductsList.filter((p) => !wishlistIds.includes(p.id)).slice(0, 3);
    if (recs.length === 0) {
      const recSection = document.querySelector(".wishlist-recommendations-section");
      if (recSection) recSection.style.display = "none";
      return;
    }

    let recHtml = "";
    recs.forEach((item) => {
      recHtml += `
        <div class="cross-sell-card">
          <a href="product-details.html?id=${item.id}">
            <img src="${item.image}" alt="${item.name}" class="cross-sell-img" loading="lazy" />
          </a>
          <div class="cross-sell-info">
            <h6><a href="product-details.html?id=${item.id}">${item.name}</a></h6>
            <div class="cross-sell-price">$${Number(item.price).toFixed(2)}</div>
          </div>
          <button type="button" class="cross-sell-add-btn add-to-wishlist-rec-btn" data-id="${item.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 4px;">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            Save to Wishlist
          </button>
        </div>
      `;
    });

    wishlistRecGrid.innerHTML = recHtml;

    // Listeners for recommendation add to wishlist
    wishlistRecGrid.querySelectorAll(".add-to-wishlist-rec-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = parseInt(btn.dataset.id, 10);
        let ids = getWishlistIds();
        if (!ids.includes(id)) {
          ids.push(id);
          saveWishlistIds(ids);
          const product = findProduct(id);
          showToast(`Added ${product.name} to your wishlist.`);
          renderWishlist();
        }
      });
    });
  }

  // 10. Initial Run
  renderWishlist();

  // 11. Cross-tab real-time synchronization
  window.addEventListener("storage", function (e) {
    if (e.key === "kido_wishlist") {
      renderWishlist();
    }
  });
});
