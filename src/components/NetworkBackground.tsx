"use client";

import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadAll } from "@tsparticles/all";
import { useCallback, useEffect, useState, useMemo, memo } from "react";

interface NetworkBackgroundProps {
  id?: string;
}

function NetworkBackground({ id = "tsparticles" }: NetworkBackgroundProps) {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadAll(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = useCallback(async (container: any) => {
    // Optional: Add any initialization logic here
  }, []);

  // Memoize options to prevent re-renders
  const particlesOptions = useMemo(() => ({
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: { enable: true, mode: "repulse" },
        resize: { enable: true },
      },
      modes: {
        repulse: { distance: 100, duration: 0.4 },
      },
    },
    particles: {
      color: { value: "#51b0ec" }, // Using the neon blue from your design system
      links: {
        color: "#51b0ec",
        distance: 150,
        enable: true,
        opacity: 0.4,
        width: 1,
      },
      collisions: { enable: false },
      move: {
        enable: true,
        speed: 1,
        direction: "none" as const,
        outModes: { default: "bounce" as const },
      },
      number: { value: 80, density: { enable: true } },
      opacity: { value: 0.5 },
      shape: { type: "circle" as const },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  }), []);

  // Memoize style object to prevent re-renders
  const particlesStyle = useMemo(() => ({
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none" as const,
  }), []);

  if (init) {
    return (
      <Particles
        id={id}
        particlesLoaded={particlesLoaded}
        options={particlesOptions}
        style={particlesStyle}
      />
    );
  }

  return <></>;
}

export default memo(NetworkBackground);
