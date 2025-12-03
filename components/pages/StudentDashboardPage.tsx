
import React, { useContext, useMemo, useState, useEffect, useRef } from 'react';
import { AuthContext, DataContext, GlobalStateContext, PageContext, MusicContext } from '../../contexts/AppProviders';
import { useFeatureFlag } from '../../hooks/useAppHooks';
import Modal from '../common/Modal';
import type { User, Task } from '../../types';

// Global definition for YouTube IFrame API (in case it's not loaded by LessonPage)
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// --- CONSTANTS ---
const VN_CITIES = [
    { name: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
    { name: 'TP. Hồ Chí Minh', lat: 10.8231, lng: 106.6297 },
    { name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022 },
    { name: 'Hải Phòng', lat: 20.8449, lng: 106.6881 },
    { name: 'Cần Thơ', lat: 10.0452, lng: 105.7469 },
    { name: 'Nha Trang', lat: 12.2388, lng: 109.1967 },
    { name: 'Huế', lat: 16.4637, lng: 107.5909 },
    { name: 'Đà Lạt', lat: 11.9404, lng: 108.4583 },
];

const WEATHER_CODES: Record<number, { icon: string, text: string, sub: string }> = {
    0: { icon: '☀️', text: 'Nắng Cực Quang', sub: 'Trời quang đãng' },
    1: { icon: '🌤️', text: 'Mây Tinh Vân', sub: 'Nhiều mây' },
    2: { icon: '☁️', text: 'Mây Tinh Vân', sub: 'Nhiều mây' },
    3: { icon: '☁️', text: 'Mây Tinh Vân', sub: 'Nhiều mây' },
    45: { icon: '🌫️', text: 'Sương Mù', sub: 'Tầm nhìn hạn chế' },
    48: { icon: '🌫️', text: 'Sương Mù', sub: 'Tầm nhìn hạn chế' },
    51: { icon: '🌧️', text: 'Mưa Sao Băng', sub: 'Mưa phùn' },
    53: { icon: '🌧️', text: 'Mưa Sao Băng', sub: 'Mưa phùn' },
    55: { icon: '🌧️', text: 'Mưa Sao Băng', sub: 'Mưa phùn' },
    61: { icon: '⛈️', text: 'Mưa Thiên Thạch', sub: 'Mưa rào' },
    63: { icon: '⛈️', text: 'Mưa Thiên Thạch', sub: 'Mưa rào' },
    65: { icon: '⛈️', text: 'Mưa Thiên Thạch', sub: 'Mưa rào' },
    80: { icon: '⛈️', text: 'Bão Từ', sub: 'Mưa lớn' },
    81: { icon: '⛈️', text: 'Bão Từ', sub: 'Mưa lớn' },
    82: { icon: '⛈️', text: 'Bão Từ', sub: 'Mưa lớn' },
    95: { icon: '⚡', text: 'Sấm Sét Plasma', sub: 'Dông bão' },
    96: { icon: '⚡', text: 'Sấm Sét Plasma', sub: 'Dông bão' },
    99: { icon: '⚡', text: 'Sấm Sét Plasma', sub: 'Dông bão' },
};

// --- ANALOG CLOCK COMPONENT ---
const AnalogClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const seconds = time.getSeconds();
    const minutes = time.getMinutes();
    const hours = time.getHours();

    return (
        <div className="relative w-28 h-28 rounded-full border-4 border-gray-700 bg-black/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-center backdrop-blur-sm">
            {/* Clock Face Markers */}
            {[...Array(12)].map((_, i) => (
                <div 
                    key={i}
                    className={`absolute w-1 ${i % 3 === 0 ? 'h-3 bg-white' : 'h-1.5 bg-gray-500'}`}
                    style={{ 
                        transform: `rotate(${i * 30}deg) translateY(-42px)`,
                        transformOrigin: '50% 50% 0px' // Not strictly needed with this layout trick but keeps logic clear
                    }}
                ></div>
            ))}

            {/* Hour Hand */}
            <div 
                className="absolute w-1.5 bg-white rounded-full origin-bottom shadow-lg"
                style={{ 
                    height: '25%', 
                    bottom: '50%',
                    left: 'calc(50% - 3px)',
                    transform: `rotate(${(hours % 12) * 30 + minutes * 0.5}deg)` 
                }}
            ></div>

            {/* Minute Hand */}
            <div 
                className="absolute w-1 bg-blue-400 rounded-full origin-bottom shadow-lg"
                style={{ 
                    height: '38%', 
                    bottom: '50%',
                    left: 'calc(50% - 2px)',
                    transform: `rotate(${minutes * 6}deg)` 
                }}
            ></div>

            {/* Second Hand */}
            <div 
                className="absolute w-0.5 bg-red-500 rounded-full origin-bottom"
                style={{ 
                    height: '42%', 
                    bottom: '50%',
                    left: 'calc(50% - 1px)',
                    transform: `rotate(${seconds * 6}deg)` 
                }}
            ></div>

            {/* Center Cap */}
            <div className="absolute w-3 h-3 bg-gray-200 rounded-full border-2 border-red-500 z-10 shadow-md"></div>
        </div>
    );
};

// --- NEW WIDGETS ---

const RealTimeWeatherWidget = () => {
    const [city, setCity] = useState(VN_CITIES[1]); // Default HCM
    const [weatherData, setWeatherData] = useState<{ temp: number, code: number } | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Clock Tick
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Weather
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current_weather=true`);
                const data = await res.json();
                if (data.current_weather) {
                    setWeatherData({
                        temp: data.current_weather.temperature,
                        code: data.current_weather.weathercode
                    });
                }
            } catch (e) {
                console.error("Weather fetch failed", e);
            }
        };
        fetchWeather();
        // Refresh every 30 mins
        const refresh = setInterval(fetchWeather, 30 * 60 * 1000);
        return () => clearInterval(refresh);
    }, [city]);

    const weatherInfo = weatherData ? (WEATHER_CODES[weatherData.code] || WEATHER_CODES[0]) : WEATHER_CODES[0];

    return (
        <div className="flex flex-col p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md animate-fade-in-up h-[340px] relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>

            {/* Header: City Selector */}
            <div className="z-10 flex justify-between items-center mb-2">
                <select 
                    className="bg-black/30 text-[10px] text-blue-200 border border-blue-500/30 rounded px-2 py-1 outline-none cursor-pointer hover:bg-black/50 transition-colors w-full max-w-[120px]"
                    value={city.name}
                    onChange={(e) => {
                        const newCity = VN_CITIES.find(c => c.name === e.target.value);
                        if (newCity) setCity(newCity);
                    }}
                >
                    {VN_CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <div className="text-[10px] font-mono text-gray-400">
                    UTC+7
                </div>
            </div>

            {/* Center: Analog Clock */}
            <div className="flex-1 flex items-center justify-center z-10 py-2">
                <AnalogClock />
            </div>

            {/* Bottom: Weather & Digital Time */}
            <div className="z-10 mt-auto bg-black/20 rounded-xl p-2 border border-white/5">
                <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-3xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] mb-1">
                            {weatherInfo.icon}
                        </span>
                        <p className="text-xl font-bold text-white leading-none">
                            {weatherData ? Math.round(weatherData.temp) : '--'}°C
                        </p>
                        <p className="text-[10px] text-blue-200 truncate max-w-[80px] mt-1">{weatherInfo.text}</p>
                    </div>
                    
                    <div className="text-right">
                        <p className="text-2xl font-mono font-bold text-white tracking-wider leading-none">
                            {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-1">
                            {currentTime.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const FocusTimerWidget = () => {
    const { pomodoro } = useContext(GlobalStateContext)!;
    const { db, addTask, toggleTask, archiveCompletedTasks } = useContext(DataContext)!;
    const { user } = useContext(AuthContext)!;
    const { navigate } = useContext(PageContext)!;

    const [activeTab, setActiveTab] = useState<'focus' | 'short' | 'long'>('focus');
    const [taskInput, setTaskInput] = useState('');

    const tasks = useMemo(() => {
        if(!user) return [];
        return Object.values(db.TASKS).filter(t => t.userId === user.id && !t.isArchived);
    }, [db.TASKS, user]);

    useEffect(() => {
        if (pomodoro.seconds === 0 && pomodoro.isActive) {
             alert("⏰ Hết giờ tập trung!");
             pomodoro.setIsActive(false);
             // Reset based on mode
             if (activeTab === 'focus') pomodoro.setSeconds(25*60);
             else if (activeTab === 'short') pomodoro.setSeconds(5*60);
             else pomodoro.setSeconds(15*60);
        }
    }, [pomodoro.seconds, pomodoro.isActive, activeTab]);

    const handleTabChange = (mode: 'focus' | 'short' | 'long') => {
        setActiveTab(mode);
        pomodoro.setIsActive(false);
        if (mode === 'focus') pomodoro.setSeconds(25 * 60);
        else if (mode === 'short') pomodoro.setSeconds(5 * 60);
        else pomodoro.setSeconds(15 * 60);
    };

    const handleTimeAdjust = (amount: number) => {
        pomodoro.setSeconds(prev => Math.max(0, prev + amount));
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (user && taskInput.trim()) {
            addTask(user.id, taskInput.trim());
            setTaskInput('');
        }
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div className="card bg-red-900/10 border-red-500/30 flex flex-col h-[340px] overflow-hidden relative">
            {/* TABS */}
            <div className="flex bg-black/20 p-1">
                <button onClick={() => handleTabChange('focus')} className={`flex-1 py-1 text-[10px] font-bold uppercase rounded ${activeTab === 'focus' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>Focus</button>
                <button onClick={() => handleTabChange('short')} className={`flex-1 py-1 text-[10px] font-bold uppercase rounded ${activeTab === 'short' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>Short</button>
                <button onClick={() => handleTabChange('long')} className={`flex-1 py-1 text-[10px] font-bold uppercase rounded ${activeTab === 'long' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Long</button>
            </div>

            {/* TIMER AREA */}
            <div className="flex flex-col items-center justify-center py-4 relative group">
                <div className="text-4xl font-mono font-bold text-white tracking-widest leading-none drop-shadow-md">
                    {formatTime(pomodoro.seconds)}
                </div>
                
                {/* Time Adjust Controls (Hover) */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                    <button onClick={() => handleTimeAdjust(-60)} className="w-6 h-6 rounded-full bg-white/10 text-white text-xs hover:bg-white/20">-</button>
                    <button onClick={() => handleTimeAdjust(60)} className="w-6 h-6 rounded-full bg-white/10 text-white text-xs hover:bg-white/20">+</button>
                </div>

                <div className="flex gap-3 mt-3">
                    <button 
                        onClick={() => pomodoro.setIsActive(!pomodoro.isActive)} 
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg transition-transform active:scale-95 ${pomodoro.isActive ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                    >
                        {pomodoro.isActive ? 'PAUSE' : 'START'}
                    </button>
                    <button 
                        onClick={() => { pomodoro.setIsActive(false); handleTabChange(activeTab); }} 
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 text-gray-300 hover:bg-white/20"
                    >
                        RESET
                    </button>
                </div>
            </div>

            {/* TASK AREA */}
            <div className="flex-1 bg-black/20 border-t border-white/5 flex flex-col p-2 min-h-0">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase">Tasks</h4>
                    <button 
                        onClick={() => { if(user && window.confirm("Lưu trữ các task đã hoàn thành?")) archiveCompletedTasks(user.id); }}
                        className="text-[10px] text-blue-400 hover:underline"
                        title="Lưu trữ task đã xong"
                    >
                        📂 Lưu trữ
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 mb-2 pr-1">
                    {tasks.map(task => (
                        <div key={task.id} className={`flex items-center gap-2 p-1.5 rounded transition-colors ${task.isCompleted ? 'bg-black/30' : 'bg-white/5 hover:bg-white/10'}`}>
                            <input 
                                type="checkbox" 
                                checked={task.isCompleted} 
                                onChange={() => toggleTask(task.id)}
                                className="w-3 h-3 rounded border-gray-600 bg-transparent text-red-500 focus:ring-0 cursor-pointer"
                            />
                            <span className={`text-xs truncate flex-1 ${task.isCompleted ? 'line-through text-gray-600' : 'text-gray-200'}`}>
                                {task.text}
                            </span>
                        </div>
                    ))}
                    {tasks.length === 0 && <p className="text-[10px] text-gray-600 text-center italic mt-2">Chưa có task nào.</p>}
                </div>

                <form onSubmit={handleAddTask} className="flex gap-1 mt-auto">
                    <input 
                        type="text" 
                        className="flex-1 bg-black/40 border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
                        placeholder="Thêm task..."
                        value={taskInput}
                        onChange={e => setTaskInput(e.target.value)}
                    />
                    <button type="submit" className="bg-red-600 text-white w-6 rounded flex items-center justify-center hover:bg-red-500">+</button>
                </form>
                
                <button 
                    onClick={() => navigate('task_archive')} 
                    className="text-[9px] text-center text-gray-500 mt-1 hover:text-gray-300"
                >
                    Xem lịch sử lưu trữ &rarr;
                </button>
            </div>
        </div>
    );
};

// --- DYNAMIC AUDIO VISUALIZER ---
// Re-implemented to use the global Audio Element
export const AudioVisualizer: React.FC<{ audioElement: HTMLAudioElement | null, isPlaying: boolean }> = ({ audioElement, isPlaying }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number>(0);

    useEffect(() => {
        if (!audioElement || !isPlaying) {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            return;
        }

        // Initialize Audio Context (once)
        try {
            if (!audioCtxRef.current) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                audioCtxRef.current = new AudioContext();
                analyserRef.current = audioCtxRef.current.createAnalyser();
                analyserRef.current.fftSize = 64; // Low detail for retro look
                
                // Connect to source only if not already connected (check if we can reuse)
                // Note: Connecting the same element to multiple contexts works but careful with CORS
                audioElement.crossOrigin = "anonymous";
                
                if (!sourceRef.current) {
                    try {
                        sourceRef.current = audioCtxRef.current.createMediaElementSource(audioElement);
                        sourceRef.current.connect(analyserRef.current);
                        analyserRef.current.connect(audioCtxRef.current.destination);
                    } catch (e) {
                        // Often fails if already connected elsewhere or CORS
                        console.warn("Visualizer connect failed", e);
                    }
                }
            }

            if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }

            const draw = () => {
                const canvas = canvasRef.current;
                const analyser = analyserRef.current;
                if (!canvas || !analyser) return;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyser.getByteFrequencyData(dataArray);

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const barWidth = (canvas.width / bufferLength) * 2.5;
                let barHeight;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = dataArray[i] / 2; // Scale down
                    const r = barHeight + 25 * (i / bufferLength);
                    const g = 250 * (i / bufferLength);
                    const b = 50;

                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
                }
                animationFrameRef.current = requestAnimationFrame(draw);
            };
            draw();
        } catch(e) { console.error(e) }

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isPlaying, audioElement]);

    return <canvas ref={canvasRef} width={200} height={100} className="absolute inset-0 w-full h-full opacity-30 pointer-events-none mix-blend-screen" />;
};

export const MusicWidget = () => {
    // Consume Global Music Context
    const music = useContext(MusicContext)!;
    
    // Local UI State
    const [showPlaylist, setShowPlaylist] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        const validFiles = files.filter((f: File) => f.type === 'audio/mpeg' || f.name.endsWith('.mp3'));
        if (validFiles.length > 0) {
            music.addTracks(validFiles);
        }
    };

    return (
        <div className="card p-4 bg-purple-900/10 border-purple-500/30 overflow-hidden relative group h-[340px] flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-2 relative z-20">
                <h3 className="text-xs font-bold text-purple-300 uppercase flex items-center gap-2">
                    📻 Global Player
                    {music.isPlaying && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>}
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => setShowPlaylist(!showPlaylist)} className={`text-xs p-1.5 rounded transition-colors ${showPlaylist ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300'}`}>
                        ≣ List
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded">
                        +
                    </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/mp3" multiple className="hidden" />
            </div>

            {/* MAIN AREA: VISUALIZER / PLAYLIST */}
            <div className="relative flex-1 rounded-lg overflow-hidden bg-black border border-purple-500/20 shadow-inner mb-3">
                
                <div className={`absolute inset-0 flex items-center justify-center ${showPlaylist ? 'opacity-20 blur-sm' : 'opacity-100'} transition-all duration-300`}>
                    <AudioVisualizer audioElement={music.audioElement} isPlaying={music.isPlaying} />
                    
                    {/* Vinyl Record */}
                    {music.currentTrack ? (
                        <div className={`relative w-32 h-32 rounded-full bg-black border-4 border-gray-800 shadow-xl flex items-center justify-center transition-all duration-1000 ${music.isPlaying ? 'animate-spin-slow' : ''}`}>
                            <div className="absolute inset-2 rounded-full border border-gray-800/50"></div>
                            <div className="absolute inset-6 rounded-full border border-gray-800/50"></div>
                            <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-black rounded-full"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500">
                            <p className="text-2xl mb-2">📂</p>
                            <p className="text-xs">Trống</p>
                        </div>
                    )}
                </div>

                {/* Playlist Drawer */}
                {showPlaylist && (
                    <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-md z-10 flex flex-col animate-fade-in">
                        <div className="p-2 bg-purple-900/50 text-[10px] font-bold text-purple-200 uppercase tracking-wider">Danh sách phát ({music.playlist.length})</div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {music.playlist.map((t, idx) => (
                                <div 
                                    key={t.id} 
                                    onClick={() => music.playTrack(idx)}
                                    className={`flex justify-between items-center p-2 rounded cursor-pointer group ${music.currentTrack?.id === t.id ? 'bg-purple-600 text-white' : 'hover:bg-white/10 text-gray-400'}`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-[10px] font-mono opacity-50">{idx + 1}</span>
                                        <span className="text-xs truncate max-w-[120px]">{t.name}</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); music.deleteTrack(t.id); }} className="text-[10px] opacity-0 group-hover:opacity-100 hover:text-red-400">✕</button>
                                </div>
                            ))}
                            {music.playlist.length === 0 && <p className="text-center text-xs text-gray-500 mt-4">Chưa có bài hát.</p>}
                        </div>
                    </div>
                )}

                {/* Track Info Overlay */}
                {!showPlaylist && music.currentTrack && (
                    <div className="absolute bottom-2 left-0 right-0 text-center px-2 z-0">
                        <p className="text-[10px] font-bold text-white truncate drop-shadow-md bg-black/40 rounded px-2 py-0.5 inline-block border border-white/10">
                            🎵 {music.currentTrack.name}
                        </p>
                    </div>
                )}
            </div>

            {/* CONTROLS */}
            <div className="space-y-2 relative z-20">
                {/* Progress Bar */}
                <div className="flex items-center gap-2 text-[9px] font-mono text-gray-400">
                    <span className="w-8 text-right">{(music.currentTime / 60).toFixed(0).padStart(2,'0')}:{(music.currentTime % 60).toFixed(0).padStart(2,'0')}</span>
                    <input 
                        type="range" 
                        min="0" 
                        max={music.duration || 0} 
                        value={music.currentTime} 
                        onChange={(e) => music.seek(parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full"
                    />
                    <span className="w-8">{(music.duration / 60).toFixed(0).padStart(2,'0')}:{(music.duration % 60).toFixed(0).padStart(2,'0')}</span>
                </div>

                {/* Main Buttons */}
                <div className="flex items-center justify-between">
                    <button 
                        onClick={music.cycleLoopMode} 
                        className={`text-xs p-1.5 rounded transition-all ${music.loopMode !== 'off' ? 'text-green-400 bg-green-900/30' : 'text-gray-500'}`}
                        title={`Loop: ${music.loopMode}`}
                    >
                        {music.loopMode === 'one' ? '🔂' : '🔁'}
                    </button>

                    <div className="flex items-center gap-3">
                        <button onClick={music.prevTrack} className="text-gray-300 hover:text-white text-lg">⏮</button>
                        <button 
                            onClick={music.togglePlay} 
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-lg transition-all ${music.isPlaying ? 'bg-purple-600 text-white scale-105' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            disabled={!music.currentTrack}
                        >
                            {music.isPlaying ? '⏸' : '▶'}
                        </button>
                        <button onClick={music.nextTrack} className="text-gray-300 hover:text-white text-lg">⏭</button>
                    </div>

                    {/* Volume - IMPROVED UI */}
                    <div className="flex items-center gap-2 group relative">
                        <span className="text-xs cursor-pointer" onClick={() => music.setVolume(music.volume === 0 ? 0.5 : 0)}>{music.volume === 0 ? '🔇' : '🔊'}</span>
                        <div className="w-16 h-4 bg-gray-800 rounded-full flex items-center px-1">
                             <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.05" 
                                value={music.volume} 
                                onChange={(e) => music.setVolume(parseFloat(e.target.value))}
                                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-blue-400" 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ScratchpadWidget = () => {
    const { user } = useContext(AuthContext)!;
    const { db, updateScratchpad } = useContext(DataContext)!;
    const [note, setNote] = useState(db.SCRATCHPAD?.[user!.id] || '');

    const handleSave = () => {
        if(user) updateScratchpad(user.id, note);
    };

    return (
        <div className="card p-4 bg-yellow-900/10 border-yellow-500/30 h-full flex flex-col">
            <h3 className="text-xs font-bold text-yellow-300 uppercase mb-2">Ghi chú nhanh</h3>
            <textarea 
                className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-gray-300 resize-none focus:outline-none focus:border-yellow-500/50 mb-2"
                placeholder="Ghi lại ý tưởng..."
                value={note}
                onChange={e => setNote(e.target.value)}
                onBlur={handleSave}
            />
        </div>
    );
};

const LeaderboardWidget = () => {
    const { db } = useContext(DataContext)!;
    const users = (Object.values(db.USERS) as User[]).filter(u => u.role === 'STUDENT');
    // Mock sort by points (using random for demo if points equal)
    const sorted = users.sort((a, b) => (db.GAMIFICATION.points + Math.random()) - (db.GAMIFICATION.points + Math.random())).reverse().slice(0, 3);

    return (
        <div className="card p-4 bg-gradient-to-b from-blue-900/20 to-transparent border-blue-500/30">
            <h3 className="text-xs font-bold text-blue-300 uppercase mb-4 flex items-center gap-2">🏆 Bảng Xếp Hạng</h3>
            <div className="space-y-3">
                {sorted.map((u, i) => (
                    <div key={u.id} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i===0 ? 'bg-yellow-400 text-black' : i===1 ? 'bg-gray-300 text-black' : 'bg-orange-700 text-white'}`}>
                            {i+1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{u.name}</p>
                            <p className="text-[10px] text-gray-400">Level {Math.floor(Math.random()*20)+1}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-4 text-xs text-blue-400 hover:text-white transition-colors">Xem tất cả &rarr;</button>
        </div>
    );
};

const StreakWidget = () => {
    const { db } = useContext(DataContext)!;
    const streak = db.GAMIFICATION.streakDays || 0;
    
    return (
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            <span className="text-xl animate-fire">🔥</span>
            <span className="text-sm font-black text-orange-400">{streak}</span>
        </div>
    );
};

// --- ACCOUNT WIDGET & MODAL ---
const AccountSettingsModal: React.FC<{ isOpen: boolean, onClose: () => void, initialTab?: 'profile' | 'security' }> = ({ isOpen, onClose, initialTab = 'profile' }) => {
    const { user } = useContext(AuthContext)!;
    const { updateUserProfile } = useContext(DataContext)!;
    
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>(initialTab);
    const [name, setName] = useState('');
    const [nickname, setNickname] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            if (user) {
                setName(user.name);
                setNickname(user.nickname || '');
                setOldPassword('');
                setNewPassword('');
                setError(null);
            }
        }
    }, [isOpen, user, initialTab]);

    const handleSave = () => {
        if (!user) return;
        try {
            updateUserProfile(user.id, {
                name,
                nickname,
                password: newPassword || undefined,
                oldPassword: oldPassword || undefined
            });
            alert("Cập nhật thông tin thành công!");
            onClose();
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Quản lý Tài khoản">
            <div className="space-y-4">
                {/* TABS */}
                <div className="flex border-b border-gray-700 mb-4">
                    <button 
                        onClick={() => setActiveTab('profile')} 
                        className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'profile' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
                    >
                        Hồ sơ
                    </button>
                    <button 
                        onClick={() => setActiveTab('security')} 
                        className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'security' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
                    >
                        Bảo mật (Đổi mật khẩu)
                    </button>
                </div>

                {activeTab === 'profile' && (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">User ID</label>
                            <input type="text" className="form-input w-full bg-gray-800 text-gray-500 cursor-not-allowed" value={user?.id} disabled />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Họ và Tên</label>
                            <input type="text" className="form-input w-full" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Biệt danh (Nickname)</label>
                            <input type="text" className="form-input w-full" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="VD: Thuyền trưởng..." />
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/20">
                            <h3 className="text-sm font-bold text-red-300 mb-2">🔒 Thay đổi Mật khẩu</h3>
                            <div className="space-y-3">
                                <input type="password" className="form-input w-full" placeholder="Mật khẩu cũ" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                                <input type="password" className="form-input w-full" placeholder="Mật khẩu mới" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

                <div className="flex justify-end gap-2 pt-4">
                    <button onClick={onClose} className="btn btn-secondary">Hủy</button>
                    <button onClick={handleSave} className="btn btn-primary">Lưu Thay Đổi</button>
                </div>
            </div>
        </Modal>
    );
};

const AccountManagerWidget = () => {
    const { user } = useContext(AuthContext)!;
    const { db } = useContext(DataContext)!;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'profile' | 'security'>('profile');
    
    const level = Math.floor(db.GAMIFICATION.points / 1000) + 1;
    const progress = (db.GAMIFICATION.points % 1000) / 1000 * 100;

    const openModal = (tab: 'profile' | 'security') => {
        setModalTab(tab);
        setIsModalOpen(true);
    };

    return (
        <>
            <div className="card p-3 flex items-center justify-between bg-blue-900/10 border-blue-500/30 transition-all group h-full">
                <div 
                    onClick={() => openModal('profile')}
                    className="flex items-center gap-3 cursor-pointer"
                >
                     <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px] group-hover:scale-105 transition-transform">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-bold text-white text-lg">
                                {user?.name.charAt(0)}
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-black text-[10px] border border-gray-600 px-1 rounded text-yellow-400 font-bold shadow-sm">
                            LV.{level}
                        </div>
                     </div>
                     <div>
                         <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                            {user?.nickname || user?.name}
                         </p>
                         <div className="w-24 h-1.5 bg-gray-800 rounded-full mt-1 relative overflow-hidden border border-white/5">
                             <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{width: `${progress}%`}}></div>
                         </div>
                         <p className="text-[9px] text-gray-400 mt-0.5">{db.GAMIFICATION.points} XP</p>
                     </div>
                </div>
                
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => openModal('profile')} 
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Hồ sơ"
                    >
                        ⚙️
                    </button>
                    <button 
                        onClick={() => openModal('security')} 
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                        title="Đổi Mật khẩu"
                    >
                        🔒
                    </button>
                </div>
            </div>
            <AccountSettingsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialTab={modalTab} />
        </>
    );
};

const ShopModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { db, buyShopItem, equipShopItem } = useContext(DataContext)!;
    const { points, diamonds, inventory, equippedSkin } = db.GAMIFICATION;

    const handleBuy = (itemId: string) => {
        try {
            buyShopItem(itemId);
            alert("Mua thành công!");
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleEquip = (itemId: string) => {
        try {
            equipShopItem(itemId);
        } catch (e: any) {
            alert(e.message);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cửa Hàng & Kho Đồ" size="xl">
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-xs text-gray-400">XP</p>
                            <p className="text-xl font-bold text-yellow-400">{points}</p>
                        </div>
                        <div className="h-8 w-px bg-gray-600"></div>
                        <div className="text-center">
                            <p className="text-xs text-gray-400">Kim cương</p>
                            <p className="text-xl font-bold text-blue-400">💎 {diamonds}</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-400 italic">Dùng XP mua Skin, dùng Kim cương mua Hiệu ứng VIP</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {db.SHOP_ITEMS.map(item => {
                        const isOwned = inventory.includes(item.id);
                        const isEquipped = equippedSkin === item.id;
                        const canAfford = item.currency === 'diamond' ? diamonds >= item.cost : points >= item.cost;

                        return (
                            <div key={item.id} className={`card p-4 relative group ${isEquipped ? 'border-green-500 bg-green-900/10' : ''}`}>
                                {isEquipped && <span className="absolute top-2 right-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Đang dùng</span>}
                                <div className="text-4xl mb-3 text-center filter drop-shadow-md">{item.icon}</div>
                                <h3 className="text-lg font-bold text-white text-center">{item.name}</h3>
                                <p className="text-xs text-gray-400 text-center mb-4 min-h-[32px]">{item.description}</p>
                                
                                {isOwned ? (
                                    <button 
                                        onClick={() => handleEquip(item.id)}
                                        disabled={isEquipped}
                                        className={`btn w-full text-sm ${isEquipped ? 'btn-secondary cursor-default opacity-50' : 'btn-primary'}`}
                                    >
                                        {isEquipped ? 'Đã trang bị' : 'Trang bị'}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleBuy(item.id)}
                                        className={`btn w-full text-sm flex justify-center items-center gap-2 ${canAfford ? 'btn-secondary border-blue-400 text-blue-300 hover:bg-blue-900/20' : 'opacity-50 cursor-not-allowed border border-gray-600'}`}
                                        disabled={!canAfford}
                                    >
                                        <span>{item.currency === 'diamond' ? '💎' : 'XP'}</span>
                                        <span>{item.cost}</span>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
};

const StudentDashboardPage: React.FC = () => {
    const { user } = useContext(AuthContext)!;
    const { db, toggleCourseBookmark } = useContext(DataContext)!;
    const { navigate } = useContext(PageContext)!;
    const [isShopOpen, setIsShopOpen] = useState(false);

    const courses = useMemo(() => db.COURSES.map(course => ({
        ...course,
        progress: db.ANALYTICS[course.id]?.progress || 0,
        grade: db.ANALYTICS[course.id]?.grade || 'N/A',
    })), [db.COURSES, db.ANALYTICS]);

    const gamification = db.GAMIFICATION;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 0 && hour <= 10) return "Chào buổi sáng";
        if (hour >= 11 && hour <= 12) return "Chào buổi trưa";
        if (hour >= 13 && hour <= 17) return "Chào buổi chiều";
        return "Chào buổi tối";
    };
    
    const greeting = getGreeting();

    if (!user) return null;

    return (
        <div className="space-y-8 md:space-y-12 pb-20">
            {/* TOP BAR WIDGETS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
                <RealTimeWeatherWidget />
                <div className="hidden lg:block"><MusicWidget /></div>
                <div className="hidden lg:block"><FocusTimerWidget /></div>
                <AccountManagerWidget />
            </div>

            {/* HERO ISLAND */}
            <div id="dashboard-hero" className="relative rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 overflow-hidden bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-white/30 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] group hover:scale-[1.01] transition-transform duration-700">
                <StreakWidget />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-pink-400/20 to-blue-400/20 rounded-full blur-[100px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-10">
                    <div className="space-y-4 md:space-y-6 max-w-2xl text-center md:text-left">
                         <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/10 border border-white/20 text-blue-200 text-[10px] md:text-xs font-bold tracking-widest shadow-inner">
                            <span>🚀</span> PHI HÀNH GIA CẤP ĐỘ 1
                         </div>
                         <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg">
                            {greeting}, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-pink-300 filter drop-shadow-sm">
                                {user.nickname || user.name}
                            </span>
                         </h1>
                         <p className="text-blue-100 text-base md:text-xl font-light">
                            Bầu trời tri thức đang chờ bạn khám phá. Hãy bắt đầu hành trình hôm nay!
                         </p>
                         <div className="flex gap-4 pt-4 justify-center md:justify-start">
                            <button id="hero-continue-btn" onClick={() => navigate('assignment_hub')} className="btn btn-primary px-8 md:px-10 py-3 md:py-4 text-base md:text-lg rounded-full shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_15px_40px_rgba(59,130,246,0.6)]">
                                🌟 Tiếp Tục Hành Trình
                            </button>
                         </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: COURSES */}
                <div className="lg:col-span-8 space-y-6 md:space-y-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                            <span className="text-3xl md:text-4xl">🔭</span> Các Điểm Đến (Khóa học)
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/30 to-transparent"></div>
                    </div>
                    
                    <div id="course-list" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {courses.map(course => (
                            <div 
                                key={course.id} 
                                onClick={() => navigate('course_detail', { courseId: course.id })}
                                className="card p-6 md:p-8 group cursor-pointer hover:bg-white/10 transition-all duration-500 relative"
                            >
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleCourseBookmark(course.id); }}
                                    className={`absolute top-4 right-4 text-xl transition-transform hover:scale-125 ${course.isBookmarked ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-200'}`}
                                >
                                    ★
                                </button>

                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/20 flex items-center justify-center text-2xl md:text-3xl shadow-inner group-hover:scale-110 transition-transform">
                                        📚
                                    </div>
                                    <span className="px-3 py-1 rounded-lg bg-black/20 text-xs font-mono text-blue-200">{course.id}</span>
                                </div>
                                
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-sky-300 transition-colors line-clamp-1">{course.name}</h3>
                                <p className="text-sm text-gray-300 mb-6 flex items-center gap-2">
                                    <span>👨‍🏫</span> {course.teacher}
                                </p>
                                
                                <div className="relative pt-2">
                                    <div className="flex justify-between text-xs font-bold mb-2 text-blue-200">
                                        <span>TIẾN ĐỘ HOÀN THÀNH</span>
                                        <span>{course.progress}%</span>
                                    </div>
                                    <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                        <div 
                                            className="h-full bg-gradient-to-r from-sky-400 to-purple-400 relative shadow-[0_0_10px_rgba(56,189,248,0.5)]" 
                                            style={{ width: `${course.progress}%` }}
                                        >
                                            <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={(e) => {e.stopPropagation(); alert("Đã tải xuống nội dung để học offline (Mock)"); }} className="absolute bottom-4 right-4 text-gray-500 hover:text-white text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    ⬇ Offline
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: STATS & DATA */}
                <div className="lg:col-span-4 space-y-6 md:space-y-8">
                    {/* Gamification Treasure Chest */}
                    <div id="treasure-chest" className="card p-6 md:p-8 border-yellow-400/30 bg-gradient-to-b from-yellow-900/10 to-transparent relative overflow-hidden group">
                        <div className="absolute -right-12 -top-12 w-40 h-40 bg-yellow-500/30 rounded-full blur-[60px] group-hover:blur-[80px] transition-all"></div>
                        
                        <h3 className="text-lg md:text-xl font-bold text-yellow-100 mb-6 flex items-center gap-3">
                            <span className="text-2xl">🏆</span> KHO BÁU CỦA BẠN
                        </h3>
                        
                        {/* Stats Row */}
                        <div className="flex flex-col sm:flex-row items-stretch gap-4 mb-6">
                            <div className="flex-1 bg-black/20 p-4 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col justify-center">
                                <p className="text-[10px] text-yellow-200/70 uppercase font-bold tracking-wider mb-1">TỔNG KINH NGHIỆM</p>
                                <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-400 drop-shadow-sm">
                                    {gamification.points} XP
                                </p>
                                <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-yellow-400 h-full w-3/4"></div>
                                </div>
                            </div>
                            <div className="flex-1 bg-black/20 p-4 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="text-4xl mb-1 animate-float">💎</div>
                                <p className="text-2xl font-black text-blue-300">{gamification.diamonds}</p>
                                <div className="absolute inset-0 bg-blue-500/10 blur-xl"></div>
                            </div>
                        </div>
                        
                        {/* Shop Buttons */}
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => setIsShopOpen(true)} className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center hover:bg-white/10 hover:scale-105 transition-all cursor-pointer shadow-lg group/btn">
                                <span className="text-2xl mb-1 group-hover/btn:scale-110 transition-transform">🚀</span>
                                <span className="text-[10px] font-bold text-gray-400">Hiệu ứng</span>
                            </button>
                            <button onClick={() => setIsShopOpen(true)} className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center hover:bg-white/10 hover:scale-105 transition-all cursor-pointer shadow-lg group/btn">
                                <span className="text-2xl mb-1 group-hover/btn:scale-110 transition-transform">📚</span>
                                <span className="text-[10px] font-bold text-gray-400">Giao diện</span>
                            </button>
                            <button onClick={() => setIsShopOpen(true)} className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center hover:bg-white/10 hover:scale-105 transition-all cursor-pointer shadow-lg group/btn">
                                <span className="text-2xl mb-1 group-hover/btn:scale-110 transition-transform">🦉</span>
                                <span className="text-[10px] font-bold text-gray-400">Trang phục</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <LeaderboardWidget />
                        <ScratchpadWidget />
                    </div>

                    {/* Magic Portals */}
                    <div className="space-y-4">
                         <button id="btn-portal-ai" onClick={() => navigate('gemini_student')} className="w-full p-5 rounded-3xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-400/30 text-left hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(192,132,252,0.3)] transition-all group backdrop-blur-md">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🔮</span>
                                    <span className="font-bold text-purple-100 text-lg">Hỏi Nhà Tiên Tri AI</span>
                                </div>
                                <span className="text-purple-300 group-hover:translate-x-2 transition-transform bg-white/10 p-2 rounded-full">➔</span>
                            </div>
                            <p className="text-sm text-purple-200/60 mt-2 pl-10">Giải đáp, Phân tích Ảnh & Video</p>
                         </button>
                         
                         <button id="btn-portal-tree" onClick={() => navigate('assignment_hub')} className="w-full p-5 rounded-3xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-400/30 text-left hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all group backdrop-blur-md">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🌳</span>
                                    <span className="font-bold text-emerald-100 text-lg">Cây Tri Thức</span>
                                </div>
                                <span className="text-emerald-300 group-hover:translate-x-2 transition-transform bg-white/10 p-2 rounded-full">➔</span>
                            </div>
                            <p className="text-sm text-emerald-200/60 mt-2 pl-10">Leo lên đỉnh cao học vấn</p>
                         </button>
                    </div>
                </div>
            </div>
            
            <ShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
        </div>
    );
};
export default StudentDashboardPage;
