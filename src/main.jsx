import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@neondatabase/neon-js';
import './styles.css';

const AUTH_URL = 'https://ep-wispy-wind-a6ojzaic.neonauth.us-west-2.aws.neon.tech/neondb/auth';
const DATA_API_URL = 'https://ep-wispy-wind-a6ojzaic.apirest.us-west-2.aws.neon.tech/neondb/rest/v1';
const BOOKING_URL = 'https://clientportal.zandahealth.com/clientportal/hzyb6/home';
const WEBSITE_URL = 'https://www.moodandmindcentre.com/';
const FEES_URL = 'https://www.moodandmindcentre.com/fees';
const TEAM_URL = 'https://moodandmindcentre.com/our-team/';
const FAQ_URL = 'https://moodandmindcentre.com/faq/';
const PHONE_DISPLAY = '07 5573 2200';
const PHONE_LINK = 'tel:+61755732200';
const EMAIL = 'reception@moodandmindcentre.com';
const EMAIL_LINK = 'mailto:reception@moodandmindcentre.com';

const db = createClient({ auth: { url: AUTH_URL }, dataApi: { url: DATA_API_URL } });

const NAV = [
  ['home', 'Home', '⌂'],
  ['book', 'Book a Session', '◇'],
  ['appointments', 'My Appointments', '▦'],
  ['psychologist', 'My Psychologist', '♙'],
  ['find', 'Find Us', '⌖'],
  ['telehealth', 'Telehealth', '◫'],
  ['resources', 'Resources', '✦'],
  ['before', 'Before My Session', '✓'],
  ['fees', 'Fees & Funding', '$'],
  ['forms', 'Forms & Documents', '▤'],
  ['contact', 'Contact Mood & Mind', '✉'],
  ['help', 'Help Now', '!'],
  ['profile', 'My Profile', '○'],
  ['notifications', 'Notifications', '◌'],
];

const PAGE_ALIASES = {
  home: 'home', booking: 'book', book: 'book', session: 'book', appointments: 'appointments', appointment: 'appointments',
  psychologist: 'psychologist', clinician: 'psychologist', therapist: 'psychologist', directions: 'find', location: 'find', find: 'find',
  telehealth: 'telehealth', online: 'telehealth', resources: 'resources', resource: 'resources', before: 'before', prepare: 'before',
  fees: 'fees', funding: 'fees', medicare: 'fees', ndis: 'fees', forms: 'forms', documents: 'forms', contact: 'contact', reception: 'contact',
  help: 'help', urgent: 'help', profile: 'profile', preferences: 'profile', notifications: 'notifications', alerts: 'notifications',
};

function normaliseError(error, fallback = 'Something went wrong. Please try again or contact reception.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || error.error_description || error.details || fallback;
}

function dateTime(value) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
  } catch { return null; }
}

function App() {
  const [view, setView] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [booting, setBooting] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [voiceOn, setVoiceOn] = useState(true);
  const [listening, setListening] = useState(false);
  const [voiceLabel, setVoiceLabel] = useState('South African English requested');
  const voiceRef = useRef(null);

  const loadClient = useCallback(async () => {
    setBooting(true); setError('');
    try {
      const sessionResult = await db.auth.getSession();
      const current = sessionResult?.data?.session || null;
      setSession(current);
      if (!current?.user?.id) { setSummary(null); return; }
      try { await db.rpc('claim_client_portal_account', {}); } catch { /* invite may not exist yet */ }
      const result = await db.rpc('get_my_portal_summary', {});
      if (result?.error) throw result.error;
      setSummary(result?.data || null);
    } catch (e) {
      setError(normaliseError(e, 'Unable to open your private client information. Public services remain available.'));
      setSummary(null);
    } finally { setBooting(false); }
  }, []);

  useEffect(() => { loadClient(); }, [loadClient]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) { setVoiceLabel('Voice playback is unavailable on this device'); return; }
    const choose = () => {
      const voices = window.speechSynthesis.getVoices();
      const za = voices.find((v) => String(v.lang).toLowerCase() === 'en-za') || voices.find((v) => String(v.lang).toLowerCase().startsWith('en-za'));
      voiceRef.current = za || voices.find((v) => String(v.lang).toLowerCase().startsWith('en-au')) || voices.find((v) => String(v.lang).toLowerCase().startsWith('en-gb')) || voices.find((v) => String(v.lang).toLowerCase().startsWith('en')) || null;
      setVoiceLabel(za ? `South African English · ${za.name}` : 'South African English requested · device fallback');
    };
    choose();
    window.speechSynthesis.onvoiceschanged = choose;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const speak = useCallback((text) => {
    if (!voiceOn || !text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-ZA';
    if (voiceRef.current) u.voice = voiceRef.current;
    u.rate = 0.94; u.pitch = 1.02;
    window.speechSynthesis.speak(u);
  }, [voiceOn]);

  function go(next, say = true) {
    setView(next); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' });
    const item = NAV.find(([id]) => id === next);
    if (say && item) speak(`Opening ${item[1]}.`);
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotice('Voice commands are not available in this browser. You can still use every button and Gigi voice playback.');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-ZA'; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onstart = () => { setListening(true); setNotice('Gigi is listening…'); };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); setNotice('I could not hear that clearly. Please try again or tap a menu item.'); };
    rec.onresult = (event) => {
      const phrase = event.results?.[0]?.[0]?.transcript?.toLowerCase() || '';
      const target = Object.entries(PAGE_ALIASES).find(([word]) => phrase.includes(word))?.[1];
      if (target) { setNotice(`Heard: “${phrase}”`); go(target); }
      else { setNotice(`Heard: “${phrase}”. I only use voice commands for navigation and clinic service tasks, so I won’t guess.`); speak('I heard you, but I will not guess. Please say a page such as appointments, telehealth, fees, contact, or resources.'); }
    };
    rec.start();
  }

  async function signOut() {
    await db.auth.signOut(); setSession(null); setSummary(null); setAuthOpen(false); setNotice('Signed out securely.'); go('home', false);
  }

  const displayName = summary?.preferredName || session?.user?.name?.split(' ')?.[0] || '';

  return <div className="app-shell">
    <TopBar displayName={displayName} session={session} onMenu={() => setMenuOpen(!menuOpen)} onProfile={() => session ? go('profile') : setAuthOpen(true)} />
    <div className="page-frame">
      <Sidebar view={view} go={go} open={menuOpen} session={session} onSignIn={() => setAuthOpen(true)} onSignOut={signOut} />
      <main className="content">
        <GigiHero displayName={displayName} voiceOn={voiceOn} setVoiceOn={setVoiceOn} listening={listening} startListening={startListening} voiceLabel={voiceLabel} speak={speak} />
        {(notice || error) && <div className={`global-notice ${error ? 'error' : ''}`}><span>{error || notice}</span><button onClick={() => { setNotice(''); setError(''); }}>×</button></div>}
        <PageBody view={view} go={go} session={session} summary={summary} booting={booting} onSignIn={() => setAuthOpen(true)} onReload={loadClient} setNotice={setNotice} />
        <IntegrityStrip go={go} />
      </main>
    </div>
    <MobileNav view={view} go={go} />
    {authOpen && <AuthModal mode={authMode} setMode={setAuthMode} onClose={() => setAuthOpen(false)} onReady={async () => { await loadClient(); setAuthOpen(false); setNotice('Signed in. If reception has already invited this email, your private client details are now linked.'); }} />}
  </div>;
}

function TopBar({ displayName, session, onMenu, onProfile }) {
  return <header className="topbar">
    <button className="menu-button" onClick={onMenu} aria-label="Open menu">☰</button>
    <div className="topbrand"><span className="brand-seal">MM</span><div><strong>Mood &amp; Mind</strong><small>Client Companion</small></div></div>
    <div className="top-actions"><span className="privacy-pill">Private by design</span><button className="profile-chip" onClick={onProfile}>{session ? (displayName ? displayName[0]?.toUpperCase() : '✓') : 'Sign in'}</button></div>
  </header>;
}

function Sidebar({ view, go, open, session, onSignIn, onSignOut }) {
  return <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="sidebar-title"><span>Client services</span><small>Everything in one calm place</small></div>
    <nav>{NAV.map(([id, label, icon]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => go(id)}><span>{icon}</span><b>{label}</b></button>)}</nav>
    <div className="sidebar-account">{session ? <button onClick={onSignOut}>Secure sign out</button> : <button onClick={onSignIn}>Sign in to private details</button>}<small>Gigi never stores therapy notes in this client companion.</small></div>
  </aside>;
}

function GigiHero({ displayName, voiceOn, setVoiceOn, listening, startListening, voiceLabel, speak }) {
  const greeting = new Date().getHours() < 12 ? 'Good morning' : (new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening');
  return <section className="gigi-hero">
    <div className="protea" aria-hidden="true"><i/><i/><i/><i/><i/></div>
    <div className="greeting"><small>{greeting}{displayName ? ',' : ''}</small><h1>{displayName || 'Welcome'} <span>♡</span></h1><p>Care organised. Details clear. You stay in control.</p></div>
    <div className="gigi-mark"><span className="crown">♛</span><div className="gigi-script">Gigi</div><small>Your Mood &amp; Mind Concierge</small><span className="za-mark">🇿🇦 South African voice</span></div>
    <div className="voice-console">
      <button className={`mic ${listening ? 'listening' : ''}`} onClick={startListening} aria-label="Speak with Gigi">🎙</button>
      <div className="wave" aria-hidden="true">▂▄▆▃▇▄▅▂▆▃▇▅▂</div>
      <div className="voice-copy"><b>Gigi Voice</b><small>{voiceLabel}</small></div>
      <button className={`voice-toggle ${voiceOn ? 'on' : ''}`} onClick={() => { setVoiceOn(!voiceOn); if (!voiceOn) setTimeout(() => speak('Gigi voice is on.'), 50); }}>{voiceOn ? 'ON' : 'OFF'}<span /></button>
    </div>
    <div className="tap-copy">Tap the microphone and say “appointments”, “telehealth”, “fees”, “contact” or another page.</div>
  </section>;
}

function PageBody({ view, go, session, summary, booting, onSignIn, onReload, setNotice }) {
  if (view === 'home') return <HomePage go={go} session={session} summary={summary} booting={booting} onSignIn={onSignIn} />;
  if (view === 'book') return <Page title="Book a Session" eyebrow="Appointments" intro="Go straight to Mood & Mind’s booking system without hunting for the right link."><ActionCard icon="◇" title="Open secure online booking" text="Choose an available appointment in Mood & Mind’s existing booking portal." action="Book a session" href={BOOKING_URL} primary/><InfoBox title="Prefer a person?">Reception can help with clinician matching, funding questions or a booking that needs extra care. <a href={PHONE_LINK}>Call {PHONE_DISPLAY}</a>.</InfoBox></Page>;
  if (view === 'appointments') return <Page title="My Appointments" eyebrow="Your schedule" intro="A private shortcut to what is known, with no invented appointment details.">{summary?.nextAppointment ? <FeatureCard title="Next appointment" value={dateTime(summary.nextAppointment)} meta={summary.primaryCentreName || 'Mood & Mind'} /> : <PrivateState session={session} onSignIn={onSignIn} title="No appointment is shown here yet" text="Your booking remains in Mood & Mind’s booking system. Gigi only displays a date when the clinic’s connected record supplies one." />}<div className="card-grid two"><ActionCard icon="↗" title="Manage through booking portal" text="View booking options in Mood & Mind’s existing client portal." action="Open booking portal" href={BOOKING_URL}/><ActionCard icon="◫" title="Telehealth access" text="Use the secure session link supplied by the clinic. Gigi does not invent meeting links." action="Telehealth guidance" onClick={() => go('telehealth')}/></div></Page>;
  if (view === 'psychologist') return <Page title="My Psychologist" eyebrow="Your clinician" intro="Keep the right clinician information close without placing clinical notes in the app.">{summary?.psychologistName ? <ClinicianCard name={summary.psychologistName} title={summary.psychologistTitle} centre={summary.primaryCentreName} /> : <PrivateState session={session} onSignIn={onSignIn} title="Your psychologist will appear after clinic linking" text="Gigi only names your clinician when that assignment is present in Mood & Mind’s approved client record." />}<ActionCard icon="♙" title="Meet the Mood & Mind team" text="Read official clinician profiles and areas of practice." action="View official team profiles" href={TEAM_URL}/></Page>;
  if (view === 'find') return <Page title="Find Us" eyebrow="Two Gold Coast clinics" intro="Clinic addresses, directions and one-tap navigation."><div className="card-grid two"><LocationCard name="Hope Island" address="Suite 8/8 Santa Barbara Road, Hope Island QLD 4212"/><LocationCard name="Upper Coomera" address="15/90 Days Road, Upper Coomera QLD 4209"/></div><InfoBox title="Before you leave">Check your appointment confirmation for the clinic location. If anything looks different, call reception before travelling.</InfoBox></Page>;
  if (view === 'telehealth') return <Page title="Telehealth" eyebrow="Online appointments" intro="One obvious place to prepare for an online session."><div className="card-grid two"><GuideCard number="01" title="Use the clinic-supplied link" text="Open the secure link or booking message Mood & Mind sent for your session."/><GuideCard number="02" title="Test your setup" text="Charge your device, check audio/video, and choose a private, stable space."/><GuideCard number="03" title="Join a little early" text="Allow a few minutes for permissions or connection checks."/><GuideCard number="04" title="If the link is missing" text="Contact reception. Gigi will never manufacture or guess a Telehealth URL."/></div><a className="gold-button" href={PHONE_LINK}>Call reception · {PHONE_DISPLAY}</a></Page>;
  if (view === 'resources') return <Page title="Resources" eyebrow="Psychologist-approved starting points" intro="Official material first. No algorithmic therapy advice and no random symptom content."><div className="card-grid three"><ActionCard icon="✦" title="Mood & Mind website" text="Practice information and psychologist-approved public material." action="Open website" href={WEBSITE_URL}/><ActionCard icon="?" title="Frequently asked questions" text="Common questions about appointments, referrals and the practice." action="Open FAQ" href={FAQ_URL}/><ActionCard icon="♙" title="Clinician profiles" text="Official Mood & Mind team information." action="View team" href={TEAM_URL}/></div><InfoBox title="Gigi’s resource rule">Resources are clearly separated from clinical care. Gigi does not diagnose, interpret symptoms or recommend treatment.</InfoBox></Page>;
  if (view === 'before') return <Page title="Before My Session" eyebrow="Arrive prepared, not overwhelmed" intro="A short practical checklist for appointments and first visits."><Checklist items={[['Appointment details','Check the time, clinic or Telehealth format in your confirmation.'],['Referral or plan','Bring any referral, Mental Health Care Plan, NDIS or insurer details that apply to your appointment.'],['Forms','Complete only forms Mood & Mind has asked you to complete.'],['Payment or funding','Have the relevant Medicare, NDIS, WorkCover, QPS, insurer or private-payment information available.'],['Questions','You can jot down practical questions you want to ask. Gigi does not ask you to store therapy content here.']]}/></Page>;
  if (view === 'fees') return <Page title="Fees & Funding" eyebrow="Clear financial pathways" intro="Start with Mood & Mind’s official information and let reception confirm what applies to you."><FundingChips/><div className="card-grid two"><ActionCard icon="$" title="Official fees information" text="View current Mood & Mind fee and rebate information." action="View fees" href={FEES_URL} primary/><ActionCard icon="✉" title="Ask reception" text="Confirm the correct funding pathway before relying on an estimate." action="Email reception" href={EMAIL_LINK}/></div><InfoBox title="Integrity first">Gigi does not promise a Medicare rebate, NDIS coverage, insurer payment or out-of-pocket amount. Eligibility and fees must be confirmed against current clinic and funder information.</InfoBox></Page>;
  if (view === 'forms') return <Page title="Forms & Documents" eyebrow="Secure documents" intro="A controlled doorway for client forms — not an open file dump."><div className="document-panel"><div className="doc-icon">▤</div><div><h3>Client-specific documents</h3><p>Only clinic-approved forms should be made available to a signed-in client. Gigi does not expose another client’s documents or create clinical forms on the fly.</p></div></div><div className="card-grid two"><ActionCard icon="✉" title="Request a form" text="Ask reception if you cannot find a form you were told to complete." action="Email reception" href={EMAIL_LINK}/><ActionCard icon="✓" title="First-session preparation" text="See the non-clinical preparation checklist." action="Before my session" onClick={() => go('before')}/></div></Page>;
  if (view === 'contact') return <Page title="Contact Mood & Mind" eyebrow="Reception" intro="Human help stays one tap away."><div className="contact-board"><a href={PHONE_LINK}><small>Phone</small><strong>{PHONE_DISPLAY}</strong><span>Tap to call</span></a><a href={EMAIL_LINK}><small>Email</small><strong>{EMAIL}</strong><span>Tap to email</span></a><a href={WEBSITE_URL} target="_blank" rel="noreferrer"><small>Website</small><strong>Mood &amp; Mind Centre</strong><span>Open official site</span></a></div><InfoBox title="Opening hours">Current public clinic information lists Monday–Friday 8:00am–6:00pm and Saturday 9:00am–2:00pm. Public holiday hours or temporary changes should be checked with reception.</InfoBox></Page>;
  if (view === 'help') return <HelpPage/>;
  if (view === 'profile') return <ProfilePage session={session} summary={summary} onSignIn={onSignIn} onSaved={onReload} setNotice={setNotice}/>;
  if (view === 'notifications') return <Page title="Notifications" eyebrow="Only what matters" intro="A calm notification centre designed to avoid noise and protect privacy."><div className="card-grid three"><MiniPolicy title="Appointments" text="Reminders only when the clinic’s connected booking workflow supplies them."/><MiniPolicy title="Practice updates" text="Useful operational changes, not marketing clutter."/><MiniPolicy title="Resources" text="Opt-in only where appropriate; no sensitive detail on lock screens by default."/></div><InfoBox title="Privacy rule">Notification previews should never expose therapy content, diagnoses, sensitive appointment reasons or private funding details.</InfoBox></Page>;
  return null;
}

function HomePage({ go, session, summary, booting, onSignIn }) {
  const next = dateTime(summary?.nextAppointment);
  return <section className="page-section home-page">
    <div className="section-heading"><div><span className="eyebrow">Today with Gigi</span><h2>Everything you need, beautifully organised.</h2></div><button className="outline-button" onClick={() => go('book')}>Book a session</button></div>
    <div className="status-grid">
      <StatusCard label="Next appointment" value={booting ? 'Checking…' : next || 'Not shown'} detail={next ? (summary?.primaryCentreName || 'Mood & Mind') : 'Open appointments to manage'} onClick={() => go('appointments')}/>
      <StatusCard label="My psychologist" value={summary?.psychologistName || (session ? 'Not linked' : 'Sign in')} detail={summary?.psychologistTitle || 'Private client detail'} onClick={() => summary?.psychologistName ? go('psychologist') : (session ? go('psychologist') : onSignIn())}/>
      <StatusCard label="Clinic" value={summary?.primaryCentreName || '2 locations'} detail="Hope Island · Upper Coomera" onClick={() => go('find')}/>
      <StatusCard label="Gigi standard" value="Verified first" detail="No guessing with care or bookings" onClick={() => go('resources')}/>
    </div>
    <div className="home-layout">
      <div className="priority-card"><div className="priority-top"><span>MY QUICK PATH</span><b>Choose what you need now</b></div><div className="quick-grid">{[['book','Book a session','◇'],['appointments','My appointments','▦'],['telehealth','Telehealth','◫'],['before','Prepare for session','✓'],['fees','Fees & funding','$'],['contact','Contact reception','✉']].map(([id,label,icon]) => <button key={id} onClick={() => go(id)}><span>{icon}</span><b>{label}</b><small>Open</small></button>)}</div><blockquote>“Clear information. Calm access. Human care stays human.” <em>— Gigi</em></blockquote></div>
      <div className="attention-stack"><div className="attention-card"><span className="eyebrow dark">WHAT NEEDS MY ATTENTION?</span>{!session && <AttentionRow icon="○" title="Private details" text="Sign in if reception has invited your email" onClick={onSignIn}/>}<AttentionRow icon="✓" title="Before your session" text="A five-point practical checklist" onClick={() => go('before')}/><AttentionRow icon="!" title="Need help now?" text="Urgent help is kept separate and obvious" onClick={() => go('help')}/></div><div className="quote-card"><span>♛</span><p>You don’t have to remember every link. Gigi keeps the practical pieces together.</p></div></div>
    </div>
  </section>;
}

function Page({ title, eyebrow, intro, children }) { return <section className="page-section"><div className="section-heading page-title"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{intro}</p></div></div>{children}</section>; }
function StatusCard({ label, value, detail, onClick }) { return <button className="status-card" onClick={onClick}><span className="status-dot"/><small>{label}</small><strong>{value}</strong><p>{detail}</p></button>; }
function FeatureCard({ title, value, meta }) { return <div className="feature-card"><span className="feature-icon">▦</span><div><small>{title}</small><strong>{value}</strong><p>{meta}</p></div></div>; }
function ClinicianCard({ name, title, centre }) { return <div className="clinician-card"><div className="clinician-monogram">{name?.split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div><small>Your linked psychologist</small><h3>{name}</h3><p>{title || 'Mood & Mind clinician'}{centre ? ` · ${centre}` : ''}</p></div></div>; }
function ActionCard({ icon, title, text, action, href, onClick, primary }) { const content = <><span className="action-icon">{icon}</span><div><h3>{title}</h3><p>{text}</p><b>{action} <span>→</span></b></div></>; return href ? <a className={`action-card ${primary?'primary':''}`} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{content}</a> : <button className={`action-card ${primary?'primary':''}`} onClick={onClick}>{content}</button>; }
function InfoBox({ title, children }) { return <div className="info-box"><span>i</span><div><b>{title}</b><p>{children}</p></div></div>; }
function PrivateState({ session, onSignIn, title, text }) { return <div className="private-state"><span>♙</span><div><h3>{title}</h3><p>{text}</p>{!session && <button className="gold-button" onClick={onSignIn}>Secure client sign in</button>}</div></div>; }
function LocationCard({ name, address }) { const maps=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`; return <a className="location-card" href={maps} target="_blank" rel="noreferrer"><span>⌖</span><div><small>Mood &amp; Mind</small><h3>{name}</h3><p>{address}</p><b>Open directions →</b></div></a>; }
function GuideCard({ number, title, text }) { return <div className="guide-card"><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></div>; }
function Checklist({ items }) { return <div className="checklist">{items.map(([title,text],i)=><div key={title}><span>{String(i+1).padStart(2,'0')}</span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div>; }
function FundingChips() { return <div className="funding-chips">{['Medicare','NDIS','WorkCover','QPS','Private Health','Insurance','Private Payment'].map(x=><span key={x}>{x}</span>)}</div>; }
function MiniPolicy({ title, text }) { return <div className="mini-policy"><span>✓</span><h3>{title}</h3><p>{text}</p></div>; }
function AttentionRow({ icon, title, text, onClick }) { return <button onClick={onClick}><span>{icon}</span><div><b>{title}</b><small>{text}</small></div><em>›</em></button>; }

function HelpPage() {
  return <Page title="Help Now" eyebrow="Urgent support" intro="Urgent help is deliberately separate from routine practice information.">
    <div className="urgent-card"><span>!</span><div><h3>If there is immediate danger or a life-threatening emergency</h3><p>Call Triple Zero (000) now.</p><a href="tel:000">Call 000</a></div></div>
    <div className="card-grid two"><a className="help-card" href="tel:+61131114"><small>24/7 crisis support</small><h3>Lifeline · 13 11 14</h3><p>Phone support in Australia.</p></a><a className="help-card" href="sms:+61477131114"><small>Text support</small><h3>Lifeline · 0477 13 11 14</h3><p>SMS crisis support.</p></a></div>
    <InfoBox title="What Gigi does here">Gigi does not conduct risk assessment, provide emergency counselling, replace a psychologist or decide whether a situation is “serious enough”. When urgent help may be needed, Gigi routes to human emergency and crisis services.</InfoBox>
  </Page>;
}

function ProfilePage({ session, summary, onSignIn, onSaved, setNotice }) {
  const [form,setForm]=useState({preferredName:'',communication:'',accessibility:'',share:false});
  const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  useEffect(()=>{setForm({preferredName:summary?.preferredName||'',communication:summary?.communicationPreferences||'',accessibility:summary?.accessibilityPreferences||'',share:Boolean(summary?.shareWithClinician)});},[summary]);
  if(!session) return <Page title="My Profile" eyebrow="Private preferences" intro="Your service preferences are available only after secure sign in."><PrivateState session={session} onSignIn={onSignIn} title="Sign in to your client profile" text="Use the same email Mood & Mind reception has invited for portal access."/></Page>;
  if(!summary) return <Page title="My Profile" eyebrow="Private preferences" intro="Your account is signed in, but it is not yet linked to a client invitation."><PrivateState session={session} onSignIn={onSignIn} title="Reception linking is still required" text="For safety, Gigi will not search for clients by name or guess which record belongs to you. Contact reception if you expected access."/></Page>;
  async function save(e){e.preventDefault();setBusy(true);setError('');try{const result=await db.rpc('save_my_portal_preferences',{p_preferred_name:form.preferredName,p_communication_preferences:form.communication,p_accessibility_preferences:form.accessibility,p_share_with_clinician:form.share});if(result?.error)throw result.error;setNotice('Your preferences were saved securely.');await onSaved();}catch(err){setError(normaliseError(err));}finally{setBusy(false);}}
  return <Page title="My Profile" eyebrow="Private preferences" intro="Store practical communication and accessibility preferences — not therapy notes."><form className="profile-form" onSubmit={save}><label><span>Preferred name</span><input value={form.preferredName} onChange={e=>setForm({...form,preferredName:e.target.value})} placeholder="How would you like us to address you?"/></label><label><span>Communication preferences</span><textarea rows="3" value={form.communication} onChange={e=>setForm({...form,communication:e.target.value})} placeholder="For example: email preferred for routine admin"/></label><label><span>Accessibility preferences</span><textarea rows="3" value={form.accessibility} onChange={e=>setForm({...form,accessibility:e.target.value})} placeholder="Practical accessibility or communication adjustments"/></label><label className="check-row"><input type="checkbox" checked={form.share} onChange={e=>setForm({...form,share:e.target.checked})}/><span><b>Share these service preferences with my clinician</b><small>This setting applies to the preferences above. Do not enter therapy notes or crisis information here.</small></span></label>{error&&<div className="form-error">{error}</div>}<button className="gold-button" disabled={busy}>{busy?'Saving…':'Save my preferences'}</button></form></Page>;
}

function AuthModal({ mode, setMode, onClose, onReady }) {
  const [form,setForm]=useState({name:'',email:'',password:'',otp:''}); const [pendingEmail,setPendingEmail]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [message,setMessage]=useState('');
  async function submit(e){e.preventDefault();setBusy(true);setError('');setMessage('');try{if(mode==='signin'){const r=await db.auth.signIn.email({email:form.email.trim(),password:form.password});if(r?.error)throw r.error;await onReady();}else if(mode==='signup'){const email=form.email.trim().toLowerCase();const r=await db.auth.signUp.email({name:form.name.trim(),email,password:form.password});if(r?.error)throw r.error;setPendingEmail(email);setMode('verify');setMessage('Account created. Enter the verification code sent to your email.');}else{const r=await db.auth.emailOtp.verifyEmail({email:pendingEmail,otp:form.otp.trim()});if(r?.error)throw r.error;setMessage('Email verified. You can now sign in.');setMode('signin');}}catch(err){setError(normaliseError(err));}finally{setBusy(false);}}
  return <div className="modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose();}}><section className="auth-modal"><button className="modal-close" onClick={onClose}>×</button><div className="auth-brand"><span>♛</span><div className="gigi-script small">Gigi</div><small>Secure client access</small></div><h2>{mode==='signin'?'Client sign in':mode==='signup'?'Create client account':'Verify your email'}</h2><p className="auth-explain">Private details link only when your email matches an invitation created by Mood & Mind reception. Gigi will not guess a client identity.</p>{message&&<div className="form-success">{message}</div>}{error&&<div className="form-error">{error}</div>}<form onSubmit={submit} className="auth-form">{mode==='signup'&&<label><span>Your name</span><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}{mode!=='verify'&&<label><span>Email</span><input required type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>}{mode!=='verify'&&<label><span>Password</span><input required minLength="10" type="password" autoComplete={mode==='signin'?'current-password':'new-password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><small>Use at least 10 characters.</small></label>}{mode==='verify'&&<label><span>Verification code</span><input required inputMode="numeric" autoComplete="one-time-code" value={form.otp} onChange={e=>setForm({...form,otp:e.target.value})}/></label>}<button className="gold-button full" disabled={busy}>{busy?'Please wait…':mode==='signin'?'Sign in securely':mode==='signup'?'Create account':'Verify email'}</button></form>{mode!=='verify'&&<button className="auth-switch" onClick={()=>setMode(mode==='signin'?'signup':'signin')}>{mode==='signin'?'First time? Create your client account':'Already have an account? Sign in'}</button>}<small className="auth-foot">Creating an account does not create a clinical record. Reception invitation is required before private client data can be shown.</small></section></div>;
}

function IntegrityStrip({ go }) { return <section className="integrity-strip"><div className="integrity-seal">♛</div><div><b>Gigi Professional Standard</b><p>Verified information · minimum necessary data · no diagnosis · no invented bookings · no therapy notes · human escalation when it matters.</p></div><button onClick={()=>go('help')}>Help now</button></section>; }
function MobileNav({ view, go }) { const items=[['home','⌂','Home'],['appointments','▦','Appointments'],['book','◇','Book'],['contact','✉','Contact'],['help','!','Help']];return <nav className="mobile-nav">{items.map(([id,icon,label])=><button key={id} className={view===id?'active':''} onClick={()=>go(id,false)}><span>{icon}</span><small>{label}</small></button>)}</nav>; }

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
