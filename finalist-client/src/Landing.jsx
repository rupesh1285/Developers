import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './landing.css';

export default function Landing() {
    const navigate = useNavigate();

    useEffect(() => {
        // 1. GLOBAL SPOTLIGHT & MOUSE TRACKING
        const wrapper = document.querySelector('.landing-wrapper');
        const handleMouseMove = (e) => {
            if (wrapper) {
                wrapper.style.setProperty('--mouse-x', `${e.clientX}px`);
                wrapper.style.setProperty('--mouse-y', `${e.clientY}px`);
            }
        };
        window.addEventListener('mousemove', handleMouseMove);

        // 2. RESPONSIVE FLOATING RUNES
        const runes = ['{}', '</>', '[]', '=>', '();', '&&', '||', '!='];
        const runesContainer = document.getElementById('landing-runes');
        let runeTimeout;

        function spawnRune() {
            if (!runesContainer) return;
            const isMobile = window.innerWidth <= 768;
            const rune = document.createElement('div');
            rune.className = 'rune';
            rune.textContent = runes[Math.floor(Math.random() * runes.length)];
            rune.style.left = Math.random() * 100 + 'vw';

            if (isMobile) {
                rune.style.animationDuration = (Math.random() * 8 + 10) + 's';
                rune.style.fontSize = (Math.random() * 10 + 12) + 'px';
                rune.style.opacity = "0.6";
                setTimeout(() => rune.remove(), 18000);
            } else {
                rune.style.animationDuration = (Math.random() * 6 + 6) + 's';
                rune.style.fontSize = (Math.random() * 10 + 14) + 'px';
                rune.style.opacity = "1";
                setTimeout(() => rune.remove(), 12000);
            }
            runesContainer.appendChild(rune);
            runeTimeout = setTimeout(spawnRune, isMobile ? 2000 : 400);
        }
        spawnRune();

        // 3. DASHBOARD MOCKUP TILT
        const mockup = document.getElementById('dashboard-mockup');
        const handleMockupMove = (e) => {
            if (window.innerWidth <= 768 || !mockup) return;
            const rect = mockup.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xRotation = ((y - rect.height / 2) / rect.height) * -12;
            const yRotation = ((x - rect.width / 2) / rect.width) * 12;
            mockup.style.transform = `perspective(1500px) rotateX(${xRotation}deg) rotateY(${yRotation}deg)`;
            mockup.style.setProperty('--glare-x', `${(x / rect.width) * 200 - 100}%`);
        };
        const handleMockupLeave = () => {
            if (window.innerWidth <= 768 || !mockup) return;
            mockup.style.transform = `perspective(1500px) rotateX(0deg) rotateY(0deg)`;
            mockup.style.setProperty('--glare-x', `-100%`);
        };

        if (mockup) {
            mockup.addEventListener('mousemove', handleMockupMove);
            mockup.addEventListener('mouseleave', handleMockupLeave);
        }

        // 4. DYNAMIC CASCADING HEADLINE
        const headlineElement = document.getElementById("dynamic-headline");
        const headings = [
            "Your Dedicated *Prep* Workspace",
            "Track Your *Coding* Performance",
            "Unblock Your *Logic* with AI"
        ];
        let currentHeadingIndex = 0;
        let headingInterval;

        function buildHeading(sentence) {
            if (!headlineElement) return;
            headlineElement.innerHTML = "";
            const words = sentence.split(" ");
            words.forEach((wordText, index) => {
                const wrapper = document.createElement("span");
                wrapper.className = "word-wrapper";
                const wordSpan = document.createElement("span");
                wordSpan.className = "dyn-word";

                if (wordText.startsWith("*") && wordText.endsWith("*")) {
                    wordSpan.textContent = wordText.slice(1, -1);
                    wordSpan.classList.add("accent-text");
                } else {
                    wordSpan.textContent = wordText;
                }

                wrapper.appendChild(wordSpan);
                headlineElement.appendChild(wrapper);
                setTimeout(() => wordSpan.classList.add("in"), 50 + (index * 80));
            });
        }

        function swapHeading() {
            if (!headlineElement) return;
            const currentWords = headlineElement.querySelectorAll(".dyn-word");
            currentWords.forEach((word, index) => {
                setTimeout(() => {
                    word.classList.remove("in");
                    word.classList.add("out");
                }, index * 25);
            });

            const totalOutTime = (currentWords.length * 25) + 50;
            setTimeout(() => {
                currentHeadingIndex = (currentHeadingIndex + 1) % headings.length;
                buildHeading(headings[currentHeadingIndex]);
            }, totalOutTime);
        }

        setTimeout(() => buildHeading(headings[0]), 300);
        headingInterval = setInterval(swapHeading, 3500);

        // 5. SUBHEADING CHOREOGRAPHY & TYPING
        const sub1 = document.getElementById("sub-1");
        const sub2 = document.getElementById("sub-2");
        const sub3 = document.getElementById("sub-3");
        const typeText = document.getElementById("typewriter-text");
        const cursor = document.getElementById("type-cursor");
        const finalWord = "FINALIST";
        let typeInterval;

        const t1 = setTimeout(() => sub1 && sub1.classList.add("animate"), 200);
        const t2 = setTimeout(() => sub2 && sub2.classList.add("animate"), 1200);
        const t3 = setTimeout(() => {
            if (sub3) sub3.classList.add("animate");
            if (cursor) cursor.classList.add("blink");
        }, 2200);

        const t4 = setTimeout(() => {
            let charIndex = 0;
            if (cursor) {
                cursor.classList.remove("blink");
                cursor.style.opacity = "1";
            }

            typeInterval = setInterval(() => {
                if (typeText) typeText.textContent += finalWord[charIndex];
                charIndex++;

                if (charIndex === finalWord.length) {
                    clearInterval(typeInterval);
                    if (cursor) cursor.classList.add("blink");

                    setTimeout(() => {
                        if (cursor) {
                            cursor.classList.remove("blink");
                            cursor.classList.add("morph-to-dot");
                        }
                        if (typeText) typeText.classList.add("power-on");
                    }, 3200);
                }
            }, 180);
        }, 3600);

        // CLEANUP ON UNMOUNT (Crucial for React)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (mockup) {
                mockup.removeEventListener('mousemove', handleMockupMove);
                mockup.removeEventListener('mouseleave', handleMockupLeave);
            }
            clearTimeout(runeTimeout);
            clearInterval(headingInterval);
            clearInterval(typeInterval);
            clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
        };
    }, []);

    return (
        <div className="landing-wrapper">
            <div className="runes-container" id="landing-runes"></div>
            <div className="spotlight-overlay"></div>

            <header className="navbar">
                <div className="logo-container">
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '1px', color: '#fff' }}>FINALIST</span>
                </div>

                <Link to="/signin" className="btn btn-secondary nav-button">
                    Sign In
                    <i className="ri-arrow-right-line"></i>
                </Link>
            </header>

            <main className="hero" id="hero-container">
                <div className="hero-badge">
                    <span className="pulse-dot"></span> FINALIST v1.0 is live
                </div>

                <h1 className="hero-title" id="dynamic-headline"></h1>

                <p className="hero-subtitle" id="staggered-sub">
                    <span className="flip-word down" id="sub-1">Stay consistent.</span>
                    <span className="flip-word up" id="sub-2">Solve smarter.</span>
                    <span className="fade-word" id="sub-3">
                        Become the <span id="typewriter-text"></span><span id="type-cursor"></span>
                    </span>
                </p>

                <div className="feature-pills">
                    <div className="pill"><i className="ri-code-box-line"></i> 1000+ Problems</div>
                    <div className="pill"><i class="ri-pie-chart-line"></i> Instant Analytics</div>
                    <div className="pill"><i className="ri-timer-line"></i> Built-in Timer</div>
                </div>

                <p className="hero-description" id="hero-desc">
                    Master algorithms in a <strong>high-performance IDE</strong> with <strong>real-time analytics</strong> and
                    <strong> context-aware AI</strong>.
                </p>

                <Link to="/signup" className="btn btn-primary hero-button">
                    <span style={{ position: 'relative', zIndex: 2 }}>Get Started <i className="ri-arrow-right-line"></i></span>
                </Link>

                <div
                    className="app-mockup"
                    id="dashboard-mockup"
                    onClick={(e) => e.currentTarget.classList.toggle('filled')}
                >
                    <div className="mockup-header">
                        <div className="mockup-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <div className="mockup-title">dashboard.finalist.app</div>
                    </div>
                    <div className="mockup-body">
                        <div className="mockup-sidebar"></div>
                        <div className="mockup-content">
                            <div className="mockup-ring-wrapper">
                                <div className="mockup-ring"></div>
                            </div>
                            <div className="mockup-bars">
                                <div className="m-bar"></div>
                                <div className="m-bar"></div>
                                <div className="m-bar"></div>
                            </div>
                        </div>
                    </div>
                    <div className="mockup-fade"></div>
                </div>
            </main>
        </div>
    );
}