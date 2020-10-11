# Constraint Satisfaction Problem Solver

## Features
* Maintained arc consistency
* N-ary constraints support
* Get all, or a given amount of solutions


## Usage example
### Install
`npm i --save ruurdbijlsma/csp-solver`

### Usage
There are two ways to use this, either using the CSP class as shown below, or creating Constraints yourself, which gives more freedom in what you can use as variable names.
1. Define variables each having a domain of numbers
2. Define constraints
3. Call `csp.solve({constraints, variables})`
```javascript
// X + Y = Z
// X < Y

import {CSP, solve} from "csp-solver";
let csp = new CSP(
    {
        x: [1,2],
        y: [3,4],
        z: [5,6],
    },
    [
        // Uses parameter names to figure out which variables it applies to
        (x, y) => x < y,    
        (x, y, z) => x + y === z,   
    ],
    {
        solutions: 'all',
    }
)
const result = solve(csp)
console.log(result)
// Result:
// x: 2
// y: 3
// z: 5
```

## Demos
Sudoku and a cryptarithmetic puzzle csp are implemented in a separate repository. 
https://github.com/RuurdBijlsma/constraint-solver-demos
