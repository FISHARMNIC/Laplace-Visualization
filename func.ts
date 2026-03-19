import { render } from "./plot.js";

export let func = (x: number) => Math.sin(x) + Math.sin(2*x) + Math.exp(-x) * Math.sin(3*x);

// @ts-ignore
document.getElementById('user_function')!.value = func.toString();

document.getElementById('enter')!.onclick = () => {
    update_func();
    render();
}

function update_func()
{
    // @ts-ignore
    const str: string = document.getElementById('user_function')!.value;

    // yes.. unsafe
    func = eval(str);
}