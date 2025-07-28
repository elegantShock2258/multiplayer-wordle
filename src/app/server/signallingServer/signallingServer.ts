import { Server } from "socket.io";
import http from "http";
import * as fs from "fs";
import * as path from "path";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });

type BoardRow = {
  disabled: boolean;
  vals: string[];
  class: string[];
};

const roomsMap: { [key: string]: { board: BoardRow[]; word: string } } = {};

function getRandomWord() {
  const filePath = path.resolve(__dirname, "../assets/words.txt");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const lines = fileContent
    .split("\n")
    .filter((line: string) => line.trim() !== "");
  const randomIndex = Math.floor(Math.random() * lines.length);
  return lines[randomIndex];
}

function initGameBoard(roomid: string) {
  const randomWord = getRandomWord();
  roomsMap[roomid] = {
    board: Array(5)
      .fill(0)
      .map(() => ({
        vals: Array(5).fill(""),
        class: Array(5).fill(""),
        disabled: false,
      })),
    word: randomWord,
  };
}

io.on("connection", (socket) => {
  console.log("A user conected to socket: ", socket.id);

  socket.on("signal", ({ target, payload }) => {
    console.log("something came");
    io.to(target).emit("signal", { source: socket.id, payload });
  });

  socket.on("join", async (room) => {
    const y = io.sockets.adapter.rooms.get(room);
    let size = y ? y.size : 1;

    // once room size is 2, do not accept more
    if (size < 2) {
      socket.join(room);
    }

    // init game board map and word for the game
    initGameBoard(room);

    const usersInRoom = (await io.in(room).fetchSockets()).map((s) => s.id);
    console.log("users: ", usersInRoom);

    size = y ? y.size : 1;
    console.log(`socket ${socket.id} joined ${room} room  - ${size}`);

    if (size == 2) io.to(room).emit("board", roomsMap[room].board);
  });

  socket.on("enterWord", ({ id, word, ptr }) => {
    console.log("i got ", word);
    roomsMap[id].board[ptr].vals = word.split("");
    roomsMap[id].board[ptr].class = Array(5).fill("bg-red-700");
    roomsMap[id].board[ptr].disabled = true;

    io.to(id).emit("board", roomsMap[id].board);
  });

  socket.on("disconnect", () => {
    console.log("disconnected");
  });
});

io.listen(4301);
