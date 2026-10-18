/** Immutable complex number. */
export default class Complex {
    readonly real: number;
    readonly imaginary: number;

    static readonly ZERO = new Complex(0, 0);
    static readonly ONE = new Complex(1, 0);
    static readonly I = new Complex(0, 1);

    constructor(real: number = 0, imaginary: number = 0) {
        this.real = real;
        this.imaginary = imaginary;
    }

    /** |z| — computed on demand so it can never go stale. */
    get magnitude(): number {
        return Math.hypot(this.real, this.imaginary);
    }

    /** |z|² — computed directly (no sqrt, no rounding error from squaring a root). */
    get magnitudeSquared(): number {
        return this.real * this.real + this.imaginary * this.imaginary;
    }

    /** arg(z) in (-π, π]. */
    get phase(): number {
        return Math.atan2(this.imaginary, this.real);
    }

    static fromPolar(r: number, theta: number): Complex {
        return new Complex(r * Math.cos(theta), r * Math.sin(theta));
    }
}

export function add(a: Complex, b: Complex): Complex {
    return new Complex(a.real + b.real, a.imaginary + b.imaginary);
}

export function subtract(a: Complex, b: Complex): Complex {
    return new Complex(a.real - b.real, a.imaginary - b.imaginary);
}

export function multiply(a: Complex, b: Complex): Complex {
    return new Complex(
        a.real * b.real - a.imaginary * b.imaginary,
        a.real * b.imaginary + a.imaginary * b.real
    );
}

export function scale(a: Complex, k: number): Complex {
    return new Complex(a.real * k, a.imaginary * k);
}

export function conjugate(z: Complex): Complex {
    return new Complex(z.real, -z.imaginary);
}

export function magnitude(z: Complex): number {
    return z.magnitude;
}