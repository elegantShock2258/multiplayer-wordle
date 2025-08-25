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
import toast, { Toaster } from "react-hot-toast";

type BoardRow = {
  vals: string[];
  disabled: boolean;
  class: string[];
};

export default function Collaborate() {
  const [socket, setSocket] = useState<Socket | undefined>(undefined);
  const [roomId, setRoomId] = useState<string | undefined>(undefined);
  const [rowPtr, setRowPtr] = useState<number>(0);
  const [update, setUpdate] = useState<boolean>(false);

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
      const socketInstance = io(process.env.NEXT_PUBLIC_BASE_URL, {
        transports: ["websocket", "polling"],
      });
      setSocket(socketInstance);

      socketInstance.on("lost", (word) => {
        let y = board.map((row, i) => {
          return {
            ...row,
            disabled: true,
          };
        });
        setBoard(y);
        console.log(word);

        toast((word as string).toLocaleUpperCase());
      });
      socketInstance.emit("join", roomId);
      socketInstance.on("win", () => {
        let y = board.map((row, i) => {
          return {
            ...row,
            disabled: true,
          };
        });
        setBoard(y);

        toast("Nicely Done!");
      });

      socketInstance.on("board", (game) => {
        let y = board.map((row, i) => {
          return {
            ...row,
            vals: game.board[i].vals,
            class: game.board[i].class,
            disabled: game.board[i].disabled,
          };
        });
        setBoard(y);
        setRowPtr(game.currentTries);
      });
    }
  }, [join]);

  return (
    <>
      <Toaster />
      {!update ? (
        <div className={`${styles.parent}`}>
          <div className={`${styles.content}`}>
            <h1 className={styles.h1}>Hi, please enter a room code.</h1>
            <input
              className={styles.input}
              value={roomId}
              onChange={(s) => setRoomId(s.currentTarget.value)}
              placeholder="Enter room id"
            ></input>
            <button
              className={styles.btn}
              onClick={(e) => {
                setUpdate(true);
                setJoin(true);
              }}
            >
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <div className="flex w-full h-full items-center justify-center gap-5 flex-col">
          <div
            className={`flex flex-col max-h-full max-w-full items-center justify-center ${styles.board}`}
          >
            {board.map((row, i) => {
              return (
                <InputOTP
                  ref={boardRefs.current[i]}
                  className={row.disabled ? styles.ipDisabeld : styles.ip}
                  key={i}
                  maxLength={5}
                  onKeyDown={async (e) => {
                    const value = (e.target as HTMLInputElement).value;

                    if (value.length == 5) {
                      console.log("entering word!", row.disabled, i == rowPtr);
                      if (i == rowPtr && !row.disabled && e.key === "Enter") {
                        if (!(await CheckWordExists(value))) {
                          toast("Not a word.");
                          return;
                        }
                        console.log("entering word!");
                        socket?.emit("enterWord", {
                          id: roomId,
                          word: value,
                          ptr: rowPtr,
                        });

                        let t = board;

                        t[rowPtr].disabled = true;
                        t[rowPtr].vals = value.split("");
                        t[rowPtr].class = Array(5).fill("");
                        setBoard(t);

                        if (rowPtr != 5) {
                          if (rowPtr + 1 != 5)
                            boardRefs.current[rowPtr + 1].current!.focus();
                        }
                        setRowPtr(rowPtr + 1);
                      }
                    } else {
                      // do nothing.
                    }
                  }}
                >
                  <InputOTPGroup className={styles.input}>
                    {row.vals.map((char, i) => {
                      return (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          value={char}
                          className={`${row.class[i] == "y" ? styles.yellow : row.class[i] == "g" ? styles.green : row.class[i] == "gr" ? styles.gray : ""} ${styles.cell}`}
                        />
                      );
                    })}
                  </InputOTPGroup>
                </InputOTP>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
