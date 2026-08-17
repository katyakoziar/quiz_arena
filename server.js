const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const BASE_POINTS = 500;
const SPEED_BONUS = 500;

/**
 * In-memory game store.
 * games: Map<pin, {
 *   pin, hostSocketId, questions, currentIndex, status, questionStartTime,
 *   timer, players: Map<playerId, {socketId, name, score, answers}>
 * }>
 */
const games = new Map();

function genPin() {
  let pin;
  do {
    pin = String(Math.floor(100000 + Math.random() * 900000));
  } while (games.has(pin));
  return pin;
}
function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function sanitizedQuestion(game, forHost) {
  const q = game.questions[game.currentIndex];
  if (!q) return null;
  const revealCorrect = forHost || game.status === "leaderboard" || game.status === "final";
  const { text, options, duration, correct } = q;
  return revealCorrect ? { text, options, duration, correct } : { text, options, duration };
}

function playerListPayload(game) {
  return [...game.players.entries()]
    .map(([id, p]) => ({
      id,
      name: p.name,
      score: p.score,
      answeredCurrent: !!p.answers[game.currentIndex],
    }))
    .sort((a, b) => b.score - a.score);
}

function statePayload(game, forHost) {
  return {
    pin: game.pin,
    status: game.status,
    currentIndex: game.currentIndex,
    totalQuestions: game.questions.length,
    questionStartTime: game.questionStartTime,
    question: sanitizedQuestion(game, forHost),
    players: playerListPayload(game),
  };
}

function broadcastState(game) {
  if (game.hostSocketId) {
    io.to(game.hostSocketId).emit("state", statePayload(game, true));
  }
  for (const p of game.players.values()) {
    io.to(p.socketId).emit("state", statePayload(game, false));
  }
}

function clearGameTimer(game) {
  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = null;
  }
}

function scheduleAutoAdvance(game) {
  clearGameTimer(game);
  const q = game.questions[game.currentIndex];
  game.timer = setTimeout(() => {
    if (game.status === "question") {
      game.status = "leaderboard";
      broadcastState(game);
    }
  }, q.duration * 1000 + 300); // small grace period for network latency
}

io.on("connection", (socket) => {
  socket.on("host:create", ({ questions }, cb) => {
    if (!Array.isArray(questions) || questions.length === 0) {
      return cb && cb({ error: "Немає питань." });
    }
    for (const q of questions) {
      if (!q.text || !q.text.trim() || !Array.isArray(q.options) || q.options.length !== 4 || q.options.some((o) => !o || !o.trim())) {
        return cb && cb({ error: "Заповніть текст питання та всі 4 варіанти відповіді." });
      }
    }
    const pin = genPin();
    const game = {
      pin,
      hostSocketId: socket.id,
      questions: questions.map((q) => ({
        text: q.text.trim(),
        options: q.options.map((o) => o.trim()),
        correct: Math.max(0, Math.min(3, parseInt(q.correct, 10) || 0)),
        duration: Math.max(5, parseInt(q.duration, 10) || 20),
      })),
      currentIndex: 0,
      status: "lobby",
      questionStartTime: null,
      timer: null,
      players: new Map(),
    };
    games.set(pin, game);
    socket.data.pin = pin;
    socket.data.role = "host";
    socket.join(pin);
    cb && cb({ pin });
    broadcastState(game);
  });

  socket.on("player:join", ({ pin, name }, cb) => {
    const game = games.get(pin);
    if (!game) return cb && cb({ error: "Гру з таким PIN не знайдено." });
    if (game.status !== "lobby") return cb && cb({ error: "Цю гру вже розпочато — приєднання неможливе." });
    const cleanName = (name || "").trim().slice(0, 20);
    if (!cleanName) return cb && cb({ error: "Введіть нікнейм." });

    const playerId = genId();
    game.players.set(playerId, { socketId: socket.id, name: cleanName, score: 0, answers: {} });
    socket.data.pin = pin;
    socket.data.role = "player";
    socket.data.playerId = playerId;
    socket.join(pin);
    cb && cb({ playerId, pin });
    broadcastState(game);
  });

  socket.on("host:start", ({ pin }) => {
    const game = games.get(pin);
    if (!game || game.hostSocketId !== socket.id) return;
    game.status = "question";
    game.currentIndex = 0;
    game.questionStartTime = Date.now();
    scheduleAutoAdvance(game);
    broadcastState(game);
  });

  socket.on("host:endQuestion", ({ pin }) => {
    const game = games.get(pin);
    if (!game || game.hostSocketId !== socket.id) return;
    if (game.status !== "question") return;
    clearGameTimer(game);
    game.status = "leaderboard";
    broadcastState(game);
  });

  socket.on("host:next", ({ pin }) => {
    const game = games.get(pin);
    if (!game || game.hostSocketId !== socket.id) return;
    const isLast = game.currentIndex + 1 >= game.questions.length;
    clearGameTimer(game);
    if (isLast) {
      game.status = "final";
    } else {
      game.currentIndex += 1;
      game.status = "question";
      game.questionStartTime = Date.now();
      scheduleAutoAdvance(game);
    }
    broadcastState(game);
  });

  socket.on("player:answer", ({ pin, playerId, choice }, cb) => {
    const game = games.get(pin);
    if (!game || game.status !== "question") return;
    const player = game.players.get(playerId);
    if (!player) return;
    if (player.answers[game.currentIndex]) return; // already answered — ignore repeat

    const q = game.questions[game.currentIndex];
    const elapsed = (Date.now() - game.questionStartTime) / 1000;
    const remainingFraction = Math.max(0, (q.duration - elapsed) / q.duration);
    const correct = choice === q.correct;
    const points = correct ? Math.round(BASE_POINTS + SPEED_BONUS * remainingFraction) : 0;

    player.answers[game.currentIndex] = { choice, correct, points };
    player.score += points;

    cb && cb({ correct, points });
    broadcastState(game);
  });

  socket.on("disconnect", () => {
    const { pin, role } = socket.data;
    const game = games.get(pin);
    if (!game) return;
    if (role === "host") {
      clearGameTimer(game);
      io.to(pin).emit("host:left");
      games.delete(pin);
    }
    // players simply drop off; their score stays in memory in case of reconnect-less MVP
  });
});

server.listen(PORT, () => {
  console.log(`Quiz Arena server running on port ${PORT}`);
});
