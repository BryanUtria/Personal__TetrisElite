/**
 * TETRIS ELITE - Motor de Juego (Lógica)
 */

import { COLS, ROWS, COLORS, SHAPES, CONFIG } from './constants.js';
import { Particle } from './particles.js';

export class GameEngine {
    constructor(canvases) {
        this.boardCanvas = canvases.board;
        this.boardCtx = this.boardCanvas.getContext('2d');
        this.nextCanvas = canvases.next;
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = canvases.hold;
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        this.blockSize = 30;
        this.previewBlockSize = 25;
        this.particles = [];
        this.onLinesCleared = null;
        this.onGameOver = null;
        
        this.init();
    }

    init() {
        this.calculateSizes();
        window.addEventListener('resize', () => {
            this.calculateSizes();
            this.draw();
        });
        this.reset();
    }

    calculateSizes() {
        const isMobile = window.innerWidth <= 900;
        const verticalMargin = isMobile ? 300 : 120;
        const horizontalMargin = isMobile ? 40 : 400;

        const availableHeight = window.innerHeight - verticalMargin;
        const availableWidth = window.innerWidth - horizontalMargin;

        const hSize = Math.floor(availableHeight / ROWS);
        const wSize = Math.floor(availableWidth / COLS);
        
        this.blockSize = Math.max(15, Math.min(hSize, wSize, 40)); 
        this.previewBlockSize = Math.floor(this.blockSize * 0.8);

        this.boardCanvas.width = COLS * this.blockSize;
        this.boardCanvas.height = ROWS * this.blockSize;
        
        this.nextCanvas.width = 6 * this.previewBlockSize;
        this.nextCanvas.height = 6 * this.previewBlockSize;
        this.holdCanvas.width = 6 * this.previewBlockSize;
        this.holdCanvas.height = 6 * this.previewBlockSize;
    }

    reset() {
        this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        
        this.currentPiece = this.getRandomPiece();
        this.nextPiece = this.getRandomPiece();
        this.heldPiece = null;
        this.canHold = true;
        this.particles = [];
        
        this.dropCounter = 0;
        this.dropInterval = CONFIG.INITIAL_DROP_INTERVAL;
        this.lastTime = 0;
    }

    getRandomPiece() {
        const keys = Object.keys(SHAPES);
        const type = keys[Math.floor(Math.random() * keys.length)];
        return {
            type,
            shape: SHAPES[type],
            pos: { x: Math.floor(COLS / 2) - 1, y: 0 },
            color: COLORS[type]
        };
    }

    move(dir) {
        this.currentPiece.pos.x += dir;
        if (this.collide()) {
            this.currentPiece.pos.x -= dir;
            return false;
        }
        return true;
    }

    rotate() {
        const prevShape = this.currentPiece.shape;
        this.currentPiece.shape = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        if (this.collide()) {
            this.currentPiece.shape = prevShape;
        }
    }

    drop() {
        this.currentPiece.pos.y++;
        if (this.collide()) {
            this.currentPiece.pos.y--;
            this.lock();
        }
        this.dropCounter = 0;
    }

    hardDrop() {
        const startY = this.currentPiece.pos.y;
        while (!this.collide()) {
            this.currentPiece.pos.y++;
        }
        this.currentPiece.pos.y--;
        this.createHardDropEffect(this.currentPiece.pos.x, startY, this.currentPiece.pos.y, this.currentPiece.shape, this.currentPiece.color);
        this.lock(true);
    }

    hold() {
        if (!this.canHold) return;

        if (!this.heldPiece) {
            this.heldPiece = {
                type: this.currentPiece.type,
                shape: SHAPES[this.currentPiece.type],
                color: COLORS[this.currentPiece.type]
            };
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.getRandomPiece();
        } else {
            const temp = {
                type: this.currentPiece.type,
                shape: SHAPES[this.currentPiece.type],
                color: COLORS[this.currentPiece.type]
            };
            this.currentPiece = {
                type: this.heldPiece.type,
                shape: SHAPES[this.heldPiece.type],
                pos: { x: Math.floor(COLS / 2) - 1, y: 0 },
                color: COLORS[this.heldPiece.type]
            };
            this.heldPiece = temp;
        }

        this.currentPiece.pos = { x: Math.floor(COLS / 2) - 1, y: 0 };
        this.canHold = false;
        this.draw();
    }

    collide() {
        const { shape, pos } = this.currentPiece;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x] !== 0) {
                    const newX = pos.x + x;
                    const newY = pos.y + y;
                    if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && this.grid[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    lock(isHardDrop = false) {
        const { shape, pos, type } = this.currentPiece;
        shape.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val !== 0) {
                    if (pos.y + y < 0) {
                        this.gameOver = true;
                        return;
                    }
                    this.grid[pos.y + y][pos.x + x] = type;
                }
            });
        });

        this.triggerShake(isHardDrop);
        
        if (!this.gameOver) {
            this.clearLines();
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.getRandomPiece();
            this.canHold = true;
            if (this.collide()) {
                this.gameOver = true;
                if (this.onGameOver) this.onGameOver();
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                for (let x = 0; x < COLS; x++) {
                    this.createParticles(x, y, COLORS[this.grid[y][x]]);
                }
                this.grid.splice(y, 1);
                this.grid.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++;
            }
        }

        if (linesCleared > 0) {
            if (linesCleared === 4) this.triggerShake(true, 400);
            this.lines += linesCleared;
            this.score += CONFIG.SCORING[linesCleared] * this.level;
            this.level = Math.floor(this.lines / CONFIG.LEVEL_UP_LINES) + 1;
            this.dropInterval = Math.max(
                CONFIG.MIN_DROP_INTERVAL,
                CONFIG.INITIAL_DROP_INTERVAL - (this.level - 1) * CONFIG.DROP_ACCELERATION_PER_LEVEL
            );

            // Notificar para multijugador
            if (this.onLinesCleared && linesCleared >= 2) {
                this.onLinesCleared(linesCleared - 1); // 2 lines -> 1 garbage, 3 -> 2, 4 -> 3
            }
        }
    }

    addGarbageLines(count) {
        for (let i = 0; i < count; i++) {
            this.grid.shift();
            const row = Array(COLS).fill('G');
            const hole = Math.floor(Math.random() * COLS);
            row[hole] = 0;
            this.grid.push(row);
        }
        this.triggerShake(true, 400);
        if (this.collide()) {
            this.gameOver = true;
            if (this.onGameOver) this.onGameOver();
        }
    }

    triggerShake(isStrong = false, duration = 300) {
        const wrapper = document.querySelector('.board-wrapper');
        if (!wrapper) return;
        wrapper.classList.remove('shake');
        void wrapper.offsetWidth;
        wrapper.style.animationDuration = isStrong ? '0.3s' : '0.2s';
        wrapper.classList.add('shake');
        if (isStrong) setTimeout(() => wrapper.style.animationDuration = '0.2s', duration);
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 3; i++) {
            this.particles.push(new Particle(
                x * this.blockSize + this.blockSize / 2,
                y * this.blockSize + this.blockSize / 2,
                color
            ));
        }
    }

    createHardDropEffect(x, startY, endY, shape, color) {
        shape.forEach((row, dy) => {
            row.forEach((val, dx) => {
                if (val !== 0) {
                    for(let i=0; i<2; i++) {
                        const p = new Particle((x+dx)*this.blockSize+this.blockSize/2, (endY+dy)*this.blockSize+this.blockSize, color);
                        p.size *= 0.5;
                        p.life = 0.5;
                        this.particles.push(p);
                    }
                }
            });
        });
        const p = new Particle(x*this.blockSize+(shape[0].length*this.blockSize)/2, startY*this.blockSize+(endY-startY)*this.blockSize/2, color);
        p.speedX = 0; p.speedY = 0; p.life = 0.2; p.size = (shape[0].length*this.blockSize)/2;
        this.particles.push(p);
    }

    draw() {
        // Tablero
        this.boardCtx.fillStyle = '#000';
        this.boardCtx.fillRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);

        // Rejilla
        this.boardCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.boardCtx.lineWidth = 1;
        for (let x = 0; x <= COLS; x++) {
            this.boardCtx.beginPath();
            this.boardCtx.moveTo(x * this.blockSize, 0);
            this.boardCtx.lineTo(x * this.blockSize, this.boardCanvas.height);
            this.boardCtx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            this.boardCtx.beginPath();
            this.boardCtx.moveTo(0, y * this.blockSize);
            this.boardCtx.lineTo(this.boardCanvas.width, y * this.blockSize);
            this.boardCtx.stroke();
        }

        // Piezas bloqueadas
        this.grid.forEach((row, y) => {
            row.forEach((type, x) => {
                if (type) this.drawBlock(this.boardCtx, x, y, COLORS[type]);
            });
        });

        // Pieza fantasma y actual
        this.drawGhost();
        if (this.currentPiece) {
            this.currentPiece.shape.forEach((row, y) => {
                row.forEach((val, x) => {
                    if (val) this.drawBlock(this.boardCtx, this.currentPiece.pos.x + x, this.currentPiece.pos.y + y, this.currentPiece.color);
                });
            });
        }

        // Siguiente y Guardado
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        this.drawCenteredPiece(this.nextCtx, this.nextPiece);

        this.holdCtx.fillStyle = '#000';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        if (this.heldPiece) this.drawCenteredPiece(this.holdCtx, this.heldPiece);

        // Partículas
        this.particles.forEach((p, i) => {
            p.update();
            p.draw(this.boardCtx);
            if (p.life <= 0) this.particles.splice(i, 1);
        });
    }

    drawCenteredPiece(ctx, piece) {
        const shape = piece.shape;
        let minX = 4, maxX = 0, minY = 4, maxY = 0, empty = true;
        shape.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val !== 0) {
                    empty = false;
                    if (x < minX) minX = x; if (x > maxX) maxX = x;
                    if (y < minY) minY = y; if (y > maxY) maxY = y;
                }
            });
        });
        if (empty) return;
        const pW = maxX - minX + 1; const pH = maxY - minY + 1;
        const offX = (6 - pW) / 2 - minX; const offY = (6 - pH) / 2 - minY;
        shape.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val !== 0) this.drawBlock(ctx, x + offX, y + offY, piece.color, this.previewBlockSize);
            });
        });
    }

    drawBlock(ctx, x, y, color, size = this.blockSize) {
        const pad = 2; const bS = size - pad * 2;
        ctx.fillStyle = color; ctx.shadowBlur = 5; ctx.shadowColor = color;
        ctx.fillRect(x * size + pad, y * size + pad, bS, bS);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x * size + pad, y * size + pad, bS, bS / 4);
    }

    drawGhost() {
        const originalY = this.currentPiece.pos.y;
        while (!this.collide()) this.currentPiece.pos.y++;
        this.currentPiece.pos.y--;
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val) {
                    this.boardCtx.strokeStyle = this.currentPiece.color; this.boardCtx.lineWidth = 1;
                    this.boardCtx.strokeRect((this.currentPiece.pos.x+x)*this.blockSize+4, (this.currentPiece.pos.y+y)*this.blockSize+4, this.blockSize-8, this.blockSize-8);
                }
            });
        });
        this.currentPiece.pos.y = originalY;
    }

    update(time = 0) {
        if (this.paused || this.gameOver) return;
        const dT = time - this.lastTime; 
        this.lastTime = time;
        this.dropCounter += dT;
        if (this.dropCounter > this.dropInterval) {
            this.drop();
        }
        this.draw();
    }
}
