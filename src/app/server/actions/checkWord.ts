"use server";
import * as fs from "fs";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function CheckWordExists(word: string) {
  const filePath = path.resolve(__dirname, "../assets/words.txt");
  const fileContent = fs.readFileSync(filePath, "utf-8");

  const lines = fileContent
    .split("\n")
    .filter((line: string) => line.trim() !== "")
    .filter((wrd) => word == wrd);
  return lines.length > 0;
}
