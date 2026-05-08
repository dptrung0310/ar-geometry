import { getDistance } from "./gestures";

export function isPinching(hand) {
  const thumbTip = hand[4];
  const indexTip = hand[8];

  const distance = getDistance(thumbTip, indexTip);

  return distance < 0.05;
}

export function isOpenPalm(hand) {
  return (
    hand[8].y < hand[6].y && hand[12].y < hand[10].y && hand[16].y < hand[14].y
  );
}
