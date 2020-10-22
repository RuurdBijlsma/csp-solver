import {CSP, solve} from '../index';

export default function sendMoney() {
    //   S E N D
    //   M O R E
    // ========== +
    // M O N E Y


    let domain = [...Array(10)].map((_, i) => i);
    let csp = new CSP(
        {
            s: [...domain],
            e: [...domain],
            n: [...domain],
            d: [...domain],
            m: [...domain],
            o: [...domain],
            r: [...domain],
            y: [...domain],
            x1: [0, 1],
            x2: [0, 1],
            x3: [0, 1],
            x4: [0, 1],
        },
        [
            (d, e, y, x1) => d + e === y + 10 * x1,
            (x1, n, r, e, x2) => x1 + n + r === e + 10 * x2,
            (x2, e, o, n, x3) => x2 + e + o === n + 10 * x3,
            (x3, s, m, o, x4) => x3 + s + m === o + 10 * x4,
            (m, x4) => m === x4,
            s => s !== 0,
            m => m !== 0,
        ], {
            lcv: false,
            mrv: false,
            degree: false,
            recordSteps: true,
            solutions: 1,
        }
    )

    solve(csp);
}