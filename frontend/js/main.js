import { GameEngine } from './engine.js';
import { loadHighScore, saveHighScore } from './storage.js';
import { AudioManager } from './audio.js';
import { MultiplayerManager } from './MultiplayerManager.js';

class App {
    constructor() {
        this.engine = new GameEngine({
            board: document.getElementById('game-board'),
            next: document.getElementById('next-piece'),
            hold: document.getElementById('hold-piece')
        });

        this.audio = new AudioManager();
        this.multiplayer = null;
        this.socket = null;

        this.highScore = 0;
        this.isMultiplayer = false;
        this.animationId = null;
        this.lastStateUpdateTime = 0;

        this.bindUI();
        this.bindTouchControls();
        this.initializeHighScore();
    }

    bindUI() {
        // Eventos de teclado
        document.addEventListener('keydown', (e) => {
            if (this.engine.gameOver || this.engine.paused) return;

            const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'ShiftRight', 'c'];
            if (gameKeys.includes(e.key) || gameKeys.includes(e.code)) e.preventDefault();

            if (e.key === 'ArrowLeft') this.engine.move(-1);
            if (e.key === 'ArrowRight') this.engine.move(1);
            if (e.key === 'ArrowDown') this.engine.drop();
            if (e.key === 'ArrowUp') this.engine.rotate();
            if (e.key === ' ') this.engine.hardDrop();
            if (e.code === 'ShiftRight' || e.key === 'c') this.engine.hold();
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.engine.gameOver) this.togglePause();
        });

        // Configurar menú de rueda 3D y barra de navegación
        this.setupMainMenu();

        document.getElementById('cancel-battle-btn').onclick = () => location.reload();

        document.getElementById('restart-btn').onclick = () => {
            if (this.isMultiplayer) this.initBattle();
            else this.start();
        };

        document.getElementById('resume-btn').onclick = () => this.togglePause();
        document.getElementById('ingame-menu-btn').onclick = () => this.togglePause();
        document.getElementById('mute-btn').onclick = () => this.toggleMute();

        document.getElementById('back-to-menu-btn').onclick = () => {
            if (this.isMultiplayer && this.multiplayer) {
                this.multiplayer.quit();
            }
            location.reload();
        };

        document.getElementById('pause-to-menu-btn').onclick = () => {
            if (this.isMultiplayer && this.multiplayer) {
                this.multiplayer.quit();
            }
            location.reload();
        };
    }

    setupMainMenu() {
        const wheelItems = document.querySelectorAll('.wheel-item');
        const playBtn = document.getElementById('play-selected-btn');
        let activeIndex = 1; // 1 porque Historia (0) está deshabilitado por ahora

        const updateWheel = () => {
            wheelItems.forEach((item, index) => {
                const diff = index - activeIndex;
                item.classList.toggle('active', diff === 0);

                // Efecto 3D de Rueda Vertical (Ajustado para más elementos)
                const translateY = diff * 45;
                const scale = Math.max(0.4, 1 - Math.abs(diff) * 0.12);
                const rotateX = diff * -15;

                let opacity = 0;
                if (diff === 0) opacity = 1;
                else if (Math.abs(diff) === 1) opacity = 0.6;
                else if (Math.abs(diff) === 2) opacity = 0.3;
                else if (Math.abs(diff) === 3) opacity = 0.1;

                // @ts-ignore
                item.style.transform = `translateY(${translateY}px) translateZ(${Math.abs(diff) * -40}px) rotateX(${rotateX}deg) scale(${scale})`;
                // @ts-ignore
                item.style.opacity = opacity;
                // @ts-ignore
                item.style.zIndex = 10 - Math.abs(diff);
            });
        };

        const wheelContainer = document.getElementById('mode-wheel');
        if (wheelContainer) {
            let startY = 0;
            wheelContainer.addEventListener('wheel', (e) => {
                if (e.deltaY > 0 && activeIndex < wheelItems.length - 1) activeIndex++;
                else if (e.deltaY < 0 && activeIndex > 0) activeIndex--;
                updateWheel();
            });

            wheelContainer.addEventListener('touchstart', e => startY = e.touches[0].clientY, { passive: true });
            wheelContainer.addEventListener('touchend', e => {
                const endY = e.changedTouches[0].clientY;
                if (startY - endY > 30 && activeIndex < wheelItems.length - 1) activeIndex++;
                else if (endY - startY > 30 && activeIndex > 0) activeIndex--;
                updateWheel();
            });

            wheelItems.forEach((item, index) => {
                item.addEventListener('click', () => {
                    if (activeIndex !== index) {
                        activeIndex = index;
                        updateWheel();
                    }
                });
            });
        }

        if (playBtn) {
            playBtn.onclick = () => {
                const action = wheelItems[activeIndex].getAttribute('data-action');
                if (action === 'start') this.start();
                else if (action === 'battle') this.initBattle();
                else if (action === 'story') alert('Modo Historia estará disponible en la próxima actualización.');
                else if (action === 'team_battle') alert('¡La Batalla 2v2 llegará pronto! Busca a un amigo.');
                else if (action === 'garbage_clear') alert('Modo "Elimina Basura" en desarrollo. ¡Prepárate para pensar!');
                else if (action === 'sprint') alert('Sprint 40 Líneas: Afina tus dedos, próximamente.');
                else if (action === 'inverted') alert('Gravedad Cero: Las piezas subirán. ¡Pronto disponible!');
            };
        }

        // Bottom Navigation Logic
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const action = tab.getAttribute('data-action');
                if (action === 'exit') {
                    if (confirm("¿Deseas salir del juego?")) window.close();
                    return;
                }

                navTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const target = tab.getAttribute('data-target');
                if (target === 'highscores-screen') {
                    this.showScreen('highscores-screen');
                    this.updateHighScoreUI();
                } else if (target === 'menu-screen') {
                    this.showScreen('menu-screen');
                } else if (target === 'settings-screen') {
                    alert('Ajustes en desarrollo...');
                }
            });
        });

        updateWheel();

        // Bucle de actualización de UI
        this.updateUI();
    }

    initBattle() {
        if (!this.socket) {
            // Conexión explícita al backend de Render para que funcione en Android (Capacitor)
            // @ts-ignore
            this.socket = io("https://personal-tetriselite.onrender.com");
            this.multiplayer = new MultiplayerManager(this, this.socket);
        }
        this.isMultiplayer = true;
        this.showScreen('game-screen');
        const gameLayout = document.querySelector('.game-layout');
        if (gameLayout) gameLayout.classList.add('battle');
        document.getElementById('opponent-side').classList.remove('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        this.multiplayer.joinBattle();
    }

    startMultiplayerGame() {
        document.getElementById('game-over-overlay').classList.add('hidden');
        this.engine = new GameEngine({
            board: document.getElementById('game-board'),
            next: document.getElementById('next-piece'),
            hold: document.getElementById('hold-piece')
        });

        // Callbacks de multijugador
        this.engine.onLinesCleared = (lines) => {
            this.multiplayer.sendGarbage(lines);
        };
        this.engine.onGameOver = () => {
            this.multiplayer.sendGameOver();
            this.endBattle(false);
        };

        this.engine.reset();
        this.audio.stopMusic();
        this.audio.playMusic();
        requestAnimationFrame((t) => this.run(t));
    }

    bindTouchControls() {
        // Re-usar lógica de touch para el tablero de batalla
        const setupBoardTouch = (boardId) => {
            const board = document.getElementById(boardId);
            if (!board) return;

            let touchStartX = 0;
            let touchStartY = 0;
            let lastTouchX = 0;
            let lastTouchY = 0;
            let startTime = 0;
            let isLongPress = false;
            let longPressTimer = null;
            let touchAxisLocked = null; // 'horizontal' o 'vertical'

            board.addEventListener('touchstart', (e) => {
                if (this.engine.gameOver || this.engine.paused) return;
                e.preventDefault();
                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                lastTouchX = touch.clientX;
                lastTouchY = touch.clientY;
                startTime = Date.now();
                isLongPress = false;
                touchAxisLocked = null;

                longPressTimer = setTimeout(() => {
                    this.engine.hold();
                    isLongPress = true;
                    if (navigator.vibrate) navigator.vibrate(40);
                }, 500);
            }, { passive: false });

            board.addEventListener('touchmove', (e) => {
                if (this.engine.gameOver || this.engine.paused) return;
                e.preventDefault();
                const touch = e.touches[0];
                const rect = board.getBoundingClientRect();
                const distX = Math.abs(touch.clientX - touchStartX);
                const distY = touch.clientY - touchStartY;
                const colWidth = rect.width / 10;
                const rowHeight = rect.height / 20;

                if (distX > 15 || Math.abs(distY) > 15) clearTimeout(longPressTimer);

                // Bloqueo Inteligente de Eje
                if (!touchAxisLocked) {
                    if (distY > 20 && distY > distX * 1.5) {
                        touchAxisLocked = 'vertical';
                    } else if (distX > 20 && distX > Math.abs(distY) * 1.5) {
                        touchAxisLocked = 'horizontal';
                    }
                }

                // Movimiento Horizontal Relativo
                if (touchAxisLocked !== 'vertical') {
                    const deltaX = touch.clientX - lastTouchX;
                    if (Math.abs(deltaX) > colWidth * 0.9) {
                        this.engine.move(deltaX > 0 ? 1 : -1);
                        lastTouchX = touch.clientX;
                    }
                }

                // Caída Suave Continua
                if (touchAxisLocked !== 'horizontal') {
                    const deltaY = touch.clientY - lastTouchY;
                    if (deltaY > rowHeight * 1.5) {
                        this.engine.drop();
                        lastTouchY = touch.clientY;
                    }
                }
            }, { passive: false });

            board.addEventListener('touchend', (e) => {
                clearTimeout(longPressTimer);
                if (this.engine.gameOver || this.engine.paused) return;
                const duration = Date.now() - startTime;
                const distX = Math.abs(e.changedTouches[0].clientX - touchStartX);
                const distY = e.changedTouches[0].clientY - touchStartY;

                // Rotar (Tap rápido y sin moverse)
                if (duration < 250 && distX < 15 && Math.abs(distY) < 15 && !isLongPress) {
                    this.engine.rotate();
                }

                // Caída Rápida (Swipe largo hacia abajo)
                if (distY > 80 && duration < 400 && touchAxisLocked !== 'horizontal') {
                    this.engine.hardDrop();
                }
            }, { passive: false });
        };

        setupBoardTouch('game-board');
    }

    start() {
        if (document.activeElement) document.activeElement.blur();
        this.isMultiplayer = false;
        const gameLayout = document.querySelector('.game-layout');
        if (gameLayout) gameLayout.classList.remove('battle');
        document.getElementById('opponent-side').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.add('hidden');
        this.engine = new GameEngine({
            board: document.getElementById('game-board'),
            next: document.getElementById('next-piece'),
            hold: document.getElementById('hold-piece')
        });
        this.engine.reset();
        this.showScreen('game-screen');
        this.engine.draw();
        this.audio.stopMusic();
        this.audio.playMusic();
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = requestAnimationFrame((t) => this.run(t));
    }

    run(time) {
        if (this.engine.paused || this.engine.gameOver) {
            if (this.engine.gameOver && !this.isMultiplayer) this.endGame();
            return;
        }
        this.engine.update(time);

        if (this.isMultiplayer) {
            // Optimización: Solo enviar estado cada 100ms
            if (time - this.lastStateUpdateTime > 100) {
                this.multiplayer.sendState(this.engine);
                this.lastStateUpdateTime = time;
            }
        }
        this.updateStats();

        this.animationId = requestAnimationFrame((t) => this.run(t));
    }

    togglePause() {
        if (this.engine.gameOver) return;

        if (this.isMultiplayer) {
            // En multijugador no pausamos el motor, solo mostramos el menú para salir
            const overlay = document.getElementById('pause-overlay');
            const isHidden = overlay.classList.contains('hidden');
            overlay.classList.toggle('hidden', !isHidden);

            // Ajustar texto para multijugador
            const title = overlay.querySelector('h2');
            const resumeBtn = document.getElementById('resume-btn');
            if (title) title.innerText = "MENÚ";
            if (resumeBtn) resumeBtn.style.display = isHidden ? "block" : "none"; // En realidad ocultamos reanudar o lo dejamos para cerrar el overlay
            return;
        }

        this.engine.paused = !this.engine.paused;
        document.getElementById('pause-overlay').classList.toggle('hidden', !this.engine.paused);

        // Ajustar texto para solitario
        const title = document.querySelector('#pause-overlay h2');
        if (title) title.innerText = "PAUSADO";
        document.getElementById('resume-btn').style.display = "block";

        if (this.engine.paused) {
            this.audio.pauseMusic();
        } else {
            this.audio.playMusic();
            requestAnimationFrame((t) => this.run(t));
        }
    }

    toggleMute() {
        const muted = this.audio.toggleMute();
        document.getElementById('mute-icon').innerText = muted ? '🔇' : '🔊';
    }

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(id);
        if (screen) screen.classList.add('active');

        // Ocultar barra de navegación en el juego
        const bottomNav = document.getElementById('bottom-nav');
        if (bottomNav) {
            if (id === 'game-screen') bottomNav.classList.add('hidden');
            else bottomNav.classList.remove('hidden');
        }
    }

    updateStats() {
        document.getElementById('score').innerText = this.engine.score.toString().padStart(6, '0');
        document.getElementById('lines').innerText = this.engine.lines;
        document.getElementById('level').innerText = this.engine.level;
        this.updateHighScoreUI();
    }

    async initializeHighScore() {
        this.highScore = await loadHighScore();
        this.updateHighScoreUI();
    }

    updateHighScoreUI() {
        const formatted = this.highScore.toString().padStart(6, '0');
        const ingameScore = document.getElementById('high-score');
        const highscoresMaxScore = document.getElementById('highscores-max-score');

        if (ingameScore) ingameScore.innerText = formatted;
        if (highscoresMaxScore) highscoresMaxScore.innerText = formatted;
    }

    updateUI() {
        requestAnimationFrame(() => this.updateUI());
    }

    endGame() {
        if (this.engine.score > this.highScore) {
            this.highScore = this.engine.score;
            saveHighScore(this.engine.score).catch(() => { });
            this.updateHighScoreUI();
        }
        this.audio.stopMusic();
        this.audio.playGameOver();

        const title = document.getElementById('game-over-title');
        const subtitle = document.getElementById('game-over-subtitle');
        title.innerText = "FIN DEL JUEGO";
        title.style.color = "var(--secondary)";
        if (subtitle) subtitle.classList.add('hidden');

        document.getElementById('final-score').innerText = this.engine.score;
        document.getElementById('game-over-overlay').classList.remove('hidden');
    }

    endBattle(won, customText = null) {
        this.audio.stopMusic();
        this.audio.playGameOver();

        const title = document.getElementById('game-over-title');
        const subtitle = document.getElementById('game-over-subtitle');

        if (customText) {
            title.innerText = "¡VICTORIA!";
            title.style.color = "var(--primary)";
            title.style.textShadow = "0 0 20px var(--primary)";

            if (subtitle) {
                subtitle.innerText = customText;
                subtitle.classList.remove('hidden');
            }
        } else {
            if (subtitle) subtitle.classList.add('hidden');
            if (won) {
                title.innerText = "¡VICTORIA!";
                title.style.color = "var(--primary)";
                title.style.textShadow = "0 0 20px var(--primary)";
            } else {
                title.innerText = "DERROTA";
                title.style.color = "var(--secondary)";
                title.style.textShadow = "0 0 20px var(--secondary)";
            }
        }

        document.getElementById('final-score').innerText = this.engine.score;
        document.getElementById('game-over-overlay').classList.remove('hidden');
    }
}

const app = new App();
