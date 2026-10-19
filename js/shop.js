document.addEventListener("DOMContentLoaded", function () {
  const productsContainer = document.querySelector(".shop #products");
  const countEl = document.querySelector(".products-count p");
  const sortSelect = document.querySelector(".sort-dropdown select");
  const minSlider = document.querySelector(".thumb-left");
  const maxSlider = document.querySelector(".thumb-right");
  const minDisplay = document.querySelector(".price-values span:first-child");
  const maxDisplay = document.querySelector(".price-values span:last-child");
  const sliderTrack = document.querySelector(".slider-track");
  const categoryLinks = document.querySelectorAll(".sidebar .browse ul li a");
  const colorCheckboxes = document.querySelectorAll(".check-list input[type='checkbox']");

  let currentCategory = "all";
  let minPrice = 0;
  let maxPrice = 100;
  let selectedColors = ["pink", "blue"];
  let currentSort = "recommended";

  // Pagination Elements & State
  const paginationWrapper = document.getElementById("shopPaginationWrapper");
  const paginationRangeText = document.getElementById("paginationRangeText");
  const paginationTotalText = document.getElementById("paginationTotalText");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const pageNumbersContainer = document.getElementById("shopPageNumbers");

  let currentPage = 1;
  const itemsPerPage = 6;

  // Check URL params for category
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get("category");
  if (catParam) {
    currentCategory = catParam.toLowerCase();
  }

  function updateSliderVisual() {
    if (!minSlider || !maxSlider || !sliderTrack) return;
    const min = parseFloat(minSlider.min);
    const max = parseFloat(maxSlider.max);
    const valMin = parseFloat(minSlider.value);
    const valMax = parseFloat(maxSlider.value);

    const minPercent = ((valMin - min) / (max - min)) * 100;
    const maxPercent = ((valMax - min) / (max - min)) * 100;

    sliderTrack.style.left = `${minPercent}%`;
    sliderTrack.style.width = `${maxPercent - minPercent}%`;

    if (minDisplay) minDisplay.textContent = `$${valMin}`;
    if (maxDisplay) maxDisplay.textContent = `$${valMax}`;

    minPrice = valMin;
    maxPrice = valMax;
  }

  if (minSlider && maxSlider) {
    minSlider.addEventListener("input", function () {
      if (parseFloat(minSlider.value) >= parseFloat(maxSlider.value)) {
        minSlider.value = parseFloat(maxSlider.value) - 1;
      }
      updateSliderVisual();
      currentPage = 1;
      renderShopProducts();
    });

    maxSlider.addEventListener("input", function () {
      if (parseFloat(maxSlider.value) <= parseFloat(minSlider.value)) {
        maxSlider.value = parseFloat(minSlider.value) + 1;
      }
      updateSliderVisual();
      currentPage = 1;
      renderShopProducts();
    });

    updateSliderVisual();
  }

  // Color filter events
  if (colorCheckboxes.length) {
    colorCheckboxes.forEach((cb) => {
      cb.addEventListener("change", function () {
        selectedColors = [];
        colorCheckboxes.forEach((c) => {
          if (c.checked) {
            const colorName = c.id === "flexCheckChecked1" ? "pink" : "blue";
            selectedColors.push(colorName);
          }
        });
        currentPage = 1;
        renderShopProducts();
      });
    });
  }

  // Category browse filter
  categoryLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const text = link.textContent.trim().toLowerCase();
      if (text.includes("all")) {
        currentCategory = "all";
      } else if (text.includes("eco")) {
        currentCategory = "eco-friendly";
      } else if (text.includes("party")) {
        currentCategory = "party-wear";
      } else if (text.includes("school")) {
        currentCategory = "school-wear";
      }
      categoryLinks.forEach((l) => {
        l.style.fontWeight = "normal";
        l.classList.remove("active");
      });
      link.style.fontWeight = "bold";
      link.classList.add("active");
      currentPage = 1;
      renderShopProducts();
    });
  });

  // Sort change event
  if (sortSelect) {
    sortSelect.addEventListener("change", function (e) {
      currentSort = e.target.value;
      currentPage = 1;
      renderShopProducts();
    });
  }

  // Custom Select Dropdown UI logic
  const customSortDropdown = document.getElementById("customSortDropdown");
  if (customSortDropdown && sortSelect) {
    const trigger = customSortDropdown.querySelector(".custom-select-trigger");
    const label = customSortDropdown.querySelector(".custom-select-label");
    const options = customSortDropdown.querySelectorAll(".custom-select-option");

    function openDropdown() {
      customSortDropdown.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    }

    function closeDropdown() {
      customSortDropdown.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    }

    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      if (customSortDropdown.classList.contains("is-open")) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    function selectOption(opt) {
      const val = opt.getAttribute("data-value");
      const text = opt.querySelector("span") ? opt.querySelector("span").textContent.trim() : opt.textContent.trim();

      options.forEach((o) => {
        o.classList.remove("is-selected");
        o.setAttribute("aria-selected", "false");
      });
      opt.classList.add("is-selected");
      opt.setAttribute("aria-selected", "true");

      if (label) {
        label.textContent = text;
      }

      closeDropdown();
      trigger.focus();

      if (sortSelect.value !== val) {
        sortSelect.value = val;
        sortSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    options.forEach((opt, idx) => {
      opt.setAttribute("tabindex", "0");
      opt.addEventListener("click", function (e) {
        e.stopPropagation();
        selectOption(opt);
      });

      opt.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectOption(opt);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = options[idx + 1] || options[0];
          next.focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = options[idx - 1] || options[options.length - 1];
          prev.focus();
        } else if (e.key === "Escape") {
          e.preventDefault();
          closeDropdown();
          trigger.focus();
        }
      });
    });

    // Trigger keyboard controls
    trigger.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDropdown();
        const selected = customSortDropdown.querySelector(".custom-select-option.is-selected") || options[0];
        if (selected) selected.focus();
      } else if (e.key === "Escape" && customSortDropdown.classList.contains("is-open")) {
        e.preventDefault();
        closeDropdown();
      }
    });

    // Close on outside click
    document.addEventListener("click", function (e) {
      if (!customSortDropdown.contains(e.target)) {
        closeDropdown();
      }
    });

    // Sync from native select if changed externally
    sortSelect.addEventListener("change", function () {
      const currentVal = sortSelect.value;
      options.forEach((opt) => {
        const isMatch = opt.getAttribute("data-value") === currentVal;
        opt.classList.toggle("is-selected", isMatch);
        opt.setAttribute("aria-selected", isMatch ? "true" : "false");
        if (isMatch && label) {
          const text = opt.querySelector("span") ? opt.querySelector("span").textContent.trim() : opt.textContent.trim();
          label.textContent = text;
        }
      });
    });
  }

  function scrollToShopCatalog() {
    const shopHeader = document.querySelector(".shop-header") || productsContainer;
    if (shopHeader) {
      const topOffset = shopHeader.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: Math.max(0, topOffset), behavior: "smooth" });
    }
  }

  function renderShopProducts() {
    if (!productsContainer || typeof ProductsList === "undefined") return;

    let filtered = ProductsList.filter((item) => {
      const matchCategory =
        currentCategory === "all" || item.category === currentCategory;
      const matchPrice = item.price >= minPrice && item.price <= maxPrice;
      const matchColor =
        selectedColors.length === 0 || selectedColors.includes(item.color);
      return matchCategory && matchPrice && matchColor;
    });

    // Sort products
    if (currentSort === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (currentSort === "name-asc") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (currentSort === "name-desc") {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else if (currentSort === "newest") {
      filtered.sort((a, b) => b.id - a.id);
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedItems = filtered.slice(startIndex, endIndex);

    if (countEl) {
      countEl.textContent = `${totalItems} Product${totalItems === 1 ? "" : "s"}`;
    }

    if (totalItems === 0) {
      productsContainer.innerHTML = `
        <div class="col-12 py-5 text-center">
          <p style="font-size: 18px; color: var(--text-color);">No products match your current filters.</p>
        </div>
      `;
      if (paginationWrapper) paginationWrapper.style.display = "none";
      return;
    }

    // Update Pagination UI
    if (paginationWrapper) {
      paginationWrapper.style.display = "flex";
      if (paginationRangeText) {
        paginationRangeText.textContent = `${startIndex + 1}–${endIndex}`;
      }
      if (paginationTotalText) {
        paginationTotalText.textContent = totalItems;
      }
      if (prevPageBtn) {
        prevPageBtn.disabled = currentPage <= 1;
      }
      if (nextPageBtn) {
        nextPageBtn.disabled = currentPage >= totalPages;
      }

      if (pageNumbersContainer) {
        let pagesHtml = "";
        for (let i = 1; i <= totalPages; i++) {
          const isActive = i === currentPage ? "active" : "";
          pagesHtml += `<button class="shop-page-num ${isActive}" data-page="${i}" type="button" aria-label="Go to page ${i}" ${i === currentPage ? 'aria-current="page"' : ""}>${i}</button>`;
        }
        pageNumbersContainer.innerHTML = pagesHtml;
      }
    }

    function getShopWishlist() {
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

    function getShopHeartSvg(filled = false) {
      if (filled) {
        return `<svg class="heart-icon filled" width="22" height="22" viewBox="0 0 24 24" fill="#ff4757" stroke="#ff4757" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
      }
      return `<svg class="heart-icon outline" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2d3748" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
    }

    const currentWishlist = getShopWishlist();
    let html = "";
    paginatedItems.forEach((item) => {
      const isFav = currentWishlist.includes(item.id);
      html += `
        <div class="item col-lg-4 col-md-6 col-sm-12">
          <div class="product-card" data-id="${item.id}" style="position: relative;">
            <div class="product-img" style="position: relative;">
              <button class="wishlist-toggle-btn ${isFav ? "active" : ""}" data-id="${item.id}" type="button" aria-label="${isFav ? "Remove from Wishlist" : "Save to Wishlist"}" title="${isFav ? "Saved in Wishlist" : "Save to Wishlist"}">
                ${getShopHeartSvg(isFav)}
              </button>
              <a href="product-details.html?id=${item.id}" style="display:block;">
                <div class="quick-view">Quick View</div>
                <img src="${item.image}" alt="${item.name}" />
              </a>
            </div>
            <a href="product-details.html?id=${item.id}">
              <p>${item.name}</p>
            </a>
            <span class="price-tag">$${item.price.toFixed(2)}</span>
          </div>
        </div>
      `;
    });

    productsContainer.innerHTML = html;
  }

  // Pagination navigation click events
  if (prevPageBtn) {
    prevPageBtn.addEventListener("click", function () {
      if (currentPage > 1) {
        currentPage--;
        renderShopProducts();
        scrollToShopCatalog();
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener("click", function () {
      currentPage++;
      renderShopProducts();
      scrollToShopCatalog();
    });
  }

  if (pageNumbersContainer) {
    pageNumbersContainer.addEventListener("click", function (e) {
      const btn = e.target.closest(".shop-page-num");
      if (!btn) return;
      const targetPage = parseInt(btn.dataset.page, 10);
      if (targetPage && targetPage !== currentPage) {
        currentPage = targetPage;
        renderShopProducts();
        scrollToShopCatalog();
      }
    });
  }

  // Handle wishlist toggle on shop page
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".wishlist-toggle-btn");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    const productId = parseInt(btn.dataset.id || "1", 10);
    let list = [];
    if (window.KidoWishlist && typeof window.KidoWishlist.get === "function") {
      list = window.KidoWishlist.get();
    } else {
      const stored = localStorage.getItem("kido_wishlist");
      try {
        list = stored ? JSON.parse(stored).map((x) => parseInt(x, 10)) : [1, 2, 3, 5];
      } catch (err) {
        list = [1, 2, 3, 5];
      }
    }

    const idx = list.indexOf(productId);
    const isRemoving = idx > -1;
    if (isRemoving) {
      list.splice(idx, 1);
    } else {
      list.push(productId);
    }

    if (window.KidoWishlist && typeof window.KidoWishlist.set === "function") {
      window.KidoWishlist.set(list);
    } else {
      localStorage.setItem("kido_wishlist", JSON.stringify(list));
    }

    // Update buttons on shop page
    const matching = document.querySelectorAll(`.wishlist-toggle-btn[data-id="${productId}"]`);
    const filledSvg = `<svg class="heart-icon filled" width="22" height="22" viewBox="0 0 24 24" fill="#ff4757" stroke="#ff4757" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
    const outlineSvg = `<svg class="heart-icon outline" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2d3748" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

    matching.forEach((b) => {
      if (isRemoving) {
        b.classList.remove("active");
        b.setAttribute("aria-label", "Save to Wishlist");
        b.setAttribute("title", "Save to Wishlist");
        b.innerHTML = outlineSvg;
      } else {
        b.classList.add("active");
        b.setAttribute("aria-label", "Remove from Wishlist");
        b.setAttribute("title", "Saved in Wishlist");
        b.innerHTML = filledSvg;
      }
    });

    if (window.updateWishlistBadge) window.updateWishlistBadge();
    const product = typeof getProductById === "function" ? getProductById(productId) : null;
    const prodName = product ? product.name : "Item";
    if (typeof window.showKidoToast === "function") {
      window.showKidoToast(
        isRemoving
          ? `Removed "${prodName}" from your wishlist.`
          : `Added "${prodName}" to your wishlist.`
      );
    }
  });

  renderShopProducts();
});
