(() => {
  'use strict';

  const BOOKING = 'https://clientportal.zandahealth.com/clientportal/hzyb6/home';
  const WEBSITE = 'https://www.moodandmindcentre.com/';

  function enhanceHome() {
    const main = document.getElementById('main');
    if (!main || !main.querySelector('.hero')) return;
    if (!location.hash.includes('home')) return;

    const hero = main.querySelector('.hero');
    const paragraph = hero.querySelector('p');
    if (paragraph) {
      paragraph.innerHTML = 'Evidence-based psychological support for individuals, couples and families—delivered with warmth, clarity and care.';
    }

    if (!hero.querySelector('.hero-pills')) {
      const pills = document.createElement('div');
      pills.className = 'hero-pills';
      pills.innerHTML = `
        <span class="pill hero-pill">📍 Hope Island</span>
        <span class="pill hero-pill">📍 Upper Coomera</span>
        <span class="pill hero-pill">💻 Telehealth</span>
      `;
      hero.appendChild(pills);
    }

    if (!hero.querySelector('.hero-actions')) {
      const actions = document.createElement('div');
      actions.className = 'hero-actions';
      actions.innerHTML = `
        <button class="btn" type="button" data-external="${BOOKING}">Book a Session ↗</button>
        <button class="btn-secondary" type="button" data-external="${WEBSITE}">Explore Services ↗</button>
      `;
      hero.appendChild(actions);
    }

    const clientHeading = [...main.querySelectorAll('.section-title')].find(el => el.querySelector('h2')?.textContent.trim() === 'For clients');
    const entryButton = clientHeading?.querySelector('button');
    if (entryButton) entryButton.className = 'text-link';

    const note = main.querySelector('.info-note');
    if (note && note.textContent.includes('Trial behaviour:')) {
      note.innerHTML = '<strong>Trial preview:</strong> this appointment card is demonstration data only. In the live version, clients would see their own approved appointment information.';
    }
  }

  function scheduleEnhance() {
    requestAnimationFrame(() => requestAnimationFrame(enhanceHome));
  }

  document.addEventListener('DOMContentLoaded', () => {
    scheduleEnhance();
    const main = document.getElementById('main');
    if (main) {
      new MutationObserver(scheduleEnhance).observe(main, { childList: true, subtree: false });
    }
  });
  window.addEventListener('hashchange', scheduleEnhance);
})();
