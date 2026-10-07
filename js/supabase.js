// Get the Supabase client from the CDN.
const { createClient } = window.supabase;

// Your Supabase project URL.
const SUPABASE_URL = "https://hferjedaeuyztarmpixu.supabase.co";

// Your browser-safe publishable key.
const SUPABASE_KEY = "sb_publishable_eCQMD2xWLwzVp49TSg4sQQ_kkurpceQ";

// Create the Supabase client.
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
