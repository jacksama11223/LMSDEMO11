
import type { Database } from '../types';

export const MOCK_DATA: Database = {
  // --- Người dùng & Xác thực ---
  USERS: {
    "sv001": { id: "sv001", password: "1", name: "Hoàng Đăng Quang", role: "STUDENT", isLocked: false, apiKey: null, squadronId: 'g2', hasSeenOnboarding: false },
    "gv001": { id: "gv001", password: "1", name: "Nguyễn Đăng Bắc", role: "TEACHER", isLocked: false, apiKey: null, hasSeenOnboarding: false },
    "qt001": { id: "qt001", password: "1", name: "Hoàng Đăng Quang", role: "ADMIN", isLocked: false, apiKey: null, hasSeenOnboarding: false },
    "sv002": { id: "sv002", password: "1", name: "Lê Thị C", role: "STUDENT", isLocked: false, apiKey: null, squadronId: 'g1', hasSeenOnboarding: false },
    "sv003": { id: "sv003", password: "1", name: "Phạm Văn D", role: "STUDENT", isLocked: false, apiKey: null, squadronId: 'g2', hasSeenOnboarding: false },
  },

  // --- Khóa học & Cấu trúc ---
  COURSES: [
    { id: "CS101", name: "Nhập môn Trí tuệ Nhân tạo", teacher: "Nguyễn Trùng Lập" },
    { id: "CS202", name: "Kiến trúc Phần mềm", teacher: "Nguyễn Đăng Bắc" },
    { id: "MA101", name: "Giải tích 1", teacher: "Nguyễn Khắc Huy" },
  ],
  COURSE_STRUCTURE: {
    CS101: {
      modules: [
        { id: "m1", name: "Chương 1: Giới thiệu về AI", items: [{type: 'lesson', id: 'l1'}, {type: 'lesson', id: 'l2'}, {type: 'assignment', id: 'a001'}, {type: 'assignment', id: 'q002'}] },
        { id: "m2", name: "Chương 2: Học máy Cơ bản", items: [{type: 'lesson', id: 'l3'}, {type: 'lesson', id: 'l4'}] },
      ]
    },
    CS202: {
       modules: [
        { id: "m3", name: "Chương 1: Nguyên tắc Thiết kế", items: [{type: 'lesson', id: 'l5'}] },
        { id: "m4", name: "Chương 2: Microservices", items: [{type: 'lesson', id: 'l6'}, {type: 'assignment', id: 'a002'}, {type: 'assignment', id: 'q001'}] },
      ]
    },
    MA101: { modules: [] }
  },
  LESSONS: {
    "l1": { id: "l1", courseId: "CS101", title: "Video: AI là gì?", type: "video", content: "https://www.youtube.com/embed/ad79nYk2keg?si=J0E-i7F-0zX_0a1X" },
    "l2": { id: "l2", courseId: "CS101", title: "Bài đọc: Lịch sử của AI", type: "text", content: "Trí tuệ nhân tạo (AI) là một lĩnh vực của khoa học máy tính tập trung vào việc tạo ra các máy móc thông minh có thể thực hiện các nhiệm vụ thường đòi hỏi trí thông minh của con người, chẳng hạn như nhận dạng giọng nói, ra quyết định và dịch ngôn ngữ.\n\nNguồn gốc của AI hiện đại có thể bắt nguồn từ giữa thế kỷ 20. Alan Turing, một nhà toán học và logic học người Anh, thường được coi là cha đẻ của khoa học máy tính lý thuyết và AI. Bài báo năm 1950 của ông, \"Máy tính và Trí thông minh\", đã giới thiệu Thử nghiệm Turing như một tiêu chí về trí thông minh của máy móc.\n\nHội nghị Dartmouth năm 1956 được nhiều người coi là sự kiện khai sinh ra AI như một lĩnh vực nghiên cứu. John McCarthy, Marvin Minsky, Nathaniel Rochester và Claude Shannon đã tổ chức hội thảo này, nơi thuật ngữ \"trí tuệ nhân tạo\" được đặt ra.\n\nNhững năm đầu tiên của AI đầy lạc quan, với các nhà nghiên cứu tin rằng máy móc thông minh như con người chỉ còn là vấn đề thời gian. Tuy nhiên, tiến độ chậm lại vào những năm 1970 và 1980, một giai đoạn được gọi là \"mùa đông AI\", do những hạn chế về sức mạnh tính toán và sự phức tạp của các vấn đề trong thế giới thực.\n\nAI đã trải qua một sự hồi sinh vào những năm 1990 và 2000, được thúc đẩy bởi sức mạnh tính toán ngày càng tăng, lượng dữ liệu lớn sẵn có và sự phát triển của các thuật toán học máy mới. Ngày nay, AI là một lĩnh vực đang phát triển nhanh chóng với các ứng dụng trong hầu hết mọi ngành công nghiệp." },
    "l3": { id: "l3", courseId: "CS101", title: "Video: Hồi quy Tuyến tính", type: "video", content: "https://www.youtube.com/embed/zPG4NjIkCjc?si=J0E-i7F-0zX_0a1X" },
    "l4": { id: "l4", courseId: "CS101", title: "Bài đọc: Cây Quyết định", type: "text", content: "Cây quyết định là một mô hình học máy có giám sát, phi tham số được sử dụng cho cả nhiệm vụ phân loại và hồi quy. Nó hoạt động bằng cách phân vùng đệ quy không gian đặc trưng thành các vùng nhỏ hơn.\n\nCấu trúc của cây quyết định bao gồm:\n* **Nút gốc (Root Node):** Đại diện cho toàn bộ tập dữ liệu.\n* **Nút trong (Internal Node):** Đại diện cho một bài kiểm tra trên một thuộc tính.\n* **Nhánh (Branch):** Đại diện cho kết quả của bài kiểm tra.\n* **Nút lá (Leaf Node):** Đại diện cho một nhãn lớp (trong phân loại) hoặc một giá trị số (trong hồi quy).\n\nQuá trình xây dựng cây quyết định bao gồm việc chọn thuộc tính tốt nhất để phân chia dữ liệu tại mỗi nút, thường dựa trên các tiêu chí như Độ lợi thông tin (Information Gain) hoặc Chỉ số Gini. Quá trình này tiếp tục cho đến khi đạt được một tiêu chí dừng (ví dụ: tất cả các điểm dữ liệu trong một nút thuộc cùng một lớp, hoặc đạt đến độ sâu tối đa).\n\UnnƯu điểm của cây quyết định bao gồm tính dễ diễn giải và khả năng xử lý cả dữ liệu số và dữ liệu hạng mục. Tuy nhiên, chúng có thể dễ bị overfitting (quá khớp) với dữ liệu huấn luyện." },
    "l5": { id: "l5", courseId: "CS202", title: "Bài đọc: SOLID", type: "text", content: "SOLID là một từ viết tắt đại diện cho năm nguyên tắc thiết kế cơ bản trong lập trình hướng đối tượng, nhằm mục đích làm cho các thiết kế phần mềm dễ hiểu, linh hoạt và dễ bảo trì hơn.\n\n1.  **S - Single Responsibility Principle (Nguyên tắc Đơn trách nhiệm):** Một lớp chỉ nên có một lý do duy nhất để thay đổi. Nghĩa là, một lớp chỉ nên chịu trách nhiệm về một phần chức năng cụ thể.\n2.  **O - Open/Closed Principle (Nguyên tắc Đóng/Mở):** Các thực thể phần mềm (lớp, mô-đun, hàm, v.v.) nên mở để mở rộng nhưng đóng để sửa đổi. Điều này có nghĩa là bạn có thể thêm chức năng mới mà không cần thay đổi mã hiện có.\n3.  **L - Liskov Substitution Principle (Nguyên tắc Thay thế Liskov):** Các đối tượng của một lớp cha phải có thể thay thế bằng các đối tượng của các lớp con mà không làm thay đổi tính đúng đắn của chương trình.\n4.  **I - Interface Segregation Principle (Nguyên tắc Phân tách Giao diện):** Client không nên bị buộc phải phụ thuộc vào các giao diện mà chúng không sử dụng. Tốt hơn là nên có nhiều giao diện cụ thể thay vì một giao diện lớn, đa mục đích.\n5.  **D - Dependency Inversion Principle (Nguyên tắc Đảo ngược Phụ thuộc):** Các mô-đun cấp cao không nên phụ thuộc vào các mô-đun cấp thấp. Cả hai nên phụ thuộc vào các trừu tượng (ví dụ: giao diện). Các trừu tượng không nên phụ thuộc vào chi tiết. Chi tiết nên phụ thuộc vào các trừu tượng." },
    "l6": { id: "l6", courseId: "CS202", title: "Video: API Gateway và BFF", type: "video", content: "https://www.youtube.com/embed/rNZAna4xXKI?si=J0E-i7F-0zX_0a1X" },
  },

  // --- Bài tập & Quiz ---
  ASSIGNMENTS: {
    "a001": { id: "a001", courseId: "CS101", title: "Bài tập: AI là gì?", type: "file" },
    "a002": { id: "a002", courseId: "CS202", title: "Bài tập: Thiết kế hệ thống LMS", type: "file" },
    "q001": { id: "q001", courseId: "CS202", title: "Quiz: Microservices Basics", type: "quiz", quizId: "qz001" },
    "q002": { id: "q002", courseId: "CS101", title: "Quiz: Lịch sử AI (Gemini)", type: "quiz", quizId: "qz002" },
  },
  QUIZZES: {
    "qz001": {
      id: "qz001",
      questions: [
        { id: "qz001_q1", text: "Microservice giao tiếp với nhau qua đâu là phổ biến nhất?", options: ["Database Sharing", "RPC", "REST API", "Message Queue"], correctAnswer: 2 },
        { id: "qz001_q2", text: "Mẫu kiến trúc nào giúp điều phối request từ client đến các microservice?", options: ["Service Discovery", "Circuit Breaker", "API Gateway", "Saga"], correctAnswer: 2 },
      ]
    },
    "qz002": {
      id: "qz002",
      questions: [
         { id: "q_gemini_1729000000000_0", text: "Ai được coi là 'cha đẻ của AI'?", options: ["Alan Turing", "John McCarthy", "Marvin Minsky", "Geoffrey Hinton"], correctAnswer: 1 },
         { id: "q_gemini_1729000000000_1", text: "Hội nghị Dartmouth năm 1956 đánh dấu sự ra đời chính thức của thuật ngữ nào?", options: ["Machine Learning", "Neural Network", "Artificial Intelligence", "Deep Learning"], correctAnswer: 2 },
         { id: "q_gemini_1729000000000_2", text: "Thử nghiệm Turing được thiết kế để đánh giá điều gì ở máy móc?", options: ["Tốc độ tính toán", "Khả năng lưu trữ", "Trí thông minh giống con người", "Hiệu quả năng lượng"], correctAnswer: 2 },
      ]
    }
  },
  FILE_SUBMISSIONS: {
    "a001": [
      { id: "sub_sv001_a001", studentId: "sv001", studentName: "Hoàng Đăng Quang", status: "Chưa nộp", grade: null, feedback: null, fileName: null, timestamp: null },
      { id: "sub_sv002_a001", studentId: "sv002", studentName: "Lê Thị C", status: "Chưa nộp", grade: null, feedback: null, fileName: null, timestamp: null },
      { id: "sub_sv003_a001", studentId: "sv003", studentName: "Phạm Văn D", status: "Chưa nộp", grade: null, feedback: null, fileName: null, timestamp: null },
    ],
    "a002": [
      { id: "sub_sv001_a002", studentId: "sv001", studentName: "Hoàng Đăng Quang", status: "Đã nộp", grade: null, feedback: null, fileName: "thiet_ke_he_thong_v1.docx", timestamp: "2025-10-27T14:30:00Z" },
      { id: "sub_sv002_a002", studentId: "sv002", studentName: "Lê Thị C", status: "Chưa nộp", grade: null, feedback: null, fileName: null, timestamp: null },
      { id: "sub_sv003_a002", studentId: "sv003", studentName: "Phạm Văn D", status: "Đã nộp", grade: 8.5, feedback: "Làm tốt, cần chi tiết hơn ở phần 2.", fileName: "lms_report_final.docx", timestamp: "2025-10-28T09:15:00Z" },
    ]
  },
  QUIZ_SUBMISSIONS: {
    "qz001": {},
    "qz002": {
       "sv001": { score: 3, total: 3, percentage: 100.0, timestamp: "2025-10-28T10:00:00Z", answers: {"q_gemini_1729000000000_0": 1, "q_gemini_1729000000000_1": 2, "q_gemini_1729000000000_2": 2 } }
    }
  },

  // --- Tính năng khác ---
  ANALYTICS: {
    CS101: { progress: 75, grade: "A-" },
    CS202: { progress: 40, grade: "B" },
    MA101: { progress: 90, grade: "A" },
  },
  DISCUSSION: {
    "l2": [
      { id: "d1", user: "sv002 (Lê Thị C)", text: "Bài đọc này rất thú vị!", timestamp: new Date(Date.now() - 800000)},
      { id: "d2", user: "sv003 (Phạm Văn D)", text: "Ai giải thích thêm về hội nghị Dartmouth không?", timestamp: new Date(Date.now() - 700000)},
      { id: "d3", user: "gv001 (Nguyễn Trùng Lập)", text: "Hội nghị Dartmouth 1956 là nơi thuật ngữ AI ra đời, tập hợp các nhà nghiên cứu tiên phong.", timestamp: new Date(Date.now() - 600000) }
    ]
  },
  RECOMMENDATIONS: [
    { id: "r1", title: "Video: Mạng Neural Nâng cao", service: "Personalization Service" },
    { id: "r2", title: "Bài đọc: Đạo đức trong AI", service: "Personalization Service" },
  ],
  FALLBACK_CONTENT: [
    { id: "f1", title: "Khám phá các khóa học nổi bật", service: "Fallback Service" }
  ],
  ACCESS_LOGS: [
    { id: "l1", user: "ADMIN (Hoàng Đăng Quang)", action: "Toggled service 'personalization' to DEGRADED", timestamp: new Date(Date.now() - 120000).toISOString() },
    { id: "l2", user: "TEACHER (Nguyễn Trùng Lập)", action: "Graded assignment a002 for Phạm Văn D", timestamp: new Date(Date.now() - 300000).toISOString() },
    { id: "l3", user: "STUDENT (Hoàng Đăng Quang)", action: "Submitted quiz q002", timestamp: new Date(Date.now() - 600000).toISOString() },
  ],
  BACKUP_STATUS: {
    lastBackup: new Date(Date.now() - 3600000).toISOString(),
    status: "Thành công",
    nextBackup: new Date(Date.now() + (24 * 3600000 - 3600000)).toISOString(),
  },
  ANNOUNCEMENTS: [
      { id: 'ann_1728000000000', text: 'Hệ thống sẽ bảo trì vào lúc 2h sáng mai.', timestamp: new Date(Date.now() - 10 * 3600000) }
  ],
  GAMIFICATION: {
    points: 1250,
    diamonds: 15, // Currency 2
    badges: [
      { id: 'b1', name: 'Người Tiên phong', icon: '🚀' },
      { id: 'b2', name: 'Siêng năng', icon: '📚' },
      { id: 'b3', name: 'Cú đêm', icon: '🦉' },
    ],
    inventory: ['skin_default'], // Owned Item IDs
    equippedSkin: 'skin_default', // Active Skin ID
    lastStudyDate: null,
    streakDays: 3
  },
  SHOP_ITEMS: [
    { id: 'skin_default', name: 'Mặc định', type: 'skin', cost: 0, currency: 'xp', icon: '🃏', cssClass: 'bg-gray-800 border-gray-600', description: 'Giao diện cơ bản' },
    { id: 'skin_neon', name: 'Neon Cyber', type: 'skin', cost: 500, currency: 'xp', icon: '🌃', cssClass: 'bg-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)] text-cyan-50', description: 'Phong cách tương lai rực rỡ' },
    { id: 'skin_gold', name: 'Hoàng Gia', type: 'skin', cost: 50, currency: 'diamond', icon: '👑', cssClass: 'bg-yellow-950 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] text-yellow-100', description: 'Sang trọng và quý phái' },
    { id: 'skin_fire', name: 'Hỏa Long', type: 'skin', cost: 800, currency: 'xp', icon: '🔥', cssClass: 'bg-red-950 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse', description: 'Nóng bỏng và mạnh mẽ' },
    { id: 'skin_forest', name: 'Rừng Già', type: 'skin', cost: 300, currency: 'xp', icon: '🌲', cssClass: 'bg-green-950 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)] text-green-100', description: 'Thiên nhiên tươi mát' },
    { id: 'skin_galaxy', name: 'Vũ Trụ', type: 'skin', cost: 100, currency: 'diamond', icon: '🌌', cssClass: 'bg-indigo-950 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.6)] text-purple-100', description: 'Huyền bí và bao la' },
  ],
  STUDY_GROUPS: [
    { 
        id: 'g1', name: 'Nhóm ôn thi CS101', members: ["sv002"],
        mission: { id: 'mis_1', title: 'Học Bá Tập Sự', target: 500, current: 120, reward: 5, type: 'chat_activity' }
    },
    { 
        id: 'g2', name: 'CLB Kiến trúc Sư phần mềm', members: ["sv003", "sv001"],
        mission: { id: 'mis_2', title: 'Code Clean', target: 10, current: 3, reward: 10, type: 'quiz_score' }
    },
  ],
  CHAT_MESSAGES: {
    "sv001_gv001": [
      { id: "msg1", from: "sv001", text: "Chào thầy ạ, em là Quang.", timestamp: new Date(Date.now() - 500000) },
      { id: "msg2", from: "gv001", text: "Chào em, thầy có thể giúp gì cho em?", timestamp: new Date(Date.now() - 400000) },
    ]
  },
  GROUP_CHAT_MESSAGES: {
     "g1": [
       { id: "gmsg1", user: { id: "sv002", name: "Lê Thị C", role: "STUDENT"}, text: "Tuần sau thi rồi mọi người ơi", timestamp: new Date(Date.now() - 200000) }
    ],
    "g2": [
       { id: "gmsg2", user: { id: "sv001", name: "Hoàng Đăng Quang", role: "STUDENT"}, text: "Chào mọi người, em mới tham gia nhóm.", timestamp: new Date(Date.now() - 100000) }
    ]
  },
  WAF_LOGS: [
    { id: `waf${Date.now()-10000}`, ip: '192.168.1.10', type: 'SQLi', path: '/login', timestamp: new Date(Date.now()-10000)},
    { id: `waf${Date.now()-5000}`, ip: '10.0.0.5', type: 'XSS', path: '/profile/edit', timestamp: new Date(Date.now()-5000)},
  ],
  MOCK_TEST_RESULTS: {
    unit: null,
    integration: null,
    e2e: null
  },
  VIDEO_NOTES: {
    "l1": [
      { id: "vn1", userId: "sv001", lessonId: "l1", timestamp: 15, text: "Định nghĩa AI cơ bản quan trọng.", createdAt: new Date(Date.now() - 1000000).toISOString() },
      { id: "vn2", userId: "sv001", lessonId: "l1", timestamp: 45, text: "Cần nhớ các cột mốc lịch sử này.", createdAt: new Date(Date.now() - 900000).toISOString() }
    ]
  },
  FLASHCARD_DECKS: {
    "m1": {
        id: "fd_m1", courseId: "CS101", moduleId: "m1", title: "Thuật ngữ AI cơ bản",
        cards: [
            { id: "fc1", front: "Artificial Intelligence (AI)", back: "Trí tuệ nhân tạo: Máy móc thực hiện các nhiệm vụ cần trí thông minh con người.", box: 0, nextReview: 0 },
            { id: "fc2", front: "Turing Test", back: "Bài kiểm tra khả năng của máy móc thể hiện hành vi thông minh tương đương con người.", box: 0, nextReview: 0 },
            { id: "fc3", front: "Machine Learning", back: "Học máy: Một tập hợp con của AI tập trung vào việc sử dụng dữ liệu để cải thiện hiệu suất.", box: 0, nextReview: 0 },
            { id: "fc4", front: "Neural Network", back: "Mạng nơ-ron: Mô hình tính toán lấy cảm hứng từ bộ não con người.", box: 0, nextReview: 0 }
        ]
    },
    "m4": {
        id: "fd_m4", courseId: "CS202", moduleId: "m4", title: "Microservices Terms",
        cards: [
            { id: "fc5", front: "Microservices", back: "Kiến trúc chia nhỏ ứng dụng thành các dịch vụ độc lập.", box: 0, nextReview: 0 },
            { id: "fc6", front: "API Gateway", back: "Cổng duy nhất để client gọi đến các microservices bên trong.", box: 0, nextReview: 0 },
            { id: "fc7", front: "Containerization", back: "Đóng gói ứng dụng cùng thư viện (ví dụ: Docker) để chạy nhất quán.", box: 0, nextReview: 0 }
        ]
    }
  },
  LESSON_PROGRESS: {
      "sv001": ["l1"] // sv001 đã học xong bài l1
  },
  LEARNING_PATHS: {
      "lp_demo_1": {
          id: "lp_demo_1",
          creatorId: "gv001",
          title: "Tiếng Nhật cơ bản",
          topic: "Japanese",
          createdAt: new Date().toISOString(),
          targetLevel: 'Beginner',
          goal: 'Du lịch',
          dailyCommitment: '15 phút',
          nodes: [
              { 
                  id: "node1", title: "Hiragana", description: "Bảng chữ cái mềm", type: "theory", 
                  isLocked: false, isCompleted: true,
                  flashcards: [], // Added
                  flashcardsMastered: 20, isExamUnlocked: true, examScore: 85
              },
              { 
                  id: "node2", title: "Katakana", description: "Bảng chữ cái cứng", type: "theory", 
                  isLocked: false, isCompleted: false,
                  flashcards: [], // Added
                  flashcardsMastered: 5, isExamUnlocked: false, examScore: null
              },
              { 
                  id: "node3", title: "Chào hỏi", description: "Các câu chào cơ bản", type: "practice", 
                  isLocked: true, isCompleted: false,
                  flashcards: [], // Added
                  flashcardsMastered: 0, isExamUnlocked: false, examScore: null
              },
              { 
                  id: "node4", title: "Số đếm", description: "Đếm từ 1 đến 100", type: "practice", 
                  isLocked: true, isCompleted: false,
                  flashcards: [], // Added
                  flashcardsMastered: 0, isExamUnlocked: false, examScore: null
              },
              { 
                  id: "node5", title: "Kiểm tra", description: "Tổng hợp kiến thức", type: "challenge", 
                  isLocked: true, isCompleted: false,
                  flashcards: [], // Added
                  flashcardsMastered: 0, isExamUnlocked: false, examScore: null
              }
          ]
      }
  },
  SCRATCHPAD: {}
};
