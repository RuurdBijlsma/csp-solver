import * as solve from "./solve";

export default function enforceConsistency({variables, constraints}) {
    let csp = solve.getCSP({variables, constraints});
    let assigned = {};
    let unassigned = {...variables};
    return solve.enforceConsistency(assigned, unassigned, csp);
}