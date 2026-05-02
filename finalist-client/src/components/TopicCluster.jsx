import React, { useRef, useEffect, useCallback } from 'react';

export default React.memo(function TopicCluster({ data, onBubbleClick }) {
  const bubblesRef = useRef(null);
  const bubbleClickRef = useRef(onBubbleClick);
  
  useEffect(() => { bubbleClickRef.current = onBubbleClick; }, [onBubbleClick]);

  const topicsJson = JSON.stringify(data?.topics || []);

  const packBubbles = useCallback(() => {
    if (!bubblesRef.current || !data.topics) return;
    const container = bubblesRef.current;

    requestAnimationFrame(() => {
      const activeTopics = data.topics.filter(t => t.solved > 0);
      const placeholder = container.querySelector('.empty-placeholder');

      if (activeTopics.length === 0) {
        if (!placeholder) {
          container.innerHTML = "<div class='empty-placeholder' style='color:var(--text-muted);font-size:13px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;line-height:1.6;'>Solve problems to unlock<br>your Topic Cluster!</div>";
        }
        return;
      } else if (placeholder) {
        placeholder.remove();
      }

      const existingBubbles = Array.from(container.querySelectorAll('.topic-bubble'));
      const seenTopics = new Set();

      const boxW = container.clientWidth || 280;
      const boxH = container.clientHeight || 250;
      const maxTotal = Math.max(...activeTopics.map(t => t.total));

      const maxBubbleSize = Math.min(90, (Math.min(boxW, boxH) / 3.5));
      const minBubbleSize = Math.max(28, maxBubbleSize * 0.4);

      let bubblesData = activeTopics.map(topic => {
        const scaleFactor = topic.total / maxTotal;
        const size = minBubbleSize + (scaleFactor * (maxBubbleSize - minBubbleSize));
        return { ...topic, size, r: size / 2, x: 0, y: 0 };
      });
      bubblesData.sort((a, b) => b.r - a.r);

      const placed = [];
      const padding = 1;
      bubblesData.forEach(b => {
        let angle = 0, radius = 0, isPlaced = false;
        while (!isPlaced) {
          b.x = Math.cos(angle) * radius; b.y = Math.sin(angle) * radius;
          let collision = false;
          for (let p of placed) {
            const dx = b.x - p.x, dy = b.y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < b.r + p.r + padding) { collision = true; break; }
          }
          if (!collision) { isPlaced = true; placed.push({ ...b }); }
          else { angle += 0.2; radius += 0.1; }
        }
      });

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      placed.forEach(p => {
        minX = Math.min(minX, p.x - p.r); maxX = Math.max(maxX, p.x + p.r);
        minY = Math.min(minY, p.y - p.r); maxY = Math.max(maxY, p.y + p.r);
      });

      const clusterW = maxX - minX, clusterH = maxY - minY;
      const scale = Math.min((boxW - 16) / clusterW, (boxH - 16) / clusterH, 1);

      placed.forEach(p => {
        seenTopics.add(p.name);
        const finalX = (p.x - minX) * scale + (boxW - clusterW * scale) / 2;
        const finalY = (p.y - minY) * scale + (boxH - clusterH * scale) / 2;
        const finalSize = p.size * scale;
        const pct = p.total === 0 ? 0 : Math.round((p.solved / p.total) * 100);

        let bubble = container.querySelector(`.topic-bubble[data-topic="${p.name}"]`);

        if (!bubble) {
          bubble = document.createElement("div");
          bubble.className = "topic-bubble";
          bubble.dataset.topic = p.name;
          bubble.innerHTML = `
            <div class="bubble-mask"><div class="wave" style="--fill-pct: 0%; opacity: 0;"></div></div>
            <div class="bubble-content"><span class="bubble-name"></span></div>`;
          bubble.style.left = `${finalX}px`; bubble.style.top = `${finalY}px`;
          bubble.style.width = `0px`; bubble.style.height = `0px`;
          bubble.onclick = (e) => { e.stopPropagation(); bubbleClickRef.current(p.name); };
          container.appendChild(bubble);
          bubble.offsetHeight; 
          bubble.style.transition = 'left 0.8s cubic-bezier(0.16,1,0.3,1),top 0.8s cubic-bezier(0.16,1,0.3,1),width 0.5s cubic-bezier(0.16,1,0.3,1),height 0.5s cubic-bezier(0.16,1,0.3,1),transform 0.3s';
        }

        bubble.setAttribute('data-tooltip', `${p.name}: ${p.solved} / ${p.total} Solved`);
        bubble.style.left = `${finalX}px`; bubble.style.top = `${finalY}px`;
        bubble.style.width = `${finalSize}px`; bubble.style.height = `${finalSize}px`;

        const nameSpan = bubble.querySelector('.bubble-name');
        if (nameSpan) {
          nameSpan.textContent = p.name;
          nameSpan.style.fontSize = finalSize > 70 ? '11px' : (finalSize > 45 ? '9px' : '7.5px');
          nameSpan.style.opacity = finalSize < 25 ? '0' : '1';
        }

        const wave = bubble.querySelector('.wave');
        if (wave) {
          wave.style.setProperty('--fill-pct', `${pct}%`);
          wave.style.opacity = pct === 0 ? "0" : "1";
        }
      });

      existingBubbles.forEach(b => {
        if (!seenTopics.has(b.dataset.topic)) {
          b.style.width = "0px"; b.style.height = "0px"; b.style.opacity = "0";
          setTimeout(() => b.remove(), 400);
        }
      });
    });
  }, [topicsJson, data.topics]);

  useEffect(() => { packBubbles(); }, [packBubbles]);

  // 🌟 PERFORMANCE CUT 3: The strict ResizeObserver Guard
  const previousWidth = useRef(0);

  useEffect(() => {
    if (!bubblesRef.current) return;
    let resizeTimer;
    const ro = new ResizeObserver((entries) => {
      const currentWidth = entries[0].contentRect.width;
      // Abort if the width didn't change by at least 1 pixel
      if (Math.abs(currentWidth - previousWidth.current) < 1) return;
      previousWidth.current = currentWidth;

      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(packBubbles, 450);
    });
    ro.observe(bubblesRef.current);
    return () => { ro.disconnect(); clearTimeout(resizeTimer); };
  }, [packBubbles]);

  return (
    <div className="stat-card stat-large" style={{ flexDirection: 'column', padding: '20px', alignItems: 'flex-start', display: 'flex', overflow: 'hidden' }}>
      <span className="section-label" style={{ marginBottom: '12px', flexShrink: 0 }}>Topic Distribution</span>
      <div className="bubbles-container" id="topic-bubbles" ref={bubblesRef} style={{ flex: 1, width: '100%', minHeight: 0, position: 'relative', overflow: 'hidden' }}></div>
    </div>
  );
});