import './style.css'

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('theme-toggle');

  // Aktualizacja atrybutów dostępności (A11y)
  function updateA11y(theme) {
    const isDark = theme === 'dark';
    toggleBtn.setAttribute('aria-label', isDark ? 'Przełącz na motyw jasny' : 'Przełącz na motyw ciemny');
  }

  // Ustawienie początkowej etykiety A11y
  updateA11y(document.documentElement.getAttribute('data-theme'));

  // Główna funkcja zmiany motywu z płynnym efektem koła
  function toggleTheme(event) {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // 1. Sprawdzenie wsparcia dla View Transitions API oraz preferencji użytkownika
    const supportsViewTransitions = 'startViewTransition' in document;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Pobranie pozycji kliknięcia (lub środka przycisku, jeśli kliknięto klawiaturą)
    const x = event?.clientX ?? toggleBtn.getBoundingClientRect().left + toggleBtn.offsetWidth / 2;
    const y = event?.clientY ?? toggleBtn.getBoundingClientRect().top + toggleBtn.offsetHeight / 2;

    const applyThemeChange = () => {
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateA11y(newTheme);
    };

    // Jeśli brak wsparcia lub aktywny tryb reduced motion, przełącz bez rozchodzącej się fali
    if (!supportsViewTransitions || prefersReducedMotion) {
      applyThemeChange();
      return;
    }

    // 2. Obliczenie promienia najdalszego narożnika ekranu
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // 3. Uruchomienie sekwencji przejścia widoku
    const transition = document.startViewTransition(() => {
      applyThemeChange();
    });

    // 4. Animowanie nowej warstwy za pomocą clip-path
    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`
      ];

      document.documentElement.animate(
        {
          clipPath: newTheme === 'dark' ? clipPath : [...clipPath].reverse()
        },
        {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: newTheme === 'dark' ? '::view-transition-new(root)' : '::view-transition-old(root)'
        }
      );
    });
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