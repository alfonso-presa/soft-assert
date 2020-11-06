import { AssertionError } from "assert";
import { format } from "util";

function formatAssertionError(err) {
    var msg;
    var err;
    var message;
    if (err.message && typeof err.message.toString === 'function') {
      message = err.message + '';
    } else if (typeof err.inspect === 'function') {
      message = err.inspect() + '';
    } else {
      message = '';
    }
    var stack = err.stack || message;
    var index = message ? stack.indexOf(message) : -1;

    if (index === -1) {
      msg = message;
    } else {
      index += message.length;
      msg = stack.slice(0, index);
      stack = stack.slice(index + 1);
    }

    if (err.uncaught) {
      msg = 'Uncaught ' + msg;
    }

    stack = stack.replace(/^/gm, '  ');
    return `${msg}\n${stack}\n`
}


export class SoftAssert {
    private captured: AssertionError[] = [];

    wrap(target: Function) {
        const isAsync = target.constructor.name === "AsyncFunction";
        const params = target.length;
        const self = this;
        const wrapperFn = isAsync ?
            async function () {
                try {
                    return await target.apply(this, arguments);
                } catch(e) {
                    if(e.constructor.name === "AssertionError") {
                        self.captured.push(e);
                    } else {
                        throw e;
                    }
                }
            }:
            function () {
                try {
                    return target.apply(this, arguments);
                } catch(e) {
                    if(e.constructor.name === "AssertionError") {
                        self.captured.push(e);
                    } else {
                        throw e;
                    }
                }
            };
        const binding = {[target.name]:wrapperFn}[target.name];
        Object.defineProperty(binding, "length", {
            value: params
        });        
        return binding;
    }

    soft(target: Function) {
        this.wrap(target)();
    }

    flush() {
        if(this.captured.length > 0) {
            const message = this.captured.map(formatAssertionError).join("\n");
            this.captured = [];
            throw new AssertionError({message});
            
        }
    }

}

export const softAssert = new SoftAssert();
export const wrap = softAssert.wrap.bind(softAssert);
export const soft = softAssert.soft.bind(softAssert);
export const flush = softAssert.flush.bind(softAssert);
