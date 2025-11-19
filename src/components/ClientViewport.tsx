"use client";

import { useEffect } from "react";

export default function ClientViewport() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Set initial viewport height
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Also handle visual viewport changes (mobile keyboard, etc.)
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        const vh = window.visualViewport.height * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
      }
    };

    // Set initial values
    setVH();
    
    // Add event listeners
    window.addEventListener("resize", setVH);
    
    // Handle visual viewport changes (important for mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleVisualViewportChange);
    }

    // Cleanup
    return () => {
      window.removeEventListener("resize", setVH);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleVisualViewportChange);
      }
    };
  }, []);

  return null;
}