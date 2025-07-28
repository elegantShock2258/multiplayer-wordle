"use client";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { createRef, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import styles from "./home.module.sass";
import { CheckWordExists } from "./server/actions/checkWord";

type BoardRow = {
  vals: string[];
  disabled: boolean;
  class: string[];
};

export default function Collaborate() {
  const [socket, setSocket] = useState<Socket | undefined>(undefined);
  const [roomId, setRoomId] = useState<string | undefined>(undefined);
  const [rowPtr, setRowPtr] = useState<number>(0);
  const [update, setUpdate] = useState(0);
  const word = "dance";

  const boardRefs = useRef<Array<React.RefObject<HTMLInputElement>>>(
    Array(5)
      .fill(null)
      .map(() => createRef()),
  );

  const [board, setBoard] = useState<BoardRow[]>(
    Array(5)
      .fill(0)
      .map(() => ({
        vals: Array(5).fill(""),
        disabled: false,
        class: Array(5).fill(""),
      })),
  );

  const [join, setJoin] = useState(false);

  useEffect(() => {
    if (roomId) {
      const socketInstance = io("http://localhost:4301");
      setSocket(socketInstance);

      socketInstance.emit("join", roomId);

      socketInstance.on("board", (data) => {
        console.log("i got board: ", data);
        let y = board.map((row, i) => {
          return {
            ...row,
            vals: data[i].vals,
            class: data[i].class,
            disabled: data[i].disabled,
          };
        });
        setBoard(y);
      });
    }
  }, [join]);

  return (
    <div className="flex w-full h-full items-center justify-center gap-5 flex-col">
      <div className="flex flex-col items-center justify-center">
        {board.map((row, i) => {
          return (
            <InputOTP
              ref={boardRefs.current[i]}
              disabled={row.disabled}
              key={i}
              maxLength={5}
              onKeyDown={async (e) => {
                const value = (e.target as HTMLInputElement).value;

                if (value.length == 5) {
                  if (i == rowPtr && !row.disabled && e.key === "Enter") {
                    if (!(await CheckWordExists(value))) {
                      // say not a word
                      return;
                    }

                    socket?.emit("enterWord", {
                      id: roomId,
                      word: value,
                      ptr: rowPtr,
                    });

                    let t = board;

                    t[rowPtr].disabled = true;
                    t[rowPtr].vals = value.split("");
                    t[rowPtr].class = Array(5).fill("bg-red-700");
                    setBoard(t);
                    if (rowPtr + 1 != 5) {
                      boardRefs.current[rowPtr + 1].current!.focus();
                    } else {
                      // exit the game
                    }
                    setRowPtr(rowPtr + 1);
                  }
                } else {
                  // do nothing.
                }
              }}
            >
              <InputOTPGroup>
                {row.vals.map((char, i) => {
                  return (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      value={char}
                      className={row.class[i]}
                    />
                  );
                })}
              </InputOTPGroup>
            </InputOTP>
          );
        })}
      </div>
      make/join a room:
      <input
        value={roomId}
        onChange={(s) => setRoomId(s.currentTarget.value)}
        placeholder="enter room id"
      ></input>
      <button
        onClick={(e) => {
          setJoin(true);
        }}
      >
        make
      </button>
    </div>
  );
}
