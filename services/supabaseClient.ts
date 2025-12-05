import { createClient } from '@supabase/supabase-js';

// ЗАМЕНИТЕ ЭТИ ЗНАЧЕНИЯ НА ВАШИ ИЗPABASE DASHBOARD
export const SUPABASE_URL = 'https://rbycgxevlfjpmuqfoucf.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJieWNneGV2bGZqcG11cWZvdWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4OTYwODYsImV4cCI6MjA4MDQ3MjA4Nn0.pJzi9hMpZGED_PJ0zI4YB8g_MRFX0-Ig5eyBl60_4PQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);