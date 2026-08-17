(() => {
  'use strict';

  const PRACTICE = Object.freeze({
    phoneDisplay: '07 5573 2200',
    phoneHref: 'tel:+61755732200',
    email: 'reception@moodandmindcentre.com',
    website: 'https://www.moodandmindcentre.com/',
    team: 'https://www.moodandmindcentre.com/our-team/',
    resources: 'https://www.moodandmindcentre.com/resources',
    blog: 'https://www.moodandmindcentre.com/blog',
    bookingPortal: 'https://clientportal.zandahealth.com/clientportal/hzyb6/home'
  });

  const STORE = 'mm-client-portal-demo-v4';
  const ROUTE_NAV = {
    home: 'home',
    care: 'care',
    prepare: 'prepare',
    resources: 'resources',
    profile: 'profile',
    psychologist: 'care',
    documents: 'care',
    contact: 'profile',
    help: 'profile'
  };

  const defaults = {
    preferredName: '',
    clinicianKnow: '',
    goals: '',
    helps: '',
    communication: '',
    accessibility: '',
    sinceLast: '',
    today: '',
    dontForget: '',
    questions: '',
    shareCare: false,
    sharePrep: false,
    sharePreferences: false
  };

  const safeText = (value = '') => String(value).replace(/[&<>'"]/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  })[ch]);

  function getData() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(STORE) || '{}') };
    } catch {
      return { ...defaults };
    }
  }

  function setData(patch) {
    const next = { ...getData(), ...patch };
    localStorage.setItem(STORE, JSON.stringify(next));
    return next;
  }

  function routeFromHash() {
    const raw = location.hash.replace(/^#\/?/, '').split('?')[0].trim();
    return raw || 'home';
  }

  function setRoute(route) {
    if (routeFromHash() === route) render();
    else location.hash = `#/${route}`;
  }

  function external(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { toast.hidden = true; }, 2600);
  }

  function header(title, lead, eyebrow = '') {
    return `
      ${eyebrow ? `<div class="eyebrow">${safeText(eyebrow)}</div>` : ''}
      <h1 class="page-title">${title}</h1>
      ${lead ? `<p class="page-lead">${lead}</p>` : ''}
    `;
  }

  function summaryCount(data) {
    const care = [data.clinicianKnow, data.goals, data.helps].filter(v => String(v).trim()).length;
    const prep = [data.sinceLast, data.today, data.dontForget, data.questions].filter(v => String(v).trim()).length;
    const preferences = [data.communication, data.accessibility].filter(v => String(v).trim()).length;
    return { care, prep, preferences };
  }

  function renderHome() {
    const data = getData();
    const name = safeText(data.preferredName.trim());
    const counts = summaryCount(data);
    return `
      <section class="page">
        <div class="eyebrow">Your private care space</div>
        <div class="hero">
          <h1>Your care, <em>in one place</em></h1>
          <p>${name ? `Welcome, ${name}. ` : ''}Keep the things you want to remember for therapy organised in your own client space, and choose what you would want your clinician to see.</p>
          <div class="hero-pills">
            <span class="pill hero-pill">My information</span>
            <span class="pill hero-pill">My goals</span>
            <span class="pill hero-pill">My session prep</span>
          </div>
          <div class="hero-actions">
            <button class="btn" type="button" data-route="care">Open My Care</button>
            <button class="btn-secondary" type="button" data-external="${PRACTICE.bookingPortal}">Book / manage appointment ↗</button>
          </div>
        </div>

        <div class="care-panel">
          <span class="demo-badge">Client-owned space</span>
          <h2 style="margin-top:10px">My care at a glance</h2>
          <p>This trial shows how a client can keep their own information without replacing Mood &amp; Mind’s existing booking system.</p>
          <div class="portal-summary">
            <div class="summary-tile"><strong>${counts.care}/3</strong><span>care sections started</span></div>
            <div class="summary-tile"><strong>${counts.prep}/4</strong><span>session-prep sections started</span></div>
            <div class="summary-tile"><strong>${counts.preferences}/2</strong><span>preference sections started</span></div>
            <div class="summary-tile"><strong>${[data.shareCare,data.sharePrep,data.sharePreferences].filter(Boolean).length}/3</strong><span>sharing choices selected</span></div>
          </div>
        </div>

        <div class="section-title"><h2>My client portal</h2></div>
        <div class="quick-grid">
          <button class="quick-card" type="button" data-route="care"><span class="q-icon">♡</span><strong>My Care</strong><small>Goals, what helps and what I want my clinician to know</small></button>
          <button class="quick-card" type="button" data-route="prepare"><span class="q-icon">✓</span><strong>Prepare for My Session</strong><small>Write down what matters before I go in</small></button>
          <button class="quick-card" type="button" data-route="psychologist"><span class="q-icon">♙</span><strong>My Psychologist</strong><small>My clinician and care-team doorway</small></button>
          <button class="quick-card" type="button" data-route="resources"><span class="q-icon">▤</span><strong>My Resources</strong><small>Clinician-approved tools and Mood &amp; Mind resources</small></button>
          <button class="quick-card" type="button" data-route="documents"><span class="q-icon">▧</span><strong>Forms & Documents</strong><small>Secure forms, referrals and shared documents</small></button>
          <button class="quick-card" type="button" data-external="${PRACTICE.bookingPortal}"><span class="q-icon">▣</span><strong>Appointments</strong><small>Use the existing secure booking portal</small></button>
          <button class="quick-card" type="button" data-route="contact"><span class="q-icon">☎</span><strong>Contact Reception</strong><small>Call or email Mood & Mind</small></button>
          <button class="quick-card danger-soft" type="button" data-route="help"><span class="q-icon">!</span><strong>Help Now</strong><small>What to do if I need urgent help</small></button>
        </div>
        <div class="info-note"><strong>Trial only:</strong> information entered here stays in this browser on this device. Do not enter real sensitive or clinical information into this public trial.</div>
      </section>
    `;
  }

  function renderCare() {
    const d = getData();
    return `
      <section class="page">
        ${header('My Care', 'This is the part of the portal that belongs to the client: the things they want to remember, work toward or make easier to communicate.', 'My personal care space')}
        <form id="careForm">
          <div class="care-fieldset">
            <label for="clinicianKnow">What I want my clinician to know</label>
            <p class="field-help">Things that are hard to remember or say once I am in the room.</p>
            <textarea class="care-textarea" id="clinicianKnow" name="clinicianKnow" maxlength="2000" placeholder="Demo text only…">${safeText(d.clinicianKnow)}</textarea>
          </div>
          <div class="care-fieldset">
            <label for="goals">What I am working toward</label>
            <p class="field-help">My own goals, written in my own words.</p>
            <textarea class="care-textarea" id="goals" name="goals" maxlength="2000" placeholder="Demo text only…">${safeText(d.goals)}</textarea>
          </div>
          <div class="care-fieldset">
            <label for="helps">What helps me</label>
            <p class="field-help">Strategies, reminders, environments or approaches I have found useful.</p>
            <textarea class="care-textarea" id="helps" name="helps" maxlength="2000" placeholder="Demo text only…">${safeText(d.helps)}</textarea>
          </div>
          <div class="care-fieldset">
            <h2 style="margin-top:0">Sharing choice</h2>
            <p class="field-help">In a secure production portal, the client would control whether this section is shared with their clinician.</p>
            <label class="share-row" for="shareCare">
              <input id="shareCare" name="shareCare" type="checkbox" ${d.shareCare ? 'checked' : ''} />
              <span><strong>I would choose to share My Care with my clinician</strong><small>Trial only — this checkbox does not send anything.</small></span>
            </label>
          </div>
          <div class="care-save-row"><button class="btn" type="submit">Save trial draft</button><button class="btn-secondary" type="button" data-route="prepare">Prepare for session</button></div>
        </form>
        <div class="info-note"><strong>Production design:</strong> this information should be encrypted, authenticated and permission-controlled before any real client information is stored.</div>
      </section>
    `;
  }

  function renderPrepare() {
    const d = getData();
    return `
      <section class="page">
        ${header('Prepare for My Session', 'A quiet place to collect thoughts before an appointment so the client does not have to rely on remembering everything in the room.', 'Before my appointment')}
        <form id="prepForm">
          <div class="care-fieldset">
            <label for="sinceLast">Since my last session…</label>
            <textarea class="care-textarea" id="sinceLast" name="sinceLast" maxlength="2000" placeholder="Demo text only…">${safeText(d.sinceLast)}</textarea>
          </div>
          <div class="care-fieldset">
            <label for="today">What feels most important today?</label>
            <textarea class="care-textarea" id="today" name="today" maxlength="2000" placeholder="Demo text only…">${safeText(d.today)}</textarea>
          </div>
          <div class="care-fieldset">
            <label for="dontForget">What I do not want to forget to mention</label>
            <textarea class="care-textarea" id="dontForget" name="dontForget" maxlength="2000" placeholder="Demo text only…">${safeText(d.dontForget)}</textarea>
          </div>
          <div class="care-fieldset">
            <label for="questions">Questions I want to ask</label>
            <textarea class="care-textarea" id="questions" name="questions" maxlength="2000" placeholder="Demo text only…">${safeText(d.questions)}</textarea>
          </div>
          <div class="care-fieldset">
            <label class="share-row" for="sharePrep">
              <input id="sharePrep" name="sharePrep" type="checkbox" ${d.sharePrep ? 'checked' : ''} />
              <span><strong>I would choose to share my session prep with my clinician</strong><small>Trial only — nothing is transmitted.</small></span>
            </label>
          </div>
          <div class="care-save-row"><button class="btn" type="submit">Save trial prep</button><button class="btn-secondary" type="button" data-external="${PRACTICE.bookingPortal}">Manage appointment ↗</button></div>
        </form>
      </section>
    `;
  }

  function renderPsychologist() {
    return `
      <section class="page">
        ${header('My Psychologist', 'In the live portal, this page would show the clinician assigned to the signed-in client and the information that clinician has chosen to share.', 'My care team')}
        <div class="card card-pad clinician-card">
          <span class="demo-badge">Example clinician</span>
          <div class="clinician-avatar" aria-hidden="true">IV</div>
          <h2>Irene Vermooten</h2>
          <p class="role">Director, Clinical Psychologist &amp; Board Approved Supervisor</p>
          <p class="muted">This is an example for the trial. Each client would see their own clinician rather than a hard-coded profile.</p>
          <div class="btn-row">
            <button class="btn" type="button" data-external="${PRACTICE.bookingPortal}">Book / manage appointment ↗</button>
            <button class="btn-secondary" type="button" data-external="${PRACTICE.team}">View Mood & Mind team ↗</button>
          </div>
        </div>
        <div class="care-panel" style="margin-top:12px">
          <h2>Shared with me</h2>
          <p>A production version could hold clinician-approved handouts, agreed plans, exercises and follow-up information for this client.</p>
        </div>
      </section>
    `;
  }

  function renderResources() {
    return `
      <section class="page">
        ${header('My Resources', 'A personal toolkit for information the clinician has approved, plus Mood & Mind’s public resources.', 'My toolkit')}
        <div class="care-grid">
          <div class="care-panel"><h2>From my clinician</h2><p>In the live portal, handouts, exercises and resources shared specifically with this client would appear here.</p><div class="btn-row"><button class="btn-secondary" type="button" data-route="documents">View shared documents</button></div></div>
          <div class="care-panel"><h2>Mood & Mind resources</h2><p>Open the practice’s existing public resource library without copying or duplicating it inside the portal.</p><div class="btn-row"><button class="btn" type="button" data-external="${PRACTICE.resources}">Open resources ↗</button><button class="btn-secondary" type="button" data-external="${PRACTICE.blog}">Read the blog ↗</button></div></div>
        </div>
      </section>
    `;
  }

  function renderDocuments() {
    return `
      <section class="page">
        ${header('Forms & Documents', 'One doorway for forms and documents without rebuilding the secure practice system Irene already uses.', 'Documents')}
        <div class="list">
          <div class="list-item"><span class="list-icon">▧</span><span class="list-copy"><strong>Forms requested by the practice</strong><small>Production integration: show only forms assigned to this client.</small></span></div>
          <div class="list-item"><span class="list-icon">↗</span><span class="list-copy"><strong>Referral or funding documents</strong><small>Production integration: secure upload and document status, subject to approval.</small></span></div>
          <div class="list-item"><span class="list-icon">♡</span><span class="list-copy"><strong>Documents shared by my clinician</strong><small>Handouts, plans or resources the clinician has chosen to share.</small></span></div>
        </div>
        <div class="spacer-18"></div>
        <button class="btn wide" type="button" data-external="${PRACTICE.bookingPortal}">Open existing secure practice portal ↗</button>
        <div class="info-note">This public trial does not accept real document uploads.</div>
      </section>
    `;
  }

  function renderProfile() {
    const d = getData();
    return `
      <section class="page">
        ${header('Me', 'The client can keep practical preferences that make appointments and communication easier.', 'My preferences')}
        <form id="profileForm">
          <div class="care-fieldset">
            <label for="preferredName">What I would like to be called</label>
            <input class="care-input" id="preferredName" name="preferredName" maxlength="80" value="${safeText(d.preferredName)}" placeholder="Demo name" />
          </div>
          <div class="care-fieldset">
            <label for="communication">How I communicate best</label>
            <p class="field-help">For example: extra processing time, written follow-up or one question at a time.</p>
            <textarea class="care-textarea" id="communication" name="communication" maxlength="1500" placeholder="Demo text only…">${safeText(d.communication)}</textarea>
          </div>
          <div class="care-fieldset">
            <label for="accessibility">Things that make appointments easier for me</label>
            <textarea class="care-textarea" id="accessibility" name="accessibility" maxlength="1500" placeholder="Demo text only…">${safeText(d.accessibility)}</textarea>
          </div>
          <div class="care-fieldset">
            <label class="share-row" for="sharePreferences">
              <input id="sharePreferences" name="sharePreferences" type="checkbox" ${d.sharePreferences ? 'checked' : ''} />
              <span><strong>I would choose to share these preferences with my clinician</strong><small>Trial only — nothing is transmitted.</small></span>
            </label>
          </div>
          <div class="care-save-row"><button class="btn" type="submit">Save trial preferences</button><button class="btn-secondary" type="button" data-action="clear-demo">Clear trial data</button></div>
        </form>
        <div class="soft-divider"></div>
        <div class="care-grid">
          <button class="list-item" type="button" data-route="contact"><span class="list-icon">☎</span><span class="list-copy"><strong>Contact reception</strong><small>Phone, email and website</small></span><span class="chev">›</span></button>
          <button class="list-item" type="button" data-route="help"><span class="list-icon">!</span><span class="list-copy"><strong>Help now</strong><small>Urgent-support information</small></span><span class="chev">›</span></button>
        </div>
      </section>
    `;
  }

  function renderContact() {
    return `
      <section class="page">
        ${header('Contact Reception', 'For appointments, forms and general practice questions.', 'Mood & Mind')}
        <div class="list">
          <a class="list-item" href="${PRACTICE.phoneHref}"><span class="list-icon">☎</span><span class="list-copy"><strong>${PRACTICE.phoneDisplay}</strong><small>Call reception</small></span><span class="chev">›</span></a>
          <a class="list-item" href="mailto:${PRACTICE.email}"><span class="list-icon">✉</span><span class="list-copy"><strong>${PRACTICE.email}</strong><small>Email reception</small></span><span class="chev">›</span></a>
          <button class="list-item" type="button" data-external="${PRACTICE.website}"><span class="list-icon">↗</span><span class="list-copy"><strong>Mood & Mind website</strong><small>Open the practice website</small></span><span class="chev">›</span></button>
        </div>
      </section>
    `;
  }

  function renderHelp() {
    return `
      <section class="page">
        ${header('Help Now', 'This trial portal is not monitored and is not an emergency service.', 'Urgent support')}
        <div class="danger-panel">
          <h2>Immediate danger</h2>
          <p>If there is an immediate threat to life or safety in Australia, call emergency services on 000.</p>
          <div class="danger-actions"><a class="btn-danger" href="tel:000">Call 000</a></div>
        </div>
        <div class="spacer-18"></div>
        <div class="card card-pad">
          <h2 style="margin-top:0">Mood & Mind reception</h2>
          <p class="muted">For routine practice and appointment support during reception hours.</p>
          <a class="btn wide" href="${PRACTICE.phoneHref}">Call reception — ${PRACTICE.phoneDisplay}</a>
        </div>
        <div class="info-note">A production portal must clearly separate routine client communication from urgent or emergency support.</div>
      </section>
    `;
  }

  function renderNotFound() {
    return `<section class="page">${header('Page not found', 'That screen is not part of this trial.')}<button class="btn" type="button" data-route="home">Back home</button></section>`;
  }

  function render() {
    const route = routeFromHash();
    const views = {
      home: renderHome,
      care: renderCare,
      prepare: renderPrepare,
      psychologist: renderPsychologist,
      resources: renderResources,
      documents: renderDocuments,
      profile: renderProfile,
      contact: renderContact,
      help: renderHelp
    };
    const main = document.getElementById('main');
    main.innerHTML = (views[route] || renderNotFound)();

    const back = document.getElementById('backButton');
    back.hidden = route === 'home';

    document.querySelectorAll('[data-nav]').forEach(btn => {
      const active = ROUTE_NAV[route] === btn.dataset.nav;
      btn.classList.toggle('active', active);
      if (active) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });

    window.scrollTo({ top: 0, behavior: 'instant' });
    main.focus({ preventScroll: true });
  }

  document.addEventListener('click', event => {
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

    const action = event.target.closest('[data-action]');
    if (action?.dataset.action === 'clear-demo') {
      localStorage.removeItem(STORE);
      showToast('Trial data cleared from this device.');
      render();
    }
  });

  document.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target;
    const values = new FormData(form);

    if (form.id === 'careForm') {
      setData({
        clinicianKnow: String(values.get('clinicianKnow') || '').trim(),
        goals: String(values.get('goals') || '').trim(),
        helps: String(values.get('helps') || '').trim(),
        shareCare: form.shareCare.checked
      });
      showToast('Trial care draft saved on this device.');
    }

    if (form.id === 'prepForm') {
      setData({
        sinceLast: String(values.get('sinceLast') || '').trim(),
        today: String(values.get('today') || '').trim(),
        dontForget: String(values.get('dontForget') || '').trim(),
        questions: String(values.get('questions') || '').trim(),
        sharePrep: form.sharePrep.checked
      });
      showToast('Trial session prep saved on this device.');
    }

    if (form.id === 'profileForm') {
      setData({
        preferredName: String(values.get('preferredName') || '').trim().slice(0,80),
        communication: String(values.get('communication') || '').trim(),
        accessibility: String(values.get('accessibility') || '').trim(),
        sharePreferences: form.sharePreferences.checked
      });
      showToast('Trial preferences saved on this device.');
    }
  });

  document.getElementById('backButton').addEventListener('click', () => {
    if (history.length > 1) history.back();
    else setRoute('home');
  });

  window.addEventListener('hashchange', render);
  if (!location.hash) location.hash = '#/home';
  else render();
})();
