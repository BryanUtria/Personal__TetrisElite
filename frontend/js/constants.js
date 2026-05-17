/**
 * TETRIS ELITE - Constantes y Configuración
 */

export const COLS = 10;
export const ROWS = 20;

export const COLORS = {
    'I': '#00f2ff', // Cian
    'J': '#007fff', // Azul
    'L': '#ffaa00', // Naranja
    'O': '#f0f000', // Amarillo
    'S': '#00ff00', // Verde
    'T': '#aa00ff', // Púrpura
    'Z': '#ff0000'  // Rojo
};

export const SHAPES = {
    'I': [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
    'J': [[1,0,0], [1,1,1], [0,0,0]],
    'L': [[0,0,1], [1,1,1], [0,0,0]],
    'O': [[1,1], [1,1]],
    'S': [[0,1,1], [1,1,0], [0,0,0]],
    'T': [[0,1,0], [1,1,1], [0,0,0]],
    'Z': [[1,1,0], [0,1,1], [0,0,0]]
};

export const CONFIG = {
    INITIAL_DROP_INTERVAL: 1000,
    MIN_DROP_INTERVAL: 100,
    DROP_ACCELERATION_PER_LEVEL: 50,
    LEVEL_UP_LINES: 10,
    SCORING: [0, 100, 300, 500, 800]
};
