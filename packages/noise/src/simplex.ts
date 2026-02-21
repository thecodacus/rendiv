/**
 * Simplex noise implementation.
 * Based on Stefan Gustavson's simplex noise algorithm.
 * Produces smooth, continuous noise values in the range [-1, 1].
 */

// Permutation table (doubled for wrapping)
const perm = new Uint8Array(512);
const permMod12 = new Uint8Array(512);

// Gradient vectors for 2D, 3D, and 4D
const grad3 = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

const grad4 = [
  [0, 1, 1, 1], [0, 1, 1, -1], [0, 1, -1, 1], [0, 1, -1, -1],
  [0, -1, 1, 1], [0, -1, 1, -1], [0, -1, -1, 1], [0, -1, -1, -1],
  [1, 0, 1, 1], [1, 0, 1, -1], [1, 0, -1, 1], [1, 0, -1, -1],
  [-1, 0, 1, 1], [-1, 0, 1, -1], [-1, 0, -1, 1], [-1, 0, -1, -1],
  [1, 1, 0, 1], [1, 1, 0, -1], [1, -1, 0, 1], [1, -1, 0, -1],
  [-1, 1, 0, 1], [-1, 1, 0, -1], [-1, -1, 0, 1], [-1, -1, 0, -1],
  [1, 1, 1, 0], [1, 1, -1, 0], [1, -1, 1, 0], [1, -1, -1, 0],
  [-1, 1, 1, 0], [-1, 1, -1, 0], [-1, -1, 1, 0], [-1, -1, -1, 0],
];

function dot2(g: number[], x: number, y: number): number {
  return g[0] * x + g[1] * y;
}

function dot3(g: number[], x: number, y: number, z: number): number {
  return g[0] * x + g[1] * y + g[2] * z;
}

function dot4(g: number[], x: number, y: number, z: number, w: number): number {
  return g[0] * x + g[1] * y + g[2] * z + g[3] * w;
}

/**
 * Seed the permutation table. Uses a simple xorshift PRNG.
 * Call this to get reproducible noise for a given seed.
 */
export function seed(value: number): void {
  // Simple seed-based permutation using xorshift
  let s = value | 0;
  if (s === 0) s = 1;

  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;

  // Fisher-Yates shuffle with xorshift PRNG
  for (let i = 255; i > 0; i--) {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    const j = ((s < 0 ? ~s + 1 : s) % (i + 1));
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }

  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod12[i] = perm[i] % 12;
  }
}

// Initialize with default seed
seed(0);

// Skewing factors for 2D
const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

// Skewing factors for 3D
const F3 = 1 / 3;
const G3 = 1 / 6;

// Skewing factors for 4D
const F4 = (Math.sqrt(5) - 1) / 4;
const G4 = (5 - Math.sqrt(5)) / 20;

/** 2D simplex noise. Returns a value in [-1, 1]. */
export function simplex2D(x: number, y: number): number {
  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const t = (i + j) * G2;

  const X0 = i - t;
  const Y0 = j - t;
  const x0 = x - X0;
  const y0 = y - Y0;

  const i1 = x0 > y0 ? 1 : 0;
  const j1 = x0 > y0 ? 0 : 1;

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;

  const ii = i & 255;
  const jj = j & 255;

  let n0 = 0;
  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) {
    const gi0 = permMod12[ii + perm[jj]];
    t0 *= t0;
    n0 = t0 * t0 * dot2(grad3[gi0], x0, y0);
  }

  let n1 = 0;
  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) {
    const gi1 = permMod12[ii + i1 + perm[jj + j1]];
    t1 *= t1;
    n1 = t1 * t1 * dot2(grad3[gi1], x1, y1);
  }

  let n2 = 0;
  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) {
    const gi2 = permMod12[ii + 1 + perm[jj + 1]];
    t2 *= t2;
    n2 = t2 * t2 * dot2(grad3[gi2], x2, y2);
  }

  return 70 * (n0 + n1 + n2);
}

/** 3D simplex noise. Returns a value in [-1, 1]. */
export function simplex3D(x: number, y: number, z: number): number {
  const s = (x + y + z) * F3;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const k = Math.floor(z + s);
  const t = (i + j + k) * G3;

  const X0 = i - t;
  const Y0 = j - t;
  const Z0 = k - t;
  const x0 = x - X0;
  const y0 = y - Y0;
  const z0 = z - Z0;

  let i1: number, j1: number, k1: number;
  let i2: number, j2: number, k2: number;

  if (x0 >= y0) {
    if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
    else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
  } else {
    if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
    else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
    else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
  }

  const x1 = x0 - i1 + G3;
  const y1 = y0 - j1 + G3;
  const z1 = z0 - k1 + G3;
  const x2 = x0 - i2 + 2 * G3;
  const y2 = y0 - j2 + 2 * G3;
  const z2 = z0 - k2 + 2 * G3;
  const x3 = x0 - 1 + 3 * G3;
  const y3 = y0 - 1 + 3 * G3;
  const z3 = z0 - 1 + 3 * G3;

  const ii = i & 255;
  const jj = j & 255;
  const kk = k & 255;

  let n0 = 0;
  let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
  if (t0 >= 0) {
    const gi0 = permMod12[ii + perm[jj + perm[kk]]];
    t0 *= t0;
    n0 = t0 * t0 * dot3(grad3[gi0], x0, y0, z0);
  }

  let n1 = 0;
  let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
  if (t1 >= 0) {
    const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]];
    t1 *= t1;
    n1 = t1 * t1 * dot3(grad3[gi1], x1, y1, z1);
  }

  let n2 = 0;
  let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
  if (t2 >= 0) {
    const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]];
    t2 *= t2;
    n2 = t2 * t2 * dot3(grad3[gi2], x2, y2, z2);
  }

  let n3 = 0;
  let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
  if (t3 >= 0) {
    const gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]];
    t3 *= t3;
    n3 = t3 * t3 * dot3(grad3[gi3], x3, y3, z3);
  }

  return 32 * (n0 + n1 + n2 + n3);
}

/** 4D simplex noise. Returns a value in [-1, 1]. */
export function simplex4D(x: number, y: number, z: number, w: number): number {
  const s = (x + y + z + w) * F4;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const k = Math.floor(z + s);
  const l = Math.floor(w + s);
  const t = (i + j + k + l) * G4;

  const X0 = i - t;
  const Y0 = j - t;
  const Z0 = k - t;
  const W0 = l - t;
  const x0 = x - X0;
  const y0 = y - Y0;
  const z0 = z - Z0;
  const w0 = w - W0;

  // Determine simplex corner offsets using ranking
  let rankx = 0, ranky = 0, rankz = 0, rankw = 0;
  if (x0 > y0) rankx++; else ranky++;
  if (x0 > z0) rankx++; else rankz++;
  if (x0 > w0) rankx++; else rankw++;
  if (y0 > z0) ranky++; else rankz++;
  if (y0 > w0) ranky++; else rankw++;
  if (z0 > w0) rankz++; else rankw++;

  const i1 = rankx >= 3 ? 1 : 0;
  const j1 = ranky >= 3 ? 1 : 0;
  const k1 = rankz >= 3 ? 1 : 0;
  const l1 = rankw >= 3 ? 1 : 0;
  const i2 = rankx >= 2 ? 1 : 0;
  const j2 = ranky >= 2 ? 1 : 0;
  const k2 = rankz >= 2 ? 1 : 0;
  const l2 = rankw >= 2 ? 1 : 0;
  const i3 = rankx >= 1 ? 1 : 0;
  const j3 = ranky >= 1 ? 1 : 0;
  const k3 = rankz >= 1 ? 1 : 0;
  const l3 = rankw >= 1 ? 1 : 0;

  const x1 = x0 - i1 + G4;
  const y1 = y0 - j1 + G4;
  const z1 = z0 - k1 + G4;
  const w1 = w0 - l1 + G4;
  const x2 = x0 - i2 + 2 * G4;
  const y2 = y0 - j2 + 2 * G4;
  const z2 = z0 - k2 + 2 * G4;
  const w2 = w0 - l2 + 2 * G4;
  const x3 = x0 - i3 + 3 * G4;
  const y3 = y0 - j3 + 3 * G4;
  const z3 = z0 - k3 + 3 * G4;
  const w3 = w0 - l3 + 3 * G4;
  const x4 = x0 - 1 + 4 * G4;
  const y4 = y0 - 1 + 4 * G4;
  const z4 = z0 - 1 + 4 * G4;
  const w4 = w0 - 1 + 4 * G4;

  const ii = i & 255;
  const jj = j & 255;
  const kk = k & 255;
  const ll = l & 255;

  let n0 = 0;
  let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
  if (t0 >= 0) {
    const gi0 = perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32;
    t0 *= t0;
    n0 = t0 * t0 * dot4(grad4[gi0], x0, y0, z0, w0);
  }

  let n1 = 0;
  let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
  if (t1 >= 0) {
    const gi1 = perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32;
    t1 *= t1;
    n1 = t1 * t1 * dot4(grad4[gi1], x1, y1, z1, w1);
  }

  let n2 = 0;
  let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
  if (t2 >= 0) {
    const gi2 = perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32;
    t2 *= t2;
    n2 = t2 * t2 * dot4(grad4[gi2], x2, y2, z2, w2);
  }

  let n3 = 0;
  let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
  if (t3 >= 0) {
    const gi3 = perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32;
    t3 *= t3;
    n3 = t3 * t3 * dot4(grad4[gi3], x3, y3, z3, w3);
  }

  let n4 = 0;
  let t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
  if (t4 >= 0) {
    const gi4 = perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32;
    t4 *= t4;
    n4 = t4 * t4 * dot4(grad4[gi4], x4, y4, z4, w4);
  }

  return 27 * (n0 + n1 + n2 + n3 + n4);
}
