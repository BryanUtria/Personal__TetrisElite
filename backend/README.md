# 🖥️ Tetris Elite - Backend

Servidor en tiempo real diseñado para gestionar batallas multijugador y persistencia de récords mundiales.

## 🚀 Tecnologías
- **Node.js & Express:** Servidor web y API REST.
- **Socket.io:** Comunicación bidireccional de baja latencia para el modo batalla.
- **SQLite:** Base de datos ligera para el High Score global.

## 📡 Funcionalidades
1.  **Matchmaking:** Emparejamiento automático de jugadores en salas privadas (`rooms`).
2.  **Sincronización en Tiempo Real:** Envío de estados del tablero (incluyendo piezas en movimiento) cada 100ms.
3.  **Sistema de Basura (Garbage):** Envío de líneas de castigo al oponente al realizar combos.
4.  **High Score API:** Endpoint para validar y guardar el récord mundial.

## 🛠️ Instalación y Uso
```bash
# Entrar a la carpeta
cd backend

# Instalar dependencias
npm install

# Iniciar servidor (Puerto 3000 por defecto)
npm start
```

## 📝 Endpoints API
- `GET /api/highscore`: Obtiene el récord mundial actual.
- `POST /api/highscore`: Intenta actualizar el récord (requiere que el nuevo score sea mayor).

## 🔌 Eventos Socket.io
- `join-battle`: Entrar a la cola de emparejamiento.
- `update-state`: Sincronizar el tablero propio con el rival.
- `send-garbage`: Enviar líneas de basura.
- `opponent-disconnected`: Notificar abandono del rival.
