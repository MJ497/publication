// main.js - mobile nav toggle with overlay pointer control
document.addEventListener('DOMContentLoaded', function () {
  const menuIcon = document.querySelector('nav .fa-bars');
  const navLinks = document.querySelector('nav .mobile-nav');
  const heroOverlay = document.querySelector('.section-hero-overlay');
  if (!menuIcon || !navLinks) return;

  // accessibility
  menuIcon.setAttribute('role', 'button');
  menuIcon.setAttribute('tabindex', '0');
  menuIcon.setAttribute('aria-expanded', 'false');

  function openMenu() {
    // show the menu (Tailwind 'hidden' removal + helper class)
    navLinks.classList.remove('hidden');
    navLinks.classList.add('mobile-nav-open');

    menuIcon.setAttribute('aria-expanded', 'true');

    // disable page scroll
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // ensure overlay doesn't block the menu area (we let the menu itself handle touches)
    if (heroOverlay) heroOverlay.style.pointerEvents = 'none';
  }

  function closeMenu() {
    navLinks.classList.add('hidden');
    navLinks.classList.remove('mobile-nav-open');

    menuIcon.setAttribute('aria-expanded', 'false');

    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    // restore default overlay behavior (no blocking)
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

  // close when any mobile link is clicked so it behaves like a normal nav
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      // close after a short timeout so native navigation still occurs
      setTimeout(closeMenu, 80);
    });
  });

  // in case CSS had nav visible on desktop, ensure mobile starts hidden if needed
  if (window.innerWidth < 768) {
    navLinks.classList.add('hidden');
    if (heroOverlay) heroOverlay.style.pointerEvents = 'none';
  }

  // optional: close menu on resize to desktop to avoid stuck states
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      navLinks.classList.remove('mobile-nav-open');
      navLinks.classList.remove('hidden'); // desktop shows nav
      if (heroOverlay) heroOverlay.style.pointerEvents = 'none';
      menuIcon.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    } else {
      // mobile: start hidden
      if (!navLinks.classList.contains('hidden')) {
        navLinks.classList.add('hidden');
      }
    }
  });
});


 (function () {
      // Open triggers using data-modal
      document.querySelectorAll('[data-modal]').forEach(function (trigger) {
        trigger.addEventListener('click', function (e) {
          e.preventDefault();
          var modalId = trigger.getAttribute('data-modal');
          var modal = document.getElementById(modalId);
          if (modal) {
            modal.style.setProperty('display', 'flex', 'important'); // ensures visible even if stylesheet used !important
            modal.setAttribute('aria-hidden', 'false');
            // prevent body scroll while modal open
            document.body.style.overflow = 'hidden';
          } else {
            // fallback: navigate to publications page if modal not present
            window.location.href = 'publications.html';
          }
        });
      });

      // Close buttons inside modals
      document.querySelectorAll('.modal .float-right').forEach(function (closeBtn) {
        closeBtn.addEventListener('click', function () {
          var modal = closeBtn.closest('.modal');
          if (modal) {
            modal.style.setProperty('display', 'none', 'important');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
          }
        });
        // allow Enter/Space to close (basic keyboard support)
        closeBtn.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            closeBtn.click();
          }
        });
      });

      // Click outside modal-content to close
      window.addEventListener('click', function (event) {
        if (event.target.classList && event.target.classList.contains('modal')) {
          event.target.style.setProperty('display', 'none', 'important');
          event.target.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
        }
      });

      // ESC key to close
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          document.querySelectorAll('.modal').forEach(function (m) {
            m.style.setProperty('display', 'none', 'important');
            m.setAttribute('aria-hidden', 'true');
          });
          document.body.style.overflow = '';
        }
      });
    })();

    // Cart logic
    let cartCount = 0;
    document.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', function() {
        cartCount++;
        document.getElementById('cart-count').textContent = cartCount;
      });
    });
    document.getElementById('cart-btn').addEventListener('click', function() {
      alert('Cart functionality coming soon!');
    });

    // Fade in/out on scroll
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