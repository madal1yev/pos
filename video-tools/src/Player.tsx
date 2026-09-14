import React from "react";
import { Player } from "@remotion/player";
import { Root } from "./Root";
import "./global.css";

export const RemotionPlayer: React.FC = () => {
  return (
    <div style={{ width: "100%", height: "100vh", background: "#f7f7fb" }}>
      <Player composition={Root()} />
    </div>
  );
};