import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@neondatabase/neon-js';
import './styles.css';

const AUTH_URL = 'https://ep-wispy-wind-a6ojzaic.neonauth.us-west-2.aws.neon.tech/neondb/auth';
const DATA_API_URL = 'https://ep-wispy-wind-a6ojzaic.apirest.us-west-2.aws.neon.tech/neondb/rest/v1';
const BOOKING_URL = 'https://clientportal.zandahealth.com/clientportal/hzyb6/home';
const WEBSITE_URL = 'https://www.moodandmindcentre.com/';

const db = createClient({
  auth: { url: AUTH_URL },
  dataApi: { url: DATA_API_URL },
});

const NAV = [
  ['overview', 'Overview', '⌂'],
  ['clients', 'Clients', '◌'],
  ['staff', 'Staff', '♙'],
  ['centres', 'Centres', '⌖'],
  ['integrations', 'Integrations', '↗'],
];

const ROLE_LABELS = {
  owner: 'Owner',
  director: 'Director',
  practice_manager: 'Practice Manager',
  reception: 'Reception',
  clinician: 'Clinician',
  supervisor: 'Supervisor',
  finance: 'Finance',
  read_only: 'Read only',
};

const STAFF_ROLES = ['reception', 'clinician', 'supervisor', 'read_only'];
const MANAGER_ROLES = ['owner', 'director', 'practice_manager', 'reception', 'clinician', 'supervisor', 'finance', 'read_only'];
const MANAGER_SET = new Set(['owner', 'director', 'practice_manager']);

function normaliseError(error, fallback = 'Something went wrong.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || error.error_description || error.details || fallback;
}

function initials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'MM';
}

function prettyRole(role) {
  return ROLE_LABELS[role] || role || 'Staff';
}

function prettyStatus(value = '') {
  return String(value).replaceAll('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function clientName(client) {
  return client.preferred_name || [client.legal_first_name, client.legal_last_name].filter(Boolean).join(' ') || 'Unnamed client';
}

function newClientNumber() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const random = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `MM-${stamp}${random}`;
}

function App() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authMode, setAuthMode] = useState('signin');
  const [pendingEmail, setPendingEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadIdentity = useCallback(async () => {
    setBooting(true);
    setError('');
    try {
      const sessionResult = await db.auth.getSession();
      const currentSession = sessionResult?.data?.session || null;
      setSession(currentSession);
      if (!currentSession?.user?.id) {
        setProfile(null);
        return;
      }

      try {
        await db.rpc('claim_staff_profile', {});
      } catch {
        // No pre-created staff profile is a valid state during first-business setup.
      }

      const { data, error: profileError } = await db
        .from('staff_profiles')
        .select('*')
        .eq('auth_user_id', currentSession.user.id)
        .limit(1);

      if (profileError) throw profileError;
      setProfile(data?.[0] || null);
    } catch (e) {
      setError(normaliseError(e, 'Unable to open the business portal.'));
      setProfile(null);
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    loadIdentity();
  }, [loadIdentity]);

  async function handleSignIn({ email, password }) {
    setError(''); setMessage('');
    const result = await db.auth.signIn.email({ email: email.trim(), password });
    if (result?.error) throw new Error(normaliseError(result.error));
    await loadIdentity();
  }

  async function handleSignUp({ name, email, password }) {
    setError(''); setMessage('');
    const cleanedEmail = email.trim().toLowerCase();
    const result = await db.auth.signUp.email({ name: name.trim(), email: cleanedEmail, password });
    if (result?.error) throw new Error(normaliseError(result.error));
    setPendingEmail(cleanedEmail);
    setAuthMode('verify');
    setMessage('Account created. Enter the email verification code to continue.');
  }

  async function handleVerify({ otp }) {
    setError(''); setMessage('');
    const result = await db.auth.emailOtp.verifyEmail({ email: pendingEmail, otp: otp.trim() });
    if (result?.error) throw new Error(normaliseError(result.error));
    setMessage('Email verified. You can now sign in.');
    setAuthMode('signin');
  }

  async function resendVerification() {
    if (!pendingEmail) return;
    setError('');
    const result = await db.auth.emailOtp.sendVerificationOtp({ email: pendingEmail, type: 'email-verification' });
    if (result?.error) throw new Error(normaliseError(result.error));
    setMessage('A fresh verification code has been sent.');
  }

  async function handleSignOut() {
    await db.auth.signOut();
    setSession(null); setProfile(null); setAuthMode('signin'); setMessage(''); setError('');
  }

  if (booting) return <LoadingScreen />;

  if (!session) {
    return <AuthScreen mode={authMode} setMode={setAuthMode} pendingEmail={pendingEmail} onSignIn={handleSignIn} onSignUp={handleSignUp} onVerify={handleVerify} onResend={resendVerification} message={message} error={error} setError={setError} />;
  }

  if (!profile) {
    return <AccessSetup session={session} onReady={loadIdentity} onSignOut={handleSignOut} />;
  }

  return <BusinessShell session={session} profile={profile} onSignOut={handleSignOut} />;
}

function LoadingScreen() {
  return <main className="auth-stage"><div className="auth-card loading-card"><BrandMark /><div className="loader" /><h1>Opening Mood &amp; Mind</h1><p>Secure business workspace</p></div></main>;
}

function BrandMark({ compact = false }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}><div className="brand-orbit" aria-hidden="true"><span>M</span></div><div><strong>The Mood &amp; <em>Mind</em> Centre</strong><small>Business Portal</small></div></div>;
}

function AuthScreen({ mode, setMode, pendingEmail, onSignIn, onSignUp, onVerify, onResend, message, error, setError }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', email: pendingEmail || '', password: '', otp: '' });

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (mode === 'signin') await onSignIn(form);
      if (mode === 'signup') await onSignUp(form);
      if (mode === 'verify') await onVerify(form);
    } catch (err) {
      setError(normaliseError(err));
    } finally { setBusy(false); }
  }

  async function resend() {
    setBusy(true); setError('');
    try { await onResend(); } catch (err) { setError(normaliseError(err)); } finally { setBusy(false); }
  }

  return <main className="auth-stage">
    <section className="auth-intro">
      <div className="auth-intro-inner">
        <span className="eyebrow">Private practice operations</span>
        <h1>One elegant workspace for <em>both centres.</em></h1>
        <p>Reception, clinicians and management work from the same protected business layer, with access controlled by role and centre.</p>
        <div className="centre-chips"><span>Hope Island</span><span>Upper Coomera</span></div>
        <div className="auth-principles"><div><b>Shared</b><span>One live source of truth</span></div><div><b>Controlled</b><span>Role and centre permissions</span></div><div><b>Auditable</b><span>Staff changes are recorded</span></div></div>
      </div>
    </section>
    <section className="auth-panel">
      <div className="auth-card">
        <BrandMark />
        {mode !== 'verify' && <div className="auth-tabs"><button className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')} type="button">Sign in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')} type="button">Create staff account</button></div>}
        <div className="auth-heading"><h2>{mode === 'signin' ? 'Staff sign in' : mode === 'signup' ? 'Create staff account' : 'Verify your email'}</h2><p>{mode === 'verify' ? `Enter the code sent to ${pendingEmail}.` : 'Use a Mood & Mind staff email that reception or management has authorised.'}</p></div>
        {message && <div className="notice success">{message}</div>}
        {error && <div className="notice error">{error}</div>}
        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && <label><span>Full name</span><input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}
          {mode !== 'verify' && <label><span>Work email</span><input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>}
          {mode !== 'verify' && <label><span>Password</span><input required minLength={10} type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><small>Use at least 10 characters for this pilot.</small></label>}
          {mode === 'verify' && <label><span>Verification code</span><input required inputMode="numeric" autoComplete="one-time-code" value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} /></label>}
          <button className="primary-button full" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Open business portal' : mode === 'signup' ? 'Create account' : 'Verify email'}</button>
        </form>
        {mode === 'verify' && <div className="inline-actions"><button type="button" className="text-button" onClick={resend} disabled={busy}>Send another code</button><button type="button" className="text-button" onClick={() => setMode('signin')}>Back to sign in</button></div>}
        <div className="security-caption">This is the Mood & Mind business workspace. Client health information should only be entered after the production handover checklist is completed.</div>
      </div>
    </section>
  </main>;
}

function AccessSetup({ session, onReady, onSignOut }) {
  const [name, setName] = useState(session?.user?.name || '');
  const [setupKey, setSetupKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function claimInitial(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const result = await db.rpc('claim_initial_manager', { setup_key: setupKey.trim(), display_name: name.trim() });
      if (result?.error) throw result.error;
      await onReady();
    } catch (err) { setError(normaliseError(err, 'Unable to establish the first business administrator.')); }
    finally { setBusy(false); }
  }

  return <main className="auth-stage access-stage"><section className="access-card"><BrandMark /><span className="eyebrow light">Account verified</span><h1>Business access is not linked yet.</h1><p>If reception has already entered this staff email in the Staff Directory, signing out and back in after they save it will link automatically.</p><div className="access-email">Signed in as <strong>{session?.user?.email}</strong></div><div className="access-separator"><span>First business administrator only</span></div><form onSubmit={claimInitial} className="auth-form"><label><span>Administrator name</span><input required value={name} onChange={(e) => setName(e.target.value)} /></label><label><span>One-time business setup key</span><input required type="password" value={setupKey} onChange={(e) => setSetupKey(e.target.value)} /></label>{error && <div className="notice error">{error}</div>}<button className="primary-button full" disabled={busy}>{busy ? 'Establishing…' : 'Establish Mood & Mind administration'}</button></form><button className="text-button light-text" onClick={onSignOut}>Sign out</button></section></main>;
}

function BusinessShell({ session, profile, onSignOut }) {
  const [view, setView] = useState('overview');
  const [centreFilter, setCentreFilter] = useState('all');
  const [centres, setCentres] = useState([]);
  const [staff, setStaff] = useState([]);
  const [staffCentres, setStaffCentres] = useState([]);
  const [clients, setClients] = useState([]);
  const [adminRows, setAdminRows] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState('');
  const [loadError, setLoadError] = useState('');
  const [modal, setModal] = useState(null);

  const isManager = MANAGER_SET.has(profile.system_role);

  const refresh = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const [centreRes, staffRes, staffCentreRes, clientRes, adminRes, integrationRes] = await Promise.all([
        db.from('centres').select('*').order('name', { ascending: true }),
        db.from('staff_profiles').select('*').eq('active', true).order('full_name', { ascending: true }),
        db.from('staff_centres').select('*'),
        db.from('clients').select('*').neq('status', 'archived').order('legal_last_name', { ascending: true }),
        db.from('client_admin').select('*'),
        db.from('integration_config').select('*').order('label', { ascending: true }),
      ]);
      for (const res of [centreRes, staffRes, staffCentreRes, clientRes, adminRes, integrationRes]) {
        if (res.error) throw res.error;
      }
      setCentres(centreRes.data || []); setStaff(staffRes.data || []); setStaffCentres(staffCentreRes.data || []); setClients(clientRes.data || []); setAdminRows(adminRes.data || []); setIntegrations(integrationRes.data || []);
    } catch (err) { setLoadError(normaliseError(err, 'Unable to load business information.')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (!flash) return; const t = setTimeout(() => setFlash(''), 3200); return () => clearTimeout(t); }, [flash]);

  const filteredClients = useMemo(() => centreFilter === 'all' ? clients : clients.filter((c) => c.primary_centre_id === centreFilter), [clients, centreFilter]);
  const filteredStaff = useMemo(() => {
    if (centreFilter === 'all') return staff;
    const ids = new Set(staffCentres.filter((x) => x.centre_id === centreFilter).map((x) => x.staff_id));
    return staff.filter((s) => ids.has(s.id));
  }, [staff, staffCentres, centreFilter]);
  const adminByClient = useMemo(() => Object.fromEntries(adminRows.map((row) => [row.client_id, row])), [adminRows]);
  const staffById = useMemo(() => Object.fromEntries(staff.map((row) => [row.id, row])), [staff]);
  const centresById = useMemo(() => Object.fromEntries(centres.map((row) => [row.id, row])), [centres]);

  function notify(text) { setFlash(text); }

  async function saveStaff(payload) {
    const { centreIds, ...record } = payload;
    const { data, error } = await db.from('staff_profiles').insert(record).select();
    if (error) throw error;
    const created = data?.[0];
    if (created && centreIds.length) {
      const assignments = centreIds.map((centre_id, index) => ({ staff_id: created.id, centre_id, is_primary: index === 0 }));
      const linkResult = await db.from('staff_centres').insert(assignments).select();
      if (linkResult.error) throw linkResult.error;
    }
    notify(`${record.full_name} added to the staff directory.`); setModal(null); await refresh();
  }

  async function saveClient(payload) {
    const { admin, ...record } = payload;
    const { data, error } = await db.from('clients').insert(record).select();
    if (error) throw error;
    const created = data?.[0];
    if (created) {
      const adminResult = await db.from('client_admin').insert({ ...admin, client_id: created.id }).select();
      if (adminResult.error) throw adminResult.error;
    }
    notify(`${record.preferred_name || record.legal_first_name} added to the client directory.`); setModal(null); await refresh();
  }

  async function updateClient(clientId, payload) {
    const { admin, ...record } = payload;
    const clientResult = await db.from('clients').update({ ...record, updated_at: new Date().toISOString() }).eq('id', clientId).select();
    if (clientResult.error) throw clientResult.error;
    const adminResult = await db.from('client_admin').update({ ...admin, updated_at: new Date().toISOString() }).eq('client_id', clientId).select();
    if (adminResult.error) throw adminResult.error;
    notify('Client administration record updated.'); setModal(null); await refresh();
  }

  return <div className="business-app">
    <aside className="sidebar">
      <div className="sidebar-brand"><BrandMark compact /></div>
      <nav>{NAV.map(([id, label, icon]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><span>{icon}</span><b>{label}</b></button>)}</nav>
      <div className="sidebar-bottom"><div className="signed-user"><div className="avatar">{initials(profile.full_name)}</div><div><strong>{profile.full_name}</strong><span>{prettyRole(profile.system_role)}</span></div></div><button className="signout" onClick={onSignOut}>Sign out</button></div>
    </aside>

    <div className="workspace">
      <header className="workspace-topbar"><div className="mobile-brand"><BrandMark compact /></div><div className="topbar-context"><span>Business workspace</span><strong>{NAV.find((n) => n[0] === view)?.[1] || 'Overview'}</strong></div><label className="centre-filter"><span>Centre</span><select value={centreFilter} onChange={(e) => setCentreFilter(e.target.value)}><option value="all">Both centres</option>{centres.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label><a className="top-link" href={BOOKING_URL} target="_blank" rel="noreferrer">Booking system ↗</a></header>
      {flash && <div className="flash-message">✓ {flash}</div>}
      {loadError && <div className="workspace-error">{loadError}<button onClick={refresh}>Try again</button></div>}
      <main className="content">
        {loading ? <WorkspaceLoader /> : <>
          {view === 'overview' && <Overview centres={centres} staff={filteredStaff} clients={filteredClients} adminByClient={adminByClient} staffById={staffById} centreFilter={centreFilter} setView={setView} openStaff={() => setModal({ type: 'staff' })} openClient={() => setModal({ type: 'client' })} />}
          {view === 'clients' && <ClientsView clients={filteredClients} adminByClient={adminByClient} staffById={staffById} centresById={centresById} onAdd={() => setModal({ type: 'client' })} onEdit={(client) => setModal({ type: 'client', client, admin: adminByClient[client.id] })} />}
          {view === 'staff' && <StaffView staff={filteredStaff} staffCentres={staffCentres} centresById={centresById} onAdd={() => setModal({ type: 'staff' })} />}
          {view === 'centres' && <CentresView centres={centres} clients={clients} staff={staff} staffCentres={staffCentres} />}
          {view === 'integrations' && <IntegrationsView integrations={integrations} />}
        </>}
      </main>
    </div>

    {modal?.type === 'staff' && <StaffModal profile={profile} centres={centres} onClose={() => setModal(null)} onSave={saveStaff} />}
    {modal?.type === 'client' && <ClientModal client={modal.client} admin={modal.admin} centres={centres} staff={staff} onClose={() => setModal(null)} onSave={modal.client ? (payload) => updateClient(modal.client.id, payload) : saveClient} />}
  </div>;
}

function WorkspaceLoader() {
  return <div className="workspace-loader"><div className="loader dark"/><span>Loading live business data…</span></div>;
}

function Overview({ centres, staff, clients, adminByClient, staffById, centreFilter, setView, openStaff, openClient }) {
  const pendingConsent = clients.filter((c) => adminByClient[c.id]?.consent_status !== 'complete').length;
  const outstandingForms = clients.filter((c) => adminByClient[c.id]?.forms_status !== 'complete').length;
  const activePortals = clients.filter((c) => adminByClient[c.id]?.portal_status === 'active').length;
  const filterLabel = centreFilter === 'all' ? 'Across both centres' : centres.find((c) => c.id === centreFilter)?.name || 'Selected centre';
  return <>
    <section className="page-hero"><div><span className="eyebrow dark-text">Mood &amp; Mind operations</span><h1>A clear view of the <em>whole practice.</em></h1><p>{filterLabel}. Reception and management can see what needs action without hunting across disconnected records.</p></div><div className="hero-actions"><button className="secondary-button" onClick={openStaff}>+ Add staff member</button><button className="primary-button" onClick={openClient}>+ Add client</button></div></section>
    <section className="metrics-grid"><Metric label="Current clients" value={clients.length} note="active / waitlist records" /><Metric label="Staff directory" value={staff.length} note="visible in this centre view" /><Metric label="Consent follow-up" value={pendingConsent} note="not marked complete" /><Metric label="Forms outstanding" value={outstandingForms} note="not marked complete" /></section>
    <section className="overview-grid">
      <div className="panel action-panel"><div className="panel-heading"><div><span className="micro">Reception command centre</span><h2>What needs attention</h2></div></div><div className="attention-list"><Attention label="Consent to finish" value={pendingConsent} tone={pendingConsent ? 'amber' : 'green'} /><Attention label="Forms outstanding" value={outstandingForms} tone={outstandingForms ? 'amber' : 'green'} /><Attention label="Client portals active" value={activePortals} tone="green" /><Attention label="Unassigned clinicians" value={clients.filter((c) => !adminByClient[c.id]?.assigned_clinician_staff_id).length} tone="soft" /></div><button className="panel-link" onClick={() => setView('clients')}>Open client administration <span>→</span></button></div>
      <div className="panel centre-panel"><div className="panel-heading"><div><span className="micro">Two-centre practice</span><h2>Centre overview</h2></div></div><div className="centre-list">{centres.map((centre) => <div className="centre-row" key={centre.id}><div className="centre-monogram">{centre.code === 'HOPE' ? 'HI' : 'UC'}</div><div><strong>{centre.name}</strong><span>{centre.address_line}, {centre.suburb}</span></div><b>{clients.filter((c) => c.primary_centre_id === centre.id).length}<small> clients</small></b></div>)}</div><button className="panel-link" onClick={() => setView('centres')}>Open centre details <span>→</span></button></div>
    </section>
    <section className="panel recent-panel"><div className="panel-heading"><div><span className="micro">Client directory</span><h2>Recently visible records</h2></div><button className="text-button forest" onClick={() => setView('clients')}>View all</button></div><div className="simple-table"><div className="table-head"><span>Client</span><span>Clinician</span><span>Portal</span><span>Forms</span></div>{clients.slice(0,5).map((client) => { const admin = adminByClient[client.id] || {}; return <div className="table-row" key={client.id}><span><b>{clientName(client)}</b><small>{client.client_number}</small></span><span>{staffById[admin.assigned_clinician_staff_id]?.full_name || 'Unassigned'}</span><span><StatusPill value={admin.portal_status || 'not_invited'} /></span><span><StatusPill value={admin.forms_status || 'not_started'} /></span></div>; })}{!clients.length && <div className="empty-row">No client records yet.</div>}</div></section>
  </>;
}

function Metric({ label, value, note }) { return <div className="metric-card"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function Attention({ label, value, tone }) { return <div className="attention-row"><span className={`attention-dot ${tone}`} /><span>{label}</span><strong>{value}</strong></div>; }

function ClientsView({ clients, adminByClient, staffById, centresById, onAdd, onEdit }) {
  const [query, setQuery] = useState('');
  const shown = clients.filter((c) => [clientName(c), c.client_number, c.email, c.mobile].join(' ').toLowerCase().includes(query.toLowerCase()));
  return <section><PageTitle eyebrow="Reception & client administration" title="Clients" lead="Shared administrative records across the practice. Clinical progress notes are deliberately outside this workspace." action="+ Add client" onAction={onAdd} /><div className="toolbar"><label className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, client number, email or mobile" /></label><span className="record-count">{shown.length} record{shown.length === 1 ? '' : 's'}</span></div><div className="directory-list">{shown.map((client) => { const admin = adminByClient[client.id] || {}; const clinician = staffById[admin.assigned_clinician_staff_id]; return <article className="directory-card" key={client.id}><div className="directory-avatar">{initials(clientName(client))}</div><div className="directory-main"><div className="directory-title"><h3>{clientName(client)}</h3><StatusPill value={client.status} /></div><div className="directory-meta"><span><b>ID</b>{client.client_number}</span><span><b>Centre</b>{centresById[client.primary_centre_id]?.name || 'Not set'}</span><span><b>Clinician</b>{clinician?.full_name || 'Unassigned'}</span><span><b>Contact</b>{client.mobile || client.email || 'Not set'}</span></div></div><div className="directory-status"><StatusPill label="Portal" value={admin.portal_status || 'not_invited'} /><StatusPill label="Consent" value={admin.consent_status || 'awaiting'} /><StatusPill label="Forms" value={admin.forms_status || 'not_started'} /></div><button className="small-button" onClick={() => onEdit(client)}>Edit administration</button></article>; })}{!shown.length && <EmptyState title="No clients found" text={clients.length ? 'Try a different search.' : 'Reception can add the first client record here.'} action={!clients.length ? '+ Add client' : null} onAction={onAdd} />}</div></section>;
}

function StaffView({ staff, staffCentres, centresById, onAdd }) {
  const [query, setQuery] = useState('');
  const shown = staff.filter((s) => [s.full_name, s.email, s.job_title, prettyRole(s.system_role)].join(' ').toLowerCase().includes(query.toLowerCase()));
  return <section><PageTitle eyebrow="People & permissions" title="Staff directory" lead="Reception can maintain staff names, contact details and centre assignments. Protected business-security roles remain management controlled." action="+ Add staff member" onAction={onAdd} /><div className="toolbar"><label className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search staff name, email, title or role" /></label><span className="record-count">{shown.length} staff member{shown.length === 1 ? '' : 's'}</span></div><div className="staff-grid">{shown.map((person) => { const assigned = staffCentres.filter((x) => x.staff_id === person.id).map((x) => centresById[x.centre_id]?.name).filter(Boolean); return <article className="staff-card" key={person.id}><div className="staff-card-top"><div className="directory-avatar large">{initials(person.full_name)}</div><StatusPill value={person.auth_user_id ? 'account linked' : 'awaiting account'} /></div><h3>{person.full_name}</h3><p>{person.job_title || prettyRole(person.system_role)}</p><div className="staff-details"><span><b>System role</b>{prettyRole(person.system_role)}</span><span><b>Work email</b>{person.email || 'Not set'}</span><span><b>Centres</b>{assigned.length ? assigned.join(' · ') : 'No centre assigned'}</span></div></article>; })}{!shown.length && <EmptyState title="No staff found" text={staff.length ? 'Try a different search.' : 'Reception or management can build the staff directory here.'} action={!staff.length ? '+ Add staff member' : null} onAction={onAdd} />}</div></section>;
}

function CentresView({ centres, clients, staff, staffCentres }) {
  return <section><PageTitle eyebrow="Practice locations" title="Two centres, one system" lead="Both clinics use the same protected data layer. Staff access is assigned by centre rather than creating separate disconnected systems." /><div className="centres-grid">{centres.map((centre) => { const centreStaffIds = new Set(staffCentres.filter((x) => x.centre_id === centre.id).map((x) => x.staff_id)); return <article className="centre-card" key={centre.id}><div className="centre-card-head"><div className="centre-icon">{centre.code === 'HOPE' ? 'HI' : 'UC'}</div><StatusPill value={centre.active ? 'active' : 'inactive'} /></div><span className="micro">{centre.code}</span><h2>{centre.name}</h2><p>{centre.address_line}<br />{centre.suburb} {centre.state} {centre.postcode}</p><a href={`tel:${centre.phone?.replace(/\s/g, '')}`}>{centre.phone}</a><div className="centre-stats"><div><strong>{clients.filter((c) => c.primary_centre_id === centre.id && c.status !== 'archived').length}</strong><span>clients</span></div><div><strong>{staff.filter((s) => centreStaffIds.has(s.id)).length}</strong><span>staff assigned</span></div></div></article>; })}</div></section>;
}

function IntegrationsView({ integrations }) {
  return <section><PageTitle eyebrow="Existing Mood & Mind systems" title="Integrations" lead="This business layer is designed to sit above existing systems. Links can be upgraded to true API connections only when the vendor access and credentials are approved." /><div className="integration-grid">{integrations.map((item) => <article className="integration-card" key={item.id}><div className="integration-top"><div className="integration-icon">{item.integration_type === 'booking' ? '▣' : '↗'}</div><StatusPill value={item.status} /></div><span className="micro">{item.integration_type}</span><h2>{item.label}</h2><p>{item.notes}</p>{item.base_url && <a className="secondary-button inline" href={item.base_url} target="_blank" rel="noreferrer">Open current system ↗</a>}</article>)}</div><div className="integration-note"><strong>Integration boundary</strong><p>The existing booking/client system is currently linked, not silently duplicated. A live two-way sync should only be enabled with authorised API access, field mapping and privacy/security testing.</p></div></section>;
}

function PageTitle({ eyebrow, title, lead, action, onAction }) {
  return <div className="page-title-row"><div><span className="micro">{eyebrow}</span><h1>{title}</h1><p>{lead}</p></div>{action && <button className="primary-button" onClick={onAction}>{action}</button>}</div>;
}

function StatusPill({ value, label }) {
  const clean = String(value || '').toLowerCase();
  const tone = /(active|complete|linked|configured)/.test(clean) ? 'good' : /(await|pending|invited|not_|in_progress|intake)/.test(clean) ? 'warn' : /(paused|inactive|overdue|declined|disabled)/.test(clean) ? 'muted' : 'neutral';
  return <span className={`status-pill ${tone}`}>{label ? `${label}: ` : ''}{prettyStatus(value)}</span>;
}

function EmptyState({ title, text, action, onAction }) { return <div className="empty-state"><div className="empty-symbol">◇</div><h3>{title}</h3><p>{text}</p>{action && <button className="primary-button" onClick={onAction}>{action}</button>}</div>; }

function ModalFrame({ title, lead, onClose, children }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><div><span className="micro">Mood &amp; Mind Business Portal</span><h2>{title}</h2><p>{lead}</p></div><button className="close-button" onClick={onClose} aria-label="Close">×</button></div>{children}</section></div>;
}

function StaffModal({ profile, centres, onClose, onSave }) {
  const allowedRoles = MANAGER_SET.has(profile.system_role) ? MANAGER_ROLES : STAFF_ROLES;
  const [form, setForm] = useState({ full_name: '', email: '', job_title: '', mobile: '', system_role: 'reception', centreIds: centres.map((c) => c.id) });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  function toggleCentre(id) { setForm((f) => ({ ...f, centreIds: f.centreIds.includes(id) ? f.centreIds.filter((x) => x !== id) : [...f.centreIds, id] })); }
  async function submit(e) { e.preventDefault(); setBusy(true); setError(''); try { await onSave({ full_name: form.full_name.trim(), email: form.email.trim().toLowerCase() || null, job_title: form.job_title.trim() || null, mobile: form.mobile.trim() || null, system_role: form.system_role, active: true, centreIds: form.centreIds }); } catch (err) { setError(normaliseError(err, 'Unable to add staff member.')); } finally { setBusy(false); } }
  return <ModalFrame title="Add staff member" lead="Create the business profile first. Their verified staff account can link later by matching work email." onClose={onClose}><form className="modal-form" onSubmit={submit}><div className="form-section"><h3>Staff identity</h3><div className="form-grid"><label><span>Full name *</span><input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label><label><span>Work email *</span><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label><span>Job title</span><input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="e.g. Psychologist, Reception" /></label><label><span>Mobile</span><input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></label><label><span>System role *</span><select value={form.system_role} onChange={(e) => setForm({ ...form, system_role: e.target.value })}>{allowedRoles.map((role) => <option value={role} key={role}>{prettyRole(role)}</option>)}</select></label></div></div><div className="form-section"><h3>Centre access</h3><p className="form-help">Choose every centre this staff member works from.</p><div className="check-grid">{centres.map((centre) => <label className="check-card" key={centre.id}><input type="checkbox" checked={form.centreIds.includes(centre.id)} onChange={() => toggleCentre(centre.id)} /><span><strong>{centre.name}</strong><small>{centre.suburb}</small></span></label>)}</div></div>{error && <div className="notice error">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? 'Saving…' : 'Add staff member'}</button></div></form></ModalFrame>;
}

function ClientModal({ client, admin, centres, staff, onClose, onSave }) {
  const [form, setForm] = useState({
    legal_first_name: client?.legal_first_name || '', legal_last_name: client?.legal_last_name || '', preferred_name: client?.preferred_name || '', date_of_birth: client?.date_of_birth || '', email: client?.email || '', mobile: client?.mobile || '', preferred_contact: client?.preferred_contact || 'Email', address: client?.address || '', primary_centre_id: client?.primary_centre_id || centres[0]?.id || '', status: client?.status || 'active',
    assigned_clinician_staff_id: admin?.assigned_clinician_staff_id || '', referral_source: admin?.referral_source || '', referrer_name: admin?.referrer_name || '', funding_stream: admin?.funding_stream || '', funding_reference: admin?.funding_reference || '', portal_status: admin?.portal_status || 'not_invited', consent_status: admin?.consent_status || 'awaiting', forms_status: admin?.forms_status || 'not_started', resources_status: admin?.resources_status || '', communication_preferences: admin?.communication_preferences || '', accessibility_adjustments: admin?.accessibility_adjustments || '', emergency_contact_name: admin?.emergency_contact_name || '', emergency_contact_relationship: admin?.emergency_contact_relationship || '', emergency_contact_phone: admin?.emergency_contact_phone || '', reception_notes: admin?.reception_notes || '', next_appointment: admin?.next_appointment ? String(admin.next_appointment).slice(0,16) : '',
  });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const clinicians = staff.filter((s) => ['clinician','supervisor','director','owner'].includes(s.system_role));
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const record = { client_number: client?.client_number || newClientNumber(), legal_first_name: form.legal_first_name.trim(), legal_last_name: form.legal_last_name.trim(), preferred_name: form.preferred_name.trim() || null, date_of_birth: form.date_of_birth || null, email: form.email.trim().toLowerCase() || null, mobile: form.mobile.trim() || null, preferred_contact: form.preferred_contact, address: form.address.trim() || null, primary_centre_id: form.primary_centre_id || null, status: form.status };
      const adminRecord = { assigned_clinician_staff_id: form.assigned_clinician_staff_id || null, referral_source: form.referral_source.trim() || null, referrer_name: form.referrer_name.trim() || null, funding_stream: form.funding_stream.trim() || null, funding_reference: form.funding_reference.trim() || null, portal_status: form.portal_status, consent_status: form.consent_status, forms_status: form.forms_status, resources_status: form.resources_status.trim() || null, communication_preferences: form.communication_preferences.trim() || null, accessibility_adjustments: form.accessibility_adjustments.trim() || null, emergency_contact_name: form.emergency_contact_name.trim() || null, emergency_contact_relationship: form.emergency_contact_relationship.trim() || null, emergency_contact_phone: form.emergency_contact_phone.trim() || null, reception_notes: form.reception_notes.trim() || null, next_appointment: form.next_appointment ? new Date(form.next_appointment).toISOString() : null };
      await onSave({ ...record, admin: adminRecord });
    } catch (err) { setError(normaliseError(err, 'Unable to save client administration record.')); }
    finally { setBusy(false); }
  }
  return <ModalFrame title={client ? 'Edit client administration' : 'Add client'} lead="Reception administration only. Psychologist progress notes and therapy notes are not stored in this layer." onClose={onClose}><form className="modal-form" onSubmit={submit}><div className="form-section"><h3>Identity & contact</h3><div className="form-grid"><label><span>Legal first name *</span><input required value={form.legal_first_name} onChange={set('legal_first_name')} /></label><label><span>Legal surname *</span><input required value={form.legal_last_name} onChange={set('legal_last_name')} /></label><label><span>Preferred name</span><input value={form.preferred_name} onChange={set('preferred_name')} /></label><label><span>Date of birth</span><input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} /></label><label><span>Email</span><input type="email" value={form.email} onChange={set('email')} /></label><label><span>Mobile</span><input value={form.mobile} onChange={set('mobile')} /></label><label><span>Preferred contact</span><select value={form.preferred_contact} onChange={set('preferred_contact')}><option>Email</option><option>SMS</option><option>Phone</option><option>Other</option></select></label><label><span>Primary centre *</span><select required value={form.primary_centre_id} onChange={set('primary_centre_id')}>{centres.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label className="span-2"><span>Address</span><textarea value={form.address} onChange={set('address')} /></label></div></div>
    <div className="form-section"><h3>Care administration</h3><div className="form-grid"><label><span>Assigned clinician</span><select value={form.assigned_clinician_staff_id} onChange={set('assigned_clinician_staff_id')}><option value="">Unassigned</option>{clinicians.map((s) => <option value={s.id} key={s.id}>{s.full_name}</option>)}</select></label><label><span>Next appointment</span><input type="datetime-local" value={form.next_appointment} onChange={set('next_appointment')} /></label><label><span>Referral source</span><input value={form.referral_source} onChange={set('referral_source')} /></label><label><span>Referrer</span><input value={form.referrer_name} onChange={set('referrer_name')} /></label><label><span>Funding / billing stream</span><input value={form.funding_stream} onChange={set('funding_stream')} /></label><label><span>Funding reference</span><input value={form.funding_reference} onChange={set('funding_reference')} /></label></div></div>
    <div className="form-section"><h3>Portal readiness</h3><div className="form-grid"><label><span>Portal access</span><select value={form.portal_status} onChange={set('portal_status')}><option value="not_invited">Not invited</option><option value="invited">Invited</option><option value="active">Active</option><option value="paused">Paused</option></select></label><label><span>Consent status</span><select value={form.consent_status} onChange={set('consent_status')}><option value="awaiting">Awaiting</option><option value="in_progress">In progress</option><option value="complete">Complete</option><option value="declined">Declined</option></select></label><label><span>Forms status</span><select value={form.forms_status} onChange={set('forms_status')}><option value="not_started">Not started</option><option value="intake_pending">Intake pending</option><option value="in_progress">In progress</option><option value="complete">Complete</option><option value="overdue">Overdue</option></select></label><label><span>Resources status</span><input value={form.resources_status} onChange={set('resources_status')} /></label></div></div>
    <div className="form-section"><h3>Communication & accessibility</h3><div className="form-grid"><label className="span-2"><span>Communication preferences</span><textarea value={form.communication_preferences} onChange={set('communication_preferences')} /></label><label className="span-2"><span>Accessibility / appointment adjustments</span><textarea value={form.accessibility_adjustments} onChange={set('accessibility_adjustments')} /></label></div></div>
    <div className="form-section"><h3>Emergency contact & reception notes</h3><div className="form-grid"><label><span>Emergency contact</span><input value={form.emergency_contact_name} onChange={set('emergency_contact_name')} /></label><label><span>Relationship</span><input value={form.emergency_contact_relationship} onChange={set('emergency_contact_relationship')} /></label><label><span>Phone</span><input value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} /></label><label className="span-2"><span>Reception administrative notes</span><textarea value={form.reception_notes} onChange={set('reception_notes')} placeholder="Administrative notes only — not clinical notes." /></label></div></div>
    {error && <div className="notice error">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? 'Saving…' : client ? 'Save changes' : 'Add client'}</button></div></form></ModalFrame>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
