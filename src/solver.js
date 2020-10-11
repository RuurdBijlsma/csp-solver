//TODO
//Change enforce consistency function to AC-4 to improve performance
//TODO
//Support for multiple solutions? How do we do this?
//Don't return on success, save that solution to a global array (csp.solutions = [])
//try memoization (in enforceconsistency maybe?)

export default function solve(
    {
        variables,
        constraints,
        recordSteps = false,
        solutions = 1,
        mrv = true,
        degree = false,
        lcv = false,
    }
) {
    let startTime = performance.now();
    if (solutions === 'all')
        solutions = Infinity;
    let csp = {
        constraints,
        solutions: [],
        steps: [],
        stepCount: 0,
        recordSteps,
        solutionCount: solutions,
        mrv,
        degree,
        lcv,
        level: 0,
    }

    if (csp.degree) {
        csp.variablesInfo = {};
        for (let varKey in variables) {
            csp.variablesInfo[varKey] = {
                connectedVariables: new Set(),
            }
        }
        for (let constraint of constraints) {
            for (let varKey of constraint.variables) {
                constraint.variables
                    .filter(v => v !== varKey)
                    .forEach(v => csp.variablesInfo[varKey].connectedVariables.add(v))
            }
        }
        for (let varKey in csp.variablesInfo) {
            csp.variablesInfo[varKey].connectedVariables = Array.from(csp.variablesInfo[varKey].connectedVariables);
        }
    }

    backtrack(csp, {}, variables);

    let backtrackDone = performance.now();
    let result = {
        solutions: csp.solutions,
        stepCount: csp.stepCount,
        time: backtrackDone - startTime
    };
    if (csp.recordSteps)
        result.steps = csp.steps;

    console.log(result);
    return result;
}

// Backtracking search.
const backtrack = (csp, _assigned, unassigned) => {
    const assigned = {..._assigned};

    // Base case.
    if (Object.keys(unassigned).length === 0) {
        csp.solutions.push(assignedToResult(assigned));
        csp.level--;
        return true;
    }

    const nextKey = selectVariableKey(unassigned, csp);
    const values = orderValues(nextKey, assigned, unassigned, csp);
    delete unassigned[nextKey];

    for (let value of values) {
        assigned[nextKey] = [value]; // Assign a value to a variable.
        const consistent = enforceConsistency(assigned, unassigned, csp.constraints);
        if (consistent === 'inconsistent')
            continue;
        const newUnassigned = {},
            newAssigned = {};
        for (let key in consistent) {
            if (assigned[key])
                newAssigned[key] = [...assigned[key]];
            else
                newUnassigned[key] = [...consistent[key]];
        }

        csp.stepCount++;
        console.log('Step:', csp.stepCount, 'Backtrack:', csp.level);
        if (csp.recordSteps)
            csp.steps.push({assigned: newAssigned, unassigned: newUnassigned, csp});

        csp.level++;
        const result = backtrack(csp, newAssigned, newUnassigned);
        if (result !== false) {
            if (csp.solutions.length >= csp.solutionCount) {
                csp.level--;
                return true;
            }
        }
    }

    csp.level--;
    return false;
}

const enforceConsistency = (assigned, unassigned, constraints) => {
    // Create copy of all variables
    let variables = partialAssignment(assigned, unassigned);

    // Create arcs
    let arcs = [];
    for (let constraint of constraints)
        for (let variableKey of constraint.variables)
            arcs.push([variableKey, constraint]);
    let visitedArcs = [];

    // Function to remove inconsistent values from an arc
    const removeInconsistentValues = ([vKey, constraint], variables) => {
        if (constraint.variables.length === 1) { // Unary constraints

            const tailValues = variables[vKey];
            const validTailValues = variables[vKey].filter(v => constraint.isSatisfied(v));
            const domainChanged = tailValues.length !== validTailValues.length;
            variables[vKey] = validTailValues;

            // TODO this is weird but fast
            return domainChanged;
            return variables[vKey].length === 0 ? 'inconsistent' : domainChanged ? 'change' : 'no-change';

        } else if (constraint.variables.length === 2) { // Binary constraints (most common)

            const otherValues = variables[constraint.variables.filter(v => v !== vKey)[0]],
                varValues = variables[vKey];
            const validTailValues = varValues.filter(t => otherValues.some(h => constraint.isSatisfied(h, t)));
            const domainChanged = varValues.length !== validTailValues.length;
            variables[vKey] = validTailValues;

            // TODO this is weird but fast
            return domainChanged;
            return variables[vKey].length === 0 ? 'inconsistent' : domainChanged ? 'change' : 'no-change';
        }
        // N-ary constraints

        let varIndex = constraint.variables.indexOf(vKey);
        let otherVariables = constraint.variables.filter(v => v !== vKey);
        let otherDomains = otherVariables.map(k => variables[k]);

        let combinations = cartesian(...otherDomains);
        // console.log("Combinations for ", vKey, combinations, 'others', otherVariables, otherDomains);

        let domainChanged = false;
        for (let x of variables[vKey]) {
            // console.log("Testing", vKey, '=', x);
            let anySatisfied = false;

            for (let args of combinations) {
                let satisfied = constraint.isSatisfied(...args.slice(0, varIndex), x, ...args.slice(varIndex));
                // console.log("Satisfied? ", _args, satisfied);
                if (satisfied) {
                    anySatisfied = true;
                    break;
                }
            }

            // If no possible combination of other variable values in this constraint satisfies the constraint
            // Then `x` can't be in domain for the variable
            if (!anySatisfied) {
                // console.log(vKey, '=', x, 'Doesnt work, removing from domain');
                variables[vKey] = variables[vKey].filter(val => val !== x);
                domainChanged = true;
                if (variables[vKey].length === 0)
                    break;
            }
        }

        // if (domainChanged)
        //     console.log("Updated domain for", vKey, '->', variables[vKey]);
        return variables[vKey].length === 0 ? 'inconsistent' : domainChanged ? 'change' : 'no-change';
    }

    while (arcs.length > 0) {
        let arc = arcs.pop();
        visitedArcs.push(arc);

        let domainChanged = removeInconsistentValues(arc, variables);
        if (domainChanged === 'inconsistent')
            return 'inconsistent';
        if (domainChanged === 'change') {
            // If the domain of this arc has changed
            // Add any visitedArcs back that should be revisited due to this change
            for (let j = visitedArcs.length - 1; j >= 0; j--) {
                let visitedArc = visitedArcs[j];
                let [, visitedConstraint] = visitedArc;
                // revisit an arc if one of the variables of the constraint in that arc has been updated
                // Except current constraint arcs
                if (visitedConstraint !== arc[1] && arc[1].variables.includes(arc[0])) {
                    visitedArcs.splice(j, 1);
                    arcs.push(visitedArc);
                }
            }
        }
    }

    return variables;
}

const partialAssignment = (assigned, unassigned) => {
    // console.log('partial', assigned, unassigned)
    // Combine unassigned and assigned for use in enforceConsistency.
    const partial = {};
    for (let key in unassigned)
        partial[key] = [...unassigned[key]];

    for (let key in assigned)
        partial[key] = [...assigned[key]];

    return partial;
}

const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

const assignedToResult = assigned => {
    let result = {};
    for (let key in assigned)
        result[key] = [...assigned[key]][0];
    return result;
}


// LCV: Least Constraining Values
const orderValues = (nextKey, assigned, unassigned, csp) => {
    if (!csp.lcv)
        return unassigned[nextKey];

    // Orders the values of an unassigned variable according to the
    // Least Constraining Values heuristic. Perform arc consistency
    // on each possible value, and order variables according to the
    // how many values were eliminated from all the domains (fewest
    // eliminated in the front). This helps makes success more likely
    // by keeping future options open.

    const countValues = vars => {
        if (vars === 'inconsistent')
            return 0;
        let sum = 0;
        for (let key in vars)
            sum += vars[key].length;
        return sum;
    };

    const valuesEliminated = val => {
        assigned[nextKey] = [val];
        const newLength = countValues(enforceConsistency(assigned, unassigned, csp.constraints));
        delete assigned[nextKey];
        return newLength;
    };

    // Cache valuesEliminated to be used in sort.
    const cache = {},
        values = unassigned[nextKey];
    values.forEach(val => cache[val] = valuesEliminated(val))
    // Descending order based on the number of domain values remaining.
    values.sort((a, b) => cache[b] - cache[a]);
    return values;
}

const degreeHeuristic = (keys, unassigned, csp) => {
    if (!csp.degree)
        return keys[keys.length - 1];
    let bestKey = null;
    let highestDegree = -1;
    for (let key of keys) {
        let connectedCount = csp.variablesInfo[key].connectedVariables.length;
        if (connectedCount > highestDegree) {
            highestDegree = connectedCount;
            bestKey = key;
        }
    }
    console.log(bestKey)
    return bestKey;
}

// MRV: Minimum Remaining Values
const selectVariableKey = (unassigned, csp) => {
    if (!csp.mrv)
        return Object.keys(unassigned)[0];

    // Picks the next variable to assign according to the Minimum
    // Remaining Values heuristic. Pick the variable with the fewest
    // values remaining in its domain. This helps identify domain
    // failures earlier.
    let minKeys = [],
        minLen = Infinity;
    for (let key in unassigned) {
        const len = unassigned[key].length;
        if (len < minLen) {
            minKeys = [key];
            minLen = len;
        } else if (len === minLen) {
            minKeys.push(key);
        }
    }
    // console.log(minKeys);
    return degreeHeuristic(minKeys, unassigned, csp);
}