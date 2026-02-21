export interface PathSegment {
  command: string;
  values: number[];
}

export interface Point {
  x: number;
  y: number;
}

export interface PointOnPath extends Point {
  angle: number;
}
