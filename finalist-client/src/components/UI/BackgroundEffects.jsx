import React, { useEffect, useRef } from 'react';

export default function BackgroundEffects({ isAuthPage = false }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // 1. Mouse Tracking Spotlight
    const handleMouseMove = (e) => {
      // Find the parent wrapper (either landing-wrapper or right-panel)
      const target = document.querySelector(isAuthPage ? '.right-panel' : '.landing-wrapper');
      if (target) {
        const rect = target.getBoundingClientRect();
        target.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        target.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 2. Rune Generation
    const runes = ['{}', '</>', '[]', '=>', '();', '&&', '||', '!='];
    let runeInterval;

    const spawnRune = () => {
      const containers = document.querySelectorAll('.runes-container');
      containers.forEach(container => {
        const rune = document.createElement('div');
        rune.className = 'rune';
        rune.textContent = runes[Math.floor(Math.random() * runes.length)];
        rune.style.left = Math.random() * 100 + '%';
        
        const isMobile = window.innerWidth <= 768;
        rune.style.animationDuration = (Math.random() * (isMobile ? 8 : 6) + (isMobile ? 10 : 6)) + 's';
        rune.style.fontSize = (Math.random() * 10 + (isMobile ? 12 : 14)) + 'px';
        rune.style.opacity = isMobile ? "0.6" : "1";
        
        container.appendChild(rune);
        setTimeout(() => rune.remove(), isMobile ? 18000 : 12000);
      });
    };

    spawnRune(); // Initial spawn
    runeInterval = setInterval(spawnRune, window.innerWidth <= 768 ? 2000 : 400);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(runeInterval);
    };
  }, [isAuthPage]);

  return (
    <>
      <div className="spotlight-overlay"></div>
      <div className="runes-container" ref={containerRef}></div>
    </>
  );
}