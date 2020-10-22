import {Constraint, solve} from "../index";

export function getSudoku() {

    const SIZE = 9,
        BLOCK_SIZE = Math.sqrt(SIZE) | 0,
        domain = [...Array(SIZE)].map((_, i) => i + 1),
        variables = {};

// Create all variables
    for (let x = 1; x <= SIZE; x++)
        for (let y = 1; y <= SIZE; y++)
            variables[[x, y]] = [...domain];

    const getRow = function* (y) {
        for (let i = 1; i <= SIZE; i++)
            yield [i, y]
    }
    const getColumn = function* (x) {
        for (let i = 1; i <= SIZE; i++)
            yield [x, i]
    }
    const getBlock = function* (i) {
        --i;
        let blockOffset = {
            x: (i % BLOCK_SIZE) * BLOCK_SIZE + 1,
            y: (Math.floor(i / BLOCK_SIZE) * BLOCK_SIZE + 1)
        };
        for (let x = 0; x < BLOCK_SIZE; x++)
            for (let y = 0; y < BLOCK_SIZE; y++)
                yield [x + blockOffset.x, y + blockOffset.y];
    }
    let groups = [];
    for (let i = 1; i <= SIZE; i++)
        groups.push(
            [...getRow(i)],
            [...getColumn(i)],
            [...getBlock(i)],
        );
// console.log([...getBlock(1)]);
    let constraints = groups.flatMap(Constraint.allDifferent);

// 4x4
// const cells = [
//     [[1, 1], 1],
//     [[4, 2], 4],
//     [[3, 3], 2],
//     [[2, 4], 3],
// ];

// wilco's sudoku
    const cells = [
        [[1, 1], 6],
        [[9, 1], 5],
        [[2, 2], 4],
        [[6, 2], 3],
        [[1, 3], 2],
        [[2, 3], 3],
        [[1, 4], 3],
        [[4, 4], 1],
        [[7, 4], 5],
        [[8, 4], 4],
        [[4, 5], 3],
        [[5, 5], 2],
        [[7, 5], 8],
        [[8, 5], 7],
        [[6, 6], 8],
        [[8, 6], 1],
        [[3, 7], 1],
        [[6, 7], 6],
        [[7, 7], 2],
        [[2, 8], 6],
        [[3, 8], 3],
        [[9, 8], 7],
        [[1, 9], 9],
        [[4, 9], 4],
        [[5, 9], 5],
        [[7, 9], 6],
        [[9, 9], 1],
    ];

// CSP sudoku
// const cells = [
//     [[1, 1], 6],
//     [[1, 5], 2],
//     [[1, 6], 5],
//     [[1, 7], 8],
//     [[2, 5], 7],
//     [[3, 1], 8],
//     [[3, 3], 4],
//     [[3, 9], 9],
//     [[4, 1], 4],
//     [[4, 3], 7],
//     [[4, 4], 3],
//     [[4, 8], 2],
//     [[5, 2], 1],
//     [[5, 8], 9],
//     [[6, 2], 8],
//     [[6, 6], 4],
//     [[6, 7], 5],
//     [[6, 9], 7],
//     [[7, 1], 3],
//     [[7, 7], 7],
//     [[7, 9], 2],
//     [[8, 5], 9],
//     [[9, 3], 2],
//     [[9, 4], 5],
//     [[9, 5], 6],
//     [[9, 9], 1],
// ];
    for (let x = 1; x <= SIZE; x++) {
        for (let y = 1; y <= SIZE; y++) {
            const cellValue = cells.find(([[cx, cy], _]) => x === cx && y === cy)?.[1];
            // If filled in, 1-number domain. Otherwise, 9-number domain.
            if (cellValue !== undefined)
                variables[[x, y]] = [cellValue];
        }
    }

    constraints.push(...Constraint.consecutive([[1, 1], [1, 2], [1, 3]]));

    return {variables, constraints};
}

export function solveSudoku() {
    let {variables, constraints} = getSudoku();

    return solve({
        variables,
        constraints,
        solutions: 1,
        mrv: true,
        degree: false,
        lcv: false,
        recordSteps: true
    });
}