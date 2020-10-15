import {performance} from "perf_hooks";

export default function solve({
                                  variables,
                                  constraints,
                                  solutions = 1,
                                  mrv = true,
                                  degree = false,
                                  lcv = false,
                              }) {
    let startTime = performance.now();
    if (solutions === 'all')
        solutions = Infinity;
    let csp = {
        constraints,
        steps: [],
        solutions: [],
        solutionCount: solutions,
        mrv,
        degree,
        lcv,
        binary: true,
    }

    // Find amount of variables connected to each variable for use in degree heuristic
    if (csp.degree) {
        csp.variablesInfo = {};
        for (let varKey in variables)
            csp.variablesInfo[varKey] = {
                connectedVariables: new Set(),
            }
        for (let constraint of constraints)
            for (let varKey of constraint.variables) {
                constraint.variables
                    .filter(v => v !== varKey)
                    .forEach(v => csp.variablesInfo[varKey].connectedVariables.add(v))
            }
        for (let varKey in csp.variablesInfo)
            csp.variablesInfo[varKey].connectedVariables = Array.from(csp.variablesInfo[varKey].connectedVariables);
    }

    // Determine if entire CSP only uses binary constraints
    for (let constraint of constraints)
        if (constraint.variables.length > 2) {
            csp.binary = false;
            break;
        }

    backtrack({}, variables, csp);

    let result = {
        solutions: csp.solutions,
        time: performance.now() - startTime,
        steps: csp.steps,
    };

    console.log(result);
    return result;
}

function backtrack(_assigned, unassigned, csp) {
    // Backtracking search.

    // Copying assigned in necessary because we modify it. Without copying
    // the object over, modifying assigned would also change values for old
    // assigned objects (which are used in callbacks).
    const assigned = {..._assigned};

    if (finished(unassigned)) {
        csp.solutions.push(assignedToResult(assigned));
        return true;
    }

    const nextKey = selectVariableKey(unassigned, csp),
        values = orderValues(nextKey, assigned, unassigned, csp);
    delete unassigned[nextKey];

    for (let value of values) {
        assigned[nextKey] = [value]; // Assign a value to a variable.

        const consistent = enforceConsistency(assigned, unassigned, csp);
        if (consistent === false)
            continue;

        const newUnassigned = {},
            newAssigned = {};
        for (let key in consistent) {
            if (assigned[key])
                newAssigned[key] = [...assigned[key]];
            else
                newUnassigned[key] = [...consistent[key]];
        }

        csp.steps.push({assigned: newAssigned, unassigned: newUnassigned, csp});

        const result = backtrack(newAssigned, newUnassigned, csp);
        if (result !== false && csp.solutions.length >= csp.solutionCount)
            return result;
    }

    return false;
}

function finished(unassigned) {
    // Checks if there are no more variables to assign.
    return Object.keys(unassigned).length === 0;
}

function partialAssignment(assigned, unassigned) {
    // Combine unassigned and assigned for use in enforceConsistency.
    const partial = {};
    for (let key in unassigned)
        partial[key] = [...unassigned[key]];
    for (let key in assigned)
        partial[key] = [...assigned[key]];
    return partial;
}

function enforceConsistency(assigned, unassigned, csp) {
    if (!csp.binary)
        return generalizedConsistency(assigned, unassigned, csp.constraints);
    // Enforces arc consistency by removing inconsistent values from
    // every binary constraint's tail node.

    const removeInconsistentValues = (head, tail, constraint, variables) => {
        // Removes inconsistent values from the tail node. A value is
        // inconsistent when if the `tail` is assigned that value, there are
        // no values in `head`'s domain that satisfies the constraint.
        const headValues = variables[head],
            tailValues = variables[tail];
        const validTailValues = tailValues.filter(t => headValues.some(h => constraint(h, t)));
        const removed = tailValues.length !== validTailValues.length;
        variables[tail] = validTailValues;
        return removed;
    };


    let binaryConstraints = csp.constraints.filter(c => c.variables.length === 2);
    // Returns all the constraints where `node` is the head node.
    const incomingConstraints = node => binaryConstraints.filter(c => c.variables[0] === node);

    let variables = partialAssignment(assigned, unassigned);
    let queue = [];

    for (let constraint of csp.constraints) {
        // Handle all unary constraints here
        if (constraint.variables.length === 1) {
            let varKey = constraint.variables[0];
            variables[varKey] = variables[varKey].filter(v => constraint.isSatisfied(v));
            if (variables[varKey].length === 0)
                return false;
        } else {
            queue.push(constraint);
        }
    }

    while (queue.length) {
        const c = queue.shift(),
            head = c.variables[0],
            tail = c.variables[1];
        if (removeInconsistentValues(head, tail, c.isSatisfied, variables)) {
            if (variables[tail].length === 0)
                return false;
            // If the domain of the tail has changed, incoming constraints
            // to the tail must be rechecked.
            queue = queue.concat(incomingConstraints(tail));
        }
    }
    return variables;
}

// Enforce consistency with support for >2 arity constraints
function generalizedConsistency(assigned, unassigned, constraints) {
    // Create copy of all variables
    let variables = partialAssignment(assigned, unassigned);

    // Create arcs
    let arcs = [];
    let visitedArcs = [];
    //handle unary constraints here
    for (let constraint of constraints) {
        if (constraint.variables.length === 1) {
            let varKey = constraint.variables[0];
            variables[varKey] = variables[varKey].filter(v => constraint.isSatisfied(v));
            if (variables[varKey].length === 0)
                return false;
        } else {
            for (let variableKey of constraint.variables)
                arcs.push([variableKey, constraint]);
        }
    }

    // Function to remove inconsistent values from an arc
    const removeInconsistentValues = ([vKey, constraint], variables) => {
        if (constraint.variables.length === 2) { // Binary constraints (most common)

            let varIndex = constraint.variables.indexOf(vKey);
            let otherVariableKey = constraint.variables[1 - varIndex];
            const otherValues = variables[otherVariableKey],
                varValues = variables[vKey];
            let validValues;
            if (varIndex === 0)
                validValues = varValues.filter(t => otherValues.some(h => constraint.isSatisfied(t, h)));
            else
                validValues = varValues.filter(t => otherValues.some(h => constraint.isSatisfied(h, t)));

            const domainChanged = varValues.length !== validValues.length;
            variables[vKey] = validValues;

            return domainChanged;
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
        return domainChanged;
    }

    while (arcs.length > 0) {
        let arc = arcs.pop();
        visitedArcs.push(arc);

        if (removeInconsistentValues(arc, variables)) {
            if (variables[arc[0]].length === 0)
                return false;

            // If the domain of this arc has changed
            // Add any visitedArcs back that should be revisited due to this change
            for (let j = visitedArcs.length - 1; j >= 0; j--) {
                let visitedArc = visitedArcs[j];
                let [visitedVar, visitedConstraint] = visitedArc;
                // revisit an arc if one of the variables of the constraint in that arc has been updated
                // Except current constraint arcs
                if (arc[1] !== visitedConstraint &&
                    arc[0] !== visitedVar &&
                    visitedConstraint.hasVariable(arc[0])
                ) {
                    visitedArcs.splice(j, 1);
                    arcs.push(visitedArc);
                }
            }
        }
    }

    return variables;
}

function orderValues(nextKey, assigned, unassigned, csp) {
    if (!csp.lcv)
        return unassigned[nextKey];
    // Orders the values of an unassigned variable according to the
    // Least Constraining Values heuristic. Perform arc consistency
    // on each possible value, and order variables according to the
    // how many values were eliminated from all the domains (fewest
    // eliminated in the front). This helps makes success more likely
    // by keeping future options open.

    const countValues = vars => {
        if (vars === false)
            return 0;
        let sum = 0;
        for (let key in vars)
            sum += vars[key].length;
        return sum;
    };

    const valuesEliminated = val => {
        assigned[nextKey] = [val];
        const newLength = countValues(enforceConsistency(assigned, unassigned, csp));
        delete assigned[nextKey];
        return newLength;
    };

    // Cache valuesEliminated to be used in sort.
    const cache = {},
        values = unassigned[nextKey];
    values.forEach(val => {
        cache[val] = valuesEliminated(val);
    });
    // Descending order based on the number of domain values remaining.
    values.sort((a, b) => cache[b] - cache[a]);
    return values;
}

// Returns cartesian product of n arrays, used when enforcing consistency on n-ary constraints
function cartesian(...a) {
    return a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
}

// Turn assigned map to more readable result object
function assignedToResult(assigned) {
    let result = {};
    for (let key in assigned)
        result[key] = [...assigned[key]][0];
    return result;
}

// Degree Heuristic
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

    return degreeHeuristic(minKeys, unassigned, csp);
}