import type { Complex } from "./aaa";

export type MathFn = (x: number) => number;

export function magnitude(c: Complex): number {
    return Math.sqrt(c.re ** 2 + c.im ** 2);
}

export function phase(c: Complex): number {
    return Math.atan2(c.im, c.re);
}

export function laplace(s: Complex, fn: MathFn): Complex {

    const upper = s.re > 0 ? Math.ceil(100 / s.re) : 100000;
    const dx = upper / 100000; //Math.min(upper / 10000, 1);

    let re = 0;
    let im = 0;

    // console.log(Math.round(s.re), Math.round(s.im), "precision:", dx.toFixed(3));

    /*
    Laplace using eulers formula becomes:

    Real: Int(0->Inf): f(t)e^(-Re*t)cos(Im*t) dt
    Imag: Int(0->Inf): -f(t)e^(-Re*t)sin(Im*t) dt

    */

    for (let x = 0; x <= upper; x += dx) {
        const fx = fn(x);

        // e^(-st)
        const exp_e = Math.exp(-s.re * x);
        const euler_re = exp_e * Math.cos(s.im * x);
        const euler_im = exp_e * Math.sin(s.im * x);

        re +=  fx * euler_re * dx;
        im += -fx * euler_im * dx;

        if (!isFinite(re) || !isFinite(im)) {
            return { re: Infinity, im: Infinity };
        }
    }

    // console.log(re, im)

    return { re, im };
}

export function laplace_magnitude(s: Complex, fn: MathFn): number {
    return magnitude(laplace(s, fn));
}