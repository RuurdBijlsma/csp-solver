import CSP from '../index';

export default function basicCSP() {
    // let v = {
    //     a: [1, 2, 3, 4],
    //     b: [1, 2, 3, 4],
    //     c: [1, 2, 3, 4, 5, 6],
    // };
    // let c = [
    //     new Constr(['a', 'b'], (a, b) => a < b),
    //     new Constr(['b', 'c'], (b, c) => b < c),
    //     new Constr(['a'], (a) => a > 1),
    //     new Constr(['a', 'b', 'c'], (a, b, c) => a + b === c),
    // ];

    let csp = new CSP({
        a: [1, 2, 3, 4],
        b: [1, 2, 3, 4],
        c: [1, 2, 3, 4, 5, 6],
    }, [
        (a, b) => a < b,
        a => a > 1,
        // c => c === 6,
        (a, b, c) => a + b === c,
    ], {allSolutions: true});

    solve(csp);
}