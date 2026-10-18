import Complex from "./Complex.ts";

export type Matrix2 = readonly [readonly [Complex, Complex], readonly [Complex, Complex]];

const c = (re: number, im: number = 0) => new Complex(re, im);
const R = Math.SQRT1_2;

export const I: Matrix2 = [[c(1), c(0)], [c(0), c(1)]];
export const X: Matrix2 = [[c(0), c(1)], [c(1), c(0)]];
export const Y: Matrix2 = [[c(0), c(0, -1)], [c(0, 1), c(0)]];
export const Z: Matrix2 = [[c(1), c(0)], [c(0), c(-1)]];
export const H: Matrix2 = [[c(R), c(R)], [c(R), c(-R)]];
export const S: Matrix2 = [[c(1), c(0)], [c(0), c(0, 1)]];
export const T: Matrix2 = [[c(1), c(0)], [c(0), c(R, R)]];

/** Rotation about the X axis of the Bloch sphere by `angle` radians. */
export function Rx(angle: number): Matrix2 {
    const co = Math.cos(angle / 2), si = Math.sin(angle / 2);
    return [[c(co), c(0, -si)], [c(0, -si), c(co)]];
}

export function Ry(angle: number): Matrix2 {
    const co = Math.cos(angle / 2), si = Math.sin(angle / 2);
    return [[c(co), c(-si)], [c(si), c(co)]];
}

export function Rz(angle: number): Matrix2 {
    return [
        [Complex.fromPolar(1, -angle / 2), c(0)],
        [c(0), Complex.fromPolar(1, angle / 2)],
    ];
}