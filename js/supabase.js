// Import the Supabase client from the CDN.
const { createClient } = supabase;

// Your Supabase project URL.
const SUPABASE_URL = "https://jyjkhwgqldfamuqfysap.supabase.co";

// Your browser-safe publishable/anon key.
const SUPABASE_KEY = "sb_publishable_1uooGaflu3YFVNyhXc331A_umAVkrHM";

// Create the Supabase client.
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
