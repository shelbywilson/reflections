import type {
  MirrorProps,
  ObjectProps,
  ObserverProps,
  Point,
  VirtualImage,
} from "./types";
import {
  isDirectlyVisible,
  lineIntersection,
  getMirrorEndpoints,
  calculateParallelMirrorImages,
  getMirrorNormal,
  subtractVectors,
  dotProduct,
  calculateVirtualImagePosition,
  findParallelMirrorGroups,
  calculateVirtualMirrors,
} from "./optics-helpers";

// Get device pixel ratio
export const getPixelRatio = () => {
  const devicePixelRatio = window.devicePixelRatio || 1;

  return devicePixelRatio / 1;
};

// Draw mirrors
export const drawMirrors = (
  ctx: CanvasRenderingContext2D,
  mirrors: MirrorProps[]
) => {
  mirrors.forEach((mirror) => {
    // Save context
    ctx.save();

    // Translate to mirror center first, then rotate
    ctx.translate(mirror.position.x, mirror.position.y);
    ctx.rotate((mirror.rotation * Math.PI) / 180); // Convert degrees to radians

    // Draw mirror
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;

    // Draw a rectangle centered at origin
    const halfWidth = mirror.width / 2;
    const halfHeight = mirror.height / 2;
    ctx.fillRect(-halfWidth, -halfHeight, mirror.width, mirror.height);
    ctx.strokeRect(-halfWidth, -halfHeight, mirror.width, mirror.height);

    // Restore context
    ctx.restore();
  });
};

// Draw objects
export const drawObjects = (
  ctx: CanvasRenderingContext2D,
  objects: ObjectProps[]
) => {
  objects.forEach((object) => {
    const halfSize = object.size / 2;

    ctx.save();
    ctx.translate(object.position.x, object.position.y);
    ctx.rotate((object.direction * Math.PI) / 180);

    // Draw triangle
    ctx.beginPath();
    ctx.moveTo(halfSize, 0); // Point
    ctx.lineTo(-halfSize, -halfSize); // Bottom left
    ctx.lineTo(-halfSize, halfSize); // Bottom right
    ctx.closePath();

    ctx.fillStyle = "black";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  });
};
// Draw observers
export const drawObservers = (
  ctx: CanvasRenderingContext2D,
  observers: ObserverProps[]
) => {
  observers.forEach((observer) => {
    const halfSize = observer.size / 2;

    // Draw observer (eye)
    // Outer circle (eyeball)
    ctx.beginPath();
    ctx.arc(observer.position.x, observer.position.y, halfSize, 0, Math.PI * 2);
    ctx.fillStyle = observer.color;
    ctx.fill();

    // Inner circle (iris)
    ctx.beginPath();
    ctx.arc(
      observer.position.x,
      observer.position.y,
      halfSize / 2,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Label
    ctx.font = "12px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.fillText(
      "observer",
      observer.position.x,
      observer.position.y + halfSize + 20
    );
  });
};

// Draw visibility lines from objects to observer
export const drawVisibilityLines = (
  ctx: CanvasRenderingContext2D,
  objects: ObjectProps[],
  observers: ObserverProps[],
  mirrors: MirrorProps[]
) => {
  objects.forEach((object) => {
    observers.forEach((observer) => {
      // Check direct visibility
      if (isDirectlyVisible(object.position, observer.position, mirrors)) {
        // Draw direct visibility line
        ctx.beginPath();
        ctx.moveTo(object.position.x, object.position.y);
        ctx.lineTo(observer.position.x, observer.position.y);
        ctx.strokeStyle = "#00cc00"; // Green for direct visibility
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  });
};

const getColorForOrder = (order: number) => {
  const colors = [
    "rgb(255, 0, 0)", // Red
    "rgb(220, 50, 220)", // Magenta
    "rgb(50, 220, 220)", // Cyan
    "rgb(50, 50, 220)", // Blue
  ];

  return colors[(order - 1) % colors.length];
};

export const drawLightRay = (
  ctx: CanvasRenderingContext2D,
  virtualImage: VirtualImage,
  object: ObjectProps,
  observer: ObserverProps,
  mirror: MirrorProps,
  parallelImage?: VirtualImage[]
) => {
  const mirrorEndpoints = getMirrorEndpoints(mirror);
  const mirrorIntersection = lineIntersection(
    virtualImage.position,
    observer.position,
    mirrorEndpoints[0],
    mirrorEndpoints[1]
  );

  if (mirrorIntersection) {
    const virtualImageColor = getColorForOrder(virtualImage.order);
    // Path from observer to first mirror
    drawPath(
      ctx,
      mirrorIntersection,
      observer.position,
      false,
      virtualImageColor
    );

    // Path from mirror to virtual image - colored by image order
    drawPath(
      ctx,
      mirrorIntersection,
      virtualImage.position,
      true,
      virtualImageColor
    );

    if (virtualImage.order == 1) {
      // Direct path from object to mirror for first-order images
      drawPath(
        ctx,
        object.position,
        mirrorIntersection,
        false,
        virtualImageColor
      );
    } else {
      let currentIntersection = mirrorIntersection;
      let currentImage = virtualImage;

      while (currentImage.order > 1) {
        try {
          const prevImage = parallelImage?.find(
            (img) =>
              img.order == currentImage.order - 1 &&
              img.sourceMirror != currentImage.sourceMirror
          );

          if (!prevImage) {
            // console.error(
            //   "Could not find previous image",
            //   currentImage.order - 1
            // );
            break;
          }

          const prevMirrorEndpoints = getMirrorEndpoints(
            prevImage.sourceMirror
          );
          const prevIntersection = lineIntersection(
            currentIntersection,
            prevImage.position,
            prevMirrorEndpoints[0],
            prevMirrorEndpoints[1]
          );

          if (prevIntersection) {
            // Draw path between mirror intersections with the color of the previous image
            drawPath(
              ctx,
              prevIntersection,
              currentIntersection,
              false,
              virtualImageColor
            );

            if (prevImage.order === 1) {
              // Connect to original object with the same color as first-order image
              drawPath(
                ctx,
                object.position,
                prevIntersection,
                false,
                virtualImageColor
              );
            }

            currentIntersection = prevIntersection;
            currentImage = prevImage;
          } else {
            // console.error("No intersection found with previous mirror");
            break;
          }
        } catch (e) {
          console.error("Error tracing path:", e);
          break;
        }
      }
    }
  }
};
// Generate random shade of blue, green, or brown
export const getRandomColor = () => {
  const shades = {
    blue: [`#1E90FF`, `#4682B4`, `#6495ED`, `#00BFFF`],
    green: [`#228B22`, `#bcda8e`, `#6B8E23`, `#2E8B57`],
    brown: [`#8B4513`, `#A0522D`, `#a16d48`, `#CD853F`, "#64320e"],
  };
  const colors = Object.values(shades).flat();
  return colors[Math.floor(Math.random() * colors.length)];
};

export const drawVirtualImages = (
  ctx: CanvasRenderingContext2D,
  objects: ObjectProps[],
  mirrors: MirrorProps[],
  observers: ObserverProps[]
) => {
  // First, handle single mirror reflections
  objects.forEach((object) => {
    mirrors.forEach((mirror) => {
      const firstOrderImage = {
        ...calculateVirtualImagePosition(object, mirror),
        order: 1,
        sourceMirror: mirror,
      };

      if (
        isImageVisible(observers, mirrors, firstOrderImage.position, mirror)
      ) {
        drawVirtualImage(
          ctx,
          firstOrderImage.position,
          object.size,
          firstOrderImage.direction,
          1
        );

        observers.forEach((observer) => {
          drawLightRay(ctx, firstOrderImage, object, observer, mirror, [
            firstOrderImage,
          ]);
        });
      }
    });
  });

  // Find ALL parallel mirror groups (including groups of 3+ mirrors)
  const parallelMirrorGroups = findParallelMirrorGroups(mirrors);

  // Draw higher-order images from parallel mirrors
  objects.forEach((object) => {
    parallelMirrorGroups.forEach((mirrorGroup) => {
      // Only process groups with 2 or more mirrors
      if (mirrorGroup.length >= 2) {
        const images = calculateParallelMirrorImages(object, mirrorGroup);

        // Filter out first-order images since we've already drawn them
        const higherOrderImages = images.filter((img) => img.order > 1);

        higherOrderImages.forEach((img) => {
          if (
            isImageVisible(observers, mirrors, img.position, img.sourceMirror)
          ) {
            drawVirtualImage(
              ctx,
              img.position,
              object.size,
              img.direction,
              img.order
            );

            mirrorGroup.forEach((mirror) => {
              observers.forEach((observer) => {
                drawLightRay(ctx, img, object, observer, mirror, images);
              });
            });
          }
        });
      }
    });
  });
};

// Draw a virtual image with opacity based on reflection order
const drawVirtualImage = (
  ctx: CanvasRenderingContext2D,
  position: Point,
  size: number,
  direction: number,
  order: number
) => {
  const halfSize = size / 2;
  const grayVal = Math.min(220, 100 + order * 30);

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate((direction * Math.PI) / 180);

  // Draw triangle
  ctx.beginPath();
  ctx.moveTo(halfSize, 0);
  ctx.lineTo(-halfSize, -halfSize);
  ctx.lineTo(-halfSize, halfSize);
  ctx.closePath();

  ctx.fillStyle = `rgb(${grayVal}, ${grayVal}, ${grayVal})`;
  ctx.fill();

  // Label with reflection order
  ctx.rotate((-direction * Math.PI) / 180); // Reset rotation for text
  ctx.font = "12px Arial";
  ctx.fillStyle = `rgb(0, 0, 0)`;
  ctx.fillText(`reflection ${order}`, 0, size);

  ctx.restore();
};

const drawPath = (
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  dashed = false,
  color = "#ff00ff"
) => {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);

  ctx.strokeStyle = color;
  if (dashed) {
    ctx.setLineDash([5, 5]);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (dashed) {
    ctx.setLineDash([]);
  }
};

// Helper function to check visibility of virtual image
const isImageVisible = (
  observers: ObserverProps[],
  mirrors: MirrorProps[],
  virtualPos: Point,
  mirror: MirrorProps
): boolean => {
  for (const observer of observers) {
    // Check if virtual image is "in front" of mirror from observer's perspective
    const mirrorNormal = getMirrorNormal(mirror);
    const mirrorToObserver = subtractVectors(
      observer.position,
      mirror.position
    );
    const mirrorToVirtual = subtractVectors(virtualPos, mirror.position);

    // Dot products to determine which side they're on
    const observerSide = dotProduct(mirrorToObserver, mirrorNormal);
    const virtualSide = dotProduct(mirrorToVirtual, mirrorNormal);

    // If they're on opposite sides, the image could be visible
    if (observerSide * virtualSide < 0) {
      // Check if line of sight is not blocked by other mirrors
      const otherMirrors = mirrors.filter((m) => m !== mirror);
      if (isDirectlyVisible(observer.position, virtualPos, otherMirrors)) {
        return true;
      }
    }
  }
  return false;
};
// Draw virtual mirrors
export const drawVirtualMirrors = (
  ctx: CanvasRenderingContext2D,
  mirrors: MirrorProps[]
) => {
  const virtualMirrors = calculateVirtualMirrors(mirrors);

  virtualMirrors.forEach((mirror) => {
    ctx.save();
    ctx.translate(mirror.position.x, mirror.position.y);
    ctx.rotate((mirror.rotation * Math.PI) / 180);

    ctx.fillStyle = `rgba(144,188,222,0.5)`;
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 1;

    const halfWidth = mirror.width / 2;
    const halfHeight = mirror.height / 2;
    ctx.fillRect(-halfWidth, -halfHeight, mirror.width, mirror.height);
    ctx.strokeRect(-halfWidth, -halfHeight, mirror.width, mirror.height);

    ctx.restore();
  });
};
