// DOM Ready Handler - Stellt sicher, dass alle Elemente geladen sind
document.addEventListener('DOMContentLoaded', function () {
    // Initialize AOS (Animate On Scroll) - nur wenn AOS verfügbar ist
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 700, once: true, easing: 'ease-out' });
    } else {
        console.warn('AOS library not loaded');
    }

    // Initialisiere alle DOM-abhängigen Funktionen
    initSplashScreen();
    initNavigation();
    initScrollHandling();
    initAudioController();
    initReadMoreSystem();
    initMobileNavigation();
});

// Splash Screen Handler
function initSplashScreen() {
    const splashScreen = document.getElementById('splashScreen');
    const startBtn = document.getElementById('startBtn');

    if (!splashScreen || !startBtn) {
        console.warn('Splash screen elements not found');
        return;
    }

    // Blockiere Scrollen während Splash Screen aktiv ist
    document.body.style.overflow = 'hidden';
    console.log('Scrolling blocked - splash screen active');

    // Start Button Click Handler
    startBtn.addEventListener('click', () => {
        // Markiere User-Interaktion
        window.userHasInteracted = true;
        console.log('User clicked splash screen - starting audio...');

        // Fade out splash screen
        splashScreen.classList.add('fade-out');

        // Start audio sofort nach User-Interaktion
        startAudioAfterInteraction();

        setTimeout(() => {
            splashScreen.style.display = 'none';
            // Erlaube Scrollen wieder
            document.body.style.overflow = 'auto';
            console.log('Splash screen hidden - scrolling enabled - main page ready');
        }, 800); // Match CSS transition duration
    });
}

// Audio-Start nach User-Interaktion mit Dual-System
function startAudioAfterInteraction() {
    console.log('Starting audio after user interaction...');

    const soundBtn = document.getElementById('soundToggle');

    // Versuche zuerst YouTube (primär), dann lokales Audio (Fallback)
    tryYouTubeAudio()
        .then(() => {
            console.log('YouTube audio started successfully');
            if (soundBtn) soundBtn.textContent = '🔊';
        })
        .catch((error) => {
            console.warn('YouTube failed, switching to local audio:', error);
            tryLocalAudio();
        });
}

// YouTube Audio versuchen (als Promise)
function tryYouTubeAudio() {
    return new Promise((resolve, reject) => {
        console.log('Trying YouTube audio...');

        if (typeof YT !== 'undefined' && YT.Player) {
            createYouTubePlayer().then(resolve).catch(reject);
        } else {
            // Lade YouTube API
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            tag.onerror = () => reject(new Error('Failed to load YouTube API'));

            if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
                document.head.appendChild(tag);
            }

            window.onYouTubeIframeAPIReady = () => {
                createYouTubePlayer().then(resolve).catch(reject);
            };

            // Timeout nach 10 Sekunden
            setTimeout(() => reject(new Error('YouTube API timeout')), 10000);
        }
    });
}

// YouTube Player erstellen
function createYouTubePlayer() {
    return new Promise((resolve, reject) => {
        const ytContainer = document.getElementById('yt-ambient');
        if (!ytContainer) {
            reject(new Error('YouTube container not found'));
            return;
        }

        try {
            const player = new YT.Player('yt-ambient', {
                videoId: 'xPztMXEgeUs',
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    loop: 1,
                    playlist: 'xPztMXEgeUs',
                    mute: 0,
                    modestbranding: 1,
                    rel: 0,
                },
                events: {
                    onReady: (event) => {
                        try {
                            event.target.setVolume(8);
                            window.currentAudioMode = 'youtube';
                            window.ytPlayer = event.target;
                            resolve(event.target);
                        } catch (e) {
                            reject(e);
                        }
                    },
                    onError: (error) => {
                        reject(new Error(`YouTube error: ${error.data}`));
                    },
                },
            });
        } catch (err) {
            reject(err);
        }
    });
}

// Lokales Audio als Fallback
function tryLocalAudio() {
    console.log('Trying local audio fallback...');

    const ambLocal = document.getElementById('ambLocal');
    const soundBtn = document.getElementById('soundToggle');

    if (ambLocal) {
        ambLocal.volume = 0.08;
        ambLocal.muted = false;

        ambLocal
            .play()
            .then(() => {
                console.log('Local audio started successfully');
                window.currentAudioMode = 'local';
                if (soundBtn) soundBtn.textContent = '🔊';
            })
            .catch((err) => {
                console.warn('Local audio failed:', err);
                if (soundBtn) soundBtn.textContent = '🔇';
            });
    }
}

// Navigation und Scroll-Funktionen
function initNavigation() {
    // CTA scrollt zur Ausgangslage (#s2)
    const ctaBtn = document.getElementById('ctaStart');
    if (ctaBtn) {
        ctaBtn.addEventListener('click', () => {
            const el = document.getElementById('s2');
            if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 70;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        });
    }

    // Smooth scroll für Navbar-Links
    document.querySelectorAll('.links a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
            const id = a.getAttribute('href').slice(1);
            const el = document.getElementById(id);
            if (!el) return;
            e.preventDefault();
            const y = el.getBoundingClientRect().top + window.scrollY - 70;
            window.scrollTo({ top: y, behavior: 'smooth' });
        });
    });

    // Back to Top
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        backToTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Scroll-Event-Handling
function initScrollHandling() {
    // Active link highlight on scroll
    const links = [...document.querySelectorAll('.links a')];
    const sections = links
        .map((a) => {
            const href = a.getAttribute('href');
            return href ? document.querySelector(href) : null;
        })
        .filter(Boolean); // Entferne null-Werte

    if (sections.length === 0) return; // Keine Sections gefunden

    const onScroll = () => {
        const y = window.scrollY + 80;
        let idx = sections.findIndex(
            (s, i) => y >= s.offsetTop && (i === sections.length - 1 || y < sections[i + 1].offsetTop)
        );

        // Update desktop navigation
        links.forEach((l) => l.classList.remove('active'));
        if (idx >= 0 && links[idx]) {
            links[idx].classList.add('active');

            // Update mobile navigation current page
            const currentPageSpan = document.querySelector('.current-page');
            if (currentPageSpan) {
                currentPageSpan.textContent = links[idx].textContent;

                // Update mobile dropdown visibility
                const mobileLinks = document.querySelectorAll('.mobile-dropdown a');
                const activeHref = links[idx].getAttribute('href');
                mobileLinks.forEach((link) => {
                    const linkHref = link.getAttribute('href');
                    if (linkHref === activeHref) {
                        link.style.display = 'none';
                    } else {
                        link.style.display = 'block';
                    }
                });
            }
        }
    };

    window.addEventListener('scroll', onScroll);
    onScroll(); // Initial call
}

// Audio Controller mit verbessertem Error Handling
function initAudioController() {
    const soundBtn = document.getElementById('soundToggle');
    const ambLocal = document.getElementById('ambLocal');

    if (!soundBtn) {
        console.warn('Sound toggle button not found');
        return;
    }

    // Nur Sound Button Setup - Audio wird über Splash Screen System verwaltet

    // Audio Controller initialisiert nur den Sound Button - kein automatisches Laden

    // Einfacher Sound toggle Event Handler
    soundBtn.onclick = () => {
        console.log('Sound button clicked, current mode:', window.currentAudioMode);

        if (!window.userHasInteracted) {
            console.log('User has not interacted yet - please click splash screen first');
            return;
        }

        const currentMode = window.currentAudioMode || 'none';

        if (currentMode === 'youtube' && window.ytPlayer) {
            try {
                const playerState = window.ytPlayer.getPlayerState();
                if (playerState === YT.PlayerState.PLAYING) {
                    window.ytPlayer.pauseVideo();
                    soundBtn.textContent = '🔇';
                    console.log('YouTube paused');
                } else {
                    window.ytPlayer.playVideo();
                    soundBtn.textContent = '🔊';
                    console.log('YouTube resumed');
                }
            } catch (e) {
                console.warn('YouTube control failed:', e);
                toggleLocalAudio();
            }
        } else if (currentMode === 'local') {
            toggleLocalAudio();
        } else {
            console.log('No audio running, starting fresh...');
            startAudioAfterInteraction();
        }
    };

    function toggleLocalAudio() {
        const ambLocal = document.getElementById('ambLocal');
        if (ambLocal) {
            try {
                if (ambLocal.paused) {
                    ambLocal
                        .play()
                        .then(() => {
                            soundBtn.textContent = '🔊';
                            console.log('Local audio resumed');
                        })
                        .catch((err) => {
                            console.warn('Local audio resume failed:', err);
                            soundBtn.textContent = '🔇';
                        });
                } else {
                    ambLocal.pause();
                    soundBtn.textContent = '🔇';
                    console.log('Local audio paused');
                }
            } catch (e) {
                console.warn('Local audio control failed:', e);
            }
        }
    }
}

// Wiederverwendbares "Mehr lesen" System
function initReadMoreSystem() {
    // Alle expandierbaren Texte initialisieren
    document.querySelectorAll('.expandable-text').forEach(initExpandableText);

    // Modal-Funktionalität
    const modal = document.getElementById('readMoreModal');
    const modalClose = document.getElementById('modalClose');
    const modalTitle = document.getElementById('modalTitle');
    const modalText = document.getElementById('modalText');

    if (!modal || !modalClose || !modalTitle || !modalText) {
        console.warn('Modal elements not found');
        return;
    }

    // Modal schließen
    function closeModal() {
        modal.classList.add('hide');
        modal.classList.remove('show');

        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('hide');
            document.body.style.overflow = 'auto'; // Scrollen wieder erlauben
        }, 300); // Warte bis CSS transition beendet ist
    }

    // Modal öffnen
    function openModal(title, fullText) {
        modalTitle.textContent = title;
        modalText.innerHTML = fullText;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Scrollen blockieren

        // Force reflow für smooth animation
        modal.offsetHeight;

        setTimeout(() => modal.classList.add('show'), 10);
    }

    // Event Listeners
    modalClose.addEventListener('click', closeModal);

    // Modal schließen bei Klick außerhalb
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Modal schließen mit ESC-Taste
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });

    // Globale Funktion zum Öffnen des Modals
    window.openReadMoreModal = openModal;
}

// Einzelnen expandierbaren Text initialisieren
function initExpandableText(element) {
    const fullText = element.getAttribute('data-full-text');
    const title = element.getAttribute('data-title') || 'Vollständiger Text';
    const maxLength = parseInt(element.getAttribute('data-max-length')) || 300;

    if (!fullText) {
        console.warn('data-full-text attribute missing');
        return;
    }

    const textPreview = element.querySelector('.text-preview');
    const readMoreBtn = element.querySelector('.read-more-btn');

    if (!textPreview || !readMoreBtn) {
        console.warn('Required elements (.text-preview, .read-more-btn) not found');
        return;
    }

    // Text kürzen
    const truncatedText = fullText.length > maxLength ? fullText.substring(0, maxLength).trim() + '...' : fullText;

    textPreview.textContent = truncatedText;

    // Wenn Text nicht gekürzt wurde, Button verstecken
    if (fullText.length <= maxLength) {
        readMoreBtn.style.display = 'none';
        return;
    }

    // Button Event Listener
    readMoreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.openReadMoreModal(title, fullText);
    });
}

// Mobile Navigation Handler
function initMobileNavigation() {
    const burgerMenu = document.getElementById('burgerMenu');
    const mobileDropdown = document.getElementById('mobileDropdown');
    const currentPageSpan = document.querySelector('.current-page');

    if (!burgerMenu || !mobileDropdown || !currentPageSpan) {
        console.warn('Mobile navigation elements not found');
        return;
    }

    // Burger Menu Toggle
    burgerMenu.addEventListener('click', () => {
        const isOpen = mobileDropdown.classList.contains('show');

        if (isOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    // Schließe Menu bei Klick außerhalb
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-inner') && mobileDropdown.classList.contains('show')) {
            closeMobileMenu();
        }
    });

    // Navigation Link Clicks
    const mobileLinks = mobileDropdown.querySelectorAll('a');
    mobileLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            const targetId = href.slice(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Update current page display
                currentPageSpan.textContent = link.textContent;

                // Update active states in main navigation
                updateActiveNavigation(href);

                // Smooth scroll to section
                const y = targetElement.getBoundingClientRect().top + window.scrollY - 70;
                window.scrollTo({ top: y, behavior: 'smooth' });

                // Close mobile menu
                closeMobileMenu();
            }
        });
    });

    function openMobileMenu() {
        mobileDropdown.classList.add('show');
        burgerMenu.classList.add('active');
        burgerMenu.setAttribute('aria-label', 'Menü schließen');
    }

    function closeMobileMenu() {
        mobileDropdown.classList.remove('show');
        burgerMenu.classList.remove('active');
        burgerMenu.setAttribute('aria-label', 'Menü öffnen');
    }

    function updateActiveNavigation(activeHref) {
        // Update desktop navigation
        document.querySelectorAll('.links a').forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('href') === activeHref) {
                link.classList.add('active');
            }
        });

        // Update mobile dropdown - hide current page from dropdown
        mobileLinks.forEach((link) => {
            const linkHref = link.getAttribute('href');
            if (linkHref === activeHref) {
                link.style.display = 'none';
            } else {
                link.style.display = 'block';
            }
        });
    }

    // Initial setup - hide current page from dropdown
    const activeLink = document.querySelector('.links a.active');
    if (activeLink) {
        const activeHref = activeLink.getAttribute('href');
        currentPageSpan.textContent = activeLink.textContent;
        updateActiveNavigation(activeHref);
    }
}
