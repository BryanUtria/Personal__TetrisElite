/**
 * TETRIS ELITE - Gestor de Multijugador
 */

export class MultiplayerManager {
    constructor(app, socket) {
        this.app = app;
        this.socket = socket;
        this.room = null;
        this.isSearching = false;
        this.opponentState = null;
        this.opponentCanvas = document.getElementById('opponent-board');
        
        // Establecer tamaño fijo para el tablero del oponente (20px por bloque)
        this.opponentCanvas.width = 200;
        this.opponentCanvas.height = 400;
        
        this.opponentCtx = this.opponentCanvas.getContext('2d');
        
        this.setupListeners();
    }

    setupListeners() {
        this.socket.on('waiting-for-opponent', () => {
            this.isSearching = true;
            document.getElementById('matchmaking-status').innerText = 'BUSCANDO OPONENTE...';
        });

        this.socket.on('match-found', (data) => {
            this.room = data.room;
            this.isSearching = false;
            document.getElementById('matchmaking-status').innerText = '¡OPONENTE ENCONTRADO!';
            
            setTimeout(() => {
                document.getElementById('matchmaking-overlay').classList.add('hidden');
                this.app.startMultiplayerGame();
            }, 1000);
        });

        this.socket.on('opponent-update', (state) => {
            this.opponentState = state;
            this.drawOpponent();
        });

        this.socket.on('receive-garbage', (data) => {
            this.app.engine.addGarbageLines(data.lines);
        });

        this.socket.on('opponent-won', () => {
            this.app.engine.gameOver = true;
            this.app.endBattle(true); // ¡Ganaste! (Tu oponente perdió)
        });

        this.socket.on('opponent-disconnected', () => {
            if (this.room && !this.app.engine.gameOver) {
                this.app.engine.gameOver = true;
                this.app.endBattle(true, 'EL OPONENTE ABANDONÓ LA PARTIDA');
            }
        });

        this.socket.on('disconnect', () => {
            // Este es el evento de pérdida de conexión propia con el servidor
            if (this.room && !this.app.engine.gameOver) {
                location.reload();
            }
        });
    }

    joinBattle() {
        this.room = null;
        this.opponentState = null;
        if (this.opponentCtx) {
            this.opponentCtx.clearRect(0, 0, this.opponentCanvas.width, this.opponentCanvas.height);
        }
        const scoreEl = document.getElementById('opponent-score');
        if (scoreEl) scoreEl.innerText = '0';

        this.socket.emit('join-battle');
        document.getElementById('matchmaking-overlay').classList.remove('hidden');
    }

    sendState(engine) {
        if (!this.room) return;
        
        // Crear una copia de la grid para incluir la pieza actual
        const tempGrid = engine.grid.map(row => [...row]);
        const piece = engine.currentPiece;
        
        if (piece) {
            piece.shape.forEach((row, y) => {
                row.forEach((val, x) => {
                    if (val) {
                        const boardY = piece.pos.y + y;
                        const boardX = piece.pos.x + x;
                        if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
                            tempGrid[boardY][boardX] = piece.type;
                        }
                    }
                });
            });
        }

        this.socket.emit('update-state', {
            room: this.room,
            grid: tempGrid,
            score: engine.score,
            lines: engine.lines,
            level: engine.level
        });
    }

    sendGarbage(lines) {
        if (!this.room) return;
        this.socket.emit('send-garbage', {
            room: this.room,
            lines
        });
    }

    sendGameOver() {
        if (!this.room) return;
        this.socket.emit('game-over-multi', { room: this.room });
    }

    drawOpponent() {
        if (!this.opponentState) return;
        
        const ctx = this.opponentCtx;
        const grid = this.opponentState.grid;
        
        // Limpiar el canvas
        ctx.clearRect(0, 0, this.opponentCanvas.width, this.opponentCanvas.height);
        
        const cols = 10;
        const rows = 20;
        const blockSize = this.opponentCanvas.width / cols;
        
        // Fondo negro para el tablero del oponente
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.opponentCanvas.width, this.opponentCanvas.height);
        
        // Dibujar grid del oponente
        grid.forEach((row, y) => {
            row.forEach((type, x) => {
                if (type) {
                    this.drawMiniBlock(ctx, x, y, blockSize, type);
                }
            });
        });

        const scoreEl = document.getElementById('opponent-score');
        if (scoreEl) scoreEl.innerText = this.opponentState.score;
    }

    drawMiniBlock(ctx, x, y, size, type) {
        const colors = {
            'I': '#00f2ff', 'J': '#003cff', 'L': '#ff9100',
            'O': '#ffe600', 'S': '#00ff22', 'T': '#bc00ff', 'Z': '#ff0040',
            'G': '#555' // Garbage
        };
        const color = colors[type] || '#555';
        
        ctx.fillStyle = color;
        ctx.shadowBlur = 4;
        ctx.shadowColor = color;
        ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x * size + 1, y * size + 1, size - 2, size / 4);
    }
    quit() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}
