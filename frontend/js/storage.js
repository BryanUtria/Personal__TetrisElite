export const HIGH_SCORE_KEY = 'tetrisEliteHighScore';
const DB_NAME = 'TetrisEliteDB';
const STORE_NAME = 'settings';
const DB_VERSION = 1;

function openDatabase() {
    return new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
            reject(new Error('IndexedDB no disponible')); 
            return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function idbGet(key) {
    return openDatabase().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result ? request.result.value : null);
        request.onerror = () => reject(request.error);
    }));
}

function idbSet(key, value) {
    return openDatabase().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put({ key, value });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    }));
}

export async function loadHighScore() {
    try {
        const stored = window.localStorage.getItem(HIGH_SCORE_KEY);
        if (stored != null) {
            return parseInt(stored, 10) || 0;
        }
    } catch (error) {
        // localStorage no disponible.
    }

    try {
        const idbValue = await idbGet(HIGH_SCORE_KEY);
        return idbValue != null ? parseInt(idbValue, 10) || 0 : 0;
    } catch (error) {
        return 0;
    }
}

export async function saveHighScore(score) {
    try {
        window.localStorage.setItem(HIGH_SCORE_KEY, score.toString());
    } catch (error) {
        // localStorage no disponible.
    }

    try {
        await idbSet(HIGH_SCORE_KEY, score.toString());
    } catch (error) {
        // IndexedDB no disponible.
    }
}

export async function loadHighScoreRemote() {
    try {
        const response = await fetch('/api/highscore', {
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('No se pudo cargar el high score remoto');
        const data = await response.json();
        return data.score != null ? parseInt(data.score, 10) || 0 : 0;
    } catch (error) {
        return null;
    }
}

export async function saveHighScoreRemote(score) {
    try {
        const response = await fetch('/api/highscore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score })
        });
        if (!response.ok) throw new Error('No se pudo guardar el high score remoto');
        return await response.json();
    } catch (error) {
        return null;
    }
}
