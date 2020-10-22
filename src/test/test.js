import {getSudoku, solveSudoku} from "./sudoku";
import enforceConsistency from "../enforceConsistency";

let result = solveSudoku();
console.log(result);

// let {variables, constraints} = getSudoku();
// let consistent = enforceConsistency({variables, constraints})
// console.log(variables, consistent);