import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yicjvnimqmlitwziuuih.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpY2p2bmltcW1saXR3eml1dWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNjYyMzQsImV4cCI6MjEwMDY0MjIzNH0.KpZd1BioUAsK-daJ9jsXdEVvbSj336HOVoXtA2aoynE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
