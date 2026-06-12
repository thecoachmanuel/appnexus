/**
 * AppForge Documentation v2.0.2
 * Enhanced interactive documentation with smooth animations and modern UX
 */

// ═══════════════════════════════════════════════════════════
// THEME MANAGEMENT
// ═══════════════════════════════════════════════════════════
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('docs-theme', next);
}

function initTheme() {
  const stored = localStorage.getItem('docs-theme');
  if (stored) {
    document.documentElement.setAttribute('data-theme', stored);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

// ═══════════════════════════════════════════════════════════
// SIDEBAR SEARCH / FILTER
// ═══════════════════════════════════════════════════════════
function filterSidebar() {
  const input = document.getElementById('sidebarSearch');
  if (!input) return;
  const query = input.value.toLowerCase().trim();
  const sections = document.querySelectorAll('.sidebar-section');
  sections.forEach(section => {
    const links = section.querySelectorAll('.sidebar-link');
    let anyVisible = false;
    links.forEach(link => {
      const text = link.textContent.toLowerCase();
      const match = !query || text.includes(query);
      link.parentElement.style.display = match ? '' : 'none';
      if (match) anyVisible = true;
    });
    const title = section.querySelector('.sidebar-title');
    if (title) {
      section.style.display = anyVisible || !query ? '' : 'none';
    }
  });
}

// ═══════════════════════════════════════════════════════════
// SIDEBAR MANAGEMENT
// ═══════════════════════════════════════════════════════════
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}


// ═══════════════════════════════════════════════════════════
// COLLAPSIBLE SIDEBAR SECTIONS
// ═══════════════════════════════════════════════════════════
function toggleSidebarSection(el) {
  const section = el.closest('.sidebar-section');
  if (section) section.classList.toggle('collapsed');
}


// ═══════════════════════════════════════════════════════════
// FAQ ACCORDION
// ═══════════════════════════════════════════════════════════
function toggleFAQ(element) {
  const answer = element.nextElementSibling;
  const arrow = element.querySelector('.faq-arrow');

  if (answer) {
    answer.classList.toggle('open');
  }

  if (arrow) {
    arrow.style.transform = answer && answer.classList.contains('open')
      ? 'rotate(180deg)'
      : 'rotate(0)';
  }
}


// ═══════════════════════════════════════════════════════════
// FAQ SEARCH / FILTER
// ═══════════════════════════════════════════════════════════
function filterFAQs() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  const query = searchInput.value.toLowerCase().trim();
  const faqItems = document.querySelectorAll('.faq-item');
  const faqSections = document.querySelectorAll('#help-center .card');

  faqItems.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(query) ? '' : 'none';
  });

  // Hide sections where all items are hidden
  faqSections.forEach(section => {
    const items = section.querySelectorAll('.faq-item');
    if (items.length === 0) return;
    const allHidden = Array.from(items).every(i => i.style.display === 'none');
    if (section.querySelector('.faq-list')) {
      section.style.display = allHidden ? 'none' : '';
    }
  });
}


// ═══════════════════════════════════════════════════════════
// SMOOTH SCROLL
// ═══════════════════════════════════════════════════════════
function scrollToSection(id) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}


// ═══════════════════════════════════════════════════════════
// COPY CODE TO CLIPBOARD
// ═══════════════════════════════════════════════════════════
function copyCode(button) {
  const codeBlock = button.closest('.code-block');
  const code = codeBlock ? codeBlock.querySelector('code') : null;

  if (code) {
    navigator.clipboard.writeText(code.textContent).then(() => {
      const originalText = button.textContent;
      button.textContent = '✓ Copied!';
      button.classList.add('copied');

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
}


// ═══════════════════════════════════════════════════════════
// TAB NAVIGATION
// ═══════════════════════════════════════════════════════════
function switchTab(tabGroup, tabId) {
  const group = document.querySelector(`[data-tab-group="${tabGroup}"]`);
  if (!group) return;

  group.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  group.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === tabId);
  });
}


// ═══════════════════════════════════════════════════════════
// READING PROGRESS BAR
// ═══════════════════════════════════════════════════════════
function updateReadingProgress() {
  const bar = document.querySelector('.reading-progress');
  if (!bar) return;

  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  bar.style.width = Math.min(progress, 100) + '%';
}


// ═══════════════════════════════════════════════════════════
// ACTIVE SIDEBAR LINK (SCROLL SPY)
// ═══════════════════════════════════════════════════════════
function updateActiveSidebarLink() {
  const sections = document.querySelectorAll('section[id], div[id]');
  const sidebarLinks = document.querySelectorAll('.sidebar-link, .sidebar-link-sub');
  const navLinks = document.querySelectorAll('.nav-center a');

  let currentSection = '';
  const offset = 120;

  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= offset) {
      currentSection = section.id;
    }
  });

  // Update sidebar links
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href === '#' + currentSection) {
      link.classList.add('active');
    } else if (href && currentSection && href.includes('#')) {
      // Check if this is a parent section
      const section = document.getElementById(currentSection);
      const linkTarget = href.substring(1);
      if (section && section.closest('[id="' + linkTarget + '"]')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    } else {
      link.classList.remove('active');
    }
  });

  // Update nav links
  const mainSections = ['getting-started', 'api-reference', 'native-features', 'deployment'];
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const target = href.substring(1);
    const isActive = mainSections.some(s => {
      if (target === s) {
        const el = document.getElementById(s);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top <= offset && rect.bottom > 0;
      }
      return false;
    });
    link.classList.toggle('active', currentSection === target || isActive);
  });
}


// ═══════════════════════════════════════════════════════════
// BACK TO TOP BUTTON
// ═══════════════════════════════════════════════════════════
function updateBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;
  btn.classList.toggle('visible', window.scrollY > 400);
}


// ═══════════════════════════════════════════════════════════
// NAV SCROLL EFFECT
// ═══════════════════════════════════════════════════════════
function updateNavEffect() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  nav.classList.toggle('scrolled', window.scrollY > 10);
}


// ═══════════════════════════════════════════════════════════
// SCROLL ANIMATIONS (Intersection Observer)
// ═══════════════════════════════════════════════════════════
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.card, .callout, .table-wrapper').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    observer.observe(el);
  });
}


// ═══════════════════════════════════════════════════════════
// AUTO-WRAP CODE BLOCKS WITH COPY BUTTON
// ═══════════════════════════════════════════════════════════
function initCodeBlocks() {
  document.querySelectorAll('pre').forEach(pre => {
    // Skip if already wrapped
    if (pre.parentElement.classList.contains('code-block')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.onclick = function() { copyCode(this); };

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    wrapper.appendChild(btn);
  });
}


// ═══════════════════════════════════════════════════════════
// DEBOUNCE UTILITY
// ═══════════════════════════════════════════════════════════
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}


// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Scroll handlers (debounced)
  const onScroll = () => {
    updateReadingProgress();
    updateActiveSidebarLink();
    updateBackToTop();
    updateNavEffect();
  };
  window.addEventListener('scroll', debounce(onScroll, 16), { passive: true });
  onScroll(); // Initial call

  // Initialize code blocks with copy buttons
  initCodeBlocks();

  // Initialize scroll animations
  initScrollAnimations();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('searchInput') || document.querySelector('.nav-search-input');
      if (searchInput) searchInput.focus();
    }
    // Escape to close sidebar
    if (e.key === 'Escape') {
      closeSidebar();
    }
  });

  // Close sidebar when clicking a link (mobile)
  document.querySelectorAll('.sidebar-link, .sidebar-link-sub').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900) closeSidebar();
    });
  });
});

// Run theme initialization immediately (before DOM ready)
initTheme();
