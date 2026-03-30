import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './signup.css';

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 1. THE LAYOUT ENGINE
  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 950px), (max-width: 1200px) and (orientation: portrait)');
    const handleLayoutShift = (e) => setIsMobile(e.matches);

    handleLayoutShift(mobileQuery);
    mobileQuery.addEventListener('change', handleLayoutShift);
    return () => mobileQuery.removeEventListener('change', handleLayoutShift);
  }, []);

  // 2. THE ANIMATION ENGINE
  useEffect(() => {
    let runeInterval;
    let activeLines = [];
    let isFirstRun = true;
    let algoBag = [];
    let visualizerTimeout;

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    const rightPanel = document.querySelector('.right-panel');
    const runesContainer = document.getElementById('runes-container');

    if (runesContainer && rightPanel) {
      rightPanel.addEventListener('mousemove', (e) => {
        const rect = rightPanel.getBoundingClientRect();
        rightPanel.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        rightPanel.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });

      const runes = ['{}', '</>', '[]', '=>', '();', '&&', '||', '!='];
      runeInterval = setInterval(() => {
        const rune = document.createElement('div');
        rune.className = 'rune';
        rune.textContent = runes[Math.floor(Math.random() * runes.length)];
        rune.style.left = Math.random() * 100 + '%';
        rune.style.animationDuration = (Math.random() * 6 + 6) + 's';
        rune.style.fontSize = (Math.random() * 10 + 14) + 'px';
        runesContainer.appendChild(rune);
        setTimeout(() => rune.remove(), 12000);
      }, 400);
    }

    const visContainer = document.getElementById('algo-visualizer');

    function updateLinesOnResize() {
      const svg = document.getElementById('algo-canvas');
      if (!svg || activeLines.length === 0) return;

      const containerRect = visContainer.getBoundingClientRect();
      const scale = containerRect.width / visContainer.offsetWidth || 1;

      activeLines.forEach(data => {
        if (data.type === 'normal') {
          const pRect = data.parent.getBoundingClientRect();
          const cRect = data.child.getBoundingClientRect();
          const startX = (pRect.left + (pRect.width / 2) - containerRect.left) / scale;
          const startY = (pRect.bottom - containerRect.top) / scale;
          const endX = (cRect.left + (cRect.width / 2) - containerRect.left) / scale;
          const endY = (cRect.top - containerRect.top) / scale;

          data.line.setAttribute("x1", data.isReverse ? endX : startX);
          data.line.setAttribute("y1", data.isReverse ? endY : startY);
          data.line.setAttribute("x2", data.isReverse ? startX : endX);
          data.line.setAttribute("y2", data.isReverse ? startY : endY);
        } else if (data.type === 'll') {
          const sRect = data.sourceAddrDiv.getBoundingClientRect();
          const tRect = data.targetNode.getBoundingClientRect();
          const startX = (sRect.left + (sRect.width / 2) - containerRect.left) / scale;
          const startY = (sRect.top + (sRect.height / 2) - containerRect.top) / scale;
          const endX = (tRect.left - containerRect.left) / scale - 4;
          const endY = (tRect.top + (tRect.height / 2) - containerRect.top) / scale;

          data.line.setAttribute("x1", startX);
          data.line.setAttribute("y1", startY);
          data.line.setAttribute("x2", endX);
          data.line.setAttribute("y2", endY);

          const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
          data.line.style.strokeDasharray = length;
        }
      });
    }

    if (visContainer) {
      window.addEventListener('resize', () => requestAnimationFrame(updateLinesOnResize));

      function drawConnectingLine(parent, child, isReverse = false) {
        const svg = document.getElementById('algo-canvas');
        if (!svg) return;
        const containerRect = visContainer.getBoundingClientRect();
        const scale = containerRect.width / visContainer.offsetWidth || 1;
        const pRect = parent.getBoundingClientRect();
        const cRect = child.getBoundingClientRect();
        const startX = (pRect.left + (pRect.width / 2) - containerRect.left) / scale;
        const startY = (pRect.bottom - containerRect.top) / scale;
        const endX = (cRect.left + (cRect.width / 2) - containerRect.left) / scale;
        const endY = (cRect.top - containerRect.top) / scale;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", isReverse ? endX : startX);
        line.setAttribute("y1", isReverse ? endY : startY);
        line.setAttribute("x2", isReverse ? startX : endX);
        line.setAttribute("y2", isReverse ? startY : endY);
        line.classList.add("algo-line");
        svg.appendChild(line);
        activeLines.push({ line, parent, child, isReverse, type: 'normal' });
      }

      function createAlgoGroup(row, numbers) {
        const group = document.createElement('div');
        group.className = 'algo-group';
        numbers.forEach(num => {
          const b = document.createElement('div');
          b.className = 'algo-box';
          b.innerText = num;
          group.appendChild(b);
        });
        row.appendChild(group);
        return group;
      }

      async function physicalSwap(box1, box2) {
        if (!box1 || !box2) return;
        const containerRect = visContainer.getBoundingClientRect();
        const scale = containerRect.width / visContainer.offsetWidth || 1;
        box1.classList.add('highlight-alt');
        box2.classList.add('highlight-alt');
        await sleep(400);

        const rect1 = box1.getBoundingClientRect();
        const rect2 = box2.getBoundingClientRect();
        const distance = (rect2.left - rect1.left) / scale;

        box1.style.transition = 'transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        box2.style.transition = 'transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        box1.style.transform = `translateX(${distance}px)`;
        box2.style.transform = `translateX(${-distance}px)`;
        await sleep(600);

        const temp = box1.innerText;
        box1.innerText = box2.innerText;
        box2.innerText = temp;

        box1.style.transition = 'none';
        box2.style.transition = 'none';
        box1.style.transform = 'translateX(0)';
        box2.style.transform = 'translateX(0)';
        void box1.offsetWidth;

        box1.classList.remove('highlight-alt');
        box2.classList.remove('highlight-alt');
        box1.style.transition = 'all 0.5s ease';
        box2.style.transition = 'all 0.5s ease';
        await sleep(200);
      }

      async function playMergeSort() {
        visContainer.classList.add('top-aligned');
        visContainer.innerHTML = `
          <svg id="algo-canvas" class="algo-svg-canvas"></svg>
          <div class="algo-row" id="row-1"></div>
          <div class="algo-row" id="row-2"></div>
          <div class="algo-row" id="row-3"></div>
          <div class="algo-row" id="row-4"></div>
        `;
        const row1 = document.getElementById('row-1');
        const row2 = document.getElementById('row-2');
        const row3 = document.getElementById('row-3');
        const row4 = document.getElementById('row-4');
        const svgCanvas = document.getElementById('algo-canvas');

        const g1 = createAlgoGroup(row1, [8, 5, 3, 9, 4, 1]);
        g1.classList.add('visible');
        await sleep(800);

        const branch2A = document.createElement('div'); branch2A.className = 'algo-branch'; branch2A.style.flex = "1";
        const branch2B = document.createElement('div'); branch2B.className = 'algo-branch'; branch2B.style.flex = "1";
        row2.appendChild(branch2A); row2.appendChild(branch2B);

        const g2a = createAlgoGroup(branch2A, [8, 5, 3]);
        const g2b = createAlgoGroup(branch2B, [9, 4, 1]);

        await sleep(30);
        drawConnectingLine(g1, g2a); drawConnectingLine(g1, g2b);
        await sleep(1500);

        g2a.classList.add('visible'); g2b.classList.add('visible');
        g1.classList.add('faded');
        await sleep(800);

        const branch3A = document.createElement('div'); branch3A.className = 'algo-branch'; branch3A.style.flex = "1";
        const branch3B = document.createElement('div'); branch3B.className = 'algo-branch'; branch3B.style.flex = "1";
        const branch3C = document.createElement('div'); branch3C.className = 'algo-branch'; branch3C.style.flex = "1";
        const branch3D = document.createElement('div'); branch3D.className = 'algo-branch'; branch3D.style.flex = "1";
        row3.appendChild(branch3A); row3.appendChild(branch3B);
        row3.appendChild(branch3C); row3.appendChild(branch3D);

        const g3a = createAlgoGroup(branch3A, [8]);
        const g3b = createAlgoGroup(branch3B, [5, 3]);
        const g3c = createAlgoGroup(branch3C, [9]);
        const g3d = createAlgoGroup(branch3D, [4, 1]);

        await sleep(30);
        drawConnectingLine(g2a, g3a); drawConnectingLine(g2a, g3b);
        drawConnectingLine(g2b, g3c); drawConnectingLine(g2b, g3d);
        await sleep(1500);

        [g3a, g3b, g3c, g3d].forEach(g => g.classList.add('visible'));
        g2a.classList.add('faded'); g2b.classList.add('faded');
        await sleep(800);

        const branch4A = document.createElement('div'); branch4A.className = 'algo-branch'; branch4A.style.flex = "1";
        const branch4B = document.createElement('div'); branch4B.className = 'algo-branch'; branch4B.style.flex = "1";
        const branch4C = document.createElement('div'); branch4C.className = 'algo-branch'; branch4C.style.flex = "1";
        const branch4D = document.createElement('div'); branch4D.className = 'algo-branch'; branch4D.style.flex = "1";
        row4.appendChild(branch4A); row4.appendChild(branch4B);
        row4.appendChild(branch4C); row4.appendChild(branch4D);

        const g4_5 = createAlgoGroup(branch4B, [5]); const g4_3 = createAlgoGroup(branch4B, [3]);
        const g4_4 = createAlgoGroup(branch4D, [4]); const g4_1 = createAlgoGroup(branch4D, [1]);

        await sleep(30);
        drawConnectingLine(g3b, g4_5); drawConnectingLine(g3b, g4_3);
        drawConnectingLine(g3d, g4_4); drawConnectingLine(g3d, g4_1);
        await sleep(1500);

        [g4_5, g4_3, g4_4, g4_1].forEach(g => g.classList.add('visible'));
        g3b.classList.add('faded'); g3d.classList.add('faded');
        await sleep(800);

        const b5 = g4_5.querySelector('.algo-box'); const b3 = g4_3.querySelector('.algo-box');
        await physicalSwap(b5, b3);

        const b4 = g4_4.querySelector('.algo-box'); const b1 = g4_1.querySelector('.algo-box');
        await physicalSwap(b4, b1);

        activeLines = [];
        svgCanvas.innerHTML = '';
        await sleep(30);
        drawConnectingLine(g3b, g4_5, true); drawConnectingLine(g3b, g4_3, true);
        drawConnectingLine(g3d, g4_4, true); drawConnectingLine(g3d, g4_1, true);
        await sleep(1500);

        activeLines = [];
        svgCanvas.innerHTML = '';
        [g4_5, g4_3, g4_4, g4_1].forEach(g => g.classList.remove('visible'));

        g3b.innerHTML = ''; g3d.innerHTML = '';
        [3, 5].forEach(n => g3b.innerHTML += `<div class="algo-box">${n}</div>`);
        [1, 4].forEach(n => g3d.innerHTML += `<div class="algo-box">${n}</div>`);

        g3b.classList.remove('faded'); g3d.classList.remove('faded');
        await sleep(800);

        activeLines = [];
        svgCanvas.innerHTML = '';
        await sleep(30);
        drawConnectingLine(g2a, g3a, true); drawConnectingLine(g2a, g3b, true);
        drawConnectingLine(g2b, g3c, true); drawConnectingLine(g2b, g3d, true);
        await sleep(1500);

        activeLines = [];
        svgCanvas.innerHTML = '';
        [g3a, g3b, g3c, g3d].forEach(g => g.classList.remove('visible'));

        g2a.innerHTML = ''; g2b.innerHTML = '';
        [8, 3, 5].forEach(n => g2a.innerHTML += `<div class="algo-box">${n}</div>`);
        [9, 1, 4].forEach(n => g2b.innerHTML += `<div class="algo-box">${n}</div>`);

        g2a.classList.remove('faded'); g2b.classList.remove('faded');
        await sleep(800);

        const leftBoxes = g2a.querySelectorAll('.algo-box');
        await physicalSwap(leftBoxes[0], leftBoxes[1]);
        await physicalSwap(leftBoxes[1], leftBoxes[2]);

        const rightBoxes = g2b.querySelectorAll('.algo-box');
        await physicalSwap(rightBoxes[0], rightBoxes[1]);
        await physicalSwap(rightBoxes[1], rightBoxes[2]);

        activeLines = [];
        svgCanvas.innerHTML = '';
        await sleep(30);
        drawConnectingLine(g1, g2a, true); drawConnectingLine(g1, g2b, true);
        await sleep(1500);

        activeLines = [];
        svgCanvas.innerHTML = '';
        g2a.classList.remove('visible'); g2b.classList.remove('visible');

        g1.innerHTML = '';
        [3, 5, 8, 1, 4, 9].forEach(n => g1.innerHTML += `<div class="algo-box">${n}</div>`);
        g1.classList.remove('faded');
        await sleep(800);

        const topBoxes = g1.querySelectorAll('.algo-box');
        await physicalSwap(topBoxes[2], topBoxes[3]);
        await physicalSwap(topBoxes[1], topBoxes[2]);
        await physicalSwap(topBoxes[0], topBoxes[1]);
        await physicalSwap(topBoxes[3], topBoxes[4]);
        await physicalSwap(topBoxes[2], topBoxes[3]);

        topBoxes.forEach(b => b.classList.add('success'));

        await sleep(3500);
        visContainer.classList.remove('top-aligned');
        playRandomAlgo();
      }

      async function playBinaryTree() {
        visContainer.innerHTML = `
          <svg id="algo-canvas" class="algo-svg-canvas"></svg>
          <div class="algo-row" id="tree-row-1"></div>
          <div class="algo-row" id="tree-row-2" style="width: 320px; margin: 0 auto;"></div>
          <div class="algo-row" id="tree-row-3" style="width: 320px; margin: 0 auto;"></div>
        `;
        const r1 = document.getElementById('tree-row-1');
        const r2 = document.getElementById('tree-row-2');
        const r3 = document.getElementById('tree-row-3');

        function addNode(row, val) {
          const branch = document.createElement('div');
          branch.className = 'algo-branch';
          branch.style.flex = "1";
          const node = document.createElement('div');
          node.className = 'algo-node';
          node.innerText = val;
          branch.appendChild(node);
          row.appendChild(branch);
          return node;
        }

        const root = addNode(r1, '15');
        await sleep(30);
        root.classList.add('visible');
        await sleep(800);

        const n10 = addNode(r2, '10');
        const n25 = addNode(r2, '25');
        await sleep(30);
        drawConnectingLine(root, n10); drawConnectingLine(root, n25);
        await sleep(1500);
        n10.classList.add('visible'); n25.classList.add('visible');
        await sleep(800);

        const n5 = addNode(r3, '5');
        const n12 = addNode(r3, '12');
        const n20 = addNode(r3, '20');
        const n30 = addNode(r3, '30');
        await sleep(30);
        drawConnectingLine(n10, n5); drawConnectingLine(n10, n12);
        drawConnectingLine(n25, n20); drawConnectingLine(n25, n30);
        await sleep(1500);
        [n5, n12, n20, n30].forEach(n => n.classList.add('visible'));
        await sleep(1200);

        root.classList.add('success');
        await sleep(500);
        n10.classList.add('success'); n25.classList.add('success');
        await sleep(500);
        [n5, n12, n20, n30].forEach(n => n.classList.add('success'));

        await sleep(3500);
        playRandomAlgo();
      }

      async function playStack() {
        visContainer.innerHTML = '';
        const stackContainer = document.createElement('div');
        stackContainer.className = 'algo-stack-container';
        visContainer.appendChild(stackContainer);

        const pointer = document.createElement('div');
        pointer.className = 'top-pointer';
        pointer.innerHTML = 'TOP <span style="font-size: 18px;">&rarr;</span>';
        pointer.style.top = '165px';
        stackContainer.appendChild(pointer);

        await sleep(400);
        pointer.style.opacity = '1';
        await sleep(400);

        const items = ['Data A', 'Data B', 'Data C'];
        const blocks = [];

        for (let i = 0; i < items.length; i++) {
          const block = document.createElement('div');
          block.className = 'algo-stack-block push-in-squash';
          block.innerText = items[i];
          stackContainer.appendChild(block);
          blocks.push(block);

          await sleep(30);
          pointer.style.top = `${block.offsetTop + 14}px`;
          await sleep(700);

          block.classList.add('neon-flash');
          await sleep(250);
          block.classList.remove('neon-flash');
          await sleep(400);
        }

        await sleep(800);

        for (let i = 0; i < items.length; i++) {
          const block = blocks.pop();
          block.classList.add('neon-flash');
          await sleep(350);
          block.classList.remove('neon-flash');
          block.classList.add('pop-out');

          if (blocks.length > 0) {
            const nextBlock = blocks[blocks.length - 1];
            pointer.style.top = `${nextBlock.offsetTop + 14}px`;
          } else {
            pointer.style.top = '165px';
          }

          await sleep(600);
          block.remove();
          await sleep(200);
        }

        pointer.style.opacity = '0';
        await sleep(1000);
        playRandomAlgo();
      }

      async function playLinkedList() {
        visContainer.innerHTML = `
          <svg id="algo-canvas" class="algo-svg-canvas">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#6ea0ea" />
              </marker>
            </defs>
          </svg>
          <div class="ll-row" id="ll-row"></div>
        `;
        const llRow = document.getElementById('ll-row');
        const svgCanvas = document.getElementById('algo-canvas');

        const createLLNode = async (dataVal) => {
          const node = document.createElement('div');
          node.className = 'll-node';
          const dataDiv = document.createElement('div');
          dataDiv.className = 'll-data';
          dataDiv.innerText = dataVal;
          dataDiv.style.opacity = '0';
          dataDiv.style.transition = 'opacity 0.5s ease';
          const addrDiv = document.createElement('div');
          addrDiv.className = 'll-address';
          addrDiv.innerText = '???';
          addrDiv.style.opacity = '0';
          addrDiv.style.transition = 'opacity 0.5s ease';

          node.appendChild(dataDiv);
          node.appendChild(addrDiv);
          llRow.appendChild(node);

          await sleep(50);
          node.classList.add('visible');
          await sleep(400);

          dataDiv.style.opacity = '1';
          addrDiv.style.opacity = '1';
          await sleep(400);
          return { node, addrDiv };
        };

        const updateAddress = async (addrDiv, newText, className) => {
          addrDiv.style.opacity = '0';
          await sleep(300);
          addrDiv.innerText = newText;
          addrDiv.classList.add(className);
          addrDiv.style.opacity = '1';
          await sleep(300);
        };

        const drawLLArrow = async (sourceAddrDiv, targetNode) => {
          const containerRect = visContainer.getBoundingClientRect();
          const scale = containerRect.width / visContainer.offsetWidth || 1;
          const sRect = sourceAddrDiv.getBoundingClientRect();
          const tRect = targetNode.getBoundingClientRect();
          const startX = (sRect.left + (sRect.width / 2) - containerRect.left) / scale;
          const startY = (sRect.top + (sRect.height / 2) - containerRect.top) / scale;
          const endX = (tRect.left - containerRect.left) / scale - 4;
          const endY = (tRect.top + (tRect.height / 2) - containerRect.top) / scale;

          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", startX);
          line.setAttribute("y1", startY);
          line.setAttribute("x2", endX);
          line.setAttribute("y2", endY);
          line.classList.add("ll-arrow-line");
          line.style.animation = 'none';

          const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
          line.style.strokeDasharray = length;
          line.style.strokeDashoffset = length;
          line.style.opacity = '0';
          line.style.transition = 'opacity 0.2s ease, stroke-dashoffset 0.8s ease-in-out';
          svgCanvas.appendChild(line);

          activeLines.push({ line, sourceAddrDiv, targetNode, type: 'll' });
          void line.getBoundingClientRect();

          line.style.opacity = '1';
          line.style.strokeDashoffset = '0';
          await sleep(800);
        };

        const n1 = await createLLNode('A');
        await sleep(600);
        const n2 = await createLLNode('B');
        await sleep(600);

        await updateAddress(n1.addrDiv, '0x2B', 'active-addr');
        await drawLLArrow(n1.addrDiv, n2.node);
        await sleep(600);

        const n3 = await createLLNode('C');
        await sleep(600);

        await updateAddress(n2.addrDiv, '0x8F', 'active-addr');
        await drawLLArrow(n2.addrDiv, n3.node);
        await sleep(600);

        await updateAddress(n3.addrDiv, 'NULL', 'null-addr');
        await sleep(1000);

        [n1.node, n2.node, n3.node].forEach(n => n.classList.add('success'));
        await sleep(3500);
        playRandomAlgo();
      }

      const algos = [playMergeSort, playBinaryTree, playStack, playLinkedList];

      async function playRandomAlgo() {
        if (!document.getElementById('algo-visualizer')) return;

        if (!isFirstRun) {
          visContainer.style.transition = 'opacity 0.6s ease';
          visContainer.style.opacity = '0';
          await sleep(600);
        } else {
          visContainer.style.opacity = '0';
          isFirstRun = false;
        }

        activeLines = [];
        visContainer.innerHTML = '';
        visContainer.className = 'algo-visualizer';

        if (algoBag.length === 0) {
          algoBag = [0, 1, 2, 3];
          for (let i = algoBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [algoBag[i], algoBag[j]] = [algoBag[j], algoBag[i]];
          }
        }
        const nextAlgoIndex = algoBag.pop();

        visContainer.style.transition = 'opacity 0.6s ease';
        visContainer.style.opacity = '1';
        await sleep(200);

        algos[nextAlgoIndex]();
      }

      visualizerTimeout = setTimeout(playRandomAlgo, 100);
    }

    return () => {
      clearInterval(runeInterval);
      clearTimeout(visualizerTimeout);
      window.removeEventListener('resize', updateLinesOnResize);
    };
  }, [isMobile]);

  // --- THE UI COMPONENTS ---
  const FormPanel = () => (
    <div className="form-wrapper" id="form-wrapper">
      <h1 className="form-title">
        <span className="letter" style={{ animationDelay: '0s' }}>C</span>
        <span className="letter" style={{ animationDelay: '0.04s' }}>r</span>
        <span className="letter" style={{ animationDelay: '0.08s' }}>e</span>
        <span className="letter" style={{ animationDelay: '0.12s' }}>a</span>
        <span className="letter" style={{ animationDelay: '0.16s' }}>t</span>
        <span className="letter" style={{ animationDelay: '0.2s' }}>e</span>
        <span className="space"> </span>
        <span className="letter" style={{ animationDelay: '0.28s' }}>A</span>
        <span className="letter" style={{ animationDelay: '0.32s' }}>c</span>
        <span className="letter" style={{ animationDelay: '0.36s' }}>c</span>
        <span className="letter" style={{ animationDelay: '0.4s' }}>o</span>
        <span className="letter" style={{ animationDelay: '0.44s' }}>u</span>
        <span className="letter" style={{ animationDelay: '0.48s' }}>n</span>
        <span className="letter" style={{ animationDelay: '0.52s' }}>t</span>
      </h1>
      <p className="form-subtitle illuminate">Start tracking your interview journey today.</p>

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="name-row">
          <div className="input-group">
            <label>First Name</label>
            <input type="text" placeholder="First name" required />
          </div>
          <div className="input-group">
            <label>Last Name</label>
            <input type="text" placeholder="Last name" required />
          </div>
        </div>

        <div className="input-group">
          <label>Email</label>
          <input type="email" placeholder="name@example.com" required />
        </div>

        <div className="input-group">
          <label>Create Password</label>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              required
            />
            <span
              className="toggle-password"
              onMouseDown={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
              onTouchStart={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
            >
              <img src={showPassword ? "/assets/eye-open.png" : "/assets/eye-closed.png"} alt="Toggle" />
            </span>
          </div>
        </div>

        <div className="input-group" style={{ marginBottom: '8px' }}>
          <label>Confirm Password</label>
          <div className="password-field">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              required
            />
            <span
              className="toggle-password"
              onMouseDown={(e) => { e.preventDefault(); setShowConfirmPassword(!showConfirmPassword); }}
              onTouchStart={(e) => { e.preventDefault(); setShowConfirmPassword(!showConfirmPassword); }}
            >
              <img src={showConfirmPassword ? "/assets/eye-open.png" : "/assets/eye-closed.png"} alt="Toggle" />
            </span>
          </div>
        </div>

        <button type="submit" className="primary-btn">
          Create Account <i className="ri-user-add-line"></i>
        </button>
      </form>

      <div className="divider-container">
        <span className="divider-text">OR CONTINUE WITH</span>
      </div>

      <div className="oauth-row">
        {/* 🌟 REACT OAUTH REDIRECTS */}
        <button
          type="button"
          className="oauth-btn"
          onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Google
        </button>
        <button
          type="button"
          className="oauth-btn"
          onClick={() => window.location.href = 'http://localhost:5000/api/auth/github'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </button>
      </div>
    </div>
  );

  const TopPills = () => (
    <div className="top-right-pills">
      <div className="float-card mini-card card-1">
        <div className="icon-box green"><i className="ri-checkbox-circle-fill"></i></div>
        <div className="card-text">
          <h4>1000+ Problems</h4>
          <span>Curated analytics</span>
        </div>
      </div>
      <div className="float-card mini-card card-2">
        <div className="icon-box orange"><i className="ri-bar-chart-grouped-fill"></i></div>
        <div className="card-text">
          <h4>Smart Analytics</h4>
          <span>Monitor your growth</span>
        </div>
      </div>
      <div className="float-card mini-card card-3">
        <div className="icon-box blue"><i className="ri-code-box-line"></i></div>
        <div className="card-text">
          <h4>100% Free Access</h4>
          <span>No paywalls</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="split-container">
      {!isMobile ? (
        <div className="desktop-layout" style={{ display: 'flex' }}>
          <div className="left-panel">
            <div className="panel-top">
              <a href="#" className="text-logo">FINALIST</a>
              <div className="login-badge">
                <span className="muted-text">Already a FINALIST?</span>
                <Link to="/signin" className="nav-signin-btn">Sign In <i className="ri-arrow-right-line"></i></Link>
              </div>
            </div>
            <FormPanel />
          </div>

          <div className="right-panel" style={{ justifyContent: 'space-around' }}>
            <div className="runes-container" id="runes-container"></div>
            <TopPills />
            <div className="signup-content">
              <div className="algo-visualizer" id="algo-visualizer"></div>
              <h2 className="hero-text">
                Start your journey.<br />
                Stay consistent.<br />
                <span className="accent-text">Reach the FINALIST stage.</span>
              </h2>
            </div>
          </div>
        </div>
      ) : (
        <div className="mobile-layout" style={{ display: 'flex' }}>
          <div className="mobile-top-stage">
            <div className="runes-container" id="runes-container"></div>
            <div className="mobile-nav">
              <a href="#" className="text-logo">FINALIST</a>
              <div className="mobile-badge">
                <span className="muted-text">Already a FINALIST?</span>
                <Link to="/signin" className="nav-signin-btn">Sign In <i className="ri-arrow-right-line"></i></Link>
              </div>
            </div>

            <div className="algo-visualizer" id="algo-visualizer"></div>
            <div className="mobile-wave"></div>
          </div>

          <div className="mobile-bottom-form">
            <FormPanel />
          </div>
        </div>
      )}
    </div>
  );
}