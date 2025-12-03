
// User & Auth
export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SYSTEM';
export interface User {
  id: string;
  password?: string;
  name: string;
  role: UserRole;
  isLocked: boolean;
  apiKey: string | null;
  squadronId?: string; // Linked Squadron
  hasSeenOnboarding?: boolean; // NEW: Track if user has seen the tour
}

// Course & Content
export type ModuleItemType = 'lesson' | 'assignment';
export interface ModuleItem {
  type: ModuleItemType;
  id: string;
}
export interface CourseModule {
  id: string;
  name: string;
  items: ModuleItem[];
}
export interface CourseStructure {
  modules: CourseModule[];
}
export interface Course {
  id: string;
  name: string;
  teacher: string;
  isBookmarked?: boolean; // NEW: Bookmark feature
}

export type LessonType = 'video' | 'text';
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  type: LessonType;
  content: string;
}

// Assignments & Submissions
export type AssignmentType = 'file' | 'quiz';
export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  type: AssignmentType;
  quizId?: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
}

export type SubmissionStatus = 'Chưa nộp' | 'Đã nộp';
export interface FileSubmission {
  id: string;
  studentId: string;
  studentName: string;
  status: SubmissionStatus;
  grade: number | null;
  feedback: string | null;
  fileName: string | null;
  timestamp: string | null;
}

export interface QuizSubmission {
  score: number;
  total: number;
  percentage: number;
  timestamp: string;
  answers: Record<string, number>;
}

// Flashcards & Learning Path
export interface Flashcard {
    id: string;
    front: string;
    back: string;
    // SRS Fields (Spaced Repetition)
    box: number; // Leitner box (0 = New/Hard, 5 = Mastered)
    nextReview: number; // Timestamp
    lastReviewed?: number; // Timestamp
}

export interface FlashcardDeck {
    id: string;
    courseId: string;
    moduleId: string;
    title: string;
    cards: Flashcard[];
}

// --- NEW: Duolingo Style Learning Path ---
export type NodeType = 'theory' | 'practice' | 'challenge';

// Exam Question Type for Level Checkpoint
export type ExamQuestionType = 'mcq' | 'fill_gap' | 'short_answer';
export interface ExamQuestion {
    id: string;
    type: ExamQuestionType;
    question: string;
    options?: string[]; // For MCQ
    correctAnswer: string; // Store string for all types (index for MCQ)
    explanation?: string; // AI explanation for the answer
}

export interface LearningNode {
    id: string;
    title: string;
    description: string;
    type: NodeType;
    isLocked: boolean;
    isCompleted: boolean;
    
    // Progress Tracking
    flashcards: Flashcard[]; // Persist cards for SRS
    flashcardsMastered: number; // Goal: > 20
    isExamUnlocked: boolean;
    examScore: number | null; // Goal: > 40%
}

export interface LearningPath {
    id: string;
    creatorId: string;
    title: string;
    topic: string;
    nodes: LearningNode[];
    createdAt: string;
    // Personalization
    targetLevel: 'Beginner' | 'Intermediate' | 'Advanced';
    goal: string;
    dailyCommitment: string;
}

export interface PlacementTestQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
}

// NEW: Note for Learning Node
export interface NodeNote {
    id: string;
    userId: string;
    pathId: string;
    nodeId: string;
    content: string;
    lastUpdated: string;
}

// NEW: Personal Notebook (Notion-like)
export interface PersonalNote {
    id: string;
    userId: string;
    title: string;
    content: string;
    tags: string[];
    // Linking context
    linkedAssignmentId?: string;
    linkedPathId?: string;
    createdAt: string;
    updatedAt: string;
    isPinned?: boolean;
}
// -----------------------------------------

// Communication & Collaboration
export interface DiscussionPost {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
}
export interface ChatMessage {
  id: string;
  from: string;
  text: string;
  timestamp: Date;
}

export interface GroupChatMessageUser {
  id: string;
  name: string;
  role: UserRole;
}
export interface GroupChatMessage {
  id: string;
  user: GroupChatMessageUser;
  text: string;
  timestamp: Date;
}

export interface SquadronMission {
    id: string;
    title: string;
    target: number;
    current: number;
    reward: number; // XP or Diamonds
    type: 'chat_activity' | 'quiz_score';
}

export interface StudyGroup {
  id: string;
  name: string;
  members: string[];
  mission?: SquadronMission; // Active mission
}

// Interactive Video Notes
export interface VideoNote {
  id: string;
  userId: string;
  lessonId: string;
  timestamp: number; // seconds
  text: string;
  createdAt: string;
}

// Shop & Gamification
export interface ShopItem {
  id: string;
  name: string;
  type: 'skin' | 'effect' | 'outfit';
  cost: number;
  currency: 'xp' | 'diamond';
  icon: string;
  description: string;
  cssClass: string; // Tailwind classes to apply to the flashcard
}

// Admin & System
export interface AccessLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

export interface WafLog {
  id: string;
  ip: string;
  type: 'SQLi' | 'XSS' | 'CSRF';
  path: string;
  timestamp: Date;
}

export interface Announcement {
    id: string;
    text: string;
    timestamp: Date;
    readBy?: string[];
}

export type ServiceStatusValue = 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL';
export type ServiceName =
  | 'user_management' | 'course_management' | 'content_delivery' | 'assessment_taking'
  | 'storage_service' | 'grading_service' | 'notification_service' | 'chat_service'
  | 'group_service' | 'forum_service' | 'ai_tutor_service' | 'ai_assistant_service'
  | 'personalization' | 'analytics';

export type ServiceStatus = Record<ServiceName, ServiceStatusValue>;

export type FeatureFlagStatus = 'OFF' | 'SPECIFIC' | 'ALL';
export interface FeatureFlag {
  status: FeatureFlagStatus;
  specificUsers: string;
}
export type FeatureFlags = Record<string, FeatureFlag>;

export type MockTestResultStatus = 'RUNNING' | 'PASS' | 'FAIL' | null;
export interface MockTestResults {
    unit: MockTestResultStatus;
    integration: MockTestResultStatus;
    e2e: MockTestResultStatus;
}


// Gemini API
export interface GeminiChatMessage {
    role: 'user' | 'model';
    parts: { 
        text?: string;
        inlineData?: {
            mimeType: string;
            data: string;
        } 
    }[];
}

// --- MUSIC PLAYER ---
export interface Track {
    id: string;
    file: File;
    name: string;
    date: number;
}

export interface MusicContextType {
    isPlaying: boolean;
    togglePlay: () => void;
    playlist: Track[];
    currentTrack: Track | null;
    currentTime: number;
    duration: number;
    volume: number;
    setVolume: (v: number) => void;
    seek: (time: number) => void;
    loopMode: 'off' | 'all' | 'one';
    cycleLoopMode: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    playTrack: (index: number) => void;
    addTracks: (files: File[]) => void;
    deleteTrack: (id: string) => void;
    audioElement: HTMLAudioElement | null; // Expose for Visualizer
}


// Database Schema
export interface Database {
  USERS: Record<string, User>;
  COURSES: Course[];
  COURSE_STRUCTURE: Record<string, CourseStructure>;
  LESSONS: Record<string, Lesson>;
  ASSIGNMENTS: Record<string, Assignment>;
  QUIZZES: Record<string, Quiz>;
  FILE_SUBMISSIONS: Record<string, FileSubmission[]>;
  QUIZ_SUBMISSIONS: Record<string, Record<string, QuizSubmission | null>>;
  ANALYTICS: Record<string, { progress: number; grade: string }>;
  DISCUSSION: Record<string, DiscussionPost[]>;
  RECOMMENDATIONS: { id: string; title: string; service: string }[];
  FALLBACK_CONTENT: { id: string; title: string; service: string }[];
  ACCESS_LOGS: AccessLog[];
  BACKUP_STATUS: { lastBackup: string; status: string; nextBackup: string };
  ANNOUNCEMENTS: Announcement[];
  GAMIFICATION: { 
      points: number; 
      diamonds: number; // Currency 2
      badges: { id: string; name: string; icon: string }[];
      inventory: string[]; // Owned ShopItem IDs
      equippedSkin: string; // Active Skin ID
      lastStudyDate: string | null; // For daily streaks/rewards
      streakDays: number; // NEW: Streak
  };
  SHOP_ITEMS: ShopItem[]; // Available items
  STUDY_GROUPS: StudyGroup[];
  CHAT_MESSAGES: Record<string, ChatMessage[]>;
  GROUP_CHAT_MESSAGES: Record<string, GroupChatMessage[]>;
  WAF_LOGS: WafLog[];
  MOCK_TEST_RESULTS: MockTestResults;
  VIDEO_NOTES: Record<string, VideoNote[]>;
  FLASHCARD_DECKS: Record<string, FlashcardDeck>;
  LESSON_PROGRESS: Record<string, string[]>; // userId -> list of completed lessonIds
  LEARNING_PATHS: Record<string, LearningPath>; // NEW: Store generated learning paths
  SCRATCHPAD: Record<string, string>; // NEW: Simple notes per user
  NODE_NOTES: Record<string, NodeNote>; // Notes for specific learning nodes. Key: pathId_nodeId_userId
  PERSONAL_NOTES: Record<string, PersonalNote>; // NEW: Centralized Notebook
}

// Context Types
export interface AuthContextType {
  user: { id: string; name: string; role: UserRole; hasSeenOnboarding?: boolean } | null;
  error: string | null;
  login: (id: string, password?: string) => void;
  logout: () => void;
  isLocked: boolean;
}

export interface DataContextType {
  db: Database;
  registerUser: (id: string, password: string, name: string, role: UserRole) => void;
  toggleUserLock: (userId: string) => void;
  unlockAllUsers: () => void; // NEW
  setApiKey: (userId: string, apiKey: string) => void;
  editLessonContent: (lessonId: string, newContent: string) => void;
  createFileAssignment: (title: string, courseId: string) => void;
  createQuizAssignment: (title: string, courseId: string, questions: QuizQuestion[]) => void;
  submitFileAssignment: (assignmentId: string, studentId: string, fileName: string) => void;
  submitQuiz: (quizId: string, studentId: string, answers: Record<string, number>) => void;
  gradeFileSubmission: (assignmentId: string, studentId: string, grade: number, feedback: string) => void;
  sendChatMessage: (fromId: string, toId: string, text: string) => void;
  joinGroup: (groupId: string, userId: string) => void;
  createGroup: (name: string, creatorId: string) => void; // NEW: Create Group
  sendGroupMessage: (groupId: string, user: { id: string; name: string; role: UserRole }, text: string) => void;
  addDiscussionPost: (lessonId: string, user: { id: string; name: string }, text: string) => void;
  sendAnnouncement: (text: string) => void;
  dismissAnnouncement: (annId: string) => void;
  runMockTest: (testType: keyof MockTestResults) => void;
  addVideoNote: (lessonId: string, userId: string, timestamp: number, text: string) => void;
  deleteVideoNote: (lessonId: string, noteId: string) => void;
  markLessonComplete: (userId: string, lessonId: string) => void;
  createLearningPath: (creatorId: string, title: string, topic: string, nodes: LearningNode[], meta: { level: string, goal: string, time: string }) => void;
  
  // NEW FUNCTIONS for Interactive Learning Path
  updateNodeProgress: (pathId: string, nodeId: string, data: Partial<LearningNode>) => void;
  unlockNextNode: (pathId: string, currentNodeId: string) => void;
  extendLearningPath: (pathId: string, newNodes: LearningNode[]) => void;
  saveNodeNote: (userId: string, pathId: string, nodeId: string, content: string) => void; // NEW
  
  // NOTEBOOK FUNCTIONS
  createPersonalNote: (userId: string, title: string, content: string, links?: { assignmentId?: string, pathId?: string }) => void;
  updatePersonalNote: (noteId: string, data: Partial<PersonalNote>) => void;
  deletePersonalNote: (noteId: string) => void;

  // Shop & Gamification
  buyShopItem: (itemId: string) => void;
  equipShopItem: (itemId: string) => void;
  checkDailyDiamondReward: () => boolean; // Returns true if reward claimed
  updateScratchpad: (userId: string, content: string) => void; // NEW
  toggleCourseBookmark: (courseId: string) => void; // NEW
  
  // Onboarding
  completeOnboarding: (userId: string) => void;
}

export interface GlobalStateContextType {
  featureFlags: FeatureFlags;
  setFeatureFlag: (key: string, newStatus: FeatureFlagStatus, newUsers?: string) => void;
  serviceStatus: ServiceStatus;
  toggleServiceStatus: (serviceKey: ServiceName) => void;
  page: string;
  pageParams: Record<string, any>;
  setPage: (pageName: string, params?: Record<string, any>) => void;
}

export interface PageContextType {
  page: string;
  params: Record<string, any>;
  navigate: (pageName: string, pageParams?: Record<string, any>) => void;
}