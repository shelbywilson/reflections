export interface Point {
  x: number;
  y: number;
}

// Mirror interface
export interface MirrorProps {
  position: Point;
  width: number;
  height: number;
  rotation: number;
  isVirtual?: boolean;
  order?: number;
  sourceMirror?: MirrorProps;
}

// Object interface
export interface ObjectProps {
  position: Point;
  size: number;
  direction: number; // In degrees, 0 means pointing right
}

// Virtual object interface
export interface VirtualImage extends ObjectProps {
  order: number;
  sourceMirror: MirrorProps;
}

// Observer interface
export interface ObserverProps {
  position: Point;
  size: number;
  color: string;
}

export interface DisplayState {
    showVirtualMirrors: boolean,
}
