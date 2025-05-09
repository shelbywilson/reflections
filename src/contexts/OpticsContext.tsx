import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { getRandomColor } from "../util/render-helpers";
import type {
  MirrorProps,
  ObjectProps,
  ObserverProps,
  Point,
} from "../util/types";

const defaultMirror: MirrorProps = {
  position: {
    x: (window.innerWidth * 1) * 0.38,
    y: window.innerHeight / 2,
  },
  width: 6,
  height: 400,
  rotation: 180,
};

// Interface for the Optics context
interface OpticsContextType {
  mirrors: MirrorProps[];
  objects: ObjectProps[];
  observers: ObserverProps[];
  addMirror: () => void;
  addObject: (position: Point) => void;
  addObserver: (position: Point) => void;
  updateMirror: (index: number, props: Partial<MirrorProps>) => void;
  updateObject: (index: number, props: Partial<ObjectProps>) => void;
  updateObserver: (index: number, props: Partial<ObserverProps>) => void;
  removeMirror: (index: number) => void;
  removeObject: (index: number) => void;
  removeObserver: (index: number) => void;
}

// Create the context
const OpticsContext = createContext<OpticsContextType | null>(null);

// Hook to use the context
export const useOptics = () => {
  const context = useContext(OpticsContext);
  if (!context) {
    throw new Error("useOptics must be used within an OpticsProvider");
  }
  return context;
};

// Provider component
interface OpticsProviderProps {
  children: ReactNode;
}

export default function OpticsProvider({ children }: OpticsProviderProps) {
  // Initialize with a setup that shows rays bouncing between mirrors
  const [mirrors, setMirrors] = useState<MirrorProps[]>([
    { ...defaultMirror },
  ]);

  const [objects, setObjects] = useState<ObjectProps[]>([
    { position: { x: window.innerWidth/2, y: window.innerHeight * 0.45 }, size: 30, direction: 0 },
  ]);

  const [observers, setObservers] = useState<ObserverProps[]>([
    { position: { x:window.innerWidth/2, y: window.innerHeight * 0.8 }, size: 40, color: getRandomColor() },
  ]);

  // Add functions
  const addMirror = () => {
    setMirrors((prev) => {
      switch (prev.length) {
        case 2:
          return [
            ...prev,
            {
              ...defaultMirror,
              rotation: 90,
              position: {
                x: (window.innerWidth * 1) / 2,
                y: (window.innerHeight * 1) / 4,
              },
            },
          ];
        case 1:
          return [
            ...prev,
            {
              ...defaultMirror,
              position: {
                ...defaultMirror.position,
                x: window.innerWidth * 0.62,
              },
            },
          ];
        case 0:
        default:
          return [defaultMirror];
      }
    });
  };

  // unused add object/observer but keep for now
  const addObject = (position: Point) => {
    setObjects([...objects, { position, size: 30, direction: 0 }]);
  };

  const addObserver = (position: Point) => {
    setObservers([
      ...observers,
      { position, size: 40, color: getRandomColor() },
    ]);
  };

  // Update functions
  const updateMirror = (index: number, props: Partial<MirrorProps>) => {
    if (index < 0 || index >= mirrors.length) return;

    const updatedMirrors = [...mirrors];
    updatedMirrors[index] = { ...updatedMirrors[index], ...props };
    setMirrors(updatedMirrors);
  };

  const updateObject = (index: number, props: Partial<ObjectProps>) => {
    if (index < 0 || index >= objects.length) return;

    const updatedObjects = [...objects];
    updatedObjects[index] = { ...updatedObjects[index], ...props };
    setObjects(updatedObjects);
  };

  const updateObserver = (index: number, props: Partial<ObserverProps>) => {
    if (index < 0 || index >= observers.length) return;

    const updatedObservers = [...observers];
    updatedObservers[index] = { ...updatedObservers[index], ...props };
    setObservers(updatedObservers);
  };

  // Remove functions
  const removeMirror = (index: number) => {
    if (index < 0 || index >= mirrors.length) return;
    setMirrors(mirrors.filter((_, i) => i !== index));
  };

  const removeObject = (index: number) => {
    if (index < 0 || index >= objects.length) return;
    setObjects(objects.filter((_, i) => i !== index));
  };

  const removeObserver = (index: number) => {
    if (index < 0 || index >= observers.length) return;
    setObservers(observers.filter((_, i) => i !== index));
  };

  const value = {
    mirrors,
    objects,
    observers,
    addMirror,
    addObject,
    addObserver,
    updateMirror,
    updateObject,
    updateObserver,
    removeMirror,
    removeObject,
    removeObserver,
  };

  return (
    <OpticsContext.Provider value={value}>{children}</OpticsContext.Provider>
  );
}
