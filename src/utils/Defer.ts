export class Defer<T> {
    promise: Promise<T>;
    resolve!: (v: T) => void;
    reject!: (err: Error) => void;

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
