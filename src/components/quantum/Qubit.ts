import Complex, {add, multiply} from "./Complex.ts";
import {
    amplitudesToCartesian, anglesToAmplitudes, anglesToCartesian,
    cartesianToAngles, type BlochCartesian, type BlochAngles,
} from "./Bloch.ts";
import type {Matrix2} from "./Gates.ts";

export class Vector implements BlochCartesian, BlochAngles {
    readonly theta: number;
    readonly phi: number;
    readonly x: number;
    readonly y: number;
    readonly z: number;

    constructor(theta: number = 0, phi: number = 0) {
        this.theta = theta;
        this.phi = phi;
        const {x, y, z} = anglesToCartesian(theta, phi);
        this.x = x; this.y = y; this.z = z;
    }
}

/** Immutable, always-normalized single-qubit state α|0> + β|1>. */
export default class Qubit {
    readonly alpha: Complex;
    readonly beta: Complex;

    /** Normalizes the input; throws if it is the zero vector or not finite. */
    constructor(alpha: Complex = Complex.ONE, beta: Complex = Complex.ZERO) {
        const norm = Math.sqrt(alpha.magnitudeSquared + beta.magnitudeSquared);
        if (!Number.isFinite(norm) || norm < 1e-12) {
            throw new RangeError("Qubit amplitudes must be finite and not both zero.");
        }
        this.alpha = new Complex(alpha.real / norm, alpha.imaginary / norm);
        this.beta = new Complex(beta.real / norm, beta.imaginary / norm);
    }

    static fromAmplitudes(alpha: Complex, beta: Complex): Qubit {
        return new Qubit(alpha, beta);
    }

    static fromAngles(theta: number, phi: number): Qubit {
        const [a, b] = anglesToAmplitudes(theta, phi);
        return new Qubit(a, b);
    }

    get m(): [Complex, Complex] {
        return [this.alpha, this.beta];
    }

    /** P(|0>), P(|1>) */
    get probabilities(): [number, number] {
        return [this.alpha.magnitudeSquared, this.beta.magnitudeSquared];
    }

    /** Bloch representation, always derived from the current amplitudes. */
    get v(): Vector {
        const {theta, phi} = cartesianToAngles(amplitudesToCartesian(this.alpha, this.beta));
        return new Vector(theta, phi);
    }

    /** Returns a NEW qubit; the original is untouched (React-friendly). */
    apply(gate: Matrix2): Qubit {
        return new Qubit(
            add(multiply(gate[0][0], this.alpha), multiply(gate[0][1], this.beta)),
            add(multiply(gate[1][0], this.alpha), multiply(gate[1][1], this.beta)),
        );
    }

    /** Projective Z-basis measurement. `rng` is injectable for tests. */
    measure(rng: () => number = Math.random): {outcome: 0 | 1; state: Qubit} {
        const outcome: 0 | 1 = rng() < this.probabilities[0] ? 0 : 1;
        return {outcome, state: outcome === 0 ? new Qubit(Complex.ONE, Complex.ZERO) : new Qubit(Complex.ZERO, Complex.ONE)};
    }
}