import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { AuthContext, DataContext, GlobalStateContext, PageContext, DataProvider, AuthProvider, GlobalStateProvider, PageProvider, MusicProvider } from './contexts/AppProviders';
import GlobalStyles from './components/common/GlobalStyles';
import NotificationBell from './components/common/NotificationBell';
import GeminiAPIKeyModal from './components/modals/GeminiAPIKeyModal';
import OnboardingTour, { TourStep } from './components/common/OnboardingTour';
import LockoutScreen from './components/auth/LockoutScreen';
import AuthPage from './components/auth/AuthPage';

import StudentDashboardPage, { MusicWidget, FocusTimerWidget } from './components/pages/StudentDashboardPage';
import TeacherDashboardPage from './components/pages/TeacherDashboardPage';
import AdminDashboardPage from './components/pages/AdminDashboardPage';
import CourseDetailPage from './components/pages/CourseDetailPage';
import LessonPage from './components/pages/LessonPage';
import AssignmentHubPage from './components/pages/AssignmentHubPage';
import ChatPage from './components/pages/ChatPage';
import ApiKeyPage from './components/pages/ApiKeyPage';
import AssignmentViewerPage from './components/pages/AssignmentViewerPage';
import GroupChatPage from './components/pages/GroupChatPage';
import GeminiStudentPage from './components/pages/GeminiStudentPage';
import AssignmentCreatorPage from './components/pages/AssignmentCreatorPage';
import GradebookPage from './components/pages/GradebookPage';
import GeminiTeacherPage from './components/pages/GeminiTeacherPage';
import AdminResiliencePage from './components/pages/AdminResiliencePage';
import DeploymentPage from './components/pages/DeploymentPage';
import SecurityPage from './components/pages/SecurityPage';
import LearningPathCreatorPage from './components/pages/LearningPathCreatorPage';
import LearningPathDetailPage from './components/pages/LearningPathDetailPage';
import LearningNodeStudyPage from './components/pages/LearningNodeStudyPage';
import NotebookPage from './components/pages/NotebookPage';

// --- DRAGGABLE FLOATING WIDGET ---
const FloatingWidget: React.FC<{ children: React.ReactNode; initialPos: { x: number; y: number } }> = ({ children, initialPos }) => {
    const [pos, setPos] = useState(initialPos);
    const [isDragging, setIsDragging] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const offset = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only drag if clicking the header/container, not buttons/inputs inside
        if (ref.current && (e.target as HTMLElement).closest('.drag-handle')) {
            setIsDragging(true);
            offset.current = {
                x: e.clientX - ref.current.getBoundingClientRect().left,
                y: e.clientY - ref.current.getBoundingClientRect().top
            };
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPos({
                    x: e.clientX - offset.current.x,
                    y: e.clientY - offset.current.y
                });
            }
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div 
            ref={ref}
            onMouseDown={handleMouseDown}
            style={{ 
                position: 'fixed', 
                left: pos.x, 
                top: pos.y, 
                zIndex: 9999, 
            }}
            className="transition-shadow duration-300 hover:shadow-2xl animate-fade-in"
        >
            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col w-[340px]">
                {/* Drag Handle / Header */}
                <div className="drag-handle h-8 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-white/10 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500/80 animate-pulse"></span>
                        <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Mission Control</span>
                    </div>
                    <div className="flex gap-1 opacity-50">
                        <div className="w-1 h-4 bg-white/20 rounded-full"></div>
                        <div className="w-1 h-4 bg-white/20 rounded-full"></div>
                        <div className="w-1 h-4 bg-white/20 rounded-full"></div>
                    </div>
                </div>
                
                {/* Content Container */}
                <div className="p-2 space-y-2 max-h-[70vh] overflow-y-auto custom-scrollbar bg-black/40">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Navigation: React.FC = () => {
  const { user } = useContext(AuthContext)!;
  const { page, setPage } = useContext(GlobalStateContext)!;
  const { navigate } = useContext(PageContext)!;

  const menuItems = useMemo(() => {
    const common = [
      { id: 'dashboard', label: 'Trạm Vũ Trụ', icon: '🚀' },
      { id: 'chat', label: 'Liên Lạc', icon: '📡' },
      { id: 'notebook', label: 'Sổ Tay', icon: '📓' }, // NEW
    ];
    
    if (user?.role === 'STUDENT') {
      return [
        ...common,
        { id: 'assignment_hub', label: 'Cây Tri Thức', icon: '🌳' },
        { id: 'group_chat', label: 'Phi Đội', icon: '🛸' },
        { id: 'gemini_student', label: 'Nhà Tiên Tri', icon: '🔮' },
      ];
    } else if (user?.role === 'TEACHER') {
      return [
        ...common,
        { id: 'assignment_hub', label: 'Quản lý Bài tập', icon: '📋' },
        { id: 'gemini_teacher', label: 'Trợ giảng AI', icon: '🤖' },
      ];
    } else if (user?.role === 'ADMIN') {
      return [
        ...common,
        { id: 'admin_resilience', label: 'Resilience', icon: '🔧' },
        { id: 'deployment', label: 'Deployment', icon: '🚀' },
        { id: 'security', label: 'Security', icon: '🛡️' },
      ];
    }
    return common;
  }, [user]);

  return (
    <nav id="main-sidebar" className="fixed bottom-0 w-full md:top-0 md:left-0 md:w-28 md:h-screen bg-black/60 backdrop-blur-xl border-t md:border-t-0 md:border-r border-white/10 z-50 flex md:flex-col justify-around md:justify-start py-2 md:py-8 transition-all duration-300">
      <div className="hidden md:flex flex-col items-center mb-8">
         <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            🌌
         </div>
      </div>
      
      {menuItems.map(item => (
        <button
          key={item.id}
          id={`nav-${item.id}`}
          onClick={() => navigate(item.id)}
          className={`flex flex-col items-center justify-center w-full md:h-20 p-2 gap-1 transition-all duration-300 relative group
            ${page === item.id 
              ? 'text-blue-400' 
              : 'text-gray-400 hover:text-white'
            }`}
        >
          {page === item.id && (
             <div className="absolute top-0 left-0 w-full h-0.5 md:w-0.5 md:h-full bg-blue-500 shadow-[0_0_10px_#3B82F6]"></div>
          )}
          <span className={`text-2xl transition-transform duration-300 ${page === item.id ? 'scale-110 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'group-hover:scale-110'}`}>
            {item.icon}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 hidden md:block">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

const Header: React.FC = () => {
  const { user, logout } = useContext(AuthContext)!;
  const { page, setPage } = useContext(GlobalStateContext)!;

  return (
    <header className="fixed top-0 left-0 md:left-28 right-0 h-20 bg-transparent z-40 flex items-center justify-between px-6 md:px-10 pointer-events-none">
       {/* Background Blur for Header */}
       <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"></div>

       <div className="relative pointer-events-auto flex items-center gap-3">
          {/* Mobile Logo */}
          <div className="md:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg shadow-lg">
             🌌
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide drop-shadow-md hidden sm:block">
             EDULEARN <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">(By Quang)</span>
          </h1>
       </div>

       <div className="relative pointer-events-auto flex items-center gap-4 md:gap-6">
        <button 
          id="header-settings"
          onClick={() => setPage('api_key', { isApiKeyModalOpen: true })}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-105"
          title="Cài đặt API Key"
        >
          🔑
        </button>
        <div id="header-notif" className="pointer-events-auto"><NotificationBell /></div>
        <button onClick={logout} className="btn btn-danger text-[10px] md:text-xs px-4 md:px-6 py-2 rounded-full shadow-lg">
          THOÁT
        </button>
      </div>
    </header>
  );
};

const PageRouter: React.FC = () => {
    const { user } = useContext(AuthContext)!;
    const { page, params } = useContext(PageContext)!;

    const PageComponent = useMemo(() => {
      if (!user) return StudentDashboardPage;
      switch (page) {
        case 'dashboard': return user.role === 'STUDENT' ? StudentDashboardPage : user.role === 'TEACHER' ? TeacherDashboardPage : AdminDashboardPage;
        case 'course_detail': return () => <CourseDetailPage courseId={params.courseId} />;
        case 'lesson': return () => <LessonPage lessonId={params.lessonId} />;
        case 'assignment_hub': return AssignmentHubPage;
        case 'chat': return ChatPage;
        case 'notebook': return NotebookPage; // NEW
        case 'api_key': return ApiKeyPage;
        case 'assignment_viewer': return () => <AssignmentViewerPage assignmentId={params.assignmentId} />;
        case 'group_chat': return GroupChatPage;
        case 'gemini_student': return GeminiStudentPage;
        case 'assignment_creator': return () => <AssignmentCreatorPage type={params.type} />;
        case 'gradebook': return () => <GradebookPage assignmentId={params.assignmentId} />;
        case 'gemini_teacher': return GeminiTeacherPage;
        case 'admin_resilience': return AdminResiliencePage;
        case 'deployment': return DeploymentPage;
        case 'security': return SecurityPage;
        case 'learning_path_creator': return LearningPathCreatorPage;
        case 'learning_path_detail': return () => <LearningPathDetailPage pathId={params.pathId} />;
        case 'learning_node_study': return () => <LearningNodeStudyPage pathId={params.pathId} nodeId={params.nodeId} isLastNode={params.isLastNode} />;
        default: return StudentDashboardPage;
      }
    }, [page, user, params]);
  
    return <PageComponent />;
};

const AppLayout: React.FC = () => {
  const { user } = useContext(AuthContext)!;
  const { page: globalPage, pageParams: globalPageParams } = useContext(GlobalStateContext)!;
  const { completeOnboarding } = useContext(DataContext)!;
  const { navigate, page } = useContext(PageContext)!; // Get current page to determine PiP

  const isApiKeyModalOpen = useMemo(() => globalPage === 'api_key' && globalPageParams?.isApiKeyModalOpen, [globalPage, globalPageParams]);

  const [isTourOpen, setIsTourOpen] = useState(false);

  // Define Tour Steps
  const tourSteps: TourStep[] = useMemo(() => [
      { 
          targetId: 'main-sidebar', 
          title: 'Thanh Điều Hướng', 
          content: 'Đây là trung tâm điều khiển. Bạn có thể truy cập mọi tính năng từ đây: Trạm Vũ Trụ, Cây Tri Thức, Nhà Tiên Tri AI, v.v.', 
          position: 'right' 
      },
      { 
          targetId: 'dashboard-hero', 
          title: 'Trạm Vũ Trụ', 
          content: 'Chào mừng bạn trở lại! Nơi đây hiển thị tổng quan hành trình của bạn và lối tắt để tiếp tục học ngay lập tức.', 
          position: 'bottom' 
      },
      { 
          targetId: 'course-list', 
          title: 'Các Điểm Đến', 
          content: 'Danh sách các khóa học bạn đang tham gia. Mỗi khóa học là một hành tinh mới chờ bạn khám phá.', 
          position: 'right' 
      },
      { 
          targetId: 'treasure-chest', 
          title: 'Kho Báu', 
          content: 'Nơi lưu giữ thành tích của bạn: XP, Kim Cương và các vật phẩm đã mua. Hãy học tập chăm chỉ để làm giàu kho báu nhé!', 
          position: 'left' 
      },
      { 
          targetId: 'btn-portal-ai', 
          title: 'Nhà Tiên Tri AI', 
          content: 'Gặp khó khăn? Hãy hỏi Nhà Tiên Tri Gemini. Bạn có thể chọn nhiều tính cách khác nhau để được hướng dẫn.', 
          position: 'left' 
      },
      { 
          targetId: 'nav-group_chat', 
          title: 'Phi Đội (Mới)', 
          content: 'Tính năng mới! Tạo hoặc tham gia các nhóm học tập (Spaceship) để cùng bạn bè chinh phục thử thách.', 
          position: 'right' 
      },
      { 
          targetId: 'nav-notebook', 
          title: 'Sổ Tay Không Gian (Mới)', 
          content: 'Trung tâm ghi chú thông minh. Ghi lại kiến thức, liên kết với bài tập và sử dụng AI để tối ưu hóa việc học.', 
          position: 'right' 
      },
      { 
          targetId: 'header-settings', 
          title: 'Cài Đặt', 
          content: 'Đừng quên cấu hình API Key tại đây để sử dụng các tính năng AI mạnh mẽ nhất.', 
          position: 'bottom' 
      },
  ], []);

  useEffect(() => {
      if (user && !user.hasSeenOnboarding && user.role === 'STUDENT') {
          // Delay slightly to ensure rendering
          const timer = setTimeout(() => setIsTourOpen(true), 1000);
          return () => clearTimeout(timer);
      }
  }, [user]);

  const handleTourComplete = () => {
      if (user) {
          completeOnboarding(user.id);
          setIsTourOpen(false);
      }
  };

  return (
    <div className="min-h-screen relative text-gray-100 overflow-hidden font-sans">
       {/* Dynamic Sky Background */}
       <div className="sky-bg"></div>
       <div className="clouds-container">
            <div className="cloud w-[300px] h-[300px] top-[10%] left-[-20%] opacity-40 duration-[60s]"></div>
            <div className="cloud w-[500px] h-[500px] top-[40%] left-[-10%] opacity-30 duration-[80s]"></div>
            <div className="cloud w-[400px] h-[400px] bottom-[10%] right-[-10%] opacity-40 duration-[70s]"></div>
       </div>

       <Navigation />
       <Header />
       
       {/* Adjusted main padding: 
           Desktop: pl-36 (for sidebar), pt-28 (for header)
           Mobile: pl-4, pt-24 (smaller header), pb-24 (for bottom nav)
       */}
       <main className="md:pl-36 md:pr-8 px-4 pt-24 md:pt-28 pb-24 md:pb-12 min-h-screen relative z-10 transition-all duration-500">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
             <PageRouter />
          </div>
       </main>
       
       {/* Picture-in-Picture Floating Widget (Combined) */}
       {user?.role === 'STUDENT' && page !== 'dashboard' && (
          <FloatingWidget initialPos={{ x: window.innerWidth - 360, y: window.innerHeight - 500 }}>
             <div className="flex flex-col gap-2">
                 <div className="bg-red-900/20 rounded-xl overflow-hidden border border-red-500/20">
                    <FocusTimerWidget />
                 </div>
                 <div className="rounded-xl overflow-hidden">
                    <MusicWidget />
                 </div>
             </div>
          </FloatingWidget>
       )}

       <GeminiAPIKeyModal isOpen={isApiKeyModalOpen} onClose={() => navigate('dashboard')} />
       
       {/* Onboarding Tour */}
       <OnboardingTour 
            steps={tourSteps} 
            isOpen={isTourOpen} 
            onComplete={handleTourComplete}
            onSkip={handleTourComplete}
       />
    </div>
  );
};

const AppRoot: React.FC = () => {
  const { user, isLocked } = useContext(AuthContext)!;
  if (isLocked) return <LockoutScreen />;
  if (!user) return <AuthPage />;
  return <AppLayout />;
}

const App: React.FC = () => {
  return (
    <DataProvider>
      <GlobalStateProvider>
        <AuthProvider>
          <PageProvider>
            <MusicProvider>
              <GlobalStyles />
              <AppRoot />
            </MusicProvider>
          </PageProvider>
        </AuthProvider>
      </GlobalStateProvider>
    </DataProvider>
  );
}

export default App;