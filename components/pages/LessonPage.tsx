
import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import { AuthContext, DataContext, GlobalStateContext, PageContext } from '../../contexts/AppProviders';
import LessonContent from '../lesson/LessonContent';
import LessonDiscussion from '../lesson/LessonDiscussion';
import VideoNotesSidebar from '../lesson/VideoNotesSidebar';

interface LessonPageProps {
    lessonId: string;
}

// Global definition for YouTube IFrame API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const LessonPage: React.FC<LessonPageProps> = ({ lessonId }) => {
    const { db, editLessonContent, addDiscussionPost, addVideoNote, deleteVideoNote, markLessonComplete } = useContext(DataContext)!;
    const { user } = useContext(AuthContext)!;
    const { navigate } = useContext(PageContext)!;
    const { serviceStatus } = useContext(GlobalStateContext)!;

    const lesson = useMemo(() => db.LESSONS[lessonId], [db.LESSONS, lessonId]);
    const discussion = useMemo(() => db.DISCUSSION[lessonId] || [], [db.DISCUSSION, lessonId]);
    const videoNotes = useMemo(() => 
        (db.VIDEO_NOTES && db.VIDEO_NOTES[lessonId] ? db.VIDEO_NOTES[lessonId].filter(n => n.userId === user?.id) : []), 
    [db.VIDEO_NOTES, lessonId, user?.id]);

    // State for YouTube Player
    const [currentTime, setCurrentTime] = useState(0);
    const [player, setPlayer] = useState<any>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<number | null>(null);

    const isContentServiceOk = serviceStatus.content_delivery === 'OPERATIONAL';
    const isForumServiceOk = serviceStatus.forum_service === 'OPERATIONAL';
    const isCourseServiceOk = serviceStatus.course_management === 'OPERATIONAL';

    const isCompleted = useMemo(() => user ? db.LESSON_PROGRESS?.[user.id]?.includes(lessonId) : false, [db.LESSON_PROGRESS, user, lessonId]);

    // --- YouTube API Logic ---
    useEffect(() => {
        if (!lesson || lesson.type !== 'video' || !isContentServiceOk) return;

        const videoIdMatch = lesson.content.match(/\/embed\/([^?]+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;
        if (!videoId) return;

        const setupPlayer = () => {
             if (window.YT && window.YT.Player && playerContainerRef.current) {
                // Ensure no old player exists
                if (playerContainerRef.current.firstChild) {
                    playerContainerRef.current.innerHTML = '';
                }
                 try {
                    const newPlayer = new window.YT.Player(playerContainerRef.current, {
                        height: '100%',
                        width: '100%',
                        videoId: videoId,
                        playerVars: { 'playsinline': 1, 'modestbranding': 1, 'rel': 0 },
                        events: {
                            'onReady': (event: any) => setPlayer(event.target),
                            'onStateChange': (event: any) => {
                                if (event.data === window.YT.PlayerState.PLAYING) {
                                    if (intervalRef.current) clearInterval(intervalRef.current);
                                    intervalRef.current = window.setInterval(() => {
                                        if (event.target && typeof event.target.getCurrentTime === 'function') {
                                            setCurrentTime(event.target.getCurrentTime());
                                        }
                                    }, 500);
                                } else {
                                    if (intervalRef.current) clearInterval(intervalRef.current);
                                    // Auto-complete if video ends (State 0)
                                    if (event.data === 0 && user) {
                                         markLessonComplete(user.id, lessonId);
                                    }
                                }
                            }
                        }
                    });
                 } catch (e) { console.error("Error initializing YT Player", e); }
             }
        };

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(tag);
            window.onYouTubeIframeAPIReady = setupPlayer;
        } else {
            setupPlayer();
        }
        
        return () => { 
            if (intervalRef.current) clearInterval(intervalRef.current);
            if(window.onYouTubeIframeAPIReady) {
                 window.onYouTubeIframeAPIReady = () => {};
            }
            if (player && typeof player.destroy === 'function') {
                player.destroy();
            }
        };
    }, [lesson, isContentServiceOk]);

    // --- Handlers ---
    const handleSeekTo = useCallback((seconds: number) => {
        if (player && typeof player.seekTo === 'function') {
            player.seekTo(seconds, true);
            if(player.getPlayerState() !== window.YT.PlayerState.PLAYING) {
               player.playVideo();
            }
            setCurrentTime(seconds);
        }
    }, [player]);

    const handleInputFocus = useCallback(() => {
        if (player && typeof player.pauseVideo === 'function' && player.getPlayerState() === window.YT.PlayerState.PLAYING) {
           player.pauseVideo();
        }
    }, [player]);

    const handleAddNote = useCallback((text: string) => {
        if (!user) return;
        const timeToSave = player && typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : currentTime;
        addVideoNote(lessonId, user.id, Math.floor(timeToSave), text);
    }, [user, player, currentTime, lessonId, addVideoNote]);

    const handleSaveContent = useCallback((newContent: string) => {
        if (!isCourseServiceOk) {
            alert("Dịch vụ đang bảo trì.");
            return;
        }
        editLessonContent(lessonId, newContent);
        alert("Đã lưu nội dung!");
    }, [isCourseServiceOk, lessonId, editLessonContent]);

    const handlePostDiscussion = useCallback((text: string) => {
         if (!user) return;
         addDiscussionPost(lessonId, user, text);
    }, [user, lessonId, addDiscussionPost]);

    const handleMarkComplete = useCallback(() => {
        if (user) {
            markLessonComplete(user.id, lessonId);
            alert("Đã hoàn thành bài học! Bạn có thể chuyển sang bài tiếp theo trong lộ trình.");
        }
    }, [user, lessonId, markLessonComplete]);

    // --- Render ---
    if (!lesson) {
        return (
            <div className="text-red-500 card p-6">
                Lỗi: Không tìm thấy thông tin bài học.
                <button onClick={() => navigate('dashboard')} className="text-sm text-blue-400 hover:underline mt-4 block">
                    &larr; Quay lại Dashboard
                </button>
            </div>
        );
    }

    const isVideo = lesson.type === 'video';

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <button 
                        onClick={() => navigate('course_detail', { courseId: lesson.courseId })} 
                        className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-300 hover:bg-blue-500/20 hover:text-white hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 backdrop-blur-md w-fit mb-3"
                    >
                        <span>&larr;</span> <span className="font-medium">Quay lại Lộ trình</span>
                    </button>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 drop-shadow-md">{lesson.title}</h1>
                </div>
                <button 
                    onClick={handleMarkComplete}
                    disabled={isCompleted}
                    className={`btn px-6 py-3 text-lg shadow-lg ${isCompleted ? 'btn-secondary border-green-500 text-green-400' : 'btn-primary animate-bounce'}`}
                >
                    {isCompleted ? '✅ Đã hoàn thành' : '⭕ Đánh dấu Hoàn thành'}
                </button>
            </div>

            <div className={`grid grid-cols-1 gap-8 ${isVideo ? 'lg:grid-cols-3' : ''}`}>
                {/* --- Main Content Area --- */}
                <div className={`${isVideo ? 'lg:col-span-2' : 'w-full'} space-y-6`}>
                     <div className="card p-0 overflow-hidden bg-black border border-gray-700 shadow-2xl">
                        {isVideo ? (
                            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                                <div id="yt-player-container" ref={playerContainerRef} className="absolute top-0 left-0 w-full h-full" />
                            </div>
                        ) : (
                            <LessonContent 
                                content={lesson.content}
                                type={lesson.type}
                                isTeacher={user?.role === 'TEACHER'}
                                isServiceOk={isCourseServiceOk}
                                onSave={handleSaveContent}
                            />
                        )}
                    </div>

                    <LessonDiscussion 
                        posts={discussion}
                        user={user ? { id: user.id, name: user.name, role: user.role, isLocked: false, apiKey: null } : null}
                        isServiceOk={isForumServiceOk}
                        onPost={handlePostDiscussion}
                    />
                </div>

                {/* --- Sidebar (Video Only) --- */}
                {isVideo && (
                    <div className="lg:col-span-1">
                        <VideoNotesSidebar 
                            notes={videoNotes}
                            currentTime={currentTime}
                            onSeek={handleSeekTo}
                            onAddNote={handleAddNote}
                            onDeleteNote={(noteId) => deleteVideoNote(lessonId, noteId)}
                            onInputFocus={handleInputFocus}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonPage;
