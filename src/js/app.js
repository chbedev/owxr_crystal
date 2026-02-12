// src/js/app.js

// ==================== MOBILE MENU & DROPDOWN INITIALIZATION ====================
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navList = document.querySelector('.nav-list');
    const header = document.querySelector('.main-header');
    
    // Define logic for switching states (Desktop <-> Mobile)
    function updateMenuState() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        
        if (!isMobile) {
            // Desktop State
            if (navList) {
                navList.style.display = ''; 
                navList.classList.remove('show');
            }
            if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = ''; 
            const icon = mobileToggle?.querySelector('i');
            if (icon) icon.className = 'fas fa-bars';
        }
    }

    // One-time setup: Add event listeners
    if (mobileToggle && navList) {
        mobileToggle.setAttribute('aria-label', 'Toggle navigation menu');
        mobileToggle.setAttribute('role', 'button');
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
        
        mobileToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
            navList.classList.toggle('show');
            mobileToggle.setAttribute('aria-expanded', !isExpanded);
            document.body.style.overflow = !isExpanded ? 'hidden' : '';
            
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                icon.className = isExpanded ? 'fas fa-bars' : 'fas fa-times';
            }
        });
    }

    // --- CLICK-TO-OPEN DROPDOWN LOGIC ---
    // Select all nav-links that have a dropdown sibling
    const dropdownToggles = document.querySelectorAll('.nav-item > .nav-link');

    dropdownToggles.forEach(toggle => {
        const parentItem = toggle.closest('.nav-item');
        const dropdown = parentItem.querySelector('.dropdown-menu');

        if (dropdown) {
            // If this link controls a dropdown, override default click
            toggle.addEventListener('click', function(e) {
                
                // Only prevent default if it's strictly a toggle (not a link to a page)
                if (toggle.tagName === 'SPAN' || toggle.getAttribute('href') === '#') {
                    e.preventDefault();
                    e.stopPropagation();
                }

                const isOpen = dropdown.classList.contains('show');

                // 1. Close all other open dropdowns first
                document.querySelectorAll('.dropdown-menu.show').forEach(openDropdown => {
                    if (openDropdown !== dropdown) {
                        openDropdown.classList.remove('show');
                        openDropdown.closest('.nav-item').classList.remove('dropdown-active');
                    }
                });

                // 2. Toggle current dropdown
                if (isOpen) {
                    dropdown.classList.remove('show');
                    parentItem.classList.remove('dropdown-active');
                } else {
                    dropdown.classList.add('show');
                    parentItem.classList.add('dropdown-active');
                }
            });
        }
    });

    // Close dropdowns when clicking anywhere else on the page
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-item')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
                menu.closest('.nav-item').classList.remove('dropdown-active');
            });
        }
    });

    // Listen for screen resize
    window.addEventListener('resize', updateMenuState);
    updateMenuState();
    
    // Optional: Compact header on scroll
    if (header) {
        window.addEventListener('scroll', function() {
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            if (!isMobile) return; 
            
            if (window.scrollY > 100) {
                header.classList.add('compact');
                document.body.classList.add('header-compact');
            } else {
                header.classList.remove('compact');
                document.body.classList.remove('header-compact');
            }
        }, { passive: true });
    }
}

// ==================== NETLIFY IDENTITY & SPA ROUTER ====================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Netlify Identity
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on("init", user => {
            if (!user) {
                window.netlifyIdentity.on("login", () => {
                    document.location.href = "/admin/";
                });
            }
        });
    }

    // Initialize Menu
    initMobileMenu();
    
    // Handle browser back/forward buttons
    window.addEventListener('hashchange', () => {
        const hashPageId = window.location.hash.substring(1);
        // Only switch if it's a MAIN page (no slash)
        // If there is a slash (e.g. news/123), let contentLoader handle it
        if (hashPageId && !hashPageId.includes('/')) { 
            switchPage(hashPageId, false); 
        }
    });
});


function switchPage(pageId, updateHistory = true, scrollToId = null) {
    const pages = document.querySelectorAll('.page-view');
    pages.forEach(page => page.classList.remove('active'));

    const selectedPage = document.getElementById(pageId);
    if(selectedPage) {
        selectedPage.classList.add('active');
        
        if (scrollToId) {
            setTimeout(() => {
                const targetEl = document.getElementById(scrollToId);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 50); 
        } else {
            window.scrollTo(0, 0); 
        }
    } else {
        // Fallback to home if page not found
        pageId = 'home';
        const homePage = document.getElementById('home');
        if(homePage) homePage.classList.add('active');
        window.scrollTo(0, 0);
    }

    // Close mobile menu
    const navList = document.querySelector('.nav-list');
    const mobileToggle = document.querySelector('.mobile-toggle');
    
    if (navList && navList.classList.contains('show')) {
        navList.classList.remove('show');
        document.body.style.overflow = '';
        if (mobileToggle) {
            mobileToggle.setAttribute('aria-expanded', 'false');
            const icon = mobileToggle.querySelector('i');
            if (icon) icon.className = 'fas fa-bars';
        }
    }
    
    // Close any open desktop dropdowns
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
        menu.closest('.nav-item').classList.remove('dropdown-active');
    });

    if (updateHistory) {
        // FIX: Always update the hash when switching to a main page
        // This ensures the URL updates even when coming from a detail view
        window.location.hash = pageId;
    }
    
    // Update active link state
    document.querySelectorAll('.main-nav .nav-link').forEach(link => link.classList.remove('active'));
    
    const activeLink = document.querySelector(`.nav-list a[data-page="${pageId}"]`) || 
                      document.querySelector(`.nav-list a[onclick*="'${pageId}'"]`);
    
    if(activeLink) {
        activeLink.classList.add('active');
        const parentSpan = activeLink.closest('.dropdown-menu')?.closest('.nav-item')?.querySelector('.nav-link');
        if (parentSpan) parentSpan.classList.add('active');
    }

    // Load content for that page (if needed)
    if (typeof loadContent === 'function') {
        loadContent(pageId);
    }
}