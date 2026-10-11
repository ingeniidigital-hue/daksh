"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type OperatingMode = "manual" | "ai";

interface OperatingModeContextType {
  mode: OperatingMode;
  setMode: (mode: OperatingMode) => void;
  toggleMode: () => void;
}

const OperatingModeContext = createContext<OperatingModeContextType>({
  mode: "manual",
  setMode: () => {},
  toggleMode: () => {},
});

export function OperatingModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<OperatingMode>("manual");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlMode = urlParams.get("mode") as OperatingMode;
      if (urlMode === "ai" || urlMode === "manual") {
        setModeState(urlMode);
        localStorage.setItem("daksh_operating_mode", urlMode);
        return;
      }
      const saved = localStorage.getItem("daksh_operating_mode") as OperatingMode;
      if (saved === "ai" || saved === "manual") {
        setModeState(saved);
      }
    } catch (e) {
      // localStorage error fallback
    }
  }, []);

  const setMode = (newMode: OperatingMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem("daksh_operating_mode", newMode);
      window.dispatchEvent(new CustomEvent("daksh_mode_changed", { detail: { mode: newMode } }));
    } catch (e) {}
  };

  const toggleMode = () => {
    setMode(mode === "manual" ? "ai" : "manual");
  };

  return (
    <OperatingModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </OperatingModeContext.Provider>
  );
}

export function useOperatingMode() {
  return useContext(OperatingModeContext);
}
