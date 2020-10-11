import Constraint from "./Constraint";

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;

function getParamNames(func) {
    const fnStr = func.toString().replace(STRIP_COMMENTS, '');
    let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null)
        result = [];
    return result;
}

export default class CSP {
    constructor(variables = {}, constraints = [], options = {}) {
        this.variables = variables;

        this.constraints = [];
        for (let satisfactionFunction of constraints) {
            let constraintVars = getParamNames(satisfactionFunction);
            this.constraints.push(new Constraint(constraintVars, satisfactionFunction))
        }

        this.solutions = [];
        this.steps = [];
        this.stepCount = 0;

        if (options.recordSteps !== undefined)
            this.recordSteps = options.recordSteps;
        if (options.solutions !== undefined)
            this.solutions = options.solutions;
        if (options.lcv !== undefined)
            this.lcv = options.lcv;
        if (options.mrv !== undefined)
            this.mrv = options.mrv;
    }

    copy() {
        let copy = JSON.parse(JSON.stringify(this));
        return new CSP(copy.variables, this.constraints, {...copy});
    }
}