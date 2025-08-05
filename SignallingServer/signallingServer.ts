import { Server } from "socket.io";
import http from "http";
import * as fs from "fs";
import * as path from "path";

import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";
import express from "express";

dotenv.config({ path: ".env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });
const app = express();

type BoardRow = {
  disabled: boolean;
  vals: string[];
  class: string[];
};

export const roomsMap: {
  [key: string]: {
    game: { board: BoardRow[]; currentTries: number };
    word: string;
  };
} = {};

function getRandomWord() {
  const filePath = path.resolve(__dirname, "../assets/words.txt");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const lines = fileContent
    .split("\n")
    .filter((line: string) => line.trim() !== "");
  const randomIndex = Math.floor(Math.random() * lines.length);
  return lines[randomIndex];
}

function evalWord(word: string, actualWord: string) {
  const result = Array(5).fill("gr");
  const secretCounts: Record<string, number> = {};

  for (let i = 0; i < 5; i++) {
    if (word[i] === actualWord[i]) {
      result[i] = "g";
    } else {
      const ch = actualWord[i];
      secretCounts[ch] = (secretCounts[ch] || 0) + 1;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i] === "gr") {
      const ch = word[i];
      if (secretCounts[ch]) {
        result[i] = "y";
        secretCounts[ch]--;
      }
    }
  }

  return result;
}

function initGameBoard(roomid: string) {
  const randomWord = getRandomWord();
  roomsMap[roomid] = {
    game: {
      board: Array(5)
        .fill(0)
        .map(() => ({
          vals: Array(5).fill(""),
          class: Array(5).fill(""),
          disabled: false,
        })),
      currentTries: 0,
    },
    word: randomWord,
  };
}

io.on("connection", (socket) => {
  console.log("A user conected to socket: ", socket.id);

  socket.on("signal", ({ target, payload }) => {
    io.to(target).emit("signal", { source: socket.id, payload });
  });

  socket.on("join", async (room) => {
    const y = io.sockets.adapter.rooms.get(room);
    let size = y ? y.size : 1;

    if (size < 2) {
      socket.join(room);
    }

    if (!roomsMap[room]) initGameBoard(room);

    const usersInRoom = (await io.in(room).fetchSockets()).map((s) => s.id);
    console.log("users: ", usersInRoom);

    size = y ? y.size : 1;
    console.log(`socket ${socket.id} joined ${room} room  - ${size}`);

    if (size == 2) io.to(room).emit("board", roomsMap[room].game);
  });

  socket.on("enterWord", ({ id, word, ptr }) => {
    console.log(id, word, ptr);
    roomsMap[id].game.board[ptr].vals = word.split("");
    roomsMap[id].game.board[ptr].class = evalWord(word, roomsMap[id].word);
    roomsMap[id].game.board[ptr].disabled = true;

    if (
      roomsMap[id].game.board[ptr].class.filter((e) => e == "g").length == 5
    ) {
      io.to(id).emit("board", roomsMap[id].game);
      io.to(id).emit("win");
    } else if (roomsMap[id].game.currentTries == 4) {
      console.log("lost!", roomsMap[id].word);
      roomsMap[id].game.board = roomsMap[id].game.board.map((row, i) => {
        return {
          ...row,
          disabled: true,
        };
      });
      io.to(id).emit("board", roomsMap[id].game);
      io.to(id).emit("lost", roomsMap[id].word);
    } else {
      roomsMap[id].game.currentTries++;
      io.to(id).emit("board", roomsMap[id].game);
    }
  });

  socket.on("disconnect", () => {
    console.log("disconnected");
  });
});
const PORT = Number(process.env.NEXT_PUBLIC_SIGNAL_SERVER || 4301);
app.get("/", (_, res) => res.send("Signalling server is alive"));
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Signalling server running on port ${PORT}`);
});
