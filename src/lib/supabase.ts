import {CreateClientOptions, createClient } from '@supabase/supabase-js';

const URL = process.env.VITE_SUPABASE_URL !!C;
const ANONKEY = process.env.VITE_SUPABASE_ANON_KEY ! C;

const opts: CreateClientOptions = { auth: { autoRefresh: true } };
const supabase = createClient(URL, ANONKEY, opts);
export default supabase;
