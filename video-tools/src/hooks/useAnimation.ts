import { interpolate, spring } from "remotion";
import { ANIMATION, VIDEO } from "../utils/theme";

export function useSpring(frame: number, fps: number = VIDEO.fps, config = ANIMATION.spring) {
  return spring({
    frame,
    fps,
    config,
  });
}

export function useSpringDelay(
  frame: number,
  delayFrames: number,
  fps: number = VIDEO.fps,
  config = ANIMATION.spring
) {
  const delayedFrame = Math.max(0, frame - delayFrames);
  return spring({
    frame: delayedFrame,
    fps,
    config,
  });
}

export function interpolateOpacity(
  frame: number,
  startFrame: number,
  endFrame: number,
  fps: number = VIDEO.fps
) {
  return interpolate(
    frame / fps,
    [startFrame / fps, endFrame / fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
}

export function interpolateScale(
  frame: number,
  startFrame: number,
  endFrame: number,
  from: number,
  to: number,
  fps: number = VIDEO.fps
) {
  return interpolate(
    frame / fps,
    [startFrame / fps, endFrame / fps],
    [from, to],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
}

export function interpolateTranslateY(
  frame: number,
  startFrame: number,
  endFrame: number,
  from: number,
  to: number,
  fps: number = VIDEO.fps
) {
  return interpolate(
    frame / fps,
    [startFrame / fps, endFrame / fps],
    [from, to],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
}

export function interpolateRotate(
  frame: number,
  startFrame: number,
  endFrame: number,
  from: number,
  to: number,
  fps: number = VIDEO.fps
) {
  return interpolate(
    frame / fps,
    [startFrame / fps, endFrame / fps],
    [from, to],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
}

export function countUp(
  frame: number,
  startFrame: number,
  endFrame: number,
  from: number,
  to: number,
  fps: number = VIDEO.fps
) {
  const progress = interpolate(
    frame / fps,
    [startFrame / fps, endFrame / fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return Math.round(from + (to - from) * progress);
}

export function stagger(
  frame: number,
  index: number,
  staggerFrames: number,
  startFrame: number,
  endFrame: number,
  fps: number = VIDEO.fps
) {
  const itemStart = startFrame + index * staggerFrames;
  const itemEnd = itemStart + (endFrame - startFrame);
  return interpolate(
    frame / fps,
    [itemStart / fps, itemEnd / fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
}

export function pulse(frame: number, fps: number = VIDEO.fps, speed: number = 2) {
  return 1 + 0.05 * Math.sin((frame / fps) * speed * Math.PI * 2);
}

export function shake(frame: number, fps: number = VIDEO.fps, intensity: number = 10) {
  return intensity * Math.sin((frame / fps) * 30) * Math.exp(-frame / fps * 3);
}