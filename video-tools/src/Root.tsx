import React from "react";
import { Composition, useCurrentFrame, interpolate } from "remotion";
import { HookScene } from "./scenes/HookScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { KassaScene } from "./scenes/KassaScene";
import { DashboardScene } from "./scenes/DashboardScene";
import { InventoryScene } from "./scenes/InventoryScene";
import { ReportsScene } from "./scenes/ReportsScene";
import { DebtorsScene } from "./scenes/DebtorsScene";
import { TelegramScene } from "./scenes/TelegramScene";
import { CTAScene } from "./scenes/CTAScene";
import { VIDEO, COLORS } from "./utils/theme";

// Timeline in seconds (matching reklama-konsepsiyasi.md)
const SCENES = [
  { component: HookScene, duration: 3, start: 0, name: "Hook" },
  { component: ProblemScene, duration: 5, start: 3, name: "Problem" },
  { component: KassaScene, duration: 7, start: 8, name: "Kassa" },
  { component: DashboardScene, duration: 1.5, start: 15, name: "Dashboard" },
  { component: InventoryScene, duration: 1.5, start: 16.5, name: "Inventory" },
  { component: ReportsScene, duration: 1.5, start: 18, name: "Reports" },
  { component: DebtorsScene, duration: 1.5, start: 19.5, name: "Debtors" },
  { component: TelegramScene, duration: 2, start: 19.5, name: "Telegram" }, // Overlaps with Debtors
  { component: CTAScene, duration: 5, start: 21, name: "CTA" },
];

const TOTAL_DURATION = 26; // seconds
const TOTAL_FRAMES = TOTAL_DURATION * VIDEO.fps;

function RootInner() {
  const frame = useCurrentFrame();
  const time = frame / VIDEO.fps;

  // Determine which scenes are active
  const activeScenes = SCENES.filter((scene) => {
    const sceneEnd = scene.start + scene.duration;
    return time >= scene.start && time < sceneEnd;
  });

  // Render active scenes with crossfade transitions
  return (
    <div
      style={{
        width: VIDEO.width,
        height: VIDEO.height,
        position: "relative",
        overflow: "hidden",
        background: COLORS.lightBg,
      }}
    >
      {activeScenes.map((scene, index) => {
        const sceneFrame = frame - scene.start * VIDEO.fps;
        const sceneProgress = sceneFrame / (scene.duration * VIDEO.fps);
        
        // Crossfade between scenes (0.3s transition)
        const TRANSITION_DURATION = 0.3;
        const transitionFrames = TRANSITION_DURATION * VIDEO.fps;
        
        let opacity = 1;
        
        // Fade in at start
        if (sceneFrame < transitionFrames && scene.start > 0) {
          opacity = interpolate(sceneFrame, [0, transitionFrames], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
        }
        
        // Fade out at end (except last scene)
        const sceneEndFrame = scene.duration * VIDEO.fps;
        if (sceneFrame > sceneEndFrame - transitionFrames && scene.start + scene.duration < TOTAL_DURATION) {
          opacity = interpolate(sceneFrame, [sceneEndFrame - transitionFrames, sceneEndFrame], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
        }

        const SceneComponent = scene.component;
        
        return (
          <div
            key={scene.name}
            style={{
              position: "absolute",
              inset: 0,
              opacity,
              pointerEvents: "none",
            }}
          >
            <SceneComponent frame={sceneFrame} startFrame={scene.start * VIDEO.fps} />
          </div>
        );
      })}
      
      {/* Global time indicator (debug) */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            padding: "8px 16px",
            borderRadius: 8,
            background: "rgba(0,0,0,0.7)",
            color: "white",
            fontFamily: "monospace",
            fontSize: 14,
            zIndex: 1000,
            pointerEvents: "none",
          }}
        >
          {time.toFixed(2)}s / {TOTAL_DURATION}s | Frame: {frame}
        </div>
      )}
    </div>
  );
}

export const Root: React.FC = () => {
  return (
    <Composition
      width={VIDEO.width}
      height={VIDEO.height}
      fps={VIDEO.fps}
      durationInFrames={TOTAL_FRAMES}
      component={RootInner}
      id="Root"
    />
  );
};

export { TOTAL_FRAMES, VIDEO };