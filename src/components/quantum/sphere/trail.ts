/**
 * [TRAIL] Computes the path the Bloch vector travels through each gate.
 *
 * Every single-qubit gate is a rotation of the sphere about some axis n by some angle δ.
 * We extract (n, δ) from the gate matrix and sample points along the real arc,
 * so S and T draw latitude circles instead of straight chords.
 * All vectors here are in BLOCH coordinates (x, y, z); BlochSphere.tsx converts them to scene coordinates.
 */
import type { Matrix2 } from "../Gates.ts";
import type { CircuitGate } from "../../controls/circuit/useCircuit.ts";
import type { BlochVector } from "./BlochSphere.tsx";

/* ---------- [TRAIL] tiny complex helpers: [re, im] ---------- */

type C = [number, number];
const mul = (a: C, b: C): C => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];

/* ---------- [TRAIL] gate matrix -> rotation axis + angle ---------- */

export interface Rotation {
    axis: BlochVector; // unit vector
    angle: number;     // radians, in [-π, π]
}

/**
 * Write U = e^{iγ} (cos(δ/2)·I − i·sin(δ/2)·(n·σ)).
 * Dividing by sqrt(det U) removes the global phase e^{iγ}; then
 * cos(δ/2) = Re(trace)/2 and sin(δ/2)·n comes from the off-diagonal / imaginary parts.
 */
export function gateToRotation(m: Matrix2): Rotation {
    const at = (r: number, c: number): C => [m[r][c].real, m[r][c].imaginary];

    const a = at(0, 0), b = at(0, 1), c = at(1, 0), d = at(1, 1);

    // det = ad − bc, then its principal square root
    const ad = mul(a, d), bc = mul(b, c);
    const det: C = [ad[0] - bc[0], ad[1] - bc[1]];
    const mod = Math.hypot(det[0], det[1]);
    const arg = Math.atan2(det[1], det[0]);
    const root: C = [Math.sqrt(mod) * Math.cos(arg / 2), Math.sqrt(mod) * Math.sin(arg / 2)];

    // multiply by 1/root to strip the global phase
    const r2 = root[0] ** 2 + root[1] ** 2;
    const inv: C = [root[0] / r2, -root[1] / r2];
    const A = mul(a, inv), B = mul(b, inv), Cc = mul(c, inv), D = mul(d, inv);

    const cosHalf = (A[0] + D[0]) / 2;
    const sx = -(B[1] + Cc[1]) / 2;
    const sy = (Cc[0] - B[0]) / 2;
    const sz = (D[1] - A[1]) / 2;
    const sinHalf = Math.hypot(sx, sy, sz);

    if (sinHalf < 1e-9) return { axis: { x: 0, y: 0, z: 1 }, angle: 0 }; // identity

    let angle = 2 * Math.atan2(sinHalf, cosHalf);
    if (angle > Math.PI) angle -= 2 * Math.PI; // take the shorter way around
    return { axis: { x: sx / sinHalf, y: sy / sinHalf, z: sz / sinHalf }, angle };
}

/* ---------- [TRAIL] Rodrigues rotation of a vector about a unit axis ---------- */

function rotate(v: BlochVector, n: BlochVector, theta: number): BlochVector {
    const cos = Math.cos(theta), sin = Math.sin(theta);
    const dot = n.x * v.x + n.y * v.y + n.z * v.z;
    const cx = n.y * v.z - n.z * v.y;
    const cy = n.z * v.x - n.x * v.z;
    const cz = n.x * v.y - n.y * v.x;
    const k = dot * (1 - cos);
    return {
        x: v.x * cos + cx * sin + n.x * k,
        y: v.y * cos + cy * sin + n.y * k,
        z: v.z * cos + cz * sin + n.z * k,
    };
}

/* ---------- [TRAIL] public API ---------- */

/**
 * One polyline per gate: arcs[i] runs from the state before gate i to the state after it.
 * Markers can be drawn at arcs[i][0] and at the last point of the final arc.
 */
export function buildTrail(initial: BlochVector, gates: readonly CircuitGate[]): BlochVector[][] {
    const arcs: BlochVector[][] = [];
    let start: BlochVector = { x: initial.x, y: initial.y, z: initial.z };

    for (const gate of gates) {
        const { axis, angle } = gateToRotation(gate.matrix);
        const steps = Math.max(2, Math.ceil(Math.abs(angle) / (Math.PI / 32)));
        const arc: BlochVector[] = [];
        for (let k = 0; k <= steps; k++) arc.push(rotate(start, axis, (angle * k) / steps));
        arcs.push(arc);
        start = arc[arc.length - 1];
    }
    return arcs;
}