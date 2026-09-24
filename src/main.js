import './style.css'

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('theme-toggle');

  // Lista zmiennych, których "stary" wygląd trzeba zamrozić na nakładce
  const THEME_VARS = [
    '--bg-top',
    '--bg-bottom',
    '--accent-glow',
    '--text-main',
    '--text',
    '--text-h',
    '--border-color',
  ];

  // Updating accessibility (A11y) attributes
  function updateA11y(theme) {
    const isDark = theme === 'dark';
    toggleBtn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  // Setting the initial A11y label
  updateA11y(document.documentElement.getAttribute('data-theme'));

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const applyThemeChange = () => {
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateA11y(newTheme);
    };

    if (prefersReducedMotion) {
      applyThemeChange();
      return;
    }

    // Punkt startowy animacji: środek przycisku
    const rect = toggleBtn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // 1. Zamrażamy AKTUALNY (stary) wygląd na wartościach obliczonych,
    //    zanim cokolwiek się zmieni pod spodem.
    const computed = getComputedStyle(document.documentElement);
    const oldValues = {};
    THEME_VARS.forEach((name) => {
      oldValues[name] = computed.getPropertyValue(name).trim();
    });

    // 2. Budujemy nakładkę będącą wizualną kopią bieżącej strony.
    const overlay = document.createElement('div');
    overlay.id = 'theme-transition-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = document.body.innerHTML;
    // Usuwamy zduplikowane id / interaktywność z klonu (a11y + poprawność HTML)
    overlay.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    overlay.querySelectorAll('a, button, input, textarea, select').forEach((el) => {
      el.setAttribute('tabindex', '-1');
    });

    // Wyrównanie z aktualnym przewinięciem strony (nakładka jest "fixed")
    overlay.style.transform = `translateY(${-window.scrollY}px)`;

    // Wstrzykujemy zamrożone, stare wartości zmiennych — bezpośrednio na
    // elemencie nakładki, więc nie zależą już od data-theme na <html>.
    THEME_VARS.forEach((name) => {
      overlay.style.setProperty(name, oldValues[name]);
    });

    // Startowy stan clip-path: nakładka w pełni pokrywa widoczny obszar
    overlay.style.clipPath = `circle(${endRadius}px at ${x}px ${y}px)`;

    document.body.appendChild(overlay);

    // 3. Wyłączamy CSS transition na czas błyskawicznej zmiany pod spodem,
    //    żeby realna strona nie zaczęła sama animować kolorów pod nakładką.
    document.documentElement.classList.add('no-transitions');
    applyThemeChange();
    // Przywracamy transition dopiero w kolejnej klatce (wartości są już finalne).
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('no-transitions');
    });

    // 4. Animujemy WYŁĄCZNIE naszą nakładkę (Web Animations API) —
    //    zero zależności od tego, jak dana przeglądarka obsługuje
    //    ::view-transition-*. "Obkurczamy" ją do punktu kliknięcia,
    //    odsłaniając już zmieniony motyw pod spodem.
    const anim = overlay.animate(
      [
        { clipPath: `circle(${endRadius}px at ${x}px ${y}px)` },
        { clipPath: `circle(0px at ${x}px ${y}px)` },
      ],
      { duration: 600, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'forwards' }
    );

    anim.onfinish = () => overlay.remove();
    anim.oncancel = () => overlay.remove();
  }

  toggleBtn.addEventListener('click', toggleTheme);

  // Nasłuchiwanie zmian na poziomie systemu operacyjnego
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      updateA11y(newTheme);
    }
  });
});