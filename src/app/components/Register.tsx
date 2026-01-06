import { BookOpen, Mail, Lock, Eye, EyeOff, X, UserPlus, User, GraduationCap, Building2 } from 'lucide-react';
import { useState } from 'react';
// Pastikan path ini benar mengarah ke file api.ts atau authService.ts yang kita buat sebelumnya
import { authService } from '../services/api'; 
// Jika file data ini ada, biarkan. Jika error, kamu bisa hardcode array di dalam komponen sementara.
import { getProdiList, getFacultyList, getProdiByFaculty } from '../data/allCoursesData';

interface RegisterProps {
  onClose: () => void;
  // onRegisterSuccess tidak lagi butuh data user lengkap disini, cukup trigger visual
  onRegisterSuccess: () => void; 
  onSwitchToLogin: () => void;
}

export default function Register({ onClose, onRegisterSuccess, onSwitchToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    faculty: '',
    prodi: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State untuk error spesifik per field atau error umum dari backend
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [backendError, setBackendError] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);

  // --- DATA FAKULTAS & PRODI ---
  // Pastikan fungsi ini return array string. Jika file ../data/allCoursesData belum ada,
  // kamu bisa ganti manual seperti: const availableFaculties = ["Teknik", "Hukum", ...];
  const availableFaculties = getFacultyList ? getFacultyList() : [];
  const availableProdi = formData.faculty && getProdiByFaculty 
    ? getProdiByFaculty(formData.faculty)
    : [];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate full name
    if (!formData.fullName.trim()) newErrors.fullName = 'Nama lengkap harus diisi';
    else if (formData.fullName.trim().length < 3) newErrors.fullName = 'Nama lengkap minimal 3 karakter';

    // Validate email
    if (!formData.email) newErrors.email = 'Email harus diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Format email tidak valid';

    // Validate faculty & prodi
    if (!formData.faculty) newErrors.faculty = 'Fakultas harus dipilih';
    if (!formData.prodi) newErrors.prodi = 'Program studi harus dipilih';

    // Validate password
    if (!formData.password) newErrors.password = 'Kata sandi harus diisi';
    else if (formData.password.length < 6) newErrors.password = 'Kata sandi minimal 6 karakter';
    // Opsional: Regex huruf besar kecil bisa dimatikan dulu untuk mempermudah testing
    // else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) newErrors.password = 'Harus ada huruf besar & kecil';

    // Validate confirm password
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Kata sandi tidak cocok';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'faculty') newData.prodi = ''; // Reset prodi jika ganti fakultas
      return newData;
    });
    
    // Hapus error saat user mengetik
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (backendError) setBackendError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // --- INTEGRASI SUPABASE DISINI ---
      // Kita panggil service yang sudah dibuat sebelumnya
      await authService.signUp(
        formData.email, 
        formData.password, 
        {
            fullName: formData.fullName,
            faculty: formData.faculty,
            prodi: formData.prodi
        }
      );

      // Jika berhasil:
      alert('Registrasi Berhasil! Silakan cek email (jika perlu) atau langsung Login.');
      onRegisterSuccess();
      onClose();
      onSwitchToLogin(); // Langsung arahkan ke login agar UX lebih mulus

    } catch (error: any) {
      console.error("Register Error:", error);
      // Tampilkan pesan error dari Supabase (misal: Email already registered)
      setBackendError(error.message || 'Terjadi kesalahan saat mendaftar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto py-8 font-mono">
      {/* Modal */}
      <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl mx-4 animate-in zoom-in-95 duration-300 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-[#EA4335] border-2 border-black flex items-center justify-center transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Header */}
        <div className="pt-12 pb-8 px-8 text-center bg-[#4285F4] border-b-2 border-black">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white border-2 border-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <UserPlus className="w-8 h-8 text-black" />
          </div>

          <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight text-stroke-black">
            Buat Akun Baru
          </h2>
          <p className="text-white font-bold">
            Bergabung dengan ribuan mahasiswa lainnya
          </p>
        </div>

        {/* Error Umum dari Backend */}
        {backendError && (
            <div className="mx-8 mt-6 bg-red-100 border-2 border-[#EA4335] text-[#EA4335] p-3 font-bold text-center">
                ⚠️ {backendError}
            </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
          {/* Grid Layout for Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label htmlFor="fullName" className="block text-sm font-black text-black mb-2 uppercase">
                Nama Lengkap <span className="text-[#EA4335]">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center border-r-2 border-black bg-gray-100 z-10 pointer-events-none">
                  <User className="w-5 h-5 text-black" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Masukkan nama lengkap..."
                  className={`w-full pl-14 pr-4 py-3 border-2 ${
                    errors.fullName ? 'border-[#EA4335] bg-red-50' : 'border-black'
                  } focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold placeholder:text-gray-400 placeholder:font-normal`}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-[#EA4335] font-bold bg-[#EA4335]/10 p-1 border-l-2 border-[#EA4335]">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-sm font-black text-black mb-2 uppercase">
                Email <span className="text-[#EA4335]">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center border-r-2 border-black bg-gray-100 z-10 pointer-events-none">
                  <Mail className="w-5 h-5 text-black" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="nama@email.com"
                  className={`w-full pl-14 pr-4 py-3 border-2 ${
                    errors.email ? 'border-[#EA4335] bg-red-50' : 'border-black'
                  } focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold placeholder:text-gray-400 placeholder:font-normal`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-[#EA4335] font-bold bg-[#EA4335]/10 p-1 border-l-2 border-[#EA4335]">{errors.email}</p>
              )}
            </div>

            {/* Faculty */}
            <div className="md:col-span-2">
              <label htmlFor="faculty" className="block text-sm font-black text-black mb-2 uppercase">
                Fakultas <span className="text-[#EA4335]">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center border-r-2 border-black bg-gray-100 z-10 pointer-events-none">
                  <Building2 className="w-5 h-5 text-black" />
                </div>
                <select
                  id="faculty"
                  value={formData.faculty}
                  onChange={(e) => handleChange('faculty', e.target.value)}
                  className={`w-full pl-14 pr-4 py-3 border-2 ${
                    errors.faculty ? 'border-[#EA4335] bg-red-50' : 'border-black'
                  } focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all appearance-none bg-white cursor-pointer font-bold`}
                >
                  <option value="">Pilih fakultas...</option>
                  {/* Mapping data fakultas */}
                  {availableFaculties.map((faculty) => (
                    <option key={faculty} value={faculty}>
                      {faculty}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black border-l-2 border-black bg-[#34A853]">
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.faculty && (
                <p className="mt-1 text-sm text-[#EA4335] font-bold bg-[#EA4335]/10 p-1 border-l-2 border-[#EA4335]">{errors.faculty}</p>
              )}
            </div>

            {/* Prodi */}
            <div className="md:col-span-2">
              <label htmlFor="prodi" className="block text-sm font-black text-black mb-2 uppercase">
                Program Studi <span className="text-[#EA4335]">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center border-r-2 border-black bg-gray-100 z-10 pointer-events-none">
                  <GraduationCap className="w-5 h-5 text-black" />
                </div>
                <select
                  id="prodi"
                  value={formData.prodi}
                  onChange={(e) => handleChange('prodi', e.target.value)}
                  disabled={!formData.faculty} // Disable jika fakultas belum dipilih
                  className={`w-full pl-14 pr-4 py-3 border-2 ${
                    errors.prodi ? 'border-[#EA4335] bg-red-50' : 'border-black'
                  } focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all appearance-none bg-white cursor-pointer font-bold disabled:bg-gray-200 disabled:cursor-not-allowed`}
                >
                  <option value="">Pilih program studi...</option>
                  {availableProdi.map((prodi) => (
                    <option key={prodi} value={prodi}>
                      {prodi}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black border-l-2 border-black bg-[#34A853]">
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.prodi && (
                <p className="mt-1 text-sm text-[#EA4335] font-bold bg-[#EA4335]/10 p-1 border-l-2 border-[#EA4335]">{errors.prodi}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-black text-black mb-2 uppercase">
                Kata Sandi <span className="text-[#EA4335]">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center border-r-2 border-black bg-gray-100 z-10 pointer-events-none">
                  <Lock className="w-5 h-5 text-black" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Min. 6 karakter"
                  className={`w-full pl-14 pr-12 py-3 border-2 ${
                    errors.password ? 'border-[#EA4335] bg-red-50' : 'border-black'
                  } focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold placeholder:text-gray-400 placeholder:font-normal`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-[#4285F4] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-[#EA4335] font-bold bg-[#EA4335]/10 p-1 border-l-2 border-[#EA4335]">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-black text-black mb-2 uppercase">
                Konfirmasi Kata Sandi <span className="text-[#EA4335]">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center border-r-2 border-black bg-gray-100 z-10 pointer-events-none">
                  <Lock className="w-5 h-5 text-black" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className={`w-full pl-14 pr-12 py-3 border-2 ${
                    errors.confirmPassword ? 'border-[#EA4335] bg-red-50' : 'border-black'
                  } focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold placeholder:text-gray-400 placeholder:font-normal`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-[#4285F4] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-[#EA4335] font-bold bg-[#EA4335]/10 p-1 border-l-2 border-[#EA4335]">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-[#4285F4]/10 border-2 border-[#4285F4] p-4 border-dashed">
            <p className="text-sm text-black font-bold">
              Dengan mendaftar, Anda menyetujui{' '}
              <a href="#" className="text-[#4285F4] hover:underline decoration-2">
                Syarat & Ketentuan
              </a>{' '}
              serta{' '}
              <a href="#" className="text-[#4285F4] hover:underline decoration-2">
                Kebijakan Privasi
              </a>{' '}
              UniNotes.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#34A853] text-white font-black uppercase tracking-wider py-4 px-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Mendaftar...
              </span>
            ) : (
              'Daftar Sekarang'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="bg-gray-100 px-8 py-6 text-center border-t-2 border-black">
          <p className="text-black font-bold">
            Sudah punya akun?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-[#4285F4] hover:underline decoration-2 font-black uppercase"
            >
              Masuk di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}