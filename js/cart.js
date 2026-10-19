/**
 * Kido Kids - Interactive Cart Management Script (js/cart.js)
 * Handles live quantity updates, item removal, dynamic free-shipping progress,
 * coupon codes (KIDOFUN20), cross-sell quick-add, and cart badge synchronization.
 */

document.addEventListener("DOMContentLoaded", function () {
  const FREE_SHIPPING_THRESHOLD = 50.0;
  const STANDARD_SHIPPING_COST = 5.99;
  const TAX_RATE = 0.05; // 5% estimated tax
  const VALID_COUPONS = {
    KIDOFUN20: { discountPercent: 20, name: "20% OFF (KIDOFUN20)" },
    WELCOME10: { discountPercent: 10, name: "10% OFF Welcome" },
  };

  // 1. Initial State & Storage
  let appliedCoupon = null;

  function getDefaultCart() {
    return [
      {
        id: 1,
        name: "Celebration T-Shirt",
        price: 25.0,
        qty: 1,
        image: "images/product-1.jpg",
        size: "4Y",
        color: "pink",
      },
      {
        id: 2,
        name: "Twirl Party Dress",
        price: 55.0,
        qty: 1,
        image: "images/product-2.jpg",
        size: "5Y",
        color: "pink",
      },
    ];
  }

  function consolidateCartItems(rawItems) {
    if (!Array.isArray(rawItems)) return [];
    const map = new Map();
    rawItems.forEach((item) => {
      if (!item) return;
      const id = parseInt(item.id, 10);
      if (isNaN(id)) return;

      const qty = Math.max(1, parseInt(item.qty, 10) || 1);
      const price = parseFloat(item.price) || 0;

      if (!map.has(id)) {
        map.set(id, {
          ...item,
          id: id,
          qty: qty,
          price: price,
        });
      } else {
        const existing = map.get(id);
        existing.qty += qty;
        if (item.size) existing.size = item.size;
        if (item.color && item.color !== "Default") existing.color = item.color;
      }
    });
    return Array.from(map.values());
  }

  function getCartItems() {
    const stored = localStorage.getItem("kido_cart_items");
    let items;
    if (!stored) {
      items = getDefaultCart();
    } else {
      try {
        items = JSON.parse(stored);
      } catch (e) {
        items = getDefaultCart();
      }
    }
    const consolidated = consolidateCartItems(items);
    if (JSON.stringify(consolidated) !== stored) {
      localStorage.setItem("kido_cart_items", JSON.stringify(consolidated));
      const totalCount = consolidated.reduce((acc, item) => acc + item.qty, 0);
      localStorage.setItem("kido_cart_count", totalCount.toString());
    }
    return consolidated;
  }

  function saveCartItems(items) {
    localStorage.setItem("kido_cart_items", JSON.stringify(items));
    const totalCount = items.reduce((acc, item) => acc + item.qty, 0);
    localStorage.setItem("kido_cart_count", totalCount.toString());

    // Update all cart count badges across the page
    document.querySelectorAll("[data-hook='items-count']").forEach((el) => {
      el.textContent = totalCount;
    });

    const headerBadge = document.querySelector(".cart-item-count-badge");
    if (headerBadge) {
      headerBadge.textContent = `${totalCount} item${totalCount === 1 ? "" : "s"}`;
    }
  }

  // 2. DOM Elements
  const cartTableBody = document.getElementById("cartTableBody");
  const cartContentRow = document.getElementById("cartContentRow");
  const emptyCartState = document.getElementById("emptyCartState");
  const freeShippingCard = document.getElementById("freeShippingCard");
  const freeShippingMsg = document.getElementById("freeShippingMsg");
  const freeShippingBar = document.getElementById("freeShippingBar");

  // Summary Elements
  const summarySubtotal = document.getElementById("summarySubtotal");
  const summaryShipping = document.getElementById("summaryShipping");
  const summaryDiscountRow = document.getElementById("summaryDiscountRow");
  const summaryDiscount = document.getElementById("summaryDiscount");
  const summaryTax = document.getElementById("summaryTax");
  const summaryTotal = document.getElementById("summaryTotal");

  // Coupon Elements
  const couponInput = document.getElementById("couponInput");
  const couponApplyBtn = document.getElementById("couponApplyBtn");
  const couponStatusMsg = document.getElementById("couponStatusMsg");

  // 3. Render Cart Table
  function renderCart() {
    const items = getCartItems();

    if (!items || items.length === 0) {
      if (cartTableBody) cartTableBody.innerHTML = "";
      if (cartContentRow) cartContentRow.style.display = "none";
      if (freeShippingCard) freeShippingCard.style.display = "none";
      if (emptyCartState) emptyCartState.classList.add("show");
      saveCartItems([]);
      return;
    }

    if (cartContentRow) cartContentRow.style.display = "";
    if (freeShippingCard) freeShippingCard.style.display = "";
    if (emptyCartState) emptyCartState.classList.remove("show");

    if (cartTableBody) {
      cartTableBody.innerHTML = items
        .map(
          (item, idx) => `
        <tr data-index="${idx}" data-id="${item.id}">
          <td class="product-col">
            <div class="cart-product-cell">
              <a href="product-details.html?id=${item.id}" aria-label="View ${item.name} details">
                <img src="${item.image}" alt="${item.name}" class="cart-thumb-img" />
              </a>
              <div class="cart-item-meta">
                <h5><a href="product-details.html?id=${item.id}">${item.name}</a></h5>
                <p class="cart-item-tags">
                  <span>Size: <strong>${item.size || "4Y"}</strong></span>
                  <span>•</span>
                  <span>Color: <strong>${item.color || "Default"}</strong></span>
                </p>
              </div>
            </div>
          </td>
          <td class="price-col">
            <span class="cart-price-tag">$${Number(item.price).toFixed(2)}</span>
          </td>
          <td class="qty-col">
            <div class="cart-qty-pill">
              <button class="cart-qty-btn btn-minus" data-index="${idx}" data-id="${item.id}" data-size="${item.size || ""}" aria-label="Decrease quantity">−</button>
              <span class="cart-qty-val">${item.qty}</span>
              <button class="cart-qty-btn btn-plus" data-index="${idx}" data-id="${item.id}" data-size="${item.size || ""}" aria-label="Increase quantity">+</button>
            </div>
          </td>
          <td class="subtotal-col">
            <span class="cart-subtotal-tag">$${(item.price * item.qty).toFixed(2)}</span>
          </td>
          <td class="remove-col text-end">
            <button class="cart-remove-icon-btn btn-remove" data-index="${idx}" data-id="${item.id}" data-size="${item.size || ""}" aria-label="Remove item" title="Remove from cart">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </td>
        </tr>
      `
        )
        .join("");
    }

    updateCalculations(items);
  }

  // 4. Update Calculations & Shipping Meter
  function updateCalculations(items) {
    const rawSubtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

    // Free shipping calculation
    let shippingCost = 0.0;
    if (rawSubtotal >= FREE_SHIPPING_THRESHOLD) {
      shippingCost = 0.0;
      if (freeShippingMsg) {
        freeShippingMsg.innerHTML = `<span class="truck-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><polyline points="20 6 9 17 4 12"></polyline></svg></span> You've unlocked <strong>FREE Express Shipping</strong>!`;
      }
      if (freeShippingBar) freeShippingBar.style.width = "100%";
      if (summaryShipping) {
        summaryShipping.innerHTML = `<span class="free-badge">FREE</span>`;
      }
    } else {
      shippingCost = STANDARD_SHIPPING_COST;
      const difference = FREE_SHIPPING_THRESHOLD - rawSubtotal;
      const percent = Math.min(100, Math.max(5, (rawSubtotal / FREE_SHIPPING_THRESHOLD) * 100));
      if (freeShippingMsg) {
        freeShippingMsg.innerHTML = `<span class="truck-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg></span> Add <strong>$${difference.toFixed(2)}</strong> more to unlock <strong>FREE Express Shipping</strong>!`;
      }
      if (freeShippingBar) freeShippingBar.style.width = `${percent}%`;
      if (summaryShipping) {
        summaryShipping.textContent = `$${STANDARD_SHIPPING_COST.toFixed(2)}`;
      }
    }

    // Coupon discount
    let discountAmount = 0.0;
    if (appliedCoupon && VALID_COUPONS[appliedCoupon]) {
      const couponObj = VALID_COUPONS[appliedCoupon];
      discountAmount = (rawSubtotal * couponObj.discountPercent) / 100;
      if (summaryDiscountRow) summaryDiscountRow.style.display = "flex";
      if (summaryDiscount) summaryDiscount.textContent = `-$${discountAmount.toFixed(2)}`;
    } else {
      if (summaryDiscountRow) summaryDiscountRow.style.display = "none";
    }

    const discountedSubtotal = Math.max(0, rawSubtotal - discountAmount);
    const taxAmount = discountedSubtotal * TAX_RATE;
    const grandTotal = discountedSubtotal + (rawSubtotal > 0 ? shippingCost : 0) + taxAmount;

    if (summarySubtotal) summarySubtotal.textContent = `$${rawSubtotal.toFixed(2)}`;
    if (summaryTax) summaryTax.textContent = `$${taxAmount.toFixed(2)}`;
    if (summaryTotal) summaryTotal.textContent = `$${grandTotal.toFixed(2)}`;

    saveCartItems(items);
  }

  // 5. Quantity & Remove Event Listeners
  if (cartTableBody) {
    cartTableBody.addEventListener("click", function (e) {
      const target = e.target.closest("button");
      if (!target) return;

      const idxAttr = target.getAttribute("data-index");
      const id = parseInt(target.getAttribute("data-id"), 10);
      const size = target.getAttribute("data-size");

      let items = getCartItems();
      let itemIndex = -1;

      // 1. Try matching by exact row index
      if (idxAttr !== null && idxAttr !== "") {
        const parsedIdx = parseInt(idxAttr, 10);
        if (parsedIdx >= 0 && parsedIdx < items.length) {
          itemIndex = parsedIdx;
        }
      }

      // 2. Try matching by product ID and size
      if (itemIndex === -1 && !isNaN(id)) {
        itemIndex = items.findIndex((item) => item.id == id && (size ? item.size === size : true));
      }

      // 3. Fallback: match by product ID
      if (itemIndex === -1 && !isNaN(id)) {
        itemIndex = items.findIndex((item) => item.id == id);
      }

      if (itemIndex === -1) return;

      if (target.classList.contains("btn-plus")) {
        items[itemIndex].qty += 1;
        saveCartItems(items);
        renderCart();
        showToast(`Increased quantity of "${items[itemIndex].name}"`);
      } else if (target.classList.contains("btn-minus")) {
        if (items[itemIndex].qty > 1) {
          items[itemIndex].qty -= 1;
          saveCartItems(items);
          renderCart();
          showToast(`Decreased quantity of "${items[itemIndex].name}"`);
        } else {
          // Remove if qty reaches 0
          const removedName = items[itemIndex].name;
          items.splice(itemIndex, 1);
          saveCartItems(items);
          renderCart();
          if (typeof renderCrossSells === "function") renderCrossSells();
          showToast(`Removed "${removedName}" from cart`);
        }
      } else if (target.classList.contains("btn-remove")) {
        const removedName = items[itemIndex].name;
        items.splice(itemIndex, 1);
        saveCartItems(items);
        renderCart();
        if (typeof renderCrossSells === "function") renderCrossSells();
        showToast(`Removed "${removedName}" from cart`);
      }
    });
  }

  // 6. Clear Cart Button
  const clearCartBtn = document.getElementById("clearCartBtn");
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", function () {
      if (typeof window.showKidoModal === "function") {
        window.showKidoModal({
          title: "Empty Shopping Bag?",
          message: "Are you sure you want to remove all items from your bag? This action cannot be undone.",
          type: "danger",
          danger: true,
          showCancel: true,
          confirmText: "Yes, Empty Bag",
          cancelText: "Keep My Items",
          onConfirm: () => {
            saveCartItems([]);
            renderCart();
            if (typeof renderCrossSells === "function") renderCrossSells();
            showToast("Your shopping bag has been cleared.");
          },
        });
      } else {
        saveCartItems([]);
        renderCart();
        if (typeof renderCrossSells === "function") renderCrossSells();
      }
    });
  }

  // 7. Coupon Apply
  if (couponApplyBtn && couponInput) {
    couponApplyBtn.addEventListener("click", function () {
      const code = couponInput.value.trim().toUpperCase();
      if (!code) {
        showCouponStatus("Please enter a discount code.", "error");
        return;
      }

      if (VALID_COUPONS[code]) {
        appliedCoupon = code;
        showCouponStatus(`✓ ${VALID_COUPONS[code].name} applied successfully!`, "success");
        renderCart();
        showToast(`Promo code ${code} applied!`);
      } else {
        showCouponStatus("Invalid coupon code. Try 'KIDOFUN20' for 20% off!", "error");
      }
    });
  }

  function showCouponStatus(msg, type) {
    if (!couponStatusMsg) return;
    couponStatusMsg.textContent = msg;
    couponStatusMsg.className = `coupon-status-msg ${type}`;
  }

  // 8. Dynamic Cross-Sell ("You May Also Love") Recommendations
  function renderCrossSells() {
    const crossSellGrid = document.querySelector(".cross-sell-grid") || document.getElementById("cartCrossSellGrid");
    if (!crossSellGrid || typeof ProductsList === "undefined") return;

    const currentItems = getCartItems();
    const inCartIds = currentItems.map((item) => item.id);

    // Pick 4 products not currently in the cart
    let recs = ProductsList.filter((p) => !inCartIds.includes(p.id)).slice(0, 4);
    if (recs.length < 4) {
      const remaining = ProductsList.filter((p) => !recs.some((r) => r.id === p.id)).slice(0, 4 - recs.length);
      recs = recs.concat(remaining);
    }

    crossSellGrid.innerHTML = recs
      .map(
        (item) => `
        <div class="cross-sell-card" data-id="${item.id}">
          <div class="cross-sell-img-wrap">
            <a href="product-details.html?id=${item.id}" aria-label="View ${item.name} details">
              <img src="${item.image}" alt="${item.name}" class="cross-sell-img" loading="lazy" />
            </a>
            <button type="button" class="quick-view" data-id="${item.id}" aria-label="Quick preview ${item.name}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Quick View</span>
            </button>
          </div>
          <div class="cross-sell-info">
            <h6><a href="product-details.html?id=${item.id}">${item.name}</a></h6>
            <span class="cross-sell-price">$${Number(item.price).toFixed(2)}</span>
          </div>
          <button type="button" class="cross-sell-add-btn" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" data-image="${item.image}">
            + Add to Bag
          </button>
        </div>
      `
      )
      .join("");
  }

  // Handle + Add to Bag clicks on cross-sell cards
  document.addEventListener("click", function (e) {
    const addBtn = e.target.closest(".cross-sell-add-btn");
    if (addBtn) {
      e.preventDefault();
      const id = parseInt(addBtn.getAttribute("data-id"), 10);
      const product = typeof getProductById === "function" ? getProductById(id) : null;

      const name = product ? product.name : (addBtn.getAttribute("data-name") || "Product");
      const price = product ? product.price : parseFloat(addBtn.getAttribute("data-price") || "0");
      const image = product ? product.image : (addBtn.getAttribute("data-image") || "images/product-1.jpg");
      const size = (product && product.sizes && product.sizes[0]) || "4Y";

      let items = getCartItems();
      const existing = items.find((item) => item.id === id);

      if (existing) {
        existing.qty += 1;
        if (size) existing.size = size;
      } else {
        items.push({
          id: id,
          name: name,
          price: price,
          qty: 1,
          image: image,
          size: size,
          color: (product && product.color) || "Default",
        });
      }

      // CRITICAL: Persist updated cart to localStorage
      saveCartItems(items);

      // Re-render cart table & summary
      renderCart();

      // Refresh cross-sells
      renderCrossSells();

      showToast(`Added "${name}" to your bag!`);

      // Micro button animation
      const origText = addBtn.innerHTML;
      addBtn.innerHTML = `<span>Added ✓</span>`;
      addBtn.style.background = "var(--text-color)";
      addBtn.style.color = "#ffffff";
      setTimeout(() => {
        addBtn.innerHTML = origText;
        addBtn.style.background = "";
        addBtn.style.color = "";
      }, 1400);
    }
  });

  // 9. Interactive Quick View Modal
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
      const card = qvBtn.closest(".cross-sell-card") || qvBtn.closest(".product-card");
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
        const targetProduct = typeof getProductById === "function" ? getProductById(activeModalProductId) : null;
        const name = targetProduct ? targetProduct.name : "Item";

        let items = getCartItems();
        const existing = items.find(
          (i) => i.id == activeModalProductId
        );
        if (existing) {
          existing.qty += activeModalQty;
          if (activeModalSize) existing.size = activeModalSize;
        } else {
          items.push({
            id: parseInt(activeModalProductId, 10),
            name: targetProduct ? targetProduct.name : "Item",
            price: targetProduct ? targetProduct.price : 0,
            qty: activeModalQty,
            image: targetProduct ? targetProduct.image : "images/product-1.jpg",
            size: activeModalSize,
            color: "Default",
          });
        }

        saveCartItems(items);
        renderCart();
        renderCrossSells();

        showToast(`Added ${activeModalQty}x "${name}" (${activeModalSize}) to your bag!`);
        closeQuickView();
      });
    }
  }

  // 10. Proceed to Checkout Navigation
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function (e) {
      const items = getCartItems();
      if (!items || items.length === 0) {
        e.preventDefault();
        if (typeof window.showKidoModal === "function") {
          window.showKidoModal({
            title: "Your Shopping Bag is Empty",
            message: "Explore our playful collections and add your favorite outfits to begin checkout.",
            type: "warning",
            confirmText: "Explore Collections",
            onConfirm: () => {
              window.location.href = "shop.html";
            },
          });
        }
        return;
      }

      // Allow natural navigation or explicit redirect to checkout.html
      // (The anchor already has href="checkout.html")
    });
  }

  // 11. Toast Notification Helper
  function showToast(message) {
    let container = document.querySelector(".toast-container-custom");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container-custom";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "kido-toast toast-success";
    toast.innerHTML = `<span class="toast-check-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 6px;"><polyline points="20 6 9 17 4 12"></polyline></svg></span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px) scale(0.9)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Initial Run
  renderCart();
  renderCrossSells();
});
