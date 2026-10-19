/**
 * Kido Kids - Login & Account Management Script (js/login.js)
 * Handles tab switching (Sign In / Register), password visibility toggles,
 * password strength validation, mock authentication, profile state, and header sync.
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

  // 2. DOM Elements
  const tabSignIn = document.getElementById("tabSignIn");
  const tabRegister = document.getElementById("tabRegister");
  const signInForm = document.getElementById("signInForm");
  const registerForm = document.getElementById("registerForm");
  const authTitle = document.getElementById("authTitle");
  const authSubtitle = document.getElementById("authSubtitle");
  const loginAuthGrid = document.getElementById("loginAuthGrid");
  const loggedInCard = document.getElementById("loggedInCard");
  const loggedInUserName = document.getElementById("loggedInUserName");
  const loggedInUserEmail = document.getElementById("loggedInUserEmail");
  const signOutBtn = document.getElementById("signOutBtn");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");

  // 3. Check Current Auth State
  function getUserState() {
    try {
      const data = localStorage.getItem("kido_user");
      if (!data) return null;
      let user = JSON.parse(data);
      if (user && (user.name === "Happy Parent" || user.name === "Happy")) {
        user.name = "Parent";
        localStorage.setItem("kido_user", JSON.stringify(user));
      }
      return user;
    } catch (e) {
      return null;
    }
  }

  function setUserState(user) {
    if (user) {
      if (user.name === "Happy Parent" || user.name === "Happy") {
        user.name = "Parent";
      }
      localStorage.setItem("kido_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("kido_user");
    }
    updateHeaderUserDisplay();
  }

  function updateHeaderUserDisplay() {
    const user = getUserState();
    const loginBtns = document.querySelectorAll(".header-login-btn");
    loginBtns.forEach((btn) => {
      const span = btn.querySelector("span");
      if (span) {
        if (user && user.loggedIn) {
          const rawName = (user.name || "Parent").trim();
          const displayName = (rawName.toLowerCase().includes("happy") || rawName === "") ? "Parent" : rawName.split(" ")[0];
          span.textContent = `Hi, ${displayName}!`;
          btn.title = `Logged in as ${displayName} (${user.email || ""})`;
        } else {
          span.textContent = "Log in";
          btn.title = "Customer Log in";
        }
      }
    });
  }
  updateHeaderUserDisplay();

  // 4. Render Logged-In Dashboard vs Auth Form
  function checkAuthUI() {
    const user = getUserState();
    if (user && user.loggedIn) {
      if (loginAuthGrid) loginAuthGrid.style.display = "none";
      if (loggedInCard) {
        loggedInCard.classList.add("show");
        loggedInCard.style.display = "block";
        const rawName = (user.name || "Parent").trim();
        const displayName = (rawName.toLowerCase().includes("happy") || rawName === "") ? "Parent" : rawName;
        if (loggedInUserName) loggedInUserName.textContent = displayName;
        if (loggedInUserEmail) loggedInUserEmail.textContent = user.email;
      }
    } else {
      if (loggedInCard) {
        loggedInCard.classList.remove("show");
        loggedInCard.style.display = "none";
      }
      if (loginAuthGrid) loginAuthGrid.style.display = "grid";
    }
  }
  checkAuthUI();

  // 5. Tab Switching
  function switchTab(mode) {
    if (mode === "register") {
      tabRegister?.classList.add("active");
      tabSignIn?.classList.remove("active");
      if (signInForm) signInForm.style.display = "none";
      if (registerForm) registerForm.style.display = "block";
      if (authTitle) authTitle.textContent = "Join the Kido Club";
      if (authSubtitle) {
        authSubtitle.textContent =
          "Create your account to unlock 10% off your first order, easy returns, and saved family sizes.";
      }
    } else {
      tabSignIn?.classList.add("active");
      tabRegister?.classList.remove("active");
      if (registerForm) registerForm.style.display = "none";
      if (signInForm) signInForm.style.display = "block";
      if (authTitle) authTitle.textContent = "Welcome Back";
      if (authSubtitle) {
        authSubtitle.textContent =
          "Log in to track orders, manage your wishlist, and unlock exclusive family perks.";
      }
    }
  }

  tabSignIn?.addEventListener("click", () => switchTab("signin"));
  tabRegister?.addEventListener("click", () => switchTab("register"));

  document.querySelectorAll("[data-switch-tab]").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const target = this.getAttribute("data-switch-tab");
      switchTab(target);
    });
  });

  // 6. Password Visibility Toggles
  document.querySelectorAll(".password-visibility-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const input = this.parentElement.querySelector("input");
      if (!input) return;

      const isPassword = input.getAttribute("type") === "password";
      input.setAttribute("type", isPassword ? "text" : "password");

      if (isPassword) {
        // Eye Off Icon
        this.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        `;
        this.setAttribute("aria-label", "Hide password");
      } else {
        // Eye Open Icon
        this.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        `;
        this.setAttribute("aria-label", "Show password");
      }
    });
  });

  // 7. Password Strength Calculation for Registration
  const regPasswordInput = document.getElementById("regPassword");
  const strengthFill = document.getElementById("strengthFill");
  const strengthText = document.getElementById("strengthText");

  if (regPasswordInput && strengthFill && strengthText) {
    regPasswordInput.addEventListener("input", function () {
      const val = this.value;
      if (!val) {
        strengthFill.className = "password-strength-fill";
        strengthFill.style.width = "0%";
        strengthText.textContent = "Minimum 6 characters";
        return;
      }

      let score = 0;
      if (val.length >= 6) score++;
      if (val.length >= 9) score++;
      if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      if (score <= 1) {
        strengthFill.className = "password-strength-fill strength-weak";
        strengthText.textContent = "Weak password";
      } else if (score <= 3) {
        strengthFill.className = "password-strength-fill strength-medium";
        strengthText.textContent = "Medium password";
      } else {
        strengthFill.className = "password-strength-fill strength-strong";
        strengthText.textContent = "Strong password";
      }
    });
  }

  // 8. Social Login Handlers (Google / Apple)
  document.querySelectorAll(".social-auth-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const provider = this.getAttribute("data-provider") || "Social Account";
      const origText = this.innerHTML;
      this.innerHTML = `<span>Connecting...</span>`;

      setTimeout(() => {
        const dummyUser = {
          name: "Parent",
          email: "parent@kidokids.com",
          provider: provider,
          loggedIn: true,
        };
        setUserState(dummyUser);
        this.innerHTML = origText;
        showToast(`Connected via ${provider}. Welcome to Kido Kids.`);
        checkAuthUI();
      }, 700);
    });
  });

  // 9. Sign In Form Submit
  if (signInForm) {
    signInForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("loginEmail")?.value.trim();
      const password = document.getElementById("loginPassword")?.value;
      const submitBtn = signInForm.querySelector('button[type="submit"]');

      if (!email || !password) {
        showToast("Please enter both email and password.", "error");
        return;
      }

      const origBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Signing in...</span>`;

      setTimeout(() => {
        const namePart = email.split("@")[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const user = {
          name: formattedName,
          email: email,
          loggedIn: true,
        };

        setUserState(user);
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;

        showToast(`Welcome back, ${formattedName}. Signed in successfully.`);
        checkAuthUI();
      }, 700);
    });
  }

  // 10. Register Form Submit
  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = document.getElementById("regName")?.value.trim();
      const email = document.getElementById("regEmail")?.value.trim();
      const password = document.getElementById("regPassword")?.value;
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      if (!name || !email || !password) {
        showToast("Please fill in all required fields.", "error");
        return;
      }

      if (password.length < 6) {
        showToast("Password must be at least 6 characters long.", "error");
        return;
      }

      const origBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Creating Account...</span>`;

      setTimeout(() => {
        const user = {
          name: name,
          email: email,
          loggedIn: true,
        };

        setUserState(user);
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;

        showToast(`Welcome to the Kido Club, ${name}. Your 10% welcome voucher is active.`);
        checkAuthUI();
      }, 800);
    });
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", function (e) {
      e.preventDefault();
      const currentEmail = document.getElementById("loginEmail")?.value.trim() || "";

      if (typeof window.showKidoModal === "function") {
        window.showKidoModal({
          title: "Reset Your Password",
          message: "Please enter your account email to receive reset instructions:",
          showInput: true,
          inputValue: currentEmail,
          inputPlaceholder: "name@example.com",
          showCancel: true,
          confirmText: "Send Reset Link",
          cancelText: "Cancel",
          type: "info",
          onConfirm: (enteredEmail) => {
            if (enteredEmail) {
              showToast(`Password reset instructions sent to ${enteredEmail}. Please check your inbox.`);
            }
          },
        });
      } else {
        if (currentEmail) {
          showToast(`Password reset instructions sent to ${currentEmail}.`);
        }
      }
    });
  }

  // 12. Sign Out Handler
  if (signOutBtn) {
    signOutBtn.addEventListener("click", function () {
      setUserState(null);
      showToast("You have successfully signed out.");
      checkAuthUI();
      switchTab("signin");
    });
  }
});
