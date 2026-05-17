const http = require('http');
const path = require('path');
const express = require('express');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;
const HIGHSCORE_KEY = 'highScore';

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Highscores (existente)
app.get('/api/highscore', async (req, res) => {
  try {
    const stored = await db.getValue(HIGHSCORE_KEY);
    const score = stored ? parseInt(stored, 10) || 0 : 0;
    res.json({ score });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo leer el high score' });
  }
});

app.post('/api/highscore', async (req, res) => {
  const { score } = req.body;
  if (typeof score !== 'number' || Number.isNaN(score) || score < 0) {
    return res.status(400).json({ error: 'Score inválido' });
  }
  try {
    const stored = await db.getValue(HIGHSCORE_KEY);
    const currentHighScore = stored ? parseInt(stored, 10) || 0 : 0;
    if (score > currentHighScore) {
      await db.setValue(HIGHSCORE_KEY, score.toString());
      return res.json({ score, saved: true });
    }
    res.json({ score: currentHighScore, saved: false });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo guardar el high score' });
  }
});

// Lógica de Batalla Multiplayer
let waitingPlayer = null;

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('join-battle', () => {
    if (waitingPlayer && waitingPlayer.id !== socket.id) {
      const room = `room-${waitingPlayer.id}-${socket.id}`;
      socket.join(room);
      waitingPlayer.join(room);
      
      io.to(room).emit('match-found', { 
        room,
        players: [waitingPlayer.id, socket.id]
      });
      console.log(`Partida iniciada en sala: ${room}`);
      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
      socket.emit('waiting-for-opponent');
      console.log('Jugador esperando oponente...');
    }
  });

  socket.on('update-state', (data) => {
    socket.to(data.room).emit('opponent-update', {
      grid: data.grid,
      score: data.score,
      lines: data.lines,
      level: data.level
    });
  });

  socket.on('send-garbage', (data) => {
    socket.to(data.room).emit('receive-garbage', { lines: data.lines });
  });

  socket.on('game-over-multi', (data) => {
    socket.to(data.room).emit('opponent-won');
  });

  socket.on('disconnecting', () => {
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
    
    // Notificar a posibles oponentes en salas de Socket.io
    // Usamos 'disconnecting' porque las salas aún están accesibles
    socket.rooms.forEach(room => {
      if (room.startsWith('room-')) {
        socket.to(room).emit('opponent-disconnected');
      }
    });
    
    console.log('Usuario desconectándose:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Backend Tetris Elite iniciado en http://localhost:${PORT}`);
});
