import { render } from "./plot.js";

export let func = (x: number) => Math.exp(-x) * Math.sin(x);

// @ts-ignore
document.getElementById('user_function')!.value = func.toString();

document.getElementById('enter')!.onclick = () => {
    update_func();
    render();
}

function update_func()
{
    // @ts-ignore
    func = eval(document.getElementById('user_function')!.value);
}