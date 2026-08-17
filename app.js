(() => {
  'use strict';

  const PRACTICE = Object.freeze({
    name: 'The Mood & Mind Centre',
    phoneDisplay: '07 5573 2200',
    phoneHref: 'tel:+61755732200',
    email: 'reception@moodandmindcentre.com',
    website: 'https://www.moodandmindcentre.com/',
    team: 'https://www.moodandmindcentre.com/our-team/',
    fees: 'https://www.moodandmindcentre.com/fees',
    resources: 'https://www.moodandmindcentre.com/resources',
    blog: 'https://www.moodandmindcentre.com/blog',
    bookingPortal: 'https://clientportal.zandahealth.com/clientportal/hzyb6/home',
    hopeIsland: {
      label: 'Hope Island',
      address: 'Suite 8/8 Santa Barbara Road, Hope Island QLD 4212',
      maps: 'https://maps.google.com/?q=Suite+8%2F8+Santa+Barbara+Road+Hope+Island+QLD+4212'
    },
    upperCoomera: {
      label: 'Upper Coomera',
      address: '15/90 Days Rd, Upper Coomera QLD 4209',
      maps: 'https://maps.google.com/?q=15%2F90+Days+Rd+Upper+Coomera+QLD+4209'
    },
    hours: 'Mon–Fri 8:00am–6:00pm · Saturday 9:00am–2:00pm'
  });

  const RESOURCES = [
    { id: 'adhd', icon: '◉', title: 'ADHD', desc: 'Practical information, articles and support resources.', type: 'Articles' },
    { id: 'anxiety', icon: '⌁', title: 'Anxiety', desc: 'Evidence-based insights for worry, stress and overwhelm.', type: 'Articles' },
    { id: 'trauma', icon: '◇', title: 'Trauma', desc: 'Trauma-informed information and pathways to support.', type: 'Guides' },
    { id: 'self-compassion', icon: '♡', title: 'Self-Compassion', desc: 'Gentle ideas for building self-kindness and resilience.', type: 'Articles' },
    { id: 'wellbeing', icon: '⌇', title: 'Wellbeing', desc: 'Everyday psychological wellbeing information.', type: 'Guides' }
  ];

  const ROUTE_NAV = {
    home: 'home', appointments: 'appointments', resources: 'resources', contact: 'contact', profile: 'profile'
  };

  const safeText = (value = '') => String(value).replace(/[&<>'"]/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  })[ch]);

  function getProfile() {
    try {
      return JSON.parse(localStorage.getItem('mm-demo-profile') || '{}');
    } catch {
      return {};
    }
  }

  function routeFromHash() {
    const raw = location.hash.replace(/^#\/?/, '').split('?')[0].trim();
    return raw || 'home';
  }

  function setRoute(route) {
    const current = routeFromHash();
    if (current === route) {
      render();
      return;
    }
    location.hash = `#/${route}`;
  }

  function external(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { toast.hidden = true; }, 2700);
  }

  function header(title, lead, eyebrow = '') {
    return `
      ${eyebrow ? `<div class="eyebrow">${safeText(eyebrow)}</div>` : ''}
      <h1 class="page-title">${title}</h1>
      ${lead ? `<p class="page-lead">${lead}</p>` : ''}
    `;
  }

  function appointmentPreview(compact = false) {
    return `
      <div class="card appointment-card">
        <div class="appointment-head">
          <div class="appointment-date" aria-hidden="true"><span>DEMO</span><strong>02</strong><span>JUN</span></div>
          <div class="appointment-copy">
            <span class="demo-badge">Example only</span>
            <h3>${compact ? 'Next appointment preview' : 'Monday, 2 June · 10:00am'}</h3>
            <p>50-minute psychology session · Telehealth</p>
            <p>Demo clinician: Irene Vermooten</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderHome() {
    const p = getProfile();
    const name = safeText((p.firstName || 'there').trim());
    return `
      <section class="page">
        <div class="eyebrow">Gold Coast Psychologists</div>
        <div class="hero">
          <h1>Your path to <em>healing</em> begins here</h1>
          <p>Welcome ${name === 'there' ? '' : `${name}. `}A simple client home for appointments, locations, resources and getting in touch with Mood &amp; Mind.</p>
        </div>

        <div class="section-title"><h2>For clients</h2><button class="btn-secondary" type="button" data-route="start">New or existing?</button></div>
        ${appointmentPreview(true)}
        <div class="info-note"><strong>Trial behaviour:</strong> this appointment is demonstration data. A production version would only show live appointment details after Irene approves a secure practice-system integration.</div>

        <div class="section-title"><h2>Quick access</h2></div>
        <div class="quick-grid">
          <button class="quick-card" type="button" data-external="${PRACTICE.bookingPortal}"><span class="q-icon">▣</span><strong>Book a Session</strong><small>Open secure booking portal</small></button>
          <button class="quick-card" type="button" data-route="appointments"><span class="q-icon">◷</span><strong>My Appointments</strong><small>Preview the client journey</small></button>
          <button class="quick-card" type="button" data-route="psychologist"><span class="q-icon">♙</span><strong>My Psychologist</strong><small>Clinician information</small></button>
          <button class="quick-card" type="button" data-route="locations"><span class="q-icon">⌖</span><strong>Find Us</strong><small>Hope Island &amp; Upper Coomera</small></button>
          <button class="quick-card" type="button" data-route="resources"><span class="q-icon">▤</span><strong>Resources</strong><small>Articles, guides &amp; support</small></button>
          <button class="quick-card danger-soft" type="button" data-route="help"><span class="q-icon">♡</span><strong>Help Now</strong><small>Urgent support information</small></button>
          <button class="quick-card" type="button" data-route="before-session"><span class="q-icon">✓</span><strong>Before My Session</strong><small>What to know before you arrive</small></button>
          <button class="quick-card" type="button" data-route="funding"><span class="q-icon">$</span><strong>Fees &amp; Funding</strong><small>Funding pathways and current fees</small></button>
          <button class="quick-card" type="button" data-route="forms"><span class="q-icon">▧</span><strong>Forms &amp; Documents</strong><small>Secure portal access</small></button>
          <button class="quick-card" type="button" data-route="contact"><span class="q-icon">☎</span><strong>Contact Reception</strong><small>Call, email or enquire</small></button>
        </div>
      </section>
    `;
  }

  function renderStart() {
    return `
      <section class="page">
        ${header('Welcome', 'Choose the path that fits you. This trial sends real booking and account actions to Mood & Mind’s existing secure client portal.', 'Client entry')}
        <div class="onboarding-grid">
          <div class="card onboarding-card">
            <h2>I’m an existing client</h2>
            <p>Open the secure client portal to manage bookings and practice-system information.</p>
            <button class="btn wide" type="button" data-external="${PRACTICE.bookingPortal}">Open client portal ↗</button>
          </div>
          <div class="card onboarding-card">
            <h2>I’m a new client</h2>
            <p>Book online, or contact reception if you’d like help finding the right psychologist.</p>
            <div class="btn-row">
              <button class="btn" type="button" data-external="${PRACTICE.bookingPortal}">Book online ↗</button>
              <a class="btn-secondary" href="${PRACTICE.phoneHref}">Call reception</a>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderAppointments() {
    return `
      <section class="page">
        ${header('My Appointments', 'A client-friendly appointment view. Live records are deliberately not connected in this trial.', 'Appointments')}
        ${appointmentPreview(false)}
        <div class="spacer-10"></div>
        <div class="list">
          <button class="list-item" type="button" data-external="${PRACTICE.bookingPortal}"><span class="list-icon">▶</span><span class="list-copy"><strong>Join / manage through secure portal</strong><small>Use Mood &amp; Mind’s current client portal for real appointment actions.</small></span><span class="chev">›</span></button>
          <button class="list-item" type="button" data-demo-action="confirm"><span class="list-icon">✓</span><span class="list-copy"><strong>Confirm appointment</strong><small>Demonstration interaction only.</small></span><span class="chev">›</span></button>
          <button class="list-item" type="button" data-external="${PRACTICE.bookingPortal}"><span class="list-icon">↻</span><span class="list-copy"><strong>Reschedule</strong><small>Opens secure client portal.</small></span><span class="chev">›</span></button>
          <button class="list-item" type="button" data-external="${PRACTICE.bookingPortal}"><span class="list-icon">×</span><span class="list-copy"><strong>Cancel / change booking</strong><small>Opens secure client portal so the practice system stays authoritative.</small></span><span class="chev">›</span></button>
        </div>
        <div class="info-note"><strong>Safety by design:</strong> the trial has no database and does not copy psychology records, clinical notes or live appointment information.</div>
      </section>
    `;
  }

  function renderPsychologist() {
    return `
      <section class="page">
        ${header('My Psychologist', 'This demonstrates how each client could see their own clinician once secure account integration is approved.', 'Clinician')}
        <div class="card clinician-card">
          <span class="demo-badge">Demo clinician card</span>
          <div class="clinician-avatar" aria-hidden="true">IV</div>
          <h2>Irene Vermooten</h2>
          <p class="role">Director, Clinical Psychologist &amp; Board Approved Supervisor</p>
          <p>Clinical interests listed by Mood &amp; Mind include trauma, PTSD, borderline personality disorder, anxiety and couples therapy.</p>
          <div class="btn-row">
            <button class="btn" type="button" data-external="${PRACTICE.bookingPortal}">Book a session ↗</button>
            <button class="btn-secondary" type="button" data-external="${PRACTICE.team}">View full team ↗</button>
          </div>
        </div>
        <div class="info-note">For another client, this card would show their psychologist rather than Irene. The trial uses Irene purely to demonstrate the personalised layout.</div>
      </section>
    `;
  }

  function renderLocations() {
    return `
      <section class="page">
        ${header('Find Us', 'Two Gold Coast clinics plus Telehealth.', 'Locations')}
        <div class="card location-card">
          <h3>📍 ${PRACTICE.hopeIsland.label}</h3>
          <p>${PRACTICE.hopeIsland.address}</p>
          <div class="location-meta"><span class="pill">Mon–Fri 8–6</span><span class="pill">Sat 9–2</span></div>
          <button class="btn wide" type="button" data-external="${PRACTICE.hopeIsland.maps}">Get directions ↗</button>
        </div>
        <div class="card location-card">
          <h3>📍 ${PRACTICE.upperCoomera.label}</h3>
          <p>${PRACTICE.upperCoomera.address}</p>
          <div class="location-meta"><span class="pill">Mon–Fri 8–6</span><span class="pill">Sat 9–2</span></div>
          <button class="btn wide" type="button" data-external="${PRACTICE.upperCoomera.maps}">Get directions ↗</button>
        </div>
        <div class="card location-card">
          <h3>💻 Telehealth</h3>
          <p>Secure online psychology appointments are available through Mood &amp; Mind.</p>
          <button class="btn wide" type="button" data-external="${PRACTICE.bookingPortal}">Book / access portal ↗</button>
        </div>
      </section>
    `;
  }

  function renderResources(query = '', active = 'All') {
    const q = query.trim().toLowerCase();
    const filtered = RESOURCES.filter(r => (active === 'All' || r.type === active) && (!q || `${r.title} ${r.desc}`.toLowerCase().includes(q)));
    return `
      <section class="page">
        ${header('Resources', 'A calm place for psychologist-approved information. Trial cards link to Mood & Mind’s public resource areas.', 'Client resources')}
        <div class="search-wrap"><span aria-hidden="true">⌕</span><label class="sr-only" for="resourceSearch">Search resources</label><input id="resourceSearch" type="search" value="${safeText(query)}" placeholder="Search resources…" autocomplete="off" /></div>
        <div class="filter-row" aria-label="Resource filters">
          ${['All','Articles','Guides'].map(f => `<button class="filter-pill ${active === f ? 'active' : ''}" type="button" data-filter="${f}">${f}</button>`).join('')}
        </div>
        <div class="list" id="resourceList">
          ${filtered.length ? filtered.map(r => `<button class="list-item" type="button" data-external="${PRACTICE.blog}"><span class="list-icon">${r.icon}</span><span class="list-copy"><strong>${r.title}</strong><small>${r.desc}</small></span><span class="chev">›</span></button>`).join('') : '<div class="info-note">No matching resources in this small trial set.</div>'}
        </div>
        <div class="spacer-18"></div>
        <div class="btn-row"><button class="btn" type="button" data-external="${PRACTICE.resources}">Mood &amp; Mind resources ↗</button><button class="btn-secondary" type="button" data-external="${PRACTICE.blog}">Read the blog ↗</button></div>
      </section>
    `;
  }

  function renderFunding() {
    const items = [
      ['▣','Medicare','Mental Health Care Plan pathways'],
      ['◈','NDIS','Funding pathway information'],
      ['▧','WorkCover','Work-related support pathway'],
      ['★','QPS','Funding / referral pathway'],
      ['♡','Private Health','Health fund rebate information'],
      ['◫','Insurance Claims','Applicable insurance pathways'],
      ['$','Private Paying','Private session options']
    ];
    return `
      <section class="page">
        ${header('Fees & Funding', 'Mood & Mind supports a range of funding and referral pathways. Fees can change, so the trial links clients to the current published fee page.', 'Funding')}
        <div class="funding-grid">
          ${items.map(([icon,title,desc]) => `<div class="card funding-card"><div class="fund-icon">${icon}</div><h3>${title}</h3><p>${desc}</p></div>`).join('')}
        </div>
        <div class="spacer-18"></div>
        <button class="btn wide" type="button" data-external="${PRACTICE.fees}">View current Mood &amp; Mind fees ↗</button>
        <div class="info-note">For funding questions specific to you, contact reception rather than relying on a static app screen.</div>
      </section>
    `;
  }

  function renderBeforeSession() {
    return `
      <section class="page">
        ${header('Before My Session', 'A simple orientation page so clients know what to do before arriving or joining Telehealth.', 'Prepare')}
        <div class="list">
          <div class="list-item"><span class="list-icon">1</span><span class="list-copy"><strong>Check your location</strong><small>Confirm Hope Island, Upper Coomera or Telehealth in your booking information.</small></span></div>
          <div class="list-item"><span class="list-icon">2</span><span class="list-copy"><strong>Keep referral or funding information handy</strong><small>If reception has asked you for documents, follow the secure instructions they provide.</small></span></div>
          <div class="list-item"><span class="list-icon">3</span><span class="list-copy"><strong>For a first session</strong><small>Mood &amp; Mind describes the initial session as a chance for your psychologist to understand your needs and collaboratively design your treatment plan.</small></span></div>
          <div class="list-item"><span class="list-icon">4</span><span class="list-copy"><strong>Telehealth</strong><small>Use your practice-system link and choose a private place where you feel comfortable speaking.</small></span></div>
        </div>
        <div class="spacer-18"></div>
        <div class="btn-row"><button class="btn" type="button" data-route="locations">Check locations</button><button class="btn-secondary" type="button" data-route="contact">Ask reception</button></div>
      </section>
    `;
  }

  function renderForms() {
    return `
      <section class="page">
        ${header('Forms & Documents', 'For the trial, sensitive forms stay inside Mood & Mind’s existing secure practice portal.', 'Documents')}
        <div class="card card-pad">
          <span class="demo-badge">Privacy-first trial</span>
          <h2>Secure client portal</h2>
          <p class="muted">This demonstration app does not upload, collect or store clinical documents. Clients can be sent to the practice’s secure portal for real forms and account information.</p>
          <button class="btn wide" type="button" data-external="${PRACTICE.bookingPortal}">Open secure client portal ↗</button>
        </div>
        <div class="info-note"><strong>Production rule:</strong> no new health-data store should be added until Irene and her privacy/security advisers approve the exact information flow.</div>
      </section>
    `;
  }

  function renderContact() {
    return `
      <section class="page">
        ${header('Contact Us', 'Reception can help with bookings, locations and general practice questions.', 'Mood & Mind reception')}
        <div class="list">
          <a class="list-item" href="${PRACTICE.phoneHref}"><span class="list-icon">☎</span><span class="list-copy"><strong>${PRACTICE.phoneDisplay}</strong><small>Call Mood &amp; Mind reception</small></span><span class="chev">›</span></a>
          <a class="list-item" href="mailto:${PRACTICE.email}"><span class="list-icon">✉</span><span class="list-copy"><strong>${PRACTICE.email}</strong><small>Email reception</small></span><span class="chev">›</span></a>
          <button class="list-item" type="button" data-external="${PRACTICE.website}"><span class="list-icon">↗</span><span class="list-copy"><strong>Open Mood &amp; Mind website</strong><small>Services, FAQs, team and enquiries</small></span><span class="chev">›</span></button>
        </div>
        <div class="card card-pad" style="margin-top:12px">
          <h2 style="margin-top:0">Clinic hours</h2>
          <p class="muted">${PRACTICE.hours}</p>
        </div>
        <div class="spacer-18"></div>
        <button class="btn-secondary wide" type="button" data-route="help">Need urgent help?</button>
      </section>
    `;
  }

  function renderProfile() {
    const p = getProfile();
    return `
      <section class="page">
        ${header('Me', 'A tiny trial profile to demonstrate personalisation. It stays only in this browser on this device.', 'Client preferences')}
        <form class="card card-pad profile-form" id="profileForm">
          <span class="demo-badge">Local device only</span>
          <label for="firstName">First name</label>
          <input id="firstName" name="firstName" maxlength="40" value="${safeText(p.firstName || '')}" placeholder="e.g. Tracey" />
          <label for="preferredLocation">Preferred location</label>
          <select id="preferredLocation" name="preferredLocation">
            <option value="">Choose…</option>
            <option value="Hope Island" ${p.preferredLocation === 'Hope Island' ? 'selected' : ''}>Hope Island</option>
            <option value="Upper Coomera" ${p.preferredLocation === 'Upper Coomera' ? 'selected' : ''}>Upper Coomera</option>
            <option value="Telehealth" ${p.preferredLocation === 'Telehealth' ? 'selected' : ''}>Telehealth</option>
          </select>
          <div class="toggle-row"><label for="largeText">Prefer larger interface text</label><input id="largeText" name="largeText" type="checkbox" ${p.largeText ? 'checked' : ''} /></div>
          <div class="toggle-row"><label for="reduceMotion">Prefer reduced motion</label><input id="reduceMotion" name="reduceMotion" type="checkbox" ${p.reduceMotion ? 'checked' : ''} /></div>
          <div class="spacer-10"></div>
          <button class="btn wide" type="submit">Save on this device</button>
        </form>
        <div class="info-note"><strong>Do not enter clinical or sensitive health information into this trial.</strong> This screen is only to demonstrate basic client preferences.</div>
      </section>
    `;
  }

  function renderHelp() {
    return `
      <section class="page">
        ${header('Help Now', 'This app is not an emergency or crisis service.', 'Urgent support')}
        <div class="danger-panel">
          <h2>Immediate danger</h2>
          <p>If there is an immediate threat to life or safety in Australia, call emergency services.</p>
          <div class="danger-actions"><a class="btn-danger" href="tel:000">Call 000</a><a class="btn-secondary" href="tel:+61131114">Lifeline 13 11 14</a></div>
        </div>
        <div class="spacer-18"></div>
        <div class="card card-pad">
          <h2 style="margin-top:0">Contact Mood &amp; Mind</h2>
          <p class="muted">For routine practice questions, appointment help or reception support during clinic hours.</p>
          <a class="btn wide" href="${PRACTICE.phoneHref}">Call reception — ${PRACTICE.phoneDisplay}</a>
        </div>
        <div class="info-note">The trial does not monitor messages, symptoms or safety. It does not replace your psychologist, emergency services or crisis support.</div>
      </section>
    `;
  }

  function renderNotFound() {
    return `<section class="page">${header('Page not found', 'That screen is not part of this trial.')}<button class="btn" type="button" data-route="home">Back home</button></section>`;
  }

  function applyPreferences() {
    const p = getProfile();
    document.documentElement.style.fontSize = p.largeText ? '18px' : '';
    document.body.classList.toggle('manual-reduced-motion', !!p.reduceMotion);
  }

  let resourceState = { query: '', filter: 'All' };

  function render() {
    applyPreferences();
    const route = routeFromHash();
    const main = document.getElementById('main');
    const views = {
      home: renderHome,
      start: renderStart,
      appointments: renderAppointments,
      psychologist: renderPsychologist,
      locations: renderLocations,
      resources: () => renderResources(resourceState.query, resourceState.filter),
      funding: renderFunding,
      'before-session': renderBeforeSession,
      forms: renderForms,
      contact: renderContact,
      profile: renderProfile,
      help: renderHelp
    };
    main.innerHTML = (views[route] || renderNotFound)();

    const back = document.getElementById('backButton');
    back.hidden = route === 'home';

    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.classList.toggle('active', ROUTE_NAV[route] === btn.dataset.nav);
      if (ROUTE_NAV[route] === btn.dataset.nav) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });

    window.scrollTo({ top: 0, behavior: 'instant' });
    main.focus({ preventScroll: true });
  }

  document.addEventListener('click', (event) => {
    const routeTarget = event.target.closest('[data-route]');
    if (routeTarget) {
      event.preventDefault();
      setRoute(routeTarget.dataset.route);
      return;
    }

    const externalTarget = event.target.closest('[data-external]');
    if (externalTarget) {
      event.preventDefault();
      external(externalTarget.dataset.external);
      return;
    }

    const demo = event.target.closest('[data-demo-action]');
    if (demo) {
      showToast('Demo only — no real appointment record was changed.');
      return;
    }

    const filter = event.target.closest('[data-filter]');
    if (filter) {
      resourceState.filter = filter.dataset.filter;
      render();
    }
  });

  document.addEventListener('input', (event) => {
    if (event.target.id === 'resourceSearch') {
      resourceState.query = event.target.value;
      const list = document.getElementById('resourceList');
      const q = resourceState.query.trim().toLowerCase();
      const filtered = RESOURCES.filter(r => (resourceState.filter === 'All' || r.type === resourceState.filter) && (!q || `${r.title} ${r.desc}`.toLowerCase().includes(q)));
      list.innerHTML = filtered.length ? filtered.map(r => `<button class="list-item" type="button" data-external="${PRACTICE.blog}"><span class="list-icon">${r.icon}</span><span class="list-copy"><strong>${r.title}</strong><small>${r.desc}</small></span><span class="chev">›</span></button>`).join('') : '<div class="info-note">No matching resources in this small trial set.</div>';
    }
  });

  document.addEventListener('submit', (event) => {
    if (event.target.id !== 'profileForm') return;
    event.preventDefault();
    const form = new FormData(event.target);
    const profile = {
      firstName: String(form.get('firstName') || '').trim().slice(0, 40),
      preferredLocation: String(form.get('preferredLocation') || ''),
      largeText: event.target.largeText.checked,
      reduceMotion: event.target.reduceMotion.checked
    };
    localStorage.setItem('mm-demo-profile', JSON.stringify(profile));
    applyPreferences();
    showToast('Saved on this device only.');
  });

  document.getElementById('backButton').addEventListener('click', () => {
    if (history.length > 1) history.back(); else setRoute('home');
  });

  window.addEventListener('hashchange', render);
  if (!location.hash) location.hash = '#/home'; else render();
})();
