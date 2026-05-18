# 🚀 Instructivo de Despliegue: Tetris Elite

Este documento contiene los pasos exactos para llevar tu juego a producción tanto en la web como en dispositivos Android.

## 1. Despliegue Web (Hosting del Juego)

Para que el juego funcione en línea, necesitas desplegar el **Backend** en un servidor que soporte WebSockets.

### A. El Backend (Servidor)
1.  **Plataformas recomendadas:** [Render.com](https://render.com) o [Railway.app](https://railway.app).
2.  **Pasos:**
    *   Crea una cuenta y conecta tu repositorio de GitHub.
    *   Selecciona la carpeta raíz del backend (`/backend`).
    *   Comando de inicio: `npm install && npm start`.
    *   El servidor te dará una URL pública (ej: `https://tetris-elite-api.onrender.com`).

### B. El Frontend (Juego)
1.  **Ajuste de Conexión:** Abre `frontend/js/main.js` y asegúrate de que el socket se conecte a la URL de tu backend:
    ```javascript
    // En main.js e MultiplayerManager.js
    this.socket = io("https://tu-backend-desplegado.onrender.com");
    ```
2.  **Hosting:** Puedes subir la carpeta `frontend` a **Vercel**, **Netlify** o incluso **GitHub Pages**.

---

## 2. Despliegue en Android (APK)

Como ya instalaste Capacitor, sigue estos pasos para corregir el error de configuración y generar el instalador:

### Paso 1: Configurar la carpeta de distribución
Capacitor no permite usar el directorio raíz (`.`) como carpeta web de forma segura. Vamos a usar la carpeta `www`.

1.  **Copia tus archivos a `www`:**
    ```powershell
    # Dentro de la carpeta /frontend
    cp -Force index.html, style.css www/
    cp -Force -Recurse js\* www\js\
    ```
2.  **Corrige el archivo `capacitor.config.json`:**
    Asegúrate de que diga: `"webDir": "www"`.

### Paso 2: Sincronizar y Abrir
```bash
npx cap sync android
npx cap open android
```

### Paso 3: Generar el APK en Android Studio
1.  Una vez abierto Android Studio, espera a que termine de cargar (Gradle Sync).
2.  Ve al menú superior: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3.  Cuando termine, aparecerá un aviso abajo a la derecha: **"APK(s) generated successfully"**. Haz clic en **locate** para encontrar tu archivo `app-debug.apk`. ¡Ese es el archivo que puedes instalar en tu celular!
4.  El archivo `app-debug.apk` se encuentra en la carpeta: `frontend\android\app\build\outputs\apk\debug`.

---

## 💡 Notas Importantes para Producción

*   **HTTPS:** Android requiere que la URL de tu backend sea segura (`https`).
*   **CORS:** En `backend/server.js`, asegúrate de permitir conexiones desde cualquier origen:
    ```javascript
    const io = require('socket.io')(server, {
      cors: { origin: "*", methods: ["GET", "POST"] }
    });
    ```
*   **Ngrok (Opcional):** Si quieres probar el APK en tu celular SIN subir el backend a la nube todavía, usa `ngrok http 3000` en tu PC y pon la URL que te dé ngrok en el código del frontend.
