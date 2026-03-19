import type { Complex } from "./aaa";
export type MathFn = (x: number) => number;
export declare function magnitude(c: Complex): number;
export declare function phase(c: Complex): number;
export declare function laplace(s: Complex, fn: MathFn): Complex;
export declare function laplace_magnitude(s: Complex, fn: MathFn): number;
//# sourceMappingURL=laplace.d.ts.map