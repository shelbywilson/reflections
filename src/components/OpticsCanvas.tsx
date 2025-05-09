import React, { useRef, useEffect, useState } from "react";
import { isPointInMirror } from "../util/optics-helpers";
import { useOptics } from "../contexts/OpticsContext";
import {
  drawMirrors,
  drawObjects,
  drawObservers,
  drawVirtualImages,
  drawVirtualMirrors,
  drawVisibilityLines,
  getPixelRatio,
} from "../util/render-helpers";
import type { DisplayState } from "../util/types";

type OpticsCanvasProps = {
  displayState: DisplayState;
};

const OpticsCanvas: React.FC<OpticsCanvasProps> = ({ displayState }) => {
  const {
    mirrors,
    objects,
    observers,
    updateMirror,
    updateObject,
    updateObserver,
  } = useOptics();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState([100, 100]);

  // Function to handle size updates
  const updateCanvasSize = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const width = canvas.parentElement.clientWidth || 200;
    const height = canvas.parentElement.clientHeight || 200;

    setSize([width, height]);
  };

  // Initialize size on mount
  useEffect(() => {
    updateCanvasSize();

    // Add resize event listener
    window.addEventListener("resize", updateCanvasSize);

    // Clean up
    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  // Initialize canvas with correct pixel ratio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get the device pixel ratio
    const pixelRatio = getPixelRatio();

    // Set canvas dimensions with pixel ratio
    canvas.width = size[0] * pixelRatio;
    canvas.height = size[1] * pixelRatio;

    // Scale the context to counter the pixel ratio
    ctx.scale(pixelRatio, pixelRatio);

    // Set display size
    canvas.style.width = `${size[0]}px`;
    canvas.style.height = `${size[1]}px`;
  }, [size]);

  // State for drag handling
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    type: "mirror" | "object" | "observer" | null;
    index: number;
    offsetX: number;
    offsetY: number;
  }>({
    isDragging: false,
    type: null,
    index: -1,
    offsetX: 0,
    offsetY: 0,
  });

  // Draw the scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get pixel ratio
    const pixelRatio = getPixelRatio();

    // Clear canvas - use actual canvas dimensions
    ctx.clearRect(0, 0, size[0] * pixelRatio, size[1] * pixelRatio);

    // Reset transform for proper scaling
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    // Draw background
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, size[0], size[1]);

    // Draw scene
    drawVisibilityLines(ctx, objects, observers, mirrors);
    drawMirrors(ctx, mirrors);
    if (displayState.showVirtualMirrors) {
      drawVirtualMirrors(ctx, mirrors);
    }
    drawVirtualImages(ctx, objects, mirrors, observers);
    drawObjects(ctx, objects);
    drawObservers(ctx, observers);
  }, [mirrors, objects, observers, size, displayState]);

  // Mouse events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Adjust coordinates to account for device pixel ratio
    const getMousePos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    // Mouse down handler
    const handleMouseDown = (e: MouseEvent) => {
      const { x, y } = getMousePos(e);

      // Check if clicking on a mirror
      for (let i = 0; i < mirrors.length; i++) {
        const mirror = mirrors[i];
        if (isPointInMirror(x, y, mirror)) {
          setDragState({
            isDragging: true,
            type: "mirror",
            index: i,
            offsetX: x - mirror.position.x,
            offsetY: y - mirror.position.y,
          });
          return;
        }
      }

      // Check if clicking on an object
      for (let i = 0; i < objects.length; i++) {
        const object = objects[i];
        const halfSize = object.size / 2;
        if (
          x >= object.position.x - halfSize &&
          x <= object.position.x + halfSize &&
          y >= object.position.y - halfSize &&
          y <= object.position.y + halfSize
        ) {
          setDragState({
            isDragging: true,
            type: "object",
            index: i,
            offsetX: x - object.position.x,
            offsetY: y - object.position.y,
          });
          return;
        }
      }

      // Check if clicking on an observer
      for (let i = 0; i < observers.length; i++) {
        const observer = observers[i];
        const distance = Math.sqrt(
          (x - observer.position.x) ** 2 + (y - observer.position.y) ** 2
        );
        if (distance <= observer.size / 2) {
          setDragState({
            isDragging: true,
            type: "observer",
            index: i,
            offsetX: x - observer.position.x,
            offsetY: y - observer.position.y,
          });
          return;
        }
      }
    };

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      const { x, y } = getMousePos(e);

      // Handle dragging
      if (dragState.isDragging) {
        const { type, index, offsetX, offsetY } = dragState;

        const newX = x - offsetX;
        const newY = y - offsetY;

        if (type === "mirror") {
          updateMirror(index, { position: { x: newX, y: newY } });
        } else if (type === "object") {
          updateObject(index, { position: { x: newX, y: newY } });
        } else if (type === "observer") {
          updateObserver(index, { position: { x: newX, y: newY } });
        }
      }
    };

    // Mouse up handler
    const handleMouseUp = () => {
      setDragState({
        isDragging: false,
        type: null,
        index: -1,
        offsetX: 0,
        offsetY: 0,
      });
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    mirrors,
    objects,
    observers,
    dragState,
    updateMirror,
    updateObject,
    updateObserver,
  ]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${size[0]}px`,
        height: `${size[1]}px`,
        cursor: dragState.isDragging ? "grabbing" : "default",
      }}
      className="border border-gray-300"
    />
  );
};

export default OpticsCanvas;
