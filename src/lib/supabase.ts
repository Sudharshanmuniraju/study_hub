import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
};

export type Subject = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  content: string;
  slide_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Assignment = {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  status: 'todo' | 'in_progress' | 'submitted';
  due_date: string | null;
  created_at: string;
};

export type Todo = {
  id: string;
  user_id: string;
  task: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
};

export type Exam = {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  exam_date: string;
  created_at: string;
};

export type ResourceLink = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  url: string;
  created_at: string;
};

export type ChatRole = 'user' | 'assistant';
export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};
