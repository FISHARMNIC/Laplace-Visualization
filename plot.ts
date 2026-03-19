import { laplace, magnitude } from "./index.js";
import { aaaFit, type Complex } from "./aaa.js";
import { func } from "./func.js";
import { getRange, getStep, set_found, set_status } from "./dom.js";

// Bounds
let sigmas: number[]
let omegas: number[]
function generate_bounds() {

    sigmas = [];
    omegas = [];

    const minmax: number = getRange();
    const step: number = getStep();

    for (let i = -minmax; i < minmax; i += step) {
        sigmas.push(i);
        omegas.push(i);
    }
}

// Used for the poles display.
const SMOOTHNESS = 0.1;
const DIVISOR = 100;

const MODE_TEST = false;


let poles: Complex[] = [];  // List of all found poles
let z: number[][];          // z points (poles)
let mapped: string[];       // List of poles mapped to the Re +/- Imi format

render();


export function calculate() {

    generate_bounds();

    console.log('rendering function:', func);


    // Sample along a vertical line safely inside the ROC
    const epsilon = 0.1;
    const trainOmegas = Array.from({ length: 300 }, (_, i) => -15 + i * 0.1);

    const trainZ: Complex[] = trainOmegas.map(w => ({ re: epsilon, im: w }));
    const trainF: Complex[] = trainZ.map(s => laplace(s, func));

    function find_poles(): void {

        poles = [];

        // 2. Fit rational approximant
        const approx = aaaFit(trainZ, trainF);

        const SENS = 10000000;
        const CHECK = 100 / SENS;

        // console.log(CHECK)

        omegas.forEach(omega =>
            sigmas.forEach(sigma => {
                const n: Complex = { re: sigma, im: omega }
                const divided = magnitude(approx(n)) / SENS;
                // console.log(divided > CHECK)
                if (divided > CHECK) {
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

    if (MODE_TEST) {
        const approx = aaaFit(trainZ, trainF);

        z = omegas.map(omega =>
            sigmas.map(sigma => {
                const n: Complex = { re: sigma, im: omega }
                const divided = magnitude(approx(n)) / 10000000;
                return divided
            }
            )
        );
    }
    else {
        find_poles()

        z = omegas.map(omega =>
            sigmas.map(sigma =>
                poles_distance({ re: sigma, im: omega })
            )
        );
    }

    mapped = poles.map(format_point);

    set_found(mapped);

}

export async function render() {

    set_status(false);
    setTimeout(() => {
        calculate();
        create_plot();
        set_status(true);
    }, 0);

}

function format_point(n: Complex): string {
    const re = parseFloat(n.re.toFixed(3));
    const im = parseFloat(n.im.toFixed(3));

    if (re == 0 && im == 0) {
        return `0`;
    }
    else if (re == 0) {
        return im == 1 ? `i` : (im == -1 ? `-i` : `${im}i`);;
    }
    else if (im == 0) {
        return `${re}`;
    }
    else {
        const sign = im > 0 ? '+' : '-';
        return `${re} ${sign} ${Math.abs(im)}i`
    }
}

function create_plot() {
    // @ts-ignore
    Plotly.newPlot('chart',
        [
            {
                type: 'surface',
                x: sigmas,
                y: omegas,
                z: z,
                colorscale: 'Portland',
                showlegend: false,
                showscale: false,

            },
            {
                type: 'scatter3d',
                mode: 'text',
                x: poles.map(p => p.re),
                y: poles.map(p => p.im),
                z: poles.map(() => DIVISOR / SMOOTHNESS),
                text: mapped,
                textfont: {
                    color: 'purple',
                    size: 14,
                },
                name: 'Poles',
                showscale: false,
            }
        ],
        {
            title: { text: 'S Domain' },
            autosize: true,
            showlegend: false,

            // width: 900, 
            // height: 800,

            scene: {
                xaxis: {
                    title: {
                        text: 'Real (σ)'
                    }
                },
                yaxis: {
                    title: {
                        text: 'Imaginary (ω)'
                    }
                },
                zaxis: {
                    title: {
                        text: 'Pole'
                    },
                    showticklabels: false,

                }
            },
        },
        { responsive: true }

    );

}