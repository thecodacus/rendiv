export interface ShapeResult {
  /** SVG path `d` attribute string */
  d: string;
  /** Natural width of the shape */
  width: number;
  /** Natural height of the shape */
  height: number;
  /** Ready-to-use SVG viewBox string ("0 0 width height") */
  viewBox: string;
}
