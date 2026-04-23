import { randomInt } from "node:crypto";

// Per tech plan §10.6: 12-char mixed case + digits + symbols,
// excluding ambiguous chars (0/O, 1/l/I).
const LOWER = "abcdefghijkmnopqrstuvwxyz"; // no l
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I, O
const DIGIT = "23456789"; // no 0, 1
const SYMBOL = "!@#$%^&*-_=+";

const ALL = LOWER + UPPER + DIGIT + SYMBOL;

function pick(s: string): string {
  return s[randomInt(0, s.length)];
}

function shuffle(arr: string[]): string[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateTempPassword(length = 12): string {
  if (length < 4) throw new Error("Password length must be >= 4");
  const chars: string[] = [pick(LOWER), pick(UPPER), pick(DIGIT), pick(SYMBOL)];
  while (chars.length < length) chars.push(pick(ALL));
  return shuffle(chars).join("");
}
