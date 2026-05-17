/**
 * TETRIS ELITE - Gestor de Audio
 */

export class AudioManager {
    constructor() {
        this.playlist = [
            'https://archive.org/download/TetrisThemeMusic/Tetris.mp3',
        ];

        this.bgMusic = new Audio();
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.4;

        this.isMuted = false;
        this.isPlaying = false;

        this.pickRandomSong();
    }

    pickRandomSong() {
        const randomIndex = Math.floor(Math.random() * this.playlist.length);
        const nextSong = this.playlist[randomIndex];

        // Solo cambiamos si es una canción diferente
        if (this.bgMusic.src !== nextSong) {
            this.bgMusic.src = nextSong;
        }
    }

    playGameOver() {
        if (this.isMuted) return;

        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'square'; // Sonido retro 8-bit
            oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.8);

            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.8);
        } catch (e) {
            console.warn("Web Audio API no soportada o bloqueada:", e);
        }
    }

    playMusic() {
        if (this.isMuted) return;

        if (this.bgMusic.readyState === 0) {
            this.bgMusic.load();
        }

        this.bgMusic.play().then(() => {
            this.isPlaying = true;
        }).catch(err => {
            console.warn("Autoplay bloqueado o error de carga. Intentando otra canción...", err);
            this.pickRandomSong();
        });
    }

    pauseMusic() {
        this.bgMusic.pause();
        this.isPlaying = false;
    }

    stopMusic() {
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
        this.isPlaying = false;
        this.pickRandomSong();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.bgMusic.muted = this.isMuted;
        return this.isMuted;
    }

    setVolume(value) {
        this.bgMusic.volume = value;
    }
}
