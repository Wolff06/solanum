import Complex from "./Complex.ts";

const EPSILON = 1e-12;

export interface BlochCartesian {
    x: number;
    y: number;
    z: number;
}

export interface BlochAngles {
    theta: number; // polar angle, [0, π]
    phi: number;   // azimuth, [0, 2π)
}

/**
 * Bloch vector (x, y, z) from amplitudes of |ψ> = α|0> + β|1>:
 *   x = 2 Re(α* β),  y = 2 Im(α* β),  z = |α|² − |β|²
 * Assumes a normalized state. Independent of global phase.
 */
export function amplitudesToCartesian(alpha: Complex, beta: Complex): BlochCartesian {
    return {
        x: 2 * (alpha.real * beta.real + alpha.imaginary * beta.imaginary),
        y: 2 * (alpha.real * beta.imaginary - alpha.imaginary * beta.real),
        z: alpha.magnitudeSquared - beta.magnitudeSquared,
    };
}

export function cartesianToAngles({x, y, z}: BlochCartesian): BlochAngles {
    const theta = Math.acos(clamp(z, -1, 1)); // clamp: float error can push |z| slightly above 1
    // At the poles the azimuth is undefined; pick 0 so it doesn't jitter.
    const phi = Math.hypot(x, y) < EPSILON ? 0 : mod(Math.atan2(y, x), 2 * Math.PI);
    return {theta, phi};
}

export function amplitudesToAngles(alpha: Complex, beta: Complex): BlochAngles {
    return cartesianToAngles(amplitudesToCartesian(alpha, beta));
}

export function anglesToCartesian(theta: number, phi: number): BlochCartesian {
    return {
        x: Math.sin(theta) * Math.cos(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(theta),
    };
}

/** |ψ> = cos(θ/2)|0> + e^{iφ} sin(θ/2)|1>  (global phase fixed so α is real) */
export function anglesToAmplitudes(theta: number, phi: number): [Complex, Complex] {
    return [
        new Complex(Math.cos(theta / 2), 0),
        Complex.fromPolar(Math.sin(theta / 2), phi),
    ];
}

function clamp(n: number, lo: number, hi: number): number {
    return Math.min(hi, Math.max(lo, n));
}

function mod(n: number, d: number): number {
    const r = ((n % d) + d) % d;
    return r >= d ? 0 : r; // tiny negatives can round up to exactly d
}