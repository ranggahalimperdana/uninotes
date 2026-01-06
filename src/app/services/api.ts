import { supabase } from './supabase';

// ==========================================
// 1. TYPE DEFINITIONS
// ==========================================

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  faculty: string;
  prodi: string;
  role: 'user' | 'admin' | 'super_admin'; 
  avatar_url?: string; // Tambahan untuk foto profil
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  course_code: string;
  file_url: string;
  uploaded_by: string;
  created_at: string;
  // ...tambahkan field lain sesuai kebutuhan
}

// ==========================================
// 2. AUTH SERVICE (Login, Register, Profile, OTP)
// ==========================================

export const authService = {
  // Register User Baru
  signUp: async (email: string, password: string, userData: { fullName: string, faculty: string, prodi: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.fullName,
          faculty: userData.faculty,
          prodi: userData.prodi,
          role: 'user' 
        }
      }
    });

    if (error) throw error;
    return data;
  },

  // Login
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Logout
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Ambil User yang sedang login beserta Role-nya
  getCurrentUserWithRole: async (): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) return null;
    return data as Profile;
  },

  // --- FITUR LUPA PASSWORD (OTP EMAIL) ---

  sendPasswordResetOtp: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: false, 
      }
    });
    if (error) throw error;
  },

  verifyPasswordResetOtp: async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;
    return data;
  },

  updateUserPassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  },

  // --- FITUR UPDATE PROFIL & FOTO ---

  // Upload Avatar ke Storage
  uploadAvatar: async (file: File, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload ke bucket 'avatars' (Pastikan bucket ini sudah dibuat di Supabase)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Ambil Public URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // Update Data Profil di Database
  updateUserProfile: async (userId: string, updates: { full_name?: string, avatar_url?: string }) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ==========================================
// 3. ADMIN & SUPER ADMIN SERVICE
// ==========================================

export const adminService = {
  
  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: true }); 
    
    if (error) throw error;
    return data as Profile[];
  },

  changeUserRole: async (targetUserId: string, newRole: 'user' | 'admin') => {
    const currentUser = await authService.getCurrentUserWithRole();
    if (!currentUser) throw new Error("User tidak ditemukan.");

    if (currentUser.id === targetUserId) {
        throw new Error("AKSES DITOLAK: Anda tidak dapat mengubah status akun sendiri.");
    }

    const { data: targetUser, error: targetError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetUser) throw new Error("Target user tidak ditemukan.");

    if (targetUser.role === 'super_admin') {
       throw new Error("AKSES DITOLAK: Anda tidak dapat mengubah status Super Admin.");
    }

    if (currentUser.role === 'admin') {
       if (newRole === 'super_admin' as any) {
          throw new Error("AKSES DITOLAK: Admin tidak bisa mengangkat Super Admin.");
       }
    }
    
    if (currentUser.role === 'user') {
       throw new Error("AKSES DITOLAK: Anda tidak memiliki izin.");
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId);

    if (error) throw error;
    return { success: true, message: `Role user berhasil diubah menjadi ${newRole}` };
  },

  getAllPosts: async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*') 
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as any[]; 
  },

  deletePost: async (postId: string) => {
    const currentUser = await authService.getCurrentUserWithRole();

    if (currentUser?.role === 'user') {
        throw new Error("AKSES DITOLAK: Anda tidak memiliki izin Admin.");
    }

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  }
};