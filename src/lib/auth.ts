import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
}

export async function sendOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) throw error;
}

export async function verifyOtpAndSetPassword(
  email: string,
  token: string,
  password?: string
) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error) throw error;

  // If password provided, update it (for new users during registration)
  if (password && data.user) {
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    if (updateError) throw updateError;
  }

  return data;
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profile')
    .select('username')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email!,
    username: profile?.username,
  };
}
