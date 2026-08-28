import { createClient, BetterAuthVanillaAdapter } from '@neondatabase/neon-js';

export const AUTH_URL = 'https://ep-gentle-water-ay5qyu2l.neonauth.c-5.us-east-2.aws.neon.tech/neondb/auth';
export const DATA_API_URL = 'https://ep-gentle-water-ay5qyu2l.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1';

export const neon = createClient({
  auth: {
    adapter: BetterAuthVanillaAdapter(),
    url: AUTH_URL,
  },
  dataApi: {
    url: DATA_API_URL,
  },
});

export async function getCurrentSession() {
  const result = await neon.auth.getSession();
  if (result?.error) throw result.error;
  return result?.data || null;
}

export async function signInWithEmail(email, password) {
  const result = await neon.auth.signIn.email({ email, password });
  if (result?.error) throw result.error;
  return result?.data || null;
}

export async function signUpWithEmail(name, email, password) {
  const result = await neon.auth.signUp.email({ name, email, password });
  if (result?.error) throw result.error;
  return result?.data || null;
}

export async function signOut() {
  const result = await neon.auth.signOut();
  if (result?.error) throw result.error;
}

export async function listWellbeingEntries() {
  const { data, error } = await neon
    .from('client_wellbeing_entries')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createWellbeingEntry(entryType, payload, sharedWithClinician = false) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Please sign in first.');
  const { data, error } = await neon
    .from('client_wellbeing_entries')
    .insert({
      user_id: userId,
      entry_type: entryType,
      payload,
      shared_with_clinician: sharedWithClinician,
    })
    .select();
  if (error) throw error;
  return data?.[0] || null;
}

export async function saveSafetyPlan(plan) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Please sign in first.');
  const { data, error } = await neon
    .from('client_safety_plans')
    .upsert({ user_id: userId, ...plan, updated_at: new Date().toISOString() })
    .select();
  if (error) throw error;
  return data?.[0] || null;
}

export async function loadSafetyPlan() {
  const { data, error } = await neon
    .from('client_safety_plans')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function recordSafetyEvent(eventType, destination = null) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return null;
  const { data, error } = await neon
    .from('client_safety_events')
    .insert({ user_id: userId, event_type: eventType, destination })
    .select();
  if (error) throw error;
  return data?.[0] || null;
}
