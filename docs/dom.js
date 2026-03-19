export function getRange() {
    return parseInt(document.getElementById('range').value);
}
export function getStep() {
    return parseInt(document.getElementById('prec').value) / 20;
    ;
}
export function set_status(ready) {
    document.getElementById('status').hidden = ready;
}
export function set_found(mapped) {
    document.getElementById('answer').innerText = 'Poles found at: ' + mapped.join(", ");
}
//# sourceMappingURL=dom.js.map