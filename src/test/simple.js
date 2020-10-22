import {CSP, solve} from "../";

export default function simple() {
    let csp = new CSP(
        {
            x: [1, 2],
            y: [3, 4],
            z: [5, 6],
        }, [
            // Uses parameter names to figure out which variables it applies to
            (x, y) => x < y,
            (x, y, z) => x + y === z,
        ], {
            lcv: true,
            mrv: false,
            recordSteps: true,
            solutions: 5,
        }
    )
    console.log(csp);
    solve(csp)
}