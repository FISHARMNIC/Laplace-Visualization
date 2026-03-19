export function getRange(): number {
    return parseInt((document.getElementById('range')! as HTMLInputElement).value);
}

export function getStep(): number {
    return parseInt((document.getElementById('prec')! as HTMLInputElement).value) / 20;;
}

export function set_status(ready: boolean): void {
    (document.getElementById('status')! as HTMLPreElement).hidden = ready;
}

export function set_found(mapped: string[]): void {
    document.getElementById('answer')!.innerText = 'Poles found at: ' + mapped.join(", ")
}