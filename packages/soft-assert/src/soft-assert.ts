import { AssertionError } from "assert";

function formatAssertionError(err) {
    let msg;
    let message;
    if (err.message && typeof err.message.toString === 'function') {
      message = err.message + '';
    } else if (typeof err.inspect === 'function') {
      message = err.inspect() + '';
    } else {
      message = '';
    }
    let stack = err.stack || message;
    let index = message ? stack.indexOf(message) : -1;

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

    private capture(e) {
        if(e.constructor?.name?.indexOf("AssertionError") >= 0) {
            this.captured.push(e);
        } else {
            throw e;
        }
    }

    proxy<T>(target: T): T {
        if(!target) {
            return target;
        }
        switch(typeof(target)) {
            case "function":
                return this.proxyObj(this.proxyFn(target), target);
            case "object":
                return this.proxyObj(target);
            default:
                return target;
        }
    }    

    private proxyObj<T extends Object>(target: T, original: T = target): T {
        const self = this;
        if(!target) {
            return target;
        }
        return new Proxy(target, {
            get: function (_oTarget, sKey) {
                let value;
                try {
                    value = original[sKey];
                } catch(e) {
                    self.capture(e);
                    return undefined;
                }
                if((value as any)?.catch) {
                    value = (value as any)?.catch(e => self.capture(e));
                }
                return self.proxy(value);
            },
        }) as any as T;
    }

    private proxyFn<T extends Function>(target: T): T {
        const self = this;
        const wrapperFn = function () {
            try {
                const value = self.proxy(target.apply(this, arguments));
                if((value as any)?.catch) {
                    return (value as any)?.catch(e => this.capture(e));
                }
                return value;
            } catch(e) {
                self.capture(e);
            }
        };
        const binding = {[target.name]:wrapperFn}[target.name] as any as T; 
        binding.prototype = target.prototype;
        return binding;
    }

    wrap<T extends Function>(target: T): T {
        const isAsync = target.constructor.name === "AsyncFunction";
        const params = target.length;
        const self = this;
        const wrapperFn = isAsync ?
            async function () {
                try {
                    return await target.apply(this, arguments);
                } catch(e) {
                    self.capture(e);
                }
            }:
            function () {
                try {
                    return target.apply(this, arguments);
                } catch(e) {
                    self.capture(e);
                }
            };
        const binding = {[target.name]:wrapperFn}[target.name] as any as T;
        Object.defineProperty(binding, "length", {
            value: params
        });        
        return binding;
    }

    soft(target: Function) {
        this.wrap(target)();
    }

    flush() {
        if (this.captured.length > 1) {
            let message = `Total failures are: ${this.captured.length}\n\n${this.captured.map(formatAssertionError).join("\n\n")}`;
            this.captured = [];
            throw new AssertionError({ message });
        }
        else if (this.captured.length === 1) {
            const message = this.captured[0];
            this.captured = [];
            throw message;
        }
    }

}

export const softAssert = new SoftAssert();
export const wrap = softAssert.wrap.bind(softAssert) as <T>(target: T) => T;
export const proxy = softAssert.proxy.bind(softAssert) as <T>(target: T) => T;
export const soft = softAssert.soft.bind(softAssert);
export const flush = softAssert.flush.bind(softAssert);
