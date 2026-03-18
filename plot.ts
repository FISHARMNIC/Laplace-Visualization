import { laplace, magnitude } from "./index.js";
import { aaaFit, type Complex } from "./aaa.js";
import { func } from "./func.js";

const sigmas: number[] = [];
const omegas: number[] = [];

for (let i = -3; i < 3; i += 0.05) {
    sigmas.push(i);
    omegas.push(i);
}

render();

export function render() {

    console.log('rendering function:', func);

    const SMOOTHNESS = 0.1;
    const DIVISOR = 100;



    // Sample along a vertical line safely inside the ROC
    const epsilon = 0.1;
    const trainOmegas = Array.from({ length: 300 }, (_, i) => -15 + i * 0.1);
    
    const trainZ: Complex[] = trainOmegas.map(w => ({ re: epsilon, im: w }));
    const trainF: Complex[] = trainZ.map(s => laplace(s, func));

    const poles: Complex[] = [];
    function find_poles(): void {

        // 2. Fit rational approximant
        const approx = aaaFit(trainZ, trainF);

        omegas.forEach(omega =>
            sigmas.forEach(sigma => {
                const n: Complex = { re: sigma, im: omega }
                const divided = magnitude(approx(n)) / 10000000;
                if (divided > 10) {
                    poles.push(n);
                }
            }
            )
        );

    }

    function poles_distance(n: Complex): number {

        function distance(a: Complex, b: Complex): number {
            return Math.sqrt((a.re - b.re) ** 2 + (a.im - b.im) ** 2);
        }

        let nearest_pole_distance = 10000;

        for (const pole of poles) {
            const new_distance = distance(n, pole);
            if (new_distance < nearest_pole_distance) {
                nearest_pole_distance = new_distance;
                if (nearest_pole_distance == 0) {
                    break;
                }
            }
        }

        return DIVISOR / (nearest_pole_distance + SMOOTHNESS);
    }

    // valuate anywhere — including LHP

    find_poles()

    const z = omegas.map(omega =>
        sigmas.map(sigma =>
            poles_distance({ re: sigma, im: omega })
        )
    );

    document.getElementById('answer')!.innerText = 'Poles found at: ' + poles.map((n: Complex): string => {
        return `⟨${n.re.toFixed(3)}, ${n.im.toFixed(3)}⟩`
    }).join(", ")


    // @ts-ignore
    Plotly.newPlot('chart', [
    {
        type: 'surface',
        x: sigmas,
        y: omegas,
        z: z,
        colorscale: 'Portland'
    },
    {
        type: 'scatter3d',
        mode: 'markers',
        x: poles.map(p => p.re),
        y: poles.map(p => p.im),
        z: poles.map(() => DIVISOR / SMOOTHNESS),
        marker: {
            size: 8,
            color: 'purple',
            symbol: 'x',
        },
        name: 'Poles'
    }
], {
    title: { text: 'S Domain' },
    // autosize: false, 
    // width: 500, 
    height: 800,
});

}