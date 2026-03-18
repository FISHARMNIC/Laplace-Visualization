// @ts-nocheck
const cadd = (a, b) => ({ re: a.re + b.re, im: a.im + b.im });
const csub = (a, b) => ({ re: a.re - b.re, im: a.im - b.im });
const cmul = (a, b) => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
});
const cdiv = (a, b) => {
    const d = b.re ** 2 + b.im ** 2;
    return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
const cabs = (a) => Math.sqrt(a.re ** 2 + a.im ** 2);
const cconj = (a) => ({ re: a.re, im: -a.im });
// Jacobi eigenvalue decomposition for real symmetric matrix
function jacobiEigen(A) {
    const n = A.length;
    const a = A.map(row => [...row]);
    const v = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
    for (let iter = 0; iter < 100 * n * n; iter++) {
        let maxVal = 0, p = 0, q = 1;
        for (let i = 0; i < n; i++)
            for (let j = i + 1; j < n; j++)
                if (Math.abs(a[i][j]) > maxVal) {
                    maxVal = Math.abs(a[i][j]);
                    p = i;
                    q = j;
                }
        if (maxVal < 1e-12)
            break;
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        const t = Math.sign(theta) / (Math.abs(theta) + Math.sqrt(1 + theta ** 2));
        const c = 1 / Math.sqrt(1 + t ** 2), s = t * c;
        const app = a[p][p], aqq = a[q][q], apq = a[p][q];
        a[p][p] = app - t * apq;
        a[q][q] = aqq + t * apq;
        a[p][q] = a[q][p] = 0;
        for (let i = 0; i < n; i++) {
            if (i !== p && i !== q) {
                const aip = a[i][p], aiq = a[i][q];
                a[i][p] = a[p][i] = c * aip - s * aiq;
                a[i][q] = a[q][i] = s * aip + c * aiq;
            }
            const vip = v[i][p], viq = v[i][q];
            v[i][p] = c * vip - s * viq;
            v[i][q] = s * vip + c * viq;
        }
    }
    return { values: a.map((_, i) => a[i][i]), vectors: v };
}
// Finds the right singular vector of complex matrix A corresponding to smallest singular value
function minSingularVector(A) {
    const m = A.length, n = A[0].length;
    // B = A^H * A  (n x n complex Hermitian)
    const B = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => {
        let sum = { re: 0, im: 0 };
        for (let k = 0; k < m; k++)
            sum = cadd(sum, cmul(cconj(A[k][i]), A[k][j]));
        return sum;
    }));
    // Convert to real 2n x 2n: [[Re(B), -Im(B)], [Im(B), Re(B)]]
    const R = Array.from({ length: 2 * n }, () => Array(2 * n).fill(0));
    for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
            R[i][j] = B[i][j].re;
            R[i][j + n] = -B[i][j].im;
            R[i + n][j] = B[i][j].im;
            R[i + n][j + n] = B[i][j].re;
        }
    const { values, vectors } = jacobiEigen(R);
    const minIdx = values.reduce((mi, v, i) => (v < values[mi] ? i : mi), 0);
    const vec = vectors.map(row => row[minIdx]);
    return Array.from({ length: n }, (_, i) => ({ re: vec[i], im: vec[i + n] }));
}
// AAA algorithm — fits a rational approximant to samples (Z, F)
export function aaaFit(Z, F, tol = 1e-10, mmax = 50) {
    const n = Z.length;
    const z = [], f = [];
    let w = [];
    const supportIdx = new Set();
    let remIdx = Array.from({ length: n }, (_, i) => i);
    // Initial residual
    let R = [...F];
    for (let m = 0; m < mmax; m++) {
        // Pick support point with largest residual
        let jmax = remIdx[0], maxErr = 0;
        for (const j of remIdx) {
            const err = cabs(R[j]);
            if (err > maxErr) {
                maxErr = err;
                jmax = j;
            }
        }
        if (maxErr < tol)
            break;
        supportIdx.add(jmax);
        z.push(Z[jmax]);
        f.push(F[jmax]);
        remIdx = remIdx.filter(j => !supportIdx.has(j));
        const sz = z.length;
        // Loewner matrix: A[i][j] = (F[i] - f[j]) / (Z[i] - z[j])
        const A = remIdx.map(i => Array.from({ length: sz }, (_, j) => cdiv(csub(F[i], f[j]), csub(Z[i], z[j]))));
        w = minSingularVector(A);
        // Update residual
        R = Array.from({ length: n }, (_, i) => {
            if (supportIdx.has(i))
                return { re: 0, im: 0 };
            let num = { re: 0, im: 0 }, den = { re: 0, im: 0 };
            for (let j = 0; j < sz; j++) {
                const d = csub(Z[i], z[j]);
                if (cabs(d) < 1e-14)
                    return csub(F[i], f[j]);
                const t = cdiv(w[j], d);
                num = cadd(num, cmul(t, f[j]));
                den = cadd(den, t);
            }
            return csub(F[i], cdiv(num, den));
        });
    }
    // Return barycentric evaluation function
    return (s) => {
        let num = { re: 0, im: 0 }, den = { re: 0, im: 0 };
        for (let j = 0; j < z.length; j++) {
            const d = csub(s, z[j]);
            if (cabs(d) < 1e-14)
                return f[j];
            const t = cdiv(w[j], d);
            num = cadd(num, cmul(t, f[j]));
            den = cadd(den, t);
        }
        return cdiv(num, den);
    };
}
//# sourceMappingURL=aaa.js.map