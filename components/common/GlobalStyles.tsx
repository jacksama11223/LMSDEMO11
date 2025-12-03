import React from 'react';

const GlobalStyles: React.FC = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap');

    :root {
      /* Sky Palette */
      --color-bg-deep: #0f172a;
      --color-glass: rgba(255, 255, 255, 0.1);
      --color-glass-border: rgba(255, 255, 255, 0.2);
      --color-glass-shine: rgba(255, 255, 255, 0.3);
      
      --sky-primary: #38bdf8; /* Sky Blue */
      --sky-secondary: #c084fc; /* Soft Purple */
      --sky-accent: #f472b6; /* Pink Cloud */
      
      --font-main: 'Quicksand', sans-serif;
    }

    body {
      background-color: var(--color-bg-deep);
      color: #f1f5f9;
      font-family: var(--font-main);
      overflow-x: hidden;
      margin: 0;
    }

    /* --- LIVING SKY BACKGROUND --- */
    .sky-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: -2;
      background: linear-gradient(-45deg, #0f2027, #203a43, #2c5364, #240b36, #c31432);
      background-size: 400% 400%;
      animation: gradientShift 20s ease infinite;
    }

    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* --- CLOUDS ANIMATION --- */
    .clouds-container {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        z-index: -1;
        pointer-events: none;
        overflow: hidden;
    }

    .cloud {
        position: absolute;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
        border-radius: 50%;
        filter: blur(20px);
        animation: drift linear infinite;
    }

    @keyframes drift {
        from { transform: translateX(-100%); }
        to { transform: translateX(100vw); }
    }

    /* --- AERIAL GLASS CARD --- */
    .card {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--color-glass-border);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
      border-radius: 1.5rem;
      position: relative;
      overflow: hidden;
      transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .card::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        border-radius: 1.5rem;
        box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.1);
        pointer-events: none;
    }

    .card:hover {
      transform: translateY(-10px) scale(1.02);
      border-color: var(--color-glass-shine);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.4);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
    }

    /* --- 3D FLIP UTILS --- */
    .perspective-1000 {
      perspective: 1000px;
    }
    .transform-style-3d {
      transform-style: preserve-3d;
    }
    .backface-hidden {
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    .rotate-y-180 {
      transform: rotateY(180deg);
    }

    /* --- TYPOGRAPHY & TEXT EFFECTS --- */
    .text-gradient {
      background: linear-gradient(to right, #7dd3fc, #e879f9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 0 10px rgba(232, 121, 249, 0.3));
    }
    
    h1, h2, h3 { letter-spacing: -0.02em; }

    /* --- INPUTS --- */
    .form-input, .form-textarea, .form-select {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      border-radius: 1rem;
      padding: 0.75rem 1.25rem;
      transition: all 0.3s ease;
      backdrop-filter: blur(4px);
    }
    .form-input:focus, .form-textarea:focus {
      outline: none;
      border-color: var(--sky-primary);
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
      background: rgba(15, 23, 42, 0.8);
      transform: scale(1.01);
    }

    /* --- BUTTONS --- */
    .btn {
      position: relative;
      padding: 0.75rem 1.5rem;
      border-radius: 1rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-size: 0.85rem;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      overflow: hidden;
      z-index: 1;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      color: white;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
    }
    
    .btn-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(139, 92, 246, 0.6);
      filter: brightness(1.1);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(4px);
    }
    
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: white;
      transform: translateY(-3px);
    }
    
    .btn-success {
        background: linear-gradient(90deg, #10b981, #34d399);
        color: white;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    }

    .btn-danger {
        background: linear-gradient(90deg, #ef4444, #f87171);
        color: white;
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
    }

    /* --- ANIMATIONS --- */
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
      100% { transform: translateY(0px); }
    }
    
    .animate-float { animation: float 6s ease-in-out infinite; }
    
    .animate-pop-in {
        animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    
    @keyframes popIn {
        0% { opacity: 0; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1); }
    }
    
    @keyframes musicBar {
        0%, 100% { height: 20%; }
        50% { height: 100%; }
    }
    .animate-music-bar { animation: musicBar 1s ease-in-out infinite; }
    
    @keyframes fire {
        0% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1); opacity: 0.8; }
    }
    .animate-fire { animation: fire 0.8s ease-in-out infinite; }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .animate-spin-slow { animation: spin 8s linear infinite; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.5); }
  `}</style>
);

export default GlobalStyles;