"use client";

import { useEffect } from "react";

export default function ClientViewport() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let previousHeight = window.innerHeight;

    // Set viewport height CSS variable
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Handle visual viewport changes (keyboard, browser UI, etc.)
    const handleVisualViewportChange = () => {
      if (!window.visualViewport) return;

      const vvHeight = window.visualViewport.height;
      const vh = vvHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);

      // Detect keyboard by comparing viewport heights
      const currentHeight = window.innerHeight;
      const keyboardHeight = Math.max(0, previousHeight - vvHeight);

      document.documentElement.style.setProperty(
        "--keyboard-height",
        `${keyboardHeight}px`
      );

      // Add a class to body when keyboard is open
      if (keyboardHeight > 100) {
        document.body.classList.add("keyboard-open");
      } else {
        document.body.classList.remove("keyboard-open");
      }
    };

    // Handle orientation changes
    const handleOrientationChange = () => {
      // Wait for orientation change to complete
      setTimeout(() => {
        previousHeight = window.innerHeight;
        setVH();
        handleVisualViewportChange();
      }, 100);
    };

    // Set initial values
    setVH();
    handleVisualViewportChange();

    // Add event listeners
    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", handleOrientationChange);

    // Handle visual viewport changes (important for mobile keyboards)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleVisualViewportChange);
      window.visualViewport.addEventListener("scroll", handleVisualViewportChange);
    }

    // Cleanup
    return () => {
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleVisualViewportChange);
        window.visualViewport.removeEventListener("scroll", handleVisualViewportChange);
      }
      document.body.classList.remove("keyboard-open");
    };
  }, []);

  return null;
}