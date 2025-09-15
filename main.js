// main.js - combined: mobile nav, modal, cart, toast, fade-in
document.addEventListener('DOMContentLoaded', function () {
  /* ---------- Mobile nav ---------- */
  const menuIcon = document.querySelector('nav .fa-bars');
  const navLinks = document.querySelector('nav .mobile-nav');
  const heroOverlay = document.querySelector('.section-hero-overlay');
  if (menuIcon && navLinks) {
    // accessibility
    menuIcon.setAttribute('role', 'button');
    menuIcon.setAttribute('tabindex', '0');
    menuIcon.setAttribute('aria-expanded', 'false');

    function openMenu() {
      navLinks.classList.remove('hidden');
      navLinks.classList.add('mobile-nav-open');
      menuIcon.setAttribute('aria-expanded', 'true');
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      if (heroOverlay) heroOverlay.style.pointerEvents = 'none';
    }
    function closeMenu() {
      navLinks.classList.add('hidden');
      navLinks.classList.remove('mobile-nav-open');
      menuIcon.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      if (heroOverlay) heroOverlay.style.pointerEvents = 'none';
    }
    function toggleMenu() {
      if (navLinks.classList.contains('hidden')) openMenu();
      else closeMenu();
    }
    menuIcon.addEventListener('click', toggleMenu);
    menuIcon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
      }
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => { setTimeout(closeMenu, 80); });
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        navLinks.classList.remove('mobile-nav-open');
        navLinks.classList.remove('hidden');
        menuIcon.setAttribute('aria-expanded', 'false');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      } else {
        if (!navLinks.classList.contains('hidden')) navLinks.classList.add('hidden');
      }
    });
  }

  /* ---------- Modal open/close (uses .open class) ---------- */
  document.querySelectorAll('[data-modal]').forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      var modalId = trigger.getAttribute('data-modal');
      var modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        var focusable = modal.querySelector('a, button, [tabindex], input, textarea');
        if (focusable) focusable.focus();
      } else {
        window.location.href = 'publications.html';
      }
    });
  });
  document.querySelectorAll('.modal .close-btn').forEach(function (closeBtn) {
    closeBtn.addEventListener('click', function () {
      var modal = closeBtn.closest('.modal');
      if (modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
    });
    closeBtn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        closeBtn.click();
      }
    });
  });
  window.addEventListener('click', function (event) {
    if (event.target.classList && event.target.classList.contains('modal')) {
      event.target.classList.remove('open');
      event.target.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.open').forEach(function (modal){
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      });
    }
  });

  /* ---------- Toast helper ---------- */
  function showToast(message = 'Added to cart') {
    const containerId = 'toast-container';
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.position = 'fixed';
      container.style.bottom = '20px';
      container.style.left = '50%';
      container.style.transform = 'translateX(-50%)';
      container.style.zIndex = 9999;
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '8px';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.minWidth = '160px';
    toast.style.padding = '10px 14px';
    toast.style.borderRadius = '8px';
    toast.style.background = 'rgba(0,0,0,0.85)';
    toast.style.color = 'white';
    toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.25)';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 260ms ease';
    toast.textContent = message;
    container.appendChild(toast);
    // show
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    // auto remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 260);
    }, 1600);
  }

  /* ---------- Cart (localStorage-backed) ---------- */
  const CART_KEY = 'olasunkanmi_cart_v1';
  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }
  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCountDisplay();
    renderCartPanel(); // update UI if open
  }
  function updateCartCountDisplay() {
    const countEl = document.getElementById('cart-count');
    if (!countEl) return;
    const totalQty = readCart().reduce((s,i) => s + (i.qty||0), 0);
    countEl.textContent = totalQty;
  }
  function addToCart(item) {
    const cart = readCart();
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      existing.qty = (existing.qty || 1) + (item.qty || 1);
    } else {
      cart.push(Object.assign({qty:1}, item));
    }
    writeCart(cart);
    showToast('Added to cart');
  }

  // wired to any element with class .add-to-cart (cards & modal purchase btn)
document.querySelectorAll('.add-to-cart').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    // read data-* attributes (must be set on the button)
    const title = btn.getAttribute('data-title') || btn.dataset.title || 'Item';
    let priceStr = btn.getAttribute('data-price') || btn.dataset.price || '0';
    // sanitize price: remove anything that's not digit or dot
    priceStr = String(priceStr).replace(/[^\d.]/g, '') || '0';
    const price = parseFloat(priceStr) || 0;
    const pdf = btn.getAttribute('data-pdf') || btn.dataset.pdf || '';
    const id = btn.getAttribute('data-id') || btn.dataset.id || title.replace(/\s+/g,'-').toLowerCase();

    // add to cart object
    addToCart({ id, title, price, pdf });

    // if this button had data-action="buy-now" go straight to checkout
    const action = (btn.getAttribute('data-action') || btn.dataset.action || '').toLowerCase();
    if (action === 'buy-now') {
      // small timeout so toast shows before redirecting
      setTimeout(() => {
        window.location.href = 'checkout.html';
      }, 350);
    }
  });
});


  /* ---------- Cart panel UI (slide-over) ---------- */
  // inject cart HTML into DOM (only once)
  function ensureCartPanelExists() {
    if (document.getElementById('cart-panel')) return;
    const panel = document.createElement('aside');
    panel.id = 'cart-panel';
    panel.style.position = 'fixed';
    panel.style.right = '20px';
    panel.style.top = '80px';
    panel.style.width = '320px';
    panel.style.maxHeight = '70vh';
    panel.style.overflowY = 'auto';
    panel.style.background = 'white';
    panel.style.borderRadius = '12px';
    panel.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)';
    panel.style.padding = '12px';
    panel.style.zIndex = 9998;
    panel.style.display = 'none';
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong>Cart</strong>
        <button id="close-cart-panel" aria-label="Close cart" style="background:none;border:none;font-size:18px;cursor:pointer">&times;</button>
      </div>
      <div id="cart-items"></div>
      <div id="cart-empty" style="text-align:center;color:#666;padding:16px 0">Your cart is empty</div>
      <div id="cart-footer" style="display:none;margin-top:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <strong>Total</strong><strong id="cart-total">₦0.00</strong>
        </div>
        <div style="display:flex;gap:8px">
          <a id="goto-checkout" href="checkout.html" class="btn-primary" style="padding:10px 12px;border-radius:8px;text-decoration:none;color:white;display:inline-block;text-align:center;flex:1">Checkout</a>
          <button id="clear-cart" style="padding:10px 12px;border-radius:8px;border:1px solid #ddd;background:#fff;flex:0">Clear</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    document.getElementById('close-cart-panel').addEventListener('click', () => toggleCartPanel(false));
    document.getElementById('clear-cart').addEventListener('click', () => {
      localStorage.removeItem(CART_KEY);
      renderCartPanel();
      updateCartCountDisplay();
      showToast('Cart cleared');
    });
  }

  function renderCartPanel() {
    ensureCartPanelExists();
    const panel = document.getElementById('cart-panel');
    const itemsContainer = document.getElementById('cart-items');
    const emptyEl = document.getElementById('cart-empty');
    const footer = document.getElementById('cart-footer');
    const totalEl = document.getElementById('cart-total');

    const cart = readCart();
    itemsContainer.innerHTML = '';
    if (!cart || cart.length === 0) {
      emptyEl.style.display = 'block';
      footer.style.display = 'none';
      return;
    }
    emptyEl.style.display = 'none';
    footer.style.display = 'block';

    let total = 0;
    cart.forEach(item => {
      total += (item.price || 0) * (item.qty || 1);
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.marginBottom = '8px';
      row.innerHTML = `
        <div style="flex:1">
          <div style="font-size:14px">${escapeHtml(item.title)}</div>
          <div style="font-size:12px;color:#666">${item.qty} × ₦${(item.price||0).toFixed(2)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-left:8px">
          <button class="qty-increase" data-id="${item.id}" style="padding:6px;border-radius:6px;border:1px solid #ddd;background:#fff">+</button>
          <button class="qty-decrease" data-id="${item.id}" style="padding:6px;border-radius:6px;border:1px solid #ddd;background:#fff">−</button>
        </div>
      `;
      itemsContainer.appendChild(row);
    });
    totalEl.textContent = `₦${total.toFixed(2)}`;

    // attach qty handlers
    itemsContainer.querySelectorAll('.qty-increase').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const cart = readCart();
        const it = cart.find(i => i.id === id);
        if (it) { it.qty = (it.qty||1)+1; writeCart(cart); renderCartPanel(); }
      });
    });
    itemsContainer.querySelectorAll('.qty-decrease').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        let cart = readCart();
        const it = cart.find(i => i.id === id);
        if (it) {
          it.qty = (it.qty||1)-1;
          if (it.qty <= 0) cart = cart.filter(x => x.id !== id);
          writeCart(cart);
          renderCartPanel();
        }
      });
    });
  }

  function toggleCartPanel(forceOpen) {
    ensureCartPanelExists();
    const panel = document.getElementById('cart-panel');
    if (typeof forceOpen === 'boolean') {
      panel.style.display = forceOpen ? 'block' : 'none';
    } else {
      panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
    }
    // update content when opening
    if (panel.style.display === 'block') renderCartPanel();
  }

  // cart button click
  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) cartBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleCartPanel();
  });

  // utility
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function(m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); });
  }

  // initial update
  updateCartCountDisplay();
  ensureCartPanelExists();
  renderCartPanel();

  /* ---------- Fade in/out on scroll ---------- */
  function handleFade() {
    document.querySelectorAll('.fade-in, .fade-in-card').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 50) {
        el.classList.add('opacity-100', 'translate-y-0');
        el.classList.remove('opacity-0', 'translate-y-8');
      } else {
        el.classList.remove('opacity-100', 'translate-y-0');
        el.classList.add('opacity-0', 'translate-y-8');
      }
    });
  }
  window.addEventListener('scroll', handleFade);
  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.fade-in, .fade-in-card').forEach(el => {
      el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-8');
    });
    handleFade();
  });
});
