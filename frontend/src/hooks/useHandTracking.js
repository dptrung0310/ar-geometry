import { useEffect } from "react";

export function useHandTracking(videoRef, enabled, onResults) {
  useEffect(() => {
    if (!enabled) return;

    if (!videoRef.current) return;

    console.log("HAND TRACKING INIT");

    let camera = null;
    let hands = null;

    async function init() {
      hands = new window.Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      hands.onResults((results) => {
        console.log("HAND RESULTS:", results);

        onResults(results);
      });

      camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({
            image: videoRef.current,
          });
        },

        width: 640,
        height: 480,
      });

      camera.start();

      console.log("HAND TRACKING STARTED");
    }

    init();

    return () => {
      if (camera) camera.stop();

      if (hands) hands.close();
    };
  }, [videoRef, enabled, onResults]);
}
