import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let client = { supabaseUrl: null }

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your .env file.')
} else {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey)
  } catch (err) {
    console.error('Failed to initialize Supabase client. Check if your URL and Key are correct.', err)
  }
}

export const supabase = client
