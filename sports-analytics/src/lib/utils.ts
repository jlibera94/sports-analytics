import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert American odds to implied probability */
export function americanOddsToImpliedProb(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  }
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

/** Calculate EV from model probability and implied probability */
export function calculateEV(
  modelProbability: number,
  impliedProbability: number,
  odds: number
): number {
  const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
  return modelProbability * decimalOdds - 1;
}
