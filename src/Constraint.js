import ConstraintFunction from "./ConstraintFunction";

export default class Constraint {
    constructor(variables, satisfactionFunction) {
        this.variables = variables;
        this.isSatisfied = satisfactionFunction;

        this.variablesMap = new Map();
        for (let v of variables)
            this.variablesMap.set(v, true);
    }

    hasVariable(key) {
        return this.variablesMap.has(key);
    }

    static series(variables, satisfactionFunction, reverseSatisfactionFunction) {
        let constraints = [];
        for (let i = 0; i < variables.length - 1; i++) {
            let variable = variables[i];
            let nextVariable = variables[i + 1];
            constraints.push(
                new Constraint([variable, nextVariable], satisfactionFunction),
                new Constraint([nextVariable, variable], reverseSatisfactionFunction),
            );
        }
        return constraints;
    }

    static all(variables, satisfactionFunction) {
        let constraints = [];
        for (let variable of variables)
            for (let otherVariable of variables.filter(v => v !== variable))
                constraints.push(new Constraint([variable, otherVariable], satisfactionFunction));

        return constraints;
    }

    static increasing(variables) {
        return Constraint.series(variables, ConstraintFunction.greater, ConstraintFunction.lesser);
    }

    static decreasing(variables) {
        return Constraint.series(variables, ConstraintFunction.lesser, ConstraintFunction.greater);
    }

    static allEqual(variables) {
        return Constraint.all(variables, ConstraintFunction.equals)
    }

    static allDifferent(variables) {
        return Constraint.all(variables, ConstraintFunction.notEquals)
    }
}