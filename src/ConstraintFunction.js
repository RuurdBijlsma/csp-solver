export default class ConstraintFunction {
    static greater(a, b) {
        return a < b;
    }

    static lesser(a, b) {
        return a > b;
    }

    static greaterOrEqual(a, b) {
        return a <= b;
    }

    static lesserOrEqual(a, b) {
        return a >= b;
    }

    static notEquals(a, b) {
        return a !== b;
    }

    static equals(a, b) {
        return a === b;
    }

    static consecutive(a, b) {
        return a + 1 === b || a - 1 === b;
    }

    static nonConsecutive(a, b) {
        return a + 1 !== b && a - 1 !== b;
    }
}