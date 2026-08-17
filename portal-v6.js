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

  const CLIENTS_STORE = 'mm-reception-clients-demo-v6';
  const ACTIVE_CLIENT_STORE = 'mm-active-client-demo-v6';
  const EDIT_CLIENT_STORE = 'mm-edit-client-demo-v6';
  const OWNED_PREFIX = 'mm-client-owned-demo-v6:';

  const CLIENT_DEFAULTS = {
    id: '', legalFirst: '', legalLast: '', preferredName: '', dob: '', pronouns: '',
    email: '', mobile: '', preferredContact: 'Email', address: '', emergencyName: '',
    emergencyRelationship: '', emergencyPhone: '', clinician: '', referralSource: '',
    referrer: '', funding: '', fundingRef: '', nextAppointment: '', portalStatus: 'Not invited',
    consentStatus: 'Awaiting', formsStatus: 'Not started', resourcesStatus: 'None assigned',
    communication: '', accessibility: '', adminNotes: '', active: true, createdAt: '', updatedAt: ''
  };

  const OWNED_DEFAULTS = {
    clinicianKnow: '', goals: '', helps: '', sinceLast: '', today: '', dontForget: '', questions: '',
    shareCare: false, sharePrep: false, sharePreferences: false, communication: '', accessibility: ''
  };

  const seedClients = [{
    ...CLIENT_DEFAULTS,
    id: 'demo-client-001', legalFirst: 'Demo', legalLast: 'Client', preferredName: 'Demo',
    dob: '1990-01-01', email: 'demo.client@example.com', mobile: '0400 000 000',
    preferredContact: 'Email', clinician: 'Irene Vermooten', referralSource: 'GP referral',
    funding: 'Private', portalStatus: 'Invited', consentStatus: 'Awaiting', formsStatus: 'Intake pending',
    resourcesStatus: 'Welcome resources assigned', communication: 'Prefers clear written follow-up.',
    adminNotes: 'Demo administrative record only — no real client information.', active: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  }];

  const safeText = (value = '') => String(value).replace(/[&<>'"]/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  })[ch]);

  const formatDateTime = (value) => {
    if (!value) return 'Not scheduled';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? safeText(value) : new Intl.DateTimeFormat('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(date);
  };

  function getClients() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CLIENTS_STORE) || 'null');
      if (Array.isArray(parsed) && parsed.length) return parsed.map(c => ({ ...CLIENT_DEFAULTS, ...c }));
    } catch {}
    localStorage.setItem(CLIENTS_STORE, JSON.stringify(seedClients));
    return seedClients.map(c => ({ ...c }));
  }

  function saveClients(clients) { localStorage.setItem(CLIENTS_STORE, JSON.stringify(clients)); }

  function getActiveClientId() {
    const clients = getClients();
    const stored = localStorage.getItem(ACTIVE_CLIENT_STORE);
    if (stored && clients.some(c => c.id === stored && c.active !== false)) return stored;
    const first = clients.find(c => c.active !== false) || clients[0];
    if (first) localStorage.setItem(ACTIVE_CLIENT_STORE, first.id);
    return first?.id || '';
  }

  function getActiveClient() {
    const id = getActiveClientId();
    return getClients().find(c => c.id === id) || { ...CLIENT_DEFAULTS };
  }

  function clientOwnedKey(id) { return `${OWNED_PREFIX}${id || 'none'}`; }

  function getOwnedData() {
    const client = getActiveClient();
    try {
      const parsed = JSON.parse(localStorage.getItem(clientOwnedKey(client.id)) || '{}');
      return { ...OWNED_DEFAULTS, communication: client.communication || '', accessibility: client.accessibility || '', ...parsed };
    } catch {
      return { ...OWNED_DEFAULTS, communication: client.communication || '', accessibility: client.accessibility || '' };
    }
  }

  function setOwnedData(patch) {
    const client = getActiveClient();
    const next = { ...getOwnedData(), ...patch };
    localStorage.setItem(clientOwnedKey(client.id), JSON.stringify(next));
    return next;
  }

  function routeFromHash() {
    const raw = location.hash.replace(/^#\/?/, '').split('?')[0].trim();
    return raw || 'home';
  }

  function setRoute(route) { if (routeFromHash() === route) render(); else location.hash = `#/${route}`; }
  function external(url) { window.open(url, '_blank', 'noopener,noreferrer'); }

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { toast.hidden = true; }, 2800);
  }

  function header(title, lead, eyebrow = '') {
    return `${eyebrow ? `<div class="eyebrow">${safeText(eyebrow)}</div>` : ''}<h1 class="page-title">${title}</h1>${lead ? `<p class="page-lead">${lead}</p>` : ''}`;
  }

  function statusClass(value='') {
    const v = value.toLowerCase();
    if (/(active|complete|confirmed|current)/.test(v)) return 'status-good';
    if (/(await|pending|invited|not started|not invited)/.test(v)) return 'status-warn';
    if (/(paused|inactive|overdue|declined)/.test(v)) return 'status-muted';
    return 'status-neutral';
  }

  function clientDisplayName(client) {
    return client.preferredName || [client.legalFirst, client.legalLast].filter(Boolean).join(' ') || 'Unnamed client';
  }

  function renderHome() {
    const client = getActiveClient();
    const d = getOwnedData();
    const displayName = safeText(clientDisplayName(client));
    const careCount = [d.clinicianKnow, d.goals, d.helps].filter(v => String(v).trim()).length;
    const prepCount = [d.sinceLast, d.today, d.dontForget, d.questions].filter(v => String(v).trim()).length;
    const prefCount = [d.communication, d.accessibility].filter(v => String(v).trim()).length;
    return `<section class="page">
      <div class="eyebrow">Your private care space</div>
      <div class="hero premium-hero"><div class="hero-kicker">Mood &amp; Mind Client Portal</div><h1>Welcome, <em>${displayName}</em></h1><p>A calm, private place for appointment preparation, your preferences, resources and the information you choose to share.</p><div class="hero-actions"><button class="btn" type="button" data-route="care">Open My Care</button><button class="btn-secondary" type="button" data-external="${PRACTICE.bookingPortal}">Manage appointment ↗</button></div></div>
      <div class="identity-ribbon"><div><span class="micro-label">My psychologist</span><strong>${safeText(client.clinician || 'To be assigned')}</strong></div><div><span class="micro-label">Next appointment</span><strong>${formatDateTime(client.nextAppointment)}</strong></div><div><span class="micro-label">Portal</span><strong>${safeText(client.portalStatus || 'Not invited')}</strong></div></div>
      <div class="section-title"><h2>My portal</h2></div>
      <div class="quick-grid">
        <button class="quick-card" type="button" data-route="care"><span class="q-icon">♡</span><strong>My Care</strong><small>Goals, what helps, and what I want my clinician to know</small></button>
        <button class="quick-card" type="button" data-route="prepare"><span class="q-icon">✓</span><strong>Prepare</strong><small>Collect what matters before my next session</small></button>
        <button class="quick-card" type="button" data-route="psychologist"><span class="q-icon">♙</span><strong>My Psychologist</strong><small>My clinician and care-team information</small></button>
        <button class="quick-card" type="button" data-route="resources"><span class="q-icon">▤</span><strong>Resources</strong><small>Practice and clinician-approved resources</small></button>
        <button class="quick-card" type="button" data-route="documents"><span class="q-icon">▧</span><strong>Forms &amp; Documents</strong><small>Status of forms and shared documents</small></button>
        <button class="quick-card" type="button" data-route="profile"><span class="q-icon">◌</span><strong>My Preferences</strong><small>Communication and accessibility preferences</small></button>
      </div>
      <div class="care-panel portal-progress"><div><span class="micro-label">Portal progress</span><h2>Everything important, without the clutter.</h2></div><div class="portal-summary"><div class="summary-tile"><strong>${careCount}/3</strong><span>care sections</span></div><div class="summary-tile"><strong>${prepCount}/4</strong><span>prep sections</span></div><div class="summary-tile"><strong>${prefCount}/2</strong><span>preferences</span></div></div></div>
      <div class="info-note"><strong>Prototype safeguard:</strong> this public trial uses demo/local browser data only. Do not enter real client, health or clinical information here.</div>
    </section>`;
  }

  function renderCare() {
    const d = getOwnedData();
    return `<section class="page">${header('My Care', 'The client-owned part of the portal: personal goals, what helps, and what they want their psychologist to know.', 'My personal care space')}<form id="careForm">
      <div class="care-fieldset"><label for="clinicianKnow">What I want my psychologist to know</label><p class="field-help">Things that can be hard to remember or say in the room.</p><textarea class="care-textarea" id="clinicianKnow" name="clinicianKnow" maxlength="2000" placeholder="Demo text only…">${safeText(d.clinicianKnow)}</textarea></div>
      <div class="care-fieldset"><label for="goals">What I am working toward</label><textarea class="care-textarea" id="goals" name="goals" maxlength="2000" placeholder="Demo text only…">${safeText(d.goals)}</textarea></div>
      <div class="care-fieldset"><label for="helps">What helps me</label><textarea class="care-textarea" id="helps" name="helps" maxlength="2000" placeholder="Demo text only…">${safeText(d.helps)}</textarea></div>
      <div class="care-fieldset"><label class="share-row" for="shareCare"><input id="shareCare" name="shareCare" type="checkbox" ${d.shareCare ? 'checked' : ''} /><span><strong>I choose to share My Care with my psychologist</strong><small>Prototype only — this does not transmit information.</small></span></label></div>
      <div class="care-save-row"><button class="btn" type="submit">Save demo draft</button><button class="btn-secondary" type="button" data-route="prepare">Prepare for session</button></div>
    </form></section>`;
  }

  function renderPrepare() {
    const d = getOwnedData();
    return `<section class="page">${header('Prepare for My Session', 'A quiet place to collect thoughts before an appointment.', 'Before my appointment')}<form id="prepForm">
      <div class="care-fieldset"><label for="sinceLast">Since my last session…</label><textarea class="care-textarea" id="sinceLast" name="sinceLast" maxlength="2000" placeholder="Demo text only…">${safeText(d.sinceLast)}</textarea></div>
      <div class="care-fieldset"><label for="today">What feels most important today?</label><textarea class="care-textarea" id="today" name="today" maxlength="2000" placeholder="Demo text only…">${safeText(d.today)}</textarea></div>
      <div class="care-fieldset"><label for="dontForget">What I do not want to forget</label><textarea class="care-textarea" id="dontForget" name="dontForget" maxlength="2000" placeholder="Demo text only…">${safeText(d.dontForget)}</textarea></div>
      <div class="care-fieldset"><label for="questions">Questions I want to ask</label><textarea class="care-textarea" id="questions" name="questions" maxlength="2000" placeholder="Demo text only…">${safeText(d.questions)}</textarea></div>
      <div class="care-fieldset"><label class="share-row" for="sharePrep"><input id="sharePrep" name="sharePrep" type="checkbox" ${d.sharePrep ? 'checked' : ''} /><span><strong>I choose to share my session prep with my psychologist</strong><small>Prototype only — nothing is transmitted.</small></span></label></div>
      <div class="care-save-row"><button class="btn" type="submit">Save demo prep</button><button class="btn-secondary" type="button" data-external="${PRACTICE.bookingPortal}">Manage appointment ↗</button></div>
    </form></section>`;
  }

  function renderPsychologist() {
    const client = getActiveClient(); const clinician = client.clinician || 'To be assigned';
    const initials = clinician.split(/\s+/).filter(Boolean).slice(0,2).map(p => p[0]).join('').toUpperCase() || 'MM';
    return `<section class="page">${header('My Psychologist', 'The clinician assigned to this client by reception.', 'My care team')}<div class="card card-pad clinician-card"><span class="demo-badge">Assigned clinician</span><div class="clinician-avatar" aria-hidden="true">${safeText(initials)}</div><h2>${safeText(clinician)}</h2><p class="muted">Reception controls the assignment. Staff-only administrative notes are never shown here.</p><div class="btn-row"><button class="btn" type="button" data-external="${PRACTICE.bookingPortal}">Manage appointment ↗</button><button class="btn-secondary" type="button" data-external="${PRACTICE.team}">View Mood &amp; Mind team ↗</button></div></div></section>`;
  }

  function renderResources() {
    const client = getActiveClient();
    return `<section class="page">${header('My Resources', 'A personal toolkit for information shared or approved for this client.', 'My toolkit')}<div class="care-grid"><div class="care-panel"><span class="micro-label">Assigned by the practice</span><h2>${safeText(client.resourcesStatus || 'None assigned')}</h2><p>In production, specific files or links assigned to this client would be shown securely here.</p></div><div class="care-panel"><h2>Mood &amp; Mind resources</h2><p>Open the practice’s existing public resource library.</p><div class="btn-row"><button class="btn" type="button" data-external="${PRACTICE.resources}">Open resources ↗</button><button class="btn-secondary" type="button" data-external="${PRACTICE.blog}">Read the blog ↗</button></div></div></div></section>`;
  }

  function renderDocuments() {
    const client = getActiveClient();
    return `<section class="page">${header('Forms & Documents', 'A single doorway for forms, referrals and clinician-shared documents.', 'Documents')}<div class="care-panel"><span class="micro-label">Current form status</span><h2>${safeText(client.formsStatus || 'Not started')}</h2><p>Reception can update the administrative status. Production document storage requires secure authenticated upload and access controls.</p></div><div class="spacer-18"></div><button class="btn wide" type="button" data-external="${PRACTICE.bookingPortal}">Open existing secure practice portal ↗</button></section>`;
  }

  function renderProfile() {
    const client = getActiveClient(); const d = getOwnedData();
    return `<section class="page">${header('My Preferences', 'Practical preferences that can make appointments and communication easier.', 'Me')}<div class="care-panel compact-identity"><div><span class="micro-label">Name</span><strong>${safeText(clientDisplayName(client))}</strong></div><div><span class="micro-label">Preferred contact</span><strong>${safeText(client.preferredContact || 'Not set')}</strong></div></div><form id="profileForm"><div class="care-fieldset"><label for="communication">How I communicate best</label><textarea class="care-textarea" id="communication" name="communication" maxlength="1500" placeholder="Demo text only…">${safeText(d.communication)}</textarea></div><div class="care-fieldset"><label for="accessibility">Things that make appointments easier for me</label><textarea class="care-textarea" id="accessibility" name="accessibility" maxlength="1500" placeholder="Demo text only…">${safeText(d.accessibility)}</textarea></div><div class="care-fieldset"><label class="share-row" for="sharePreferences"><input id="sharePreferences" name="sharePreferences" type="checkbox" ${d.sharePreferences ? 'checked' : ''} /><span><strong>I choose to share these preferences with my psychologist</strong><small>Prototype only — nothing is transmitted.</small></span></label></div><div class="care-save-row"><button class="btn" type="submit">Save demo preferences</button></div></form><div class="soft-divider"></div><div class="care-grid"><button class="list-item" type="button" data-route="contact"><span class="list-icon">☎</span><span class="list-copy"><strong>Contact reception</strong><small>Phone, email and website</small></span><span class="chev">›</span></button><button class="list-item" type="button" data-route="help"><span class="list-icon">!</span><span class="list-copy"><strong>Help now</strong><small>Urgent-support information</small></span><span class="chev">›</span></button></div></section>`;
  }

  function renderContact() { return `<section class="page">${header('Contact Reception', 'For appointments, forms and general practice questions.', 'Mood & Mind')}<div class="list"><a class="list-item" href="${PRACTICE.phoneHref}"><span class="list-icon">☎</span><span class="list-copy"><strong>${PRACTICE.phoneDisplay}</strong><small>Call reception</small></span><span class="chev">›</span></a><a class="list-item" href="mailto:${PRACTICE.email}"><span class="list-icon">✉</span><span class="list-copy"><strong>${PRACTICE.email}</strong><small>Email reception</small></span><span class="chev">›</span></a><button class="list-item" type="button" data-external="${PRACTICE.website}"><span class="list-icon">↗</span><span class="list-copy"><strong>Mood & Mind website</strong><small>Open the practice website</small></span><span class="chev">›</span></button></div></section>`; }

  function renderHelp() { return `<section class="page">${header('Help Now', 'This prototype portal is not monitored and is not an emergency service.', 'Urgent support')}<div class="danger-panel"><h2>Immediate danger</h2><p>If there is an immediate threat to life or safety in Australia, call emergency services on 000.</p><div class="danger-actions"><a class="btn-danger" href="tel:000">Call 000</a></div></div><div class="spacer-18"></div><div class="card card-pad"><h2 style="margin-top:0">Mood & Mind reception</h2><p class="muted">For routine practice and appointment support during reception hours.</p><a class="btn wide" href="${PRACTICE.phoneHref}">Call reception — ${PRACTICE.phoneDisplay}</a></div></section>`; }

  function staffStats(clients) {
    const active = clients.filter(c => c.active !== false);
    return { total: active.length, portal: active.filter(c => c.portalStatus === 'Active').length, consent: active.filter(c => c.consentStatus !== 'Complete').length, forms: active.filter(c => !/complete/i.test(c.formsStatus || '')).length };
  }

  function renderClientRow(client) {
    const name = clientDisplayName(client);
    const initials = [client.legalFirst, client.legalLast].filter(Boolean).slice(0,2).map(x => x[0]).join('').toUpperCase() || 'MM';
    const search = [name, client.legalFirst, client.legalLast, client.email, client.mobile, client.clinician].join(' ').toLowerCase();
    return `<article class="staff-client-row" data-client-row data-search="${safeText(search)}"><div class="staff-avatar" aria-hidden="true">${safeText(initials)}</div><div class="staff-client-main"><div class="staff-client-title"><h3>${safeText(name)}</h3><span class="status-pill ${statusClass(client.portalStatus)}">${safeText(client.portalStatus)}</span></div><div class="staff-client-meta"><span><b>Clinician</b>${safeText(client.clinician || 'Unassigned')}</span><span><b>Mobile</b>${safeText(client.mobile || 'Not set')}</span><span><b>Email</b>${safeText(client.email || 'Not set')}</span></div></div><div class="staff-client-flags"><span class="mini-status ${statusClass(client.consentStatus)}">Consent: ${safeText(client.consentStatus)}</span><span class="mini-status ${statusClass(client.formsStatus)}">Forms: ${safeText(client.formsStatus)}</span></div><div class="staff-row-actions"><button class="btn-secondary btn-small" type="button" data-edit-client="${safeText(client.id)}">Edit record</button><button class="btn-quiet btn-small" type="button" data-open-client="${safeText(client.id)}">View portal</button></div></article>`;
  }

  function renderStaff() {
    const clients = getClients().filter(c => c.active !== false); const stats = staffStats(clients);
    return `<section class="page staff-page"><div class="staff-hero"><div><div class="eyebrow staff-eyebrow">Reception workspace · prototype</div><h1 class="page-title">Client administration, <em>beautifully organised.</em></h1><p class="page-lead">Reception can create and maintain the client’s administrative record, assign their clinician and manage portal readiness without touching client-owned therapy content.</p></div><button class="btn staff-primary" type="button" data-action="new-client">+ Add client</button></div>
      <div class="staff-stats"><div class="staff-stat"><span>Current clients</span><strong>${stats.total}</strong><small>active records</small></div><div class="staff-stat"><span>Portal active</span><strong>${stats.portal}</strong><small>client access live</small></div><div class="staff-stat"><span>Consent to finish</span><strong>${stats.consent}</strong><small>admin follow-up</small></div><div class="staff-stat"><span>Forms outstanding</span><strong>${stats.forms}</strong><small>not yet complete</small></div></div>
      <div class="staff-toolbar"><label class="staff-search"><span aria-hidden="true">⌕</span><input id="clientSearch" type="search" placeholder="Search clients, clinician, email or mobile" autocomplete="off" /></label><button class="btn-secondary" type="button" data-route="home">Preview client portal</button></div>
      <div class="staff-list-heading"><div><span class="micro-label">Client directory</span><h2>Reception records</h2></div><span class="staff-count">${clients.length} client${clients.length === 1 ? '' : 's'}</span></div><div class="staff-client-list" id="staffClientList">${clients.length ? clients.map(renderClientRow).join('') : `<div class="empty-state"><h2>No clients yet</h2><p>Add the first demo client to begin.</p><button class="btn" type="button" data-action="new-client">Add client</button></div>`}</div>
      <div class="staff-safety-note"><strong>Prototype only — no real client information.</strong><span>The production version should require named staff accounts, MFA, role-based permissions, encrypted storage, audit logging, session controls and a compliant privacy/security review before any real health information is entered.</span></div></section>`;
  }

  function selectOptions(options, value) { return options.map(opt => `<option value="${safeText(opt)}" ${opt === value ? 'selected' : ''}>${safeText(opt)}</option>`).join(''); }

  function renderStaffEditor(isNew = false) {
    const clients = getClients(); const editId = isNew ? '' : sessionStorage.getItem(EDIT_CLIENT_STORE) || '';
    const found = clients.find(c => c.id === editId); const c = { ...CLIENT_DEFAULTS, ...(found || {}) };
    const title = isNew ? 'Add a client' : 'Edit client record';
    const subtitle = isNew ? 'Create the administrative record reception needs to prepare the client’s private portal.' : `Update ${safeText(clientDisplayName(c))}’s administrative details.`;
    return `<section class="page staff-page"><div class="editor-head"><div><div class="eyebrow staff-eyebrow">Reception workspace</div><h1 class="page-title">${title}</h1><p class="page-lead">${subtitle}</p></div><button class="btn-quiet" type="button" data-route="staff">Back to clients</button></div>
      <form id="staffClientForm" class="staff-form" data-new="${isNew ? 'true' : 'false'}" data-client-id="${safeText(c.id)}">
        <section class="form-section"><div class="form-section-head"><span class="form-step">01</span><div><h2>Identity &amp; contact</h2><p>The practical information reception needs to identify and contact the client.</p></div></div><div class="form-grid">
          <label><span>Legal first name *</span><input name="legalFirst" maxlength="80" required value="${safeText(c.legalFirst)}" /></label><label><span>Legal surname *</span><input name="legalLast" maxlength="80" required value="${safeText(c.legalLast)}" /></label><label><span>Preferred name</span><input name="preferredName" maxlength="80" value="${safeText(c.preferredName)}" /></label><label><span>Date of birth</span><input name="dob" type="date" value="${safeText(c.dob)}" /></label><label><span>Pronouns</span><input name="pronouns" maxlength="80" value="${safeText(c.pronouns)}" /></label><label><span>Mobile</span><input name="mobile" inputmode="tel" maxlength="40" value="${safeText(c.mobile)}" /></label><label><span>Email</span><input name="email" type="email" maxlength="160" value="${safeText(c.email)}" /></label><label><span>Preferred contact</span><select name="preferredContact">${selectOptions(['Email','SMS','Phone','Other'], c.preferredContact)}</select></label><label class="span-2"><span>Address</span><textarea name="address" maxlength="500">${safeText(c.address)}</textarea></label>
        </div></section>
        <section class="form-section"><div class="form-section-head"><span class="form-step">02</span><div><h2>Care administration</h2><p>Assignment, referral and funding information — not clinical notes.</p></div></div><div class="form-grid">
          <label><span>Assigned clinician</span><input name="clinician" maxlength="120" value="${safeText(c.clinician)}" placeholder="e.g. Irene Vermooten" /></label><label><span>Next appointment</span><input name="nextAppointment" type="datetime-local" value="${safeText(c.nextAppointment)}" /></label><label><span>Referral source</span><input name="referralSource" maxlength="120" value="${safeText(c.referralSource)}" placeholder="GP, self, NDIS, insurer…" /></label><label><span>Referrer</span><input name="referrer" maxlength="160" value="${safeText(c.referrer)}" /></label><label><span>Funding / billing stream</span><input name="funding" maxlength="120" value="${safeText(c.funding)}" placeholder="Private, NDIS, WorkCover…" /></label><label><span>Funding / reference number</span><input name="fundingRef" maxlength="120" value="${safeText(c.fundingRef)}" /></label>
        </div></section>
        <section class="form-section"><div class="form-section-head"><span class="form-step">03</span><div><h2>Portal readiness</h2><p>Reception can see exactly what still needs attention before the client uses the portal.</p></div></div><div class="form-grid">
          <label><span>Portal access</span><select name="portalStatus">${selectOptions(['Not invited','Invited','Active','Paused'], c.portalStatus)}</select></label><label><span>Consent status</span><select name="consentStatus">${selectOptions(['Awaiting','In progress','Complete','Declined'], c.consentStatus)}</select></label><label><span>Forms status</span><select name="formsStatus">${selectOptions(['Not started','Intake pending','In progress','Complete','Overdue'], c.formsStatus)}</select></label><label><span>Resources status</span><input name="resourcesStatus" maxlength="160" value="${safeText(c.resourcesStatus)}" placeholder="None assigned" /></label>
        </div></section>
        <section class="form-section"><div class="form-section-head"><span class="form-step">04</span><div><h2>Communication &amp; accessibility</h2><p>Practical preferences that help reception and the care team communicate respectfully.</p></div></div><div class="form-grid"><label class="span-2"><span>Communication preferences</span><textarea name="communication" maxlength="1500">${safeText(c.communication)}</textarea></label><label class="span-2"><span>Accessibility / appointment adjustments</span><textarea name="accessibility" maxlength="1500">${safeText(c.accessibility)}</textarea></label></div></section>
        <section class="form-section"><div class="form-section-head"><span class="form-step">05</span><div><h2>Emergency contact &amp; reception notes</h2><p>Staff-only administrative information. Reception notes are never displayed in the client portal.</p></div></div><div class="form-grid"><label><span>Emergency contact name</span><input name="emergencyName" maxlength="120" value="${safeText(c.emergencyName)}" /></label><label><span>Relationship</span><input name="emergencyRelationship" maxlength="100" value="${safeText(c.emergencyRelationship)}" /></label><label><span>Emergency contact phone</span><input name="emergencyPhone" inputmode="tel" maxlength="40" value="${safeText(c.emergencyPhone)}" /></label><label class="span-2"><span>Reception administrative notes</span><textarea name="adminNotes" maxlength="2000" placeholder="Administrative notes only — not clinical notes.">${safeText(c.adminNotes)}</textarea></label></div></section>
        <div class="staff-form-actions"><button class="btn" type="submit">${isNew ? 'Create demo client' : 'Save changes'}</button><button class="btn-secondary" type="button" data-route="staff">Cancel</button>${!isNew && c.id !== 'demo-client-001' ? `<button class="btn-danger-soft" type="button" data-archive-client="${safeText(c.id)}">Archive client</button>` : ''}</div>
      </form><div class="staff-safety-note"><strong>Privacy boundary</strong><span>This reception record deliberately excludes psychologist progress notes, diagnoses and therapy notes. Those require separate clinical-record governance and permissions.</span></div></section>`;
  }

  function renderNotFound() { return `<section class="page">${header('Page not found', 'That screen is not part of this prototype.')}<button class="btn" type="button" data-route="home">Back home</button></section>`; }

  function render() {
    const route = routeFromHash();
    const views = { home: renderHome, care: renderCare, prepare: renderPrepare, psychologist: renderPsychologist, resources: renderResources, documents: renderDocuments, profile: renderProfile, contact: renderContact, help: renderHelp, staff: renderStaff, 'staff-new': () => renderStaffEditor(true), 'staff-edit': () => renderStaffEditor(false) };
    const main = document.getElementById('main'); main.innerHTML = (views[route] || renderNotFound)();
    const staffMode = route.startsWith('staff'); const shell = document.querySelector('.app-shell'); shell?.classList.toggle('staff-shell', staffMode); document.body.classList.toggle('staff-mode', staffMode);
    const back = document.getElementById('backButton'); if (back) back.hidden = route === 'home' || route === 'staff';
    document.querySelectorAll('[data-nav]').forEach(btn => {
      const active = !staffMode && ((route === 'home' && btn.dataset.nav === 'home') || (['care','psychologist','documents'].includes(route) && btn.dataset.nav === 'care') || (route === 'prepare' && btn.dataset.nav === 'prepare') || (route === 'resources' && btn.dataset.nav === 'resources') || (['profile','contact','help'].includes(route) && btn.dataset.nav === 'profile'));
      btn.classList.toggle('active', active); if (active) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current');
    });
    const bottom = document.querySelector('.bottom-nav'); if (bottom) bottom.hidden = staffMode;
    window.scrollTo({ top: 0, behavior: 'instant' }); main.focus({ preventScroll: true });
  }

  function formValue(values, name, max=5000) { return String(values.get(name) || '').trim().slice(0, max); }

  document.addEventListener('click', event => {
    const routeTarget = event.target.closest('[data-route]'); if (routeTarget) { event.preventDefault(); setRoute(routeTarget.dataset.route); return; }
    const externalTarget = event.target.closest('[data-external]'); if (externalTarget) { event.preventDefault(); external(externalTarget.dataset.external); return; }
    const edit = event.target.closest('[data-edit-client]'); if (edit) { sessionStorage.setItem(EDIT_CLIENT_STORE, edit.dataset.editClient); setRoute('staff-edit'); return; }
    const open = event.target.closest('[data-open-client]'); if (open) { localStorage.setItem(ACTIVE_CLIENT_STORE, open.dataset.openClient); showToast('Client portal preview selected.'); setRoute('home'); return; }
    const archive = event.target.closest('[data-archive-client]'); if (archive) { const id = archive.dataset.archiveClient; saveClients(getClients().map(c => c.id === id ? { ...c, active: false, updatedAt: new Date().toISOString() } : c)); showToast('Demo client archived.'); setRoute('staff'); return; }
    const action = event.target.closest('[data-action]'); if (action?.dataset.action === 'new-client') { sessionStorage.removeItem(EDIT_CLIENT_STORE); setRoute('staff-new'); }
  });

  document.addEventListener('input', event => {
    if (event.target?.id !== 'clientSearch') return;
    const q = event.target.value.toLowerCase().trim();
    document.querySelectorAll('[data-client-row]').forEach(row => { row.hidden = q && !String(row.dataset.search || '').includes(q); });
  });

  document.addEventListener('submit', event => {
    event.preventDefault(); const form = event.target; const values = new FormData(form);
    if (form.id === 'careForm') { setOwnedData({ clinicianKnow: formValue(values, 'clinicianKnow', 2000), goals: formValue(values, 'goals', 2000), helps: formValue(values, 'helps', 2000), shareCare: form.shareCare.checked }); showToast('Demo care draft saved on this device.'); return; }
    if (form.id === 'prepForm') { setOwnedData({ sinceLast: formValue(values, 'sinceLast', 2000), today: formValue(values, 'today', 2000), dontForget: formValue(values, 'dontForget', 2000), questions: formValue(values, 'questions', 2000), sharePrep: form.sharePrep.checked }); showToast('Demo session prep saved on this device.'); return; }
    if (form.id === 'profileForm') { setOwnedData({ communication: formValue(values, 'communication', 1500), accessibility: formValue(values, 'accessibility', 1500), sharePreferences: form.sharePreferences.checked }); showToast('Demo preferences saved on this device.'); return; }
    if (form.id === 'staffClientForm') {
      const isNew = form.dataset.new === 'true'; const now = new Date().toISOString(); const existingId = form.dataset.clientId || ''; const id = isNew ? `client-${Date.now()}-${Math.random().toString(36).slice(2,7)}` : existingId;
      const previous = getClients().find(c => c.id === id);
      const record = { ...CLIENT_DEFAULTS, id, legalFirst: formValue(values,'legalFirst',80), legalLast: formValue(values,'legalLast',80), preferredName: formValue(values,'preferredName',80), dob: formValue(values,'dob',20), pronouns: formValue(values,'pronouns',80), email: formValue(values,'email',160), mobile: formValue(values,'mobile',40), preferredContact: formValue(values,'preferredContact',40), address: formValue(values,'address',500), emergencyName: formValue(values,'emergencyName',120), emergencyRelationship: formValue(values,'emergencyRelationship',100), emergencyPhone: formValue(values,'emergencyPhone',40), clinician: formValue(values,'clinician',120), referralSource: formValue(values,'referralSource',120), referrer: formValue(values,'referrer',160), funding: formValue(values,'funding',120), fundingRef: formValue(values,'fundingRef',120), nextAppointment: formValue(values,'nextAppointment',40), portalStatus: formValue(values,'portalStatus',40), consentStatus: formValue(values,'consentStatus',40), formsStatus: formValue(values,'formsStatus',60), resourcesStatus: formValue(values,'resourcesStatus',160), communication: formValue(values,'communication',1500), accessibility: formValue(values,'accessibility',1500), adminNotes: formValue(values,'adminNotes',2000), active: true, createdAt: isNew ? now : (previous?.createdAt || now), updatedAt: now };
      const clients = getClients(); if (isNew) clients.unshift(record); else { const index = clients.findIndex(c => c.id === id); if (index >= 0) clients[index] = record; else clients.unshift(record); }
      saveClients(clients); localStorage.setItem(ACTIVE_CLIENT_STORE, id); sessionStorage.setItem(EDIT_CLIENT_STORE, id); showToast(isNew ? 'Demo client created.' : 'Client record updated.'); setRoute('staff');
    }
  });

  document.getElementById('backButton')?.addEventListener('click', () => { const route = routeFromHash(); if (route.startsWith('staff')) setRoute('staff'); else if (history.length > 1) history.back(); else setRoute('home'); });
  window.addEventListener('hashchange', render);
  if (!localStorage.getItem(CLIENTS_STORE)) { saveClients(seedClients); localStorage.setItem(ACTIVE_CLIENT_STORE, seedClients[0].id); }
  if (!location.hash) location.hash = '#/home'; else render();
})();