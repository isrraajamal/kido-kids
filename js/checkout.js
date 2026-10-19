/**
 * Kido Kids - Dedicated Checkout Experience
 * Handles cart synchronization, shipping rates, coupon discounts,
 * card masking, form validation, and interactive order placement.
 */

document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const mainGrid = document.getElementById("checkoutMainGrid");
  const emptyState = document.getElementById("checkoutEmptyState");
  const successView = document.getElementById("checkoutSuccessView");
  const checkoutForm = document.getElementById("checkoutForm");
  const itemsListEl = document.getElementById("checkoutItemsList");
  const itemCountBadge = document.getElementById("checkoutItemCountBadge");

  // Pricing Elements
  const chkSubtotalEl = document.getElementById("chkSubtotal");
  const chkDiscountRow = document.getElementById("chkDiscountRow");
  const chkDiscountBadge = document.getElementById("chkDiscountBadge");
  const chkDiscountAmount = document.getElementById("chkDiscountAmount");
  const chkShippingDisplay = document.getElementById("chkShippingDisplay");
  const chkTaxEl = document.getElementById("chkTax");
  const chkGrandTotalEl = document.getElementById("chkGrandTotal");
  const btnPayTextEl = document.getElementById("btnPayText");
  const placeOrderBtn = document.getElementById("placeOrderBtn");
  const btnSpinner = document.getElementById("btnSpinner");

  // Shipping Radios & Badges
  const standardShipRadio = document.getElementById("shipMethodStandard");
  const expressShipRadio = document.getElementById("shipMethodExpress");
  const standardShipBadge = document.getElementById("standardShipBadge");
  const standardShipPriceDisplay = document.getElementById("standardShipPriceDisplay");

  // Payment Tabs & Panels
  const payCardRadio = document.getElementById("payMethodCard");
  const payCodRadio = document.getElementById("payMethodCod");
  const cardFieldsPanel = document.getElementById("cardFieldsPanel");
  const codFieldsPanel = document.getElementById("codFieldsPanel");

  // Card Input Fields
  const cardNumberInput = document.getElementById("cardNumber");
  const cardExpiryInput = document.getElementById("cardExpiry");
  const cardCvvInput = document.getElementById("cardCvv");
  const cardNameInput = document.getElementById("cardName");

  // Coupon Elements
  const couponInput = document.getElementById("checkoutCouponInput");
  const couponBtn = document.getElementById("checkoutCouponBtn");
  const couponMsg = document.getElementById("checkoutCouponMsg");

  // User Info & Inputs
  const userWelcomeEl = document.getElementById("checkoutUserWelcome");
  const emailInput = document.getElementById("checkoutEmail");
  const firstNameInput = document.getElementById("shipFirstName");
  const lastNameInput = document.getElementById("shipLastName");
  const addressInput = document.getElementById("shipAddress");
  const cityInput = document.getElementById("shipCity");
  const stateInput = document.getElementById("shipState");
  const zipInput = document.getElementById("shipZip");
  const phoneInput = document.getElementById("shipPhone");

  // State
  let cartItems = [];
  let appliedCoupon = null; // { code: '...', rate: 0.20, label: '20% OFF' }
  const FREE_SHIPPING_THRESHOLD = 50.0;
  const STANDARD_SHIPPING_FEE = 5.99;
  const EXPRESS_SHIPPING_FEE = 9.99;
  const TAX_RATE = 0.05; // 5% sales tax

  // Available coupons
  const VALID_COUPONS = {
    KIDOFUN20: { rate: 0.2, label: "20% OFF" },
    WELCOME10: { rate: 0.1, label: "10% OFF" },
    SUMMER25: { rate: 0.25, label: "25% OFF" },
  };

  // 1. Initialize
  initCheckout();

  function initCheckout() {
    loadCartData();
    if (!cartItems || cartItems.length === 0) {
      showEmptyCart();
      return;
    }

    renderItemsList();
    prefillUserData();
    bindShippingHandlers();
    bindPaymentHandlers();
    bindCardMasking();
    bindCouponHandler();
    bindExpressButtons();
    bindOrderSubmission();
    calculateTotals();
  }

  // 2. Load Cart Data from localStorage
  function loadCartData() {
    try {
      const stored = localStorage.getItem("kido_cart_items");
      cartItems = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(cartItems)) cartItems = [];
    } catch (e) {
      console.error("Error reading cart from localStorage:", e);
      cartItems = [];
    }
  }

  // 3. Show Empty Cart State
  function showEmptyCart() {
    if (mainGrid) mainGrid.style.display = "none";
    if (emptyState) emptyState.style.display = "block";
    if (successView) successView.style.display = "none";
  }

  // 4. Pre-fill logged-in user data
  function prefillUserData() {
    try {
      const storedUser = localStorage.getItem("kido_user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user && user.email) {
          if (emailInput) emailInput.value = user.email;
          if (userWelcomeEl) {
            userWelcomeEl.textContent = `Logged in as ${user.name || user.email}`;
            userWelcomeEl.style.color = "#15803d";
            userWelcomeEl.style.fontWeight = "600";
          }
          if (user.name) {
            const parts = user.name.trim().split(" ");
            if (parts.length > 0 && firstNameInput && !firstNameInput.value) {
              firstNameInput.value = parts[0];
            }
            if (parts.length > 1 && lastNameInput && !lastNameInput.value) {
              lastNameInput.value = parts.slice(1).join(" ");
            }
            if (cardNameInput && !cardNameInput.value) {
              cardNameInput.value = user.name;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Could not read kido_user", e);
    }
  }

  // 5. Render Sidebar Item Rows
  function renderItemsList() {
    if (!itemsListEl) return;
    itemsListEl.innerHTML = "";

    let totalItemCount = 0;

    cartItems.forEach((item) => {
      const qty = parseInt(item.qty, 10) || 1;
      totalItemCount += qty;
      const price = parseFloat(item.price) || 0;
      const lineSubtotal = (price * qty).toFixed(2);
      const imageSrc = item.image || "images/collection-1.jpg";
      const sizeVariant = item.size ? `Size: ${item.size}` : "Standard Size";
      const colorVariant = item.color ? ` • ${item.color}` : "";

      const row = document.createElement("div");
      row.className = "checkout-item-row";
      row.innerHTML = `
        <div class="checkout-item-thumb">
          <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(item.name || "Product")}" onerror="this.src='images/collection-1.jpg';" />
          <span class="checkout-item-badge">${qty}</span>
        </div>
        <div class="checkout-item-details">
          <div class="checkout-item-name" title="${escapeHtml(item.name || "Outfit")}">${escapeHtml(item.name || "Organic Item")}</div>
          <div class="checkout-item-variant">${escapeHtml(sizeVariant + colorVariant)}</div>
        </div>
        <div class="checkout-item-price">$${lineSubtotal}</div>
      `;
      itemsListEl.appendChild(row);
    });

    if (itemCountBadge) {
      itemCountBadge.textContent = `${totalItemCount} ${totalItemCount === 1 ? "item" : "items"}`;
    }
  }

  // 6. Calculate Real-Time Totals
  function calculateTotals() {
    const subtotal = cartItems.reduce((acc, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.qty, 10) || 1;
      return acc + price * qty;
    }, 0);

    // Shipping calculation
    const isExpress = expressShipRadio && expressShipRadio.checked;
    let shippingFee = 0;

    if (isExpress) {
      shippingFee = EXPRESS_SHIPPING_FEE;
    } else {
      if (subtotal >= FREE_SHIPPING_THRESHOLD) {
        shippingFee = 0;
        if (standardShipBadge) {
          standardShipBadge.textContent = "FREE";
          standardShipBadge.className = "shipping-badge free";
        }
        if (standardShipPriceDisplay) standardShipPriceDisplay.textContent = "FREE";
      } else {
        shippingFee = STANDARD_SHIPPING_FEE;
        if (standardShipBadge) {
          standardShipBadge.textContent = "$5.99";
          standardShipBadge.className = "shipping-badge";
        }
        if (standardShipPriceDisplay) standardShipPriceDisplay.textContent = "$5.99";
      }
    }

    // Coupon discount calculation
    let discount = 0;
    if (appliedCoupon && appliedCoupon.rate) {
      discount = subtotal * appliedCoupon.rate;
      if (chkDiscountRow) chkDiscountRow.style.display = "flex";
      if (chkDiscountBadge) chkDiscountBadge.textContent = appliedCoupon.label;
      if (chkDiscountAmount) chkDiscountAmount.textContent = `-$${discount.toFixed(2)}`;
    } else {
      if (chkDiscountRow) chkDiscountRow.style.display = "none";
    }

    // Discounted subtotal
    const discountedSubtotal = Math.max(0, subtotal - discount);

    // Tax calculation
    const tax = discountedSubtotal * TAX_RATE;

    // Grand total
    const grandTotal = discountedSubtotal + shippingFee + tax;

    // Update displays
    if (chkSubtotalEl) chkSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (chkTaxEl) chkTaxEl.textContent = `$${tax.toFixed(2)}`;

    if (chkShippingDisplay) {
      if (shippingFee === 0) {
        chkShippingDisplay.textContent = "FREE";
        chkShippingDisplay.className = "shipping-status-val";
      } else {
        chkShippingDisplay.textContent = `$${shippingFee.toFixed(2)}`;
        chkShippingDisplay.className = "";
      }
    }

    if (chkGrandTotalEl) chkGrandTotalEl.textContent = `$${grandTotal.toFixed(2)}`;

    // Update place order button text
    if (btnPayTextEl) {
      const isCod = payCodRadio && payCodRadio.checked;
      if (isCod) {
        btnPayTextEl.textContent = `Place Order (Pay $${grandTotal.toFixed(2)} on Delivery)`;
      } else {
        btnPayTextEl.textContent = `Pay $${grandTotal.toFixed(2)} • Place Order`;
      }
    }

    return {
      subtotal,
      discount,
      shippingFee,
      tax,
      grandTotal,
    };
  }

  // 7. Shipping Options Selection
  function bindShippingHandlers() {
    const shippingItems = document.querySelectorAll(".shipping-option-item");
    shippingItems.forEach((label) => {
      label.addEventListener("click", function () {
        shippingItems.forEach((l) => l.classList.remove("active"));
        this.classList.add("active");
        calculateTotals();
      });
    });
  }

  // 8. Payment Method Selection
  function bindPaymentHandlers() {
    const paymentItems = document.querySelectorAll(".payment-tab-item");
    paymentItems.forEach((item) => {
      item.addEventListener("click", function () {
        paymentItems.forEach((p) => p.classList.remove("active"));
        this.classList.add("active");

        const radio = this.querySelector('input[type="radio"]');
        if (radio && radio.value === "cod") {
          if (cardFieldsPanel) cardFieldsPanel.style.display = "none";
          if (codFieldsPanel) codFieldsPanel.style.display = "block";
        } else {
          if (cardFieldsPanel) cardFieldsPanel.style.display = "block";
          if (codFieldsPanel) codFieldsPanel.style.display = "none";
        }

        calculateTotals();
      });
    });
  }

  // 9. Credit Card Input Masking & Validation
  function bindCardMasking() {
    // Space every 4 digits for Card Number
    if (cardNumberInput) {
      cardNumberInput.addEventListener("input", function (e) {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 16) value = value.slice(0, 16);

        // Card brand detection badge
        const cardIndicator = document.getElementById("cardTypeIndicator");
        const visaBadge = document.querySelector(".brand-badge.visa");
        const mcBadge = document.querySelector(".brand-badge.mc");
        const amexBadge = document.querySelector(".brand-badge.amex");

        [visaBadge, mcBadge, amexBadge].forEach((b) => b && (b.style.boxShadow = "none"));

        if (value.startsWith("4")) {
          if (visaBadge) visaBadge.style.boxShadow = "0 0 0 2px #1a1f71";
        } else if (value.startsWith("5") || value.startsWith("2")) {
          if (mcBadge) mcBadge.style.boxShadow = "0 0 0 2px #eb001b";
        } else if (value.startsWith("3")) {
          if (amexBadge) amexBadge.style.boxShadow = "0 0 0 2px #007bc1";
        }

        const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
        e.target.value = formatted;
      });
    }

    // Auto slash for Expiry Date (MM/YY)
    if (cardExpiryInput) {
      cardExpiryInput.addEventListener("input", function (e) {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 4) value = value.slice(0, 4);

        if (value.length >= 3) {
          e.target.value = `${value.slice(0, 2)}/${value.slice(2)}`;
        } else {
          e.target.value = value;
        }
      });
    }

    // Numbers only for CVV
    if (cardCvvInput) {
      cardCvvInput.addEventListener("input", function (e) {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
      });
    }
  }

  // 10. Coupon Handler
  function bindCouponHandler() {
    if (!couponBtn || !couponInput) return;

    couponBtn.addEventListener("click", function () {
      applyCoupon();
    });

    couponInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        applyCoupon();
      }
    });
  }

  function applyCoupon() {
    const code = couponInput.value.trim().toUpperCase();
    if (!code) {
      showCouponFeedback("Please enter a discount code.", "error");
      return;
    }

    if (VALID_COUPONS[code]) {
      appliedCoupon = {
        code: code,
        rate: VALID_COUPONS[code].rate,
        label: VALID_COUPONS[code].label,
      };
      showCouponFeedback(`Code "${code}" applied! You unlocked ${appliedCoupon.label}.`, "success");
      couponInput.disabled = true;
      couponBtn.textContent = "Applied";
      couponBtn.disabled = true;
      couponBtn.style.background = "#dcfce7";
      couponBtn.style.color = "#15803d";
      calculateTotals();
    } else {
      showCouponFeedback("Invalid promo code. Try KIDOFUN20 or WELCOME10.", "error");
    }
  }

  function showCouponFeedback(msg, type) {
    if (!couponMsg) return;
    couponMsg.textContent = msg;
    couponMsg.className = `checkout-coupon-msg ${type}`;
    couponMsg.style.display = "block";
  }

  // 11. Express Checkout Buttons Simulation
  function bindExpressButtons() {
    const btnApple = document.getElementById("btnExpressApplePay");
    const btnGoogle = document.getElementById("btnExpressGooglePay");
    const btnPaypal = document.getElementById("btnExpressPaypal");

    const handleExpress = (providerName) => {
      // Pre-fill dummy valid shipping info for speed
      if (emailInput && !emailInput.value) emailInput.value = "parent@kidoexpress.com";
      if (firstNameInput && !firstNameInput.value) firstNameInput.value = "Alex";
      if (lastNameInput && !lastNameInput.value) lastNameInput.value = "Taylor";
      if (addressInput && !addressInput.value) addressInput.value = "742 Evergreen Terrace";
      if (cityInput && !cityInput.value) cityInput.value = "Springfield";
      if (stateInput && !stateInput.value) stateInput.value = "Oregon";
      if (zipInput && !zipInput.value) zipInput.value = "97477";
      if (phoneInput && !phoneInput.value) phoneInput.value = "+1 (555) 987-6543";

      if (typeof window.showKidoModal === "function") {
        window.showKidoModal({
          title: `${providerName} Express Checkout`,
          message: `Your verified shipping address and payment method were retrieved from ${providerName}.\n\nReady to complete your organic order?`,
          type: "success",
          confirmText: `Authorize with ${providerName}`,
          cancelText: "Review Details",
          onConfirm: () => {
            triggerOrderPlacement(providerName);
          },
        });
      } else {
        triggerOrderPlacement(providerName);
      }
    };

    if (btnApple) btnApple.addEventListener("click", () => handleExpress("Apple Pay"));
    if (btnGoogle) btnGoogle.addEventListener("click", () => handleExpress("Google Pay"));
    if (btnPaypal) btnPaypal.addEventListener("click", () => handleExpress("PayPal"));
  }

  // 12. Order Submission & Validation
  function bindOrderSubmission() {
    if (!checkoutForm) return;

    checkoutForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Validate Contact and Shipping
      const email = emailInput ? emailInput.value.trim() : "";
      const fName = firstNameInput ? firstNameInput.value.trim() : "";
      const lName = lastNameInput ? lastNameInput.value.trim() : "";
      const address = addressInput ? addressInput.value.trim() : "";
      const city = cityInput ? cityInput.value.trim() : "";
      const state = stateInput ? stateInput.value.trim() : "";
      const zip = zipInput ? zipInput.value.trim() : "";
      const phone = phoneInput ? phoneInput.value.trim() : "";

      if (!email || !fName || !lName || !address || !city || !state || !zip || !phone) {
        showValidationModal("Please fill out all required shipping and contact fields.");
        return;
      }

      // Check Email Format
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        showValidationModal("Please provide a valid email address for delivery updates.");
        return;
      }

      // Validate Payment Details if Card is selected
      const isCod = payCodRadio && payCodRadio.checked;
      let paymentLabel = "Cash on Delivery";

      if (!isCod) {
        const cardName = cardNameInput ? cardNameInput.value.trim() : "";
        const cardNum = cardNumberInput ? cardNumberInput.value.replace(/\s/g, "") : "";
        const expiry = cardExpiryInput ? cardExpiryInput.value.trim() : "";
        const cvv = cardCvvInput ? cardCvvInput.value.trim() : "";

        if (!cardName || !cardNum || !expiry || !cvv) {
          showValidationModal("Please complete all credit card details.");
          return;
        }

        if (cardNum.length < 15) {
          showValidationModal("Please enter a valid 16-digit card number.");
          return;
        }

        if (!/^\d{2}\/\d{2}$/.test(expiry)) {
          showValidationModal("Please provide a valid card expiry date (MM/YY).");
          return;
        }

        if (cvv.length < 3) {
          showValidationModal("Please provide a valid 3 or 4 digit security CVV.");
          return;
        }

        paymentLabel = `Credit Card ending in ${cardNum.slice(-4)}`;
      }

      triggerOrderPlacement(paymentLabel);
    });
  }

  function showValidationModal(message) {
    if (typeof window.showKidoModal === "function") {
      window.showKidoModal({
        title: "Required Information Missing",
        message: message,
        type: "warning",
        confirmText: "Got It",
      });
    } else {
      console.warn(message);
    }
  }

  // 13. Trigger Order Placement (Simulated Network Call & Storage)
  function triggerOrderPlacement(paymentMethodName) {
    if (placeOrderBtn) placeOrderBtn.disabled = true;
    if (btnSpinner) btnSpinner.style.display = "inline-block";
    if (btnPayTextEl) btnPayTextEl.textContent = "Securing Order & Processing...";

    const totals = calculateTotals();
    const orderNumber = `KIDO-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderData = {
      orderId: orderNumber,
      date: new Date().toISOString(),
      items: cartItems,
      totals: totals,
      customer: {
        name: `${firstNameInput ? firstNameInput.value.trim() : "Parent"} ${lastNameInput ? lastNameInput.value.trim() : ""}`.trim(),
        email: emailInput ? emailInput.value.trim() : "parent@example.com",
        phone: phoneInput ? phoneInput.value.trim() : "",
        address: `${addressInput ? addressInput.value.trim() : ""}, ${cityInput ? cityInput.value.trim() : ""}, ${stateInput ? stateInput.value.trim() : ""} ${zipInput ? zipInput.value.trim() : ""}`,
      },
      paymentMethod: paymentMethodName,
      shippingMethod: expressShipRadio && expressShipRadio.checked ? "Express Priority" : "Standard Eco-Delivery",
    };

    // Store order in kido_orders history
    try {
      const pastOrders = JSON.parse(localStorage.getItem("kido_orders") || "[]");
      pastOrders.unshift(orderData);
      localStorage.setItem("kido_orders", JSON.stringify(pastOrders));
    } catch (e) {
      console.warn("Could not save to order history", e);
    }

    setTimeout(() => {
      // Clear shopping cart
      localStorage.removeItem("kido_cart_items");
      localStorage.setItem("kido_cart_count", "0");

      // Update badge if updateCartBadge exists in window
      if (typeof window.updateCartBadge === "function") {
        window.updateCartBadge();
      }

      // Populate Success Screen
      const successNameEl = document.getElementById("successCustomerName");
      const successOrderNumEl = document.getElementById("successOrderNumber");
      const successEmailEl = document.getElementById("successCustomerEmail");
      const successEstDeliveryEl = document.getElementById("successEstDelivery");
      const successShipAddressEl = document.getElementById("successShipAddress");
      const successPaymentMethodEl = document.getElementById("successPaymentMethod");
      const successTotalPaidEl = document.getElementById("successTotalPaid");

      if (successNameEl) successNameEl.textContent = `Thank you, ${orderData.customer.name}!`;
      if (successOrderNumEl) successOrderNumEl.textContent = `#${orderNumber}`;
      if (successEmailEl) successEmailEl.textContent = orderData.customer.email;

      // Delivery estimate: 2 days for express, 4 days for standard
      const deliveryDays = expressShipRadio && expressShipRadio.checked ? 2 : 4;
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
      const options = { weekday: "long", month: "short", day: "numeric" };
      if (successEstDeliveryEl) {
        successEstDeliveryEl.textContent = `${deliveryDate.toLocaleDateString("en-US", options)} (${orderData.shippingMethod})`;
      }

      if (successShipAddressEl) successShipAddressEl.textContent = orderData.customer.address;
      if (successPaymentMethodEl) successPaymentMethodEl.textContent = paymentMethodName;
      if (successTotalPaidEl) successTotalPaidEl.textContent = `$${totals.grandTotal.toFixed(2)}`;

      // Switch view
      if (mainGrid) mainGrid.style.display = "none";
      if (successView) successView.style.display = "block";

      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1200);
  }

  // 14. Express Checkout Fast-Track Simulation
  ["btnExpressApplePay", "btnExpressGooglePay", "btnExpressPaypal"].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener("click", function () {
        const provider = id.includes("Apple") ? "Apple Pay" : (id.includes("Google") ? "Google Pay" : "PayPal");
        if (typeof window.showKidoToast === "function") {
          window.showKidoToast(`Initiating quick express checkout with ${provider}...`);
        }
        // Autofill sample address for smooth demonstration if empty
        const emailInput = document.getElementById("checkoutEmail");
        const firstNameInput = document.getElementById("shipFirstName");
        const lastNameInput = document.getElementById("shipLastName");
        const addressInput = document.getElementById("shipAddress");
        const cityInput = document.getElementById("shipCity");
        const zipInput = document.getElementById("shipZip");
        const phoneInput = document.getElementById("shipPhone");

        if (emailInput && !emailInput.value) emailInput.value = "parent@example.com";
        if (firstNameInput && !firstNameInput.value) firstNameInput.value = "Sarah";
        if (lastNameInput && !lastNameInput.value) lastNameInput.value = "Miller";
        if (addressInput && !addressInput.value) addressInput.value = "124 Organic Meadow Way";
        if (cityInput && !cityInput.value) cityInput.value = "Portland";
        if (zipInput && !zipInput.value) zipInput.value = "97201";
        if (phoneInput && !phoneInput.value) phoneInput.value = "+1 (555) 234-5678";

        setTimeout(() => {
          triggerOrderPlacement(provider);
        }, 600);
      });
    }
  });

  // 15. HTML escaping helper
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
