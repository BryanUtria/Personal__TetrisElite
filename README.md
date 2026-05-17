# 🎮 Tetris Elite - Guía de Estructura

Este documento detalla la organización de los archivos y carpetas del proyecto **Tetris Elite**, incluyendo los componentes de batalla multijugador y persistencia.

## 📁 Estructura del Proyecto

### `/frontend` - Interfaz y Lógica de Cliente
Es una aplicación web moderna (Vanilla JS) diseñada para ser responsiva y visualmente premium.
- **index.html** - Estructura semántica con overlays para pausa, matchmaking y fin de juego.
- **style.css** - Diseño "Glassmorphism", animaciones de neón y layout responsivo (Grid/Flexbox).
- **/js** - Módulos JavaScript:
  - `main.js` - Punto de entrada, gestión de pantallas y coordinación general.
  - `engine.js` - El núcleo del juego (rotación, colisión, gravedad, piezas).
  - `MultiplayerManager.js` - **[NUEVO]** Gestiona la conexión Socket.io, sincronización de tableros y basura.
  - `particles.js` - Sistema de efectos visuales (explosiones de líneas, impactos).
  - `constants.js` - Parámetros de configuración (velocidad, colores, formas).
  - `storage.js` - Gestión de récords (LocalStorage y sincronización con API).

### `/backend` - Servidor y Real-Time
Servidor basado en Node.js que habilita la competición en línea.
- **server.js** - Servidor Express + Socket.io. Gestiona el matchmaking y el intercambio de estados entre jugadores.
- **db.js** - Capa de persistencia usando SQLite para almacenar el High Score global.
- **package.json** - Definición de scripts (`npm start`) y dependencias.

### `/database` - Persistencia Global
- **tetriselite.sqlite** - Base de Datos SQLite donde se guarda el récord mundial.

### `/android` (Opcional)
- Carpeta generada por **Capacitor** para compilar el proyecto como una aplicación nativa de Android.

---

## 🚀 Comandos Rápidos

### 1. Iniciar el Servidor (Backend)
Es necesario para el modo multijugador y para guardar el récord.
```bash
cd backend
npm install
npm start
```

### 2. Ejecutar el Juego (Frontend)
Simplemente abre `frontend/index.html` en tu navegador, o usa un servidor local como `Live Server`.
Si el backend está corriendo, el juego se conectará automáticamente a `http://localhost:3000`.

### 3. Compilar para Android
```bash
cd frontend
npx cap copy
npx cap open android
```
