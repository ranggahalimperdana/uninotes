import { ArrowLeft, Upload, FileText, Image as ImageIcon, X, Calendar, Trash2, Check, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSemestersByProdi, getCoursesBySemester, getFacultyByProdi } from '../data/allCoursesData';
// Import Service Baru
import { notesService, Note } from '../services/notesService';
import { authService } from '../services/api';

interface UploadNotesProps {
  onBack: () => void;
  userName: string;
  userEmail?: string;
  userFaculty?: string;
  userProdi?: string;
}

export default function UploadNotes({ onBack, userName, userFaculty, userProdi }: UploadNotesProps) {
  // State untuk menyimpan catatan yang diambil dari Database
  const [userNotes, setUserNotes] = useState<Note[]>([]);
  
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [isUploading, setIsUploading] = useState(false); // Loading state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null); // State untuk mode edit

  // Form states
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [noteType, setNoteType] = useState<'PDF' | 'IMG'>('PDF');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>(''); // Hanya untuk preview lokal IMG

  // Get dynamic data based on user's prodi
  const availableSemesters = userProdi ? getSemestersByProdi(userProdi) : [];
  const availableCoursesData = userProdi && selectedSemester 
    ? getCoursesBySemester(userProdi, selectedSemester) 
    : [];
  const userFacultyAuto = userProdi ? getFacultyByProdi(userProdi) : userFaculty;

  // Transform courses data
  const availableCourses = availableCoursesData.map(course => ({
    code: course.kode,
    title: course.nama
  }));

  // --- LOAD NOTES DARI SUPABASE ---
  const fetchMyNotes = async () => {
    try {
        const user = await authService.getCurrentUserWithRole();
        if (user) {
            const notes = await notesService.getNotes({ uploaded_by: user.id });
            setUserNotes(notes);
        }
    } catch (error) {
        console.error("Gagal memuat catatan:", error);
    }
  };

  useEffect(() => {
    fetchMyNotes();
  }, []);

  const showNotif = (message: string, type: 'success' | 'error' = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = noteType === 'PDF' 
        ? ['application/pdf']
        : ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      
      if (!validTypes.includes(file.type)) {
        showNotif(`Hanya file ${noteType} yang diperbolehkan`, 'error');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showNotif('Ukuran file maksimal 10MB', 'error');
        return;
      }

      setSelectedFile(file);

      // Create preview for IMG only (PDF preview not needed for upload UI)
      if (noteType === 'IMG') {
          const reader = new FileReader();
          reader.onloadend = () => {
            setFilePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
      } else {
          setFilePreview('');
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // --- SUBMIT KE SUPABASE (CREATE & UPDATE) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSemester) return showNotif('Pilih semester terlebih dahulu', 'error');
    if (!selectedCourse) return showNotif('Pilih mata kuliah terlebih dahulu', 'error');
    if (!noteTitle.trim()) return showNotif('Judul catatan harus diisi', 'error');
    if (!noteDescription.trim()) return showNotif('Deskripsi catatan harus diisi', 'error');
    
    // Validasi File: Wajib ada jika upload baru, Opsional jika edit
    if (!editingNoteId && !selectedFile) {
        return showNotif('Upload file terlebih dahulu', 'error');
    }

    const course = availableCourses.find(c => c.code === selectedCourse);
    if (!course) return;

    setIsUploading(true);

    try {
        if (editingNoteId) {
            // === UPDATE LOGIC ===
            const oldNote = userNotes.find(n => n.id === editingNoteId);
            
            await notesService.updateNote(
                editingNoteId,
                {
                    title: noteTitle,
                    description: noteDescription,
                    course_code: selectedCourse,
                    course_title: course.title,
                    semester: selectedSemester,
                    file_type: noteType,
                    faculty: userFacultyAuto || '',
                    prodi: userProdi || '',
                },
                selectedFile || undefined, // File baru (jika ada)
                oldNote?.file_url // URL lama (untuk dihapus jika ada file baru)
            );
            showNotif('Catatan berhasil diperbarui! ✓', 'success');
        } else {
            // === CREATE LOGIC ===
            if (selectedFile) {
                await notesService.uploadNote(selectedFile, {
                    title: noteTitle,
                    description: noteDescription,
                    course_code: selectedCourse,
                    course_title: course.title,
                    semester: selectedSemester,
                    faculty: userFacultyAuto || '',
                    prodi: userProdi || '',
                    file_name: selectedFile.name,
                    file_size: formatFileSize(selectedFile.size),
                    file_type: noteType,
                    uploader_name: userName
                });
                showNotif('Catatan berhasil diupload! 🎉', 'success');
            }
        }

        resetForm();
        setShowUploadForm(false);
        setEditingNoteId(null);
        fetchMyNotes(); // Refresh list
    } catch (error: any) {
        console.error("Operation failed:", error);
        showNotif(`Gagal: ${error.message}`, 'error');
    } finally {
        setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedSemester('');
    setSelectedCourse('');
    setNoteType('PDF');
    setNoteTitle('');
    setNoteDescription('');
    setSelectedFile(null);
    setFilePreview('');
  };

  // --- DELETE DARI SUPABASE ---
  const handleDelete = async (noteId: string, fileUrl: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
      try {
          await notesService.deleteNote(noteId, fileUrl);
          showNotif('Catatan berhasil dihapus', 'success');
          fetchMyNotes(); // Refresh list
      } catch (error: any) {
          showNotif(`Gagal menghapus: ${error.message}`, 'error');
      }
    }
  };

  // --- EDIT MODE HANDLER ---
  const handleEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setSelectedSemester(note.semester);
    setSelectedCourse(note.course_code);
    setNoteType(note.file_type);
    setNoteTitle(note.title);
    setNoteDescription(note.description);
    // File tidak perlu di-set karena opsional saat edit
    
    setShowUploadForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    resetForm();
    setShowUploadForm(false);
  };

  return (
    <div className="min-h-screen bg-white font-mono">
      {/* Header */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-black hover:text-[#4285F4] mb-6 transition-colors font-bold uppercase"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali ke Beranda</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-black mb-2 uppercase tracking-tight">Catatan Saya</h1>
              <p className="text-black font-bold">Kelola dan bagikan catatan kuliah Anda</p>
            </div>
            <button
              onClick={() => {
                setShowUploadForm(true);
                setEditingNoteId(null);
                resetForm();
              }}
              className="bg-[#34A853] border-2 border-black text-white px-6 py-3 font-black uppercase tracking-wider hover:bg-[#2D8E47] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none flex items-center gap-2 justify-center lg:justify-start"
            >
              <Upload className="w-5 h-5" />
              Upload Catatan Baru
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Form */}
        {showUploadForm && (
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 mb-12">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-black border-dashed">
              <h2 className="text-2xl font-black text-black uppercase">
                {editingNoteId ? 'Edit Catatan' : 'Upload Catatan Baru'}
              </h2>
              <button
                onClick={cancelEdit}
                className="text-black hover:text-[#EA4335] transition-colors bg-white border-2 border-transparent hover:border-black p-1"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Info User */}
              <div className="bg-[#4285F4]/10 border-2 border-[#4285F4] p-4 border-dashed">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-black mb-1 uppercase">Fakultas</label>
                    <div className="bg-white border-2 border-black px-4 py-2 font-bold text-black">
                      {userFacultyAuto || 'Tidak diketahui'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-black mb-1 uppercase">Program Studi</label>
                    <div className="bg-white border-2 border-black px-4 py-2 font-bold text-black">
                      {userProdi || 'Tidak diketahui'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Semester & Course Selection */}
              <div>
                <label className="block text-sm font-black text-black mb-2 uppercase">Semester <span className="text-[#EA4335]">*</span></label>
                <select
                    value={selectedSemester}
                    onChange={(e) => { setSelectedSemester(e.target.value); setSelectedCourse(''); }}
                    className="w-full px-4 py-3 border-2 border-black font-bold bg-white"
                    required
                >
                    <option value="">PILIH SEMESTER</option>
                    {availableSemesters.map((sem) => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-2 uppercase">Mata Kuliah <span className="text-[#EA4335]">*</span></label>
                <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black font-bold bg-white disabled:opacity-50"
                    required
                    disabled={!selectedSemester}
                >
                    <option value="">PILIH MATA KULIAH</option>
                    {availableCourses.map((c) => (
                        <option key={c.code} value={c.code}>{c.code} - {c.title}</option>
                    ))}
                </select>
              </div>

              {/* Note Type */}
              <div>
                <label className="block text-sm font-black text-black mb-2 uppercase">Tipe Catatan <span className="text-[#EA4335]">*</span></label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="noteType" value="PDF" checked={noteType === 'PDF'} onChange={() => setNoteType('PDF')} />
                        <span className="font-bold">PDF Document</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="noteType" value="IMG" checked={noteType === 'IMG'} onChange={() => setNoteType('IMG')} />
                        <span className="font-bold">Gambar/Scan</span>
                    </label>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-black text-black mb-2 uppercase">
                    Upload File {editingNoteId ? '(Opsional)' : <span className="text-[#EA4335]">*</span>}
                </label>
                <div className="border-2 border-dashed border-black bg-gray-50 p-8 text-center relative">
                    <input type="file" id="fileInput" accept={noteType === 'PDF' ? '.pdf' : 'image/*'} onChange={handleFileSelect} className="hidden" />
                    <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center gap-4 w-full h-full">
                        {selectedFile ? (
                            <div className="text-center">
                                <p className="font-black text-lg">{selectedFile.name}</p>
                                <p className="text-sm font-bold text-gray-500">{formatFileSize(selectedFile.size)}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Upload className="w-12 h-12 mb-2" />
                                <span className="font-black uppercase">
                                    {editingNoteId ? 'Klik untuk ganti file' : `Klik untuk upload ${noteType}`}
                                </span>
                            </div>
                        )}
                    </label>
                </div>
                {filePreview && <img src={filePreview} alt="Preview" className="mt-4 max-h-64 border-2 border-black" />}
              </div>

              {/* Title & Description */}
              <div>
                <label className="block text-sm font-black text-black mb-2 uppercase">Judul <span className="text-[#EA4335]">*</span></label>
                <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="w-full px-4 py-3 border-2 border-black font-bold" placeholder="Contoh: Rangkuman Bab 1" required />
              </div>
              
              <div>
                <label className="block text-sm font-black text-black mb-2 uppercase">Deskripsi <span className="text-[#EA4335]">*</span></label>
                <textarea value={noteDescription} onChange={(e) => setNoteDescription(e.target.value)} rows={3} className="w-full px-4 py-3 border-2 border-black font-bold resize-none" required />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4 border-t-2 border-black border-dashed">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 bg-[#34A853] text-white px-6 py-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all font-black uppercase flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? 'Memproses...' : (editingNoteId ? 'Simpan Perubahan' : 'Upload Catatan')}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-4 border-2 border-black bg-white text-black hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all font-black uppercase"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notes List */}
        <div>
          <h2 className="text-2xl font-black text-black uppercase border-l-8 border-[#4285F4] pl-3 mb-8">
            Catatan yang Diupload ({userNotes.length})
          </h2>

          {userNotes.length === 0 ? (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-black mb-2 uppercase">Belum Ada Catatan</h3>
              <button onClick={() => setShowUploadForm(true)} className="bg-[#34A853] text-white px-6 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4 font-black uppercase">
                Upload Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {userNotes.map((note) => (
                <div key={note.id} className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex flex-col group">
                  <div className="bg-[#4285F4] px-4 py-2 border-b-2 border-black flex justify-between items-center">
                    <span className="text-white font-black text-sm">{note.course_code}</span>
                    <span className="bg-white text-black px-2 py-0.5 text-xs font-bold border border-black">{note.file_type}</span>
                  </div>
                  <div className="p-5 flex-1">
                    <h3 className="font-black text-xl mb-2 line-clamp-2">{note.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{note.description}</p>
                    <div className="bg-gray-50 border-2 border-black p-2 mb-4">
                        <p className="text-xs font-bold truncate">📎 {note.file_name}</p>
                        <p className="text-xs text-gray-500">{note.file_size}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(note.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="p-4 border-t-2 border-black flex gap-2">
                    <button 
                        onClick={() => handleEdit(note)} 
                        className="flex-1 bg-white text-black border-2 border-black py-2 hover:bg-[#FBBC05] hover:text-black font-black uppercase text-xs flex items-center justify-center gap-2"
                    >
                        <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <button 
                        onClick={() => handleDelete(note.id, note.file_url)} 
                        className="flex-1 bg-white text-black border-2 border-black py-2 hover:bg-[#EA4335] hover:text-white font-black uppercase text-xs flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {showNotification && (
        <div className={`fixed bottom-4 right-4 ${notificationType === 'success' ? 'bg-[#34A853]' : 'bg-[#EA4335]'} text-white px-6 py-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 z-50`}>
          <p className="text-sm font-black uppercase tracking-wide">{notificationMessage}</p>
        </div>
      )}
    </div>
  );
}