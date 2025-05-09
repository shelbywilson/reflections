import type { MirrorProps, ObjectProps, Point, VirtualImage } from "./types";

// Calculate the endpoints of a mirror based on its position and dimensions
export const getMirrorEndpoints = (mirror: MirrorProps): [Point, Point] => {
  const radians = (mirror.rotation * Math.PI) / 180;
  const halfHeight = mirror.height / 2;

  const start: Point = {
    x: mirror.position.x + Math.sin(radians) * halfHeight,
    y: mirror.position.y - Math.cos(radians) * halfHeight,
  };

  const end: Point = {
    x: mirror.position.x - Math.sin(radians) * halfHeight,
    y: mirror.position.y + Math.cos(radians) * halfHeight,
  };

  return [start, end];
};

// Calculate the normal vector for a mirror (perpendicular to surface)
export const getMirrorNormal = (mirror: MirrorProps): Point => {
  const radians = (mirror.rotation * Math.PI) / 180;
  return {
    x: Math.cos(radians),
    y: Math.sin(radians),
  };
};

// Vector operations
export const vectorLength = (v: Point): number => {
  return Math.sqrt(v.x * v.x + v.y * v.y);
};

export const normalizeVector = (v: Point): Point => {
  const length = vectorLength(v);
  if (length === 0) return { x: 0, y: 0 };
  return {
    x: v.x / length,
    y: v.y / length,
  };
};

export const dotProduct = (v1: Point, v2: Point): number => {
  return v1.x * v2.x + v1.y * v2.y;
};

export const subtractVectors = (v1: Point, v2: Point): Point => {
  return {
    x: v1.x - v2.x,
    y: v1.y - v2.y,
  };
};

export const addVectors = (v1: Point, v2: Point): Point => {
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y,
  };
};

export const multiplyVector = (v: Point, scalar: number): Point => {
  if (!v) return { x: 0, y: 0 };
  return {
    x: v.x * scalar,
    y: v.y * scalar,
  };
};

// Calculate reflection of a ray when it hits a mirror
export const calculateReflection = (
  rayStart: Point,
  rayDirection: Point,
  mirror: MirrorProps
): Point | null => {
  if (!rayDirection || !mirror) return null;

  const [mirrorStart, mirrorEnd] = getMirrorEndpoints(mirror);
  const mirrorNormal = getMirrorNormal(mirror);

  // Check if ray intersects with mirror
  const intersection = lineIntersection(
    rayStart,
    addVectors(rayStart, rayDirection),
    mirrorStart,
    mirrorEnd
  );

  if (!intersection) return null;

  // Calculate reflection
  const dot = dotProduct(rayDirection, mirrorNormal);
  const reflection = subtractVectors(
    rayDirection,
    multiplyVector(mirrorNormal, 2 * dot)
  );

  return normalizeVector(reflection);
};

// Find intersection of two line segments
export const lineIntersection = (
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): Point | null => {
  if (!p1 || !p2 || !p3 || !p4) return null;

  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

  if (Math.abs(denom) < 0.0001) return null; // parallel lines

  const ua =
    ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub =
    ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  // Check if intersection is on both line segments
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null;

  return {
    x: p1.x + ua * (p2.x - p1.x),
    y: p1.y + ua * (p2.y - p1.y),
  };
};

export function isPointInMirror(
  x: number,
  y: number,
  mirror: MirrorProps
): boolean {
  // Convert point to mirror's local coordinates
  const dx = x - mirror.position.x;
  const dy = y - mirror.position.y;

  // Rotate point by negative of mirror's rotation
  const angle = -(mirror.rotation * Math.PI) / 180;
  const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
  const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);

  // Check if point is inside rectangle
  return (
    Math.abs(rotatedX) <= mirror.width / 2 &&
    Math.abs(rotatedY) <= mirror.height / 2
  );
}

// Check if a point is directly visible from another point
export const isDirectlyVisible = (
  from: Point,
  to: Point,
  mirrors: MirrorProps[]
): boolean => {
  // Check if line of sight is blocked by any mirror
  for (const mirror of mirrors) {
    const [mirrorStart, mirrorEnd] = getMirrorEndpoints(mirror);
    if (lineIntersection(from, to, mirrorStart, mirrorEnd)) {
      return false;
    }
  }
  return true;
};

// Calculate virtual image position for an object in a mirror
export const calculateVirtualImagePosition = (
  object: ObjectProps,
  mirror: MirrorProps
): VirtualImage => {
  // Current position calculation
  const normal = getMirrorNormal(mirror);
  const mirrorToObj = subtractVectors(object.position, mirror.position);
  const dist = dotProduct(mirrorToObj, normal);

  const position = {
    x: object.position.x - 2 * dist * normal.x,
    y: object.position.y - 2 * dist * normal.y,
  };

  // Calculate reflected direction
  // Mirror angle in radians
  const mirrorAngle = (mirror.rotation * Math.PI) / 180;

  // Calculate reflected angle (2 * mirror angle - object angle)
  // Normalize angles to 0-360 range
  const normalizedMirrorAngle =
    ((((mirrorAngle * 180) / Math.PI) % 360) + 360) % 360;
  const reflectedDirection =
    (2 * normalizedMirrorAngle - object.direction + 180) % 360;

  return {
    position,
    direction: reflectedDirection,
    size: object.size,
    order: 1,
    sourceMirror: mirror,
  };
};

// Check if two mirrors are parallel by comparing their normals
export const areParallel = (
  mirror1: MirrorProps,
  mirror2: MirrorProps
): boolean => {
  const epsilon = 0.001; // Tolerance for floating point comparison
  const normal1 = getMirrorNormal(mirror1);
  const normal2 = getMirrorNormal(mirror2);

  // Check if normals are parallel (either same or opposite direction)
  return Math.abs(normal1.x * normal2.x + normal1.y * normal2.y) > 1 - epsilon;
};

// Calculate virtual images for parallel mirrors
export const calculateParallelMirrorImages = (
  object: ObjectProps,
  mirrors: MirrorProps[],
  maxReflections: number = 3
): VirtualImage[] => {
  if (mirrors.length < 2) return [];

  const results: {
    position: Point;
    direction: number;
    order: number;
    sourceMirror: MirrorProps;
  }[] = [];
  const virtualObjects: {
    position: Point;
    direction: number;
    size: number;
    sourceObject: ObjectProps;
    sourceMirror: MirrorProps | null;
    reflectionOrder: number;
  }[] = [
    {
      position: object.position,
      direction: object.direction,
      size: object.size,
      sourceObject: object,
      sourceMirror: null,
      reflectionOrder: 0,
    },
  ];

  // Track already calculated images to avoid duplicates
  const imageMap = new Map<string, boolean>();

  // Process reflections up to maxReflections
  for (let reflection = 1; reflection <= maxReflections; reflection++) {
    const newVirtualObjects: typeof virtualObjects = [];

    virtualObjects.forEach((vObj) => {
      mirrors.forEach((mirror) => {
        // Skip if this is the mirror that created this virtual object
        if (mirror === vObj.sourceMirror) return;

        // Calculate virtual image
        const virtual = calculateVirtualImagePosition(
          {
            ...vObj.sourceObject,
            position: vObj.position,
            direction: vObj.direction,
          },
          mirror
        );

        // Create a unique key for this image to avoid duplicates
        const key = `${Math.round(virtual.position.x)},${Math.round(
          virtual.position.y
        )},${reflection}`;
        if (!imageMap.has(key)) {
          imageMap.set(key, true);
          results.push({
            ...virtual,
            order: reflection,
            sourceMirror: mirror,
          });

          // Add this as a virtual object for next iteration
          newVirtualObjects.push({
            ...virtual,
            sourceObject: vObj.sourceObject,
            sourceMirror: mirror,
            reflectionOrder: reflection,
          });
        }
      });
    });

    // Update virtual objects for next iteration
    virtualObjects.length = 0;
    virtualObjects.push(...newVirtualObjects);
  }

  return results.map((result) => ({
    position: result.position,
    direction: result.direction,
    size: object.size,
    order: result.order,
    sourceMirror: result.sourceMirror,
  }));
};

// Calculate distance from point to line segment (mirror)
export const distanceToMirror = (point: Point, mirror: MirrorProps): number => {
  const [p1, p2] = getMirrorEndpoints(mirror);

  const A = point.x - p1.x;
  const B = point.y - p1.y;
  const C = p2.x - p1.x;
  const D = p2.y - p1.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = p1.x;
    yy = p1.y;
  } else if (param > 1) {
    xx = p2.x;
    yy = p2.y;
  } else {
    xx = p1.x + param * C;
    yy = p1.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;

  return Math.sqrt(dx * dx + dy * dy);
};

// Helper function to find parallel mirror groups
export const findParallelMirrorGroups = (
  mirrors: MirrorProps[]
): MirrorProps[][] => {
  const groups: MirrorProps[][] = [];

  for (let i = 0; i < mirrors.length; i++) {
    for (let j = i + 1; j < mirrors.length; j++) {
      if (areParallel(mirrors[i], mirrors[j])) {
        let found = false;

        for (const group of groups) {
          if (group.includes(mirrors[i]) || group.includes(mirrors[j])) {
            if (!group.includes(mirrors[i])) group.push(mirrors[i]);
            if (!group.includes(mirrors[j])) group.push(mirrors[j]);
            found = true;
            break;
          }
        }

        if (!found) {
          groups.push([mirrors[i], mirrors[j]]);
        }
      }
    }
  }

  return groups;
};

// Calculate a virtual mirror position from a source mirror reflected in another mirror
export const calculateVirtualMirror = (
  sourceMirror: MirrorProps,
  reflectingMirror: MirrorProps
): MirrorProps => {
  const [start, end] = getMirrorEndpoints(sourceMirror);

  // Calculate virtual positions of mirror endpoints
  const normal = getMirrorNormal(reflectingMirror);

  const reflectingToStart = subtractVectors(start, reflectingMirror.position);
  const distStart = dotProduct(reflectingToStart, normal);
  const virtualStart = {
    x: start.x - 2 * distStart * normal.x,
    y: start.y - 2 * distStart * normal.y,
  };

  const reflectingToEnd = subtractVectors(end, reflectingMirror.position);
  const distEnd = dotProduct(reflectingToEnd, normal);
  const virtualEnd = {
    x: end.x - 2 * distEnd * normal.x,
    y: end.y - 2 * distEnd * normal.y,
  };

  // Calculate center and dimensions
  const virtualCenter = {
    x: (virtualStart.x + virtualEnd.x) / 2,
    y: (virtualStart.y + virtualEnd.y) / 2,
  };

  const virtualHeight = Math.sqrt(
    Math.pow(virtualEnd.x - virtualStart.x, 2) +
      Math.pow(virtualEnd.y - virtualStart.y, 2)
  );

  // Calculate rotation angle
  const dx = virtualEnd.x - virtualStart.x;
  const dy = virtualEnd.y - virtualStart.y;
  const virtualRotation = (Math.atan2(dx, -dy) * 180) / Math.PI;

  return {
    position: virtualCenter,
    width: sourceMirror.width,
    height: virtualHeight,
    rotation: virtualRotation,
    sourceMirror: reflectingMirror, // Track which mirror created this virtual mirror
    isVirtual: true,
    order: 1,
  };
};

// Calculate all virtual mirrors in a scene
export const calculateVirtualMirrors = (
  mirrors: MirrorProps[]
): MirrorProps[] => {
  if (mirrors.length <= 1) return [];

  const virtualMirrors: MirrorProps[] = [];

  // Calculate first-order virtual mirrors (real mirror reflected in real mirror)
  const firstOrderVirtualMirrors: MirrorProps[] = [];
  for (let i = 0; i < mirrors.length; i++) {
    for (let j = 0; j < mirrors.length; j++) {
      if (i !== j) {
        const virtualMirror = calculateVirtualMirror(mirrors[i], mirrors[j]);
        virtualMirror.isVirtual = true;
        virtualMirror.order = 1;
        firstOrderVirtualMirrors.push(virtualMirror);
        virtualMirrors.push(virtualMirror);
      }
    }
  }

  // Calculate second-order virtual mirrors (virtual mirror reflected in real mirror)
  for (let i = 0; i < firstOrderVirtualMirrors.length; i++) {
    for (let j = 0; j < mirrors.length; j++) {
      // Avoid reflecting a virtual mirror in the mirror that created it
      if (firstOrderVirtualMirrors[i].sourceMirror !== mirrors[j]) {
        const secondOrderMirror = calculateVirtualMirror(
          firstOrderVirtualMirrors[i],
          mirrors[j]
        );
        secondOrderMirror.isVirtual = true;
        secondOrderMirror.order = 2;
        virtualMirrors.push(secondOrderMirror);
      }
    }
  }

  return virtualMirrors;
};
