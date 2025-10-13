"use client";

import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadAll } from "@tsparticles/all";
import { useCallback, useEffect, useState } from "react";

export default function NetworkBackground() {
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

  if (init) {
    return (
      <Particles
        id="tsparticles"
        particlesLoaded={particlesLoaded}
        options={{
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
              direction: "none",
              outModes: { default: "bounce" },
            },
            number: { value: 80, density: { enable: true } },
            opacity: { value: 0.5 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 3 } },
          },
          detectRetina: true,
        }}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          zIndex: 1,
          width: "50%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    );
  }

  return <></>;
}
