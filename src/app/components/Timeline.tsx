import { useState, useEffect, useRef } from 'react';
import { Clock, FileText, Download, Eye, Zap, ChevronLeft, ChevronRight, Star } from 'lucide-react';
// 1. IMPORT SERVICE API
import { adminService } from '../services/api'; 

interface Post {
  id: string;
  title: string;
  courseCode: string;
  courseTitle: string;
  faculty: string;
  prodi: string;
  uploadedBy: string;
  author: string;
  createdAt: string;
  fileType: string;
  fileName?: string;
  fileSize?: string;
  fileData?: string; // Ini nanti diisi URL dari Supabase
  description?: string;
}

interface TimelineProps {
  userEmail: string;
}

export default function Timeline({ userEmail }: TimelineProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    checkScrollButtons();
  }, [posts]);

  // 2. FUNGSI LOAD POSTS DARI SUPABASE
  const loadPosts = async () => {
    try {
      setIsLoading(true);
      // Ambil data dari tabel 'notes' via API Service
      const data = await adminService.getAllPosts();

      if (data) {
        // Mapping data dari format Database (snake_case) ke format React (camelCase)
        const formattedPosts: Post[] = data.map((note: any) => ({
          id: note.id,
          title: note.title,
          courseCode: note.course_code, // Sesuaikan dengan nama kolom di Supabase
          courseTitle: note.course_title || 'Mata Kuliah Umum',
          faculty: note.faculty,
          prodi: note.prodi,
          uploadedBy: note.uploaded_by,
          author: note.author || 'Mahasiswa',
          createdAt: note.created_at,
          fileType: note.file_type || 'PDF', 
          fileName: note.file_name,
          fileSize: note.file_size,
          fileData: note.file_url, // URL file dari Supabase Storage
          description: note.description
        }));

        setPosts(formattedPosts);
      }
    } catch (error) {
      console.error("Gagal memuat timeline:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 450; 
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
      
      setTimeout(checkScrollButtons, 300);
    }
  };

  const handleDownload = (post: Post) => {
    if (!post.fileData) return;
    window.open(post.fileData, '_blank'); // Buka URL Supabase di tab baru
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}j`;
    if (diffInDays < 7) return `${diffInDays}h`;
    
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short'
    });
  };

  const getEngagement = (postId: string) => {
    const seed = postId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      views: Math.floor((seed % 50) + 20),
      likes: Math.floor((seed % 30) + 5),
    };
  };

  return (
    <div className="w-full relative">
      {/* Timeline Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 border-3 sm:border-4 border-black p-4 sm:p-6 lg:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl sm:rounded-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-black/10 rounded-full blur-2xl"></div>
          
          <div className="relative flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative">
                <div className="bg-yellow-400 p-2 sm:p-3 lg:p-4 border-2 sm:border-4 border-black rounded-lg sm:rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-black" />
                </div>
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 border-2 border-black rounded-full animate-ping"></div>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight drop-shadow-[3px_3px_0px_rgba(0,0,0,0.3)] flex items-center gap-1 sm:gap-2">
                  Timeline <Star className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-300 fill-yellow-300" />
                </h2>
                <p className="text-white/90 font-bold text-sm sm:text-base lg:text-lg mt-0.5 sm:mt-1">
                  🔥 {posts.length} catatan terbaru
                </p>
              </div>
            </div>
            
            {posts.length > 0 && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  className={`p-2 sm:p-3 border-2 sm:border-4 border-black font-black transition-all rounded-md sm:rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    canScrollLeft 
                      ? 'bg-white text-black hover:bg-yellow-300' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  className={`p-2 sm:p-3 border-2 sm:border-4 border-black font-black transition-all rounded-md sm:rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    canScrollRight 
                      ? 'bg-white text-black hover:bg-yellow-300' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Posts */}
      <div className="relative group">
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
        )}

        <div 
          ref={scrollContainerRef}
          onScroll={checkScrollButtons}
          className="overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8 pb-8 min-h-[400px] sm:min-h-[500px]">
            
            {/* Loading State */}
            {isLoading && posts.length === 0 ? (
               <div className="w-full flex items-center justify-center min-h-[400px]">
                 <div className="flex flex-col items-center">
                    <div className="animate-spin w-12 h-12 border-4 border-black border-t-yellow-400 rounded-full mb-4"></div>
                    <p className="font-bold">Memuat Timeline...</p>
                 </div>
               </div>
            ) : posts.length === 0 ? (
              // Empty State
              <div className="w-full max-w-2xl mx-auto bg-gradient-to-br from-gray-50 to-blue-50 border-3 sm:border-4 border-black p-8 sm:p-12 lg:p-16 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-yellow-400 border-3 sm:border-4 border-black rounded-full mb-4 sm:mb-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Clock className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-black" />
                </div>
                <p className="font-black text-gray-900 text-xl sm:text-2xl lg:text-3xl mb-2 sm:mb-3 uppercase">Belum Ada Posting</p>
                <p className="text-gray-600 font-bold text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">Timeline akan muncul saat ada catatan baru! 🚀</p>
                {/* Note: Tombol ini nanti bisa diarahkan ke fungsi toggle Upload Modal di Dashboard */}
                <button className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 border-3 sm:border-4 border-black rounded-lg font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm sm:text-base hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                  Upload Sekarang
                </button>
              </div>
            ) : (
              // Posts List
              posts.map((post, index) => {
                const engagement = getEngagement(post.id);
                const isNew = index < 3; 
                
                return (
                  <div
                    key={post.id}
                    className="flex-shrink-0 w-[300px] sm:w-[360px] lg:w-[420px] bg-white border-3 sm:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 rounded-xl sm:rounded-2xl overflow-hidden group/card relative"
                  >
                    {isNew && (
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 bg-red-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 border-2 border-black rounded-md sm:rounded-lg font-black text-[10px] sm:text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse">
                        🔥 NEW
                      </div>
                    )}

                    {/* Post Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 border-b-3 sm:border-b-4 border-black p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 border-3 sm:border-4 border-black flex items-center justify-center rounded-lg sm:rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                            <span className="font-black text-white text-base sm:text-xl">
                              {post.author ? post.author.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <p className="font-black text-sm sm:text-base lg:text-lg text-white drop-shadow-md truncate">{post.author}</p>
                              {post.uploadedBy === userEmail && (
                                <span className="bg-green-400 text-black px-1.5 py-0.5 sm:px-2 text-[10px] sm:text-xs font-black border-2 border-black rounded shadow-sm flex-shrink-0">
                                  YOU
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] sm:text-xs text-white/90 font-bold mt-0.5">
                              {formatTimeAgo(post.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-3 sm:p-4 lg:p-5">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-black border-2 sm:border-3 border-black rounded-md sm:rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                          {post.courseCode}
                        </span>
                        <span className="bg-yellow-300 text-black px-2 py-1 sm:px-3 text-[10px] sm:text-xs font-bold border-2 border-black rounded-md sm:rounded-lg">
                          {post.prodi}
                        </span>
                      </div>

                      <h3 className="font-black text-base sm:text-lg lg:text-xl mb-1.5 sm:mb-2 text-gray-900 line-clamp-2 leading-tight">
                        {post.title}
                      </h3>
                      <p className="text-xs sm:text-sm font-bold text-gray-600 mb-2 sm:mb-3 line-clamp-1">{post.courseTitle}</p>
                      
                      {post.description && (
                        <div className="bg-blue-50 border-l-3 sm:border-l-4 border-blue-500 p-2 sm:p-3 mb-3 sm:mb-4 rounded-md sm:rounded-lg">
                          <p className="text-[10px] sm:text-xs text-gray-700 font-medium italic line-clamp-2">"{post.description}"</p>
                        </div>
                      )}

                      {/* File Preview Image */}
                      {post.fileData && post.fileType === 'IMG' && (
                        <div 
                          className="mt-3 sm:mt-4 border-3 sm:border-4 border-black rounded-lg sm:rounded-xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 sm:hover:-translate-y-1 transition-all group-hover/card:scale-[1.01] sm:group-hover/card:scale-[1.02]"
                          onClick={() => setPreviewPost(post)}
                        >
                          <img
                            src={post.fileData}
                            alt={post.title}
                            className="w-full h-40 sm:h-48 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/card:opacity-100">
                            <div className="bg-white p-2 sm:p-3 border-2 border-black rounded-full shadow-lg">
                              <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* File Preview PDF */}
                      {post.fileType === 'PDF' && (
                        <div className="mt-3 sm:mt-4 bg-gradient-to-br from-red-500 to-pink-500 border-3 sm:border-4 border-black p-6 sm:p-8 text-center rounded-lg sm:rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover/card:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:group-hover/card:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                          <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-white mx-auto mb-1.5 sm:mb-2" />
                          <p className="font-black text-white text-base sm:text-lg">PDF FILE</p>
                          {post.fileName && (
                            <p className="text-white/90 font-bold text-[10px] sm:text-xs mt-1 truncate">{post.fileName}</p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-gray-100">
                        <div className="flex items-center gap-1 sm:gap-1.5 text-blue-600">
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-[10px] sm:text-xs font-bold">{engagement.views}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                        <button
                          onClick={() => setPreviewPost(post)}
                          className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 bg-blue-500 text-white px-3 py-2 sm:px-4 sm:py-3 border-3 sm:border-4 border-black font-black hover:bg-blue-600 transition-all rounded-md sm:rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-xs sm:text-sm"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          LIHAT
                        </button>
                        <button
                          onClick={() => handleDownload(post)}
                          className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 bg-green-500 text-white px-3 py-2 sm:px-4 sm:py-3 border-3 sm:border-4 border-black font-black hover:bg-green-600 transition-all rounded-md sm:rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-xs sm:text-sm"
                        >
                          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          DOWNLOAD
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {posts.length > 2 && (
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black text-white px-4 py-2 border-2 border-black rounded-full font-black text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <ChevronLeft className="w-3 h-3 animate-pulse" />
            Scroll untuk lebih banyak
            <ChevronRight className="w-3 h-3 animate-pulse" />
          </div>
        )}
      </div>

      {/* Preview Modal (Tetap sama) */}
      {previewPost && (
        <div 
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-2 sm:p-4" 
          onClick={() => setPreviewPost(null)}
        >
          <div className="relative max-w-6xl w-full max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewPost(null)}
              className="absolute -top-12 sm:-top-14 right-0 bg-white text-black px-4 py-2 sm:px-8 sm:py-3 border-3 sm:border-4 border-white font-black hover:bg-red-500 hover:text-white transition-all rounded-lg sm:rounded-xl shadow-[3px_3px_0px_0px_rgba(255,255,255,0.5)] sm:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none z-20 text-sm sm:text-base"
            >
              ✕ TUTUP
            </button>

            <div className="bg-white border-3 sm:border-4 border-white rounded-xl sm:rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] sm:shadow-[16px_16px_0px_0px_rgba(0,0,0,0.5)]">
              {previewPost.fileData ? (
                <>
                  {previewPost.fileType === 'IMG' ? (
                    <img
                      src={previewPost.fileData}
                      alt={previewPost.title}
                      className="w-full h-auto max-h-[90vh] object-contain bg-gray-100"
                    />
                  ) : (
                    <div className="bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 p-8 sm:p-12 lg:p-20 text-center min-h-[400px] sm:min-h-[500px] flex flex-col items-center justify-center">
                      <FileText className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 text-white mb-4 sm:mb-6 drop-shadow-2xl" />
                      <p className="font-black text-white text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3 drop-shadow-lg">PDF FILE</p>
                      <p className="text-white/90 font-bold text-base sm:text-lg lg:text-xl px-4">{previewPost.fileName}</p>
                      <button
                        onClick={() => handleDownload(previewPost)}
                        className="bg-white text-black px-6 py-3 sm:px-8 sm:py-4 lg:px-10 lg:py-5 border-3 sm:border-4 border-black font-black hover:bg-green-500 hover:text-white transition-all rounded-lg sm:rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 sm:gap-3 text-sm sm:text-base lg:text-lg mt-8"
                      >
                        <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                        DOWNLOAD FILE
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-200 p-8 sm:p-12 text-center">
                   <p className="font-black">File tidak tersedia</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}