// Hamburger menu functionality

document.addEventListener('DOMContentLoaded', function() {
    const menuIcon = document.querySelector('nav .fa-bars');
    const navLinks = document.querySelector('nav .mobile-nav');
    if (menuIcon && navLinks) {
        menuIcon.addEventListener('click', function() {
            navLinks.classList.toggle('hidden');
        });
    }
});
