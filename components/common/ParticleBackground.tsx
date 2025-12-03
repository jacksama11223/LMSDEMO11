import React, { useEffect, useRef } from 'react';

const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // --- CONFIGURATION ---
    const starCount = window.innerWidth < 768 ? 50 : 150; 
    const shootingStarInterval = 2000; // ms

    // --- TYPES ---
    interface Star {
      x: number;
      y: number;
      size: number;
      blinkSpeed: number;
      opacity: number;
    }

    interface ShootingStar {
      x: number;
      y: number;
      length: number;
      speed: number;
      angle: number;
      opacity: number;
      active: boolean;
    }

    // --- STATE ---
    const stars: Star[] = [];
    let shootingStar: ShootingStar | null = null;
    let lastShootingStarTime = 0;

    // --- INITIALIZATION ---
    const initStars = () => {
      stars.length = 0;
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5,
          blinkSpeed: 0.01 + Math.random() * 0.05,
          opacity: Math.random(),
        });
      }
    };

    const spawnShootingStar = () => {
        shootingStar = {
            x: Math.random() * width * 0.8, // Start mostly left/top
            y: Math.random() * height * 0.5,
            length: 100 + Math.random() * 50,
            speed: 15 + Math.random() * 10,
            angle: Math.PI / 4, // 45 degrees
            opacity: 1,
            active: true
        };
    };

    // --- ANIMATION LOOP ---
    const animate = (time: number) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Static Stars (Twinkling)
      ctx.fillStyle = "white";
      stars.forEach((star) => {
        star.opacity += star.blinkSpeed;
        if (star.opacity > 1 || star.opacity < 0.2) {
            star.blinkSpeed = -star.blinkSpeed;
        }
        ctx.globalAlpha = Math.max(0, Math.min(1, star.opacity));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw Shooting Star
      if (!shootingStar && time - lastShootingStarTime > shootingStarInterval) {
          if (Math.random() > 0.95) { // Chance to spawn
              spawnShootingStar();
              lastShootingStarTime = time;
          }
      }

      if (shootingStar && shootingStar.active) {
          const { x, y, length, speed, angle, opacity } = shootingStar;
          
          const endX = x + Math.cos(angle) * length;
          const endY = y + Math.sin(angle) * length;

          const gradient = ctx.createLinearGradient(x, y, endX, endY);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
          gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Move
          shootingStar.x += Math.cos(angle) * speed;
          shootingStar.y += Math.sin(angle) * speed;
          shootingStar.opacity -= 0.02;

          if (shootingStar.x > width || shootingStar.y > height || shootingStar.opacity <= 0) {
              shootingStar.active = false;
              shootingStar = null;
          }
      }

      requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initStars();
    };

    window.addEventListener('resize', handleResize);
    initStars();
    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[-1] pointer-events-none" />;
};

export default ParticleBackground;