# `@alfonso-presa/soft-assert`

This library allows you to capture assertion errors that happen during your tests in order to delay the failure until the end of the tests (or when ever you want). This is useful in case you want to test several things and you want a full feedback of assertions failing instead of just knowing the last one.

## Instalation

```sh
npm i -D @alfonso-presa/soft-assert
```

## Usage

### Proxy assetion libraries

You may use soft-assert by proxying standar assertions libraries. This is tested to work with *chai*, *jest* and standard nodejs *assert* library, but will probably work with most of the other libraries.

#### Chai

```js
const { expect, assert } = require("chai");
const softExpect = proxy(expect);
const softAssert = proxy(assert);

describe("something", () => {
    it("should capture exceptions with wrapped chai expectation library", () => {
        softExpect("a").to.equal("b");
        softExpect(false).to.be.true;
        softExpect(() => {}).to.throw("Error");
        softExpect(() => {throw new Error();}).to.not.throw();
        try {
            //This is just to showcase, you should not try catch the result of flush.
            flush();
            //As there are assertion errors above this will not be reached
            expect(false).toBeTruthy();
        } catch(e) {
            expect(e.message).toContain("expected 'a' to equal 'b'");
            expect(e.message).toContain("expected false to be true");
            expect(e.message).toContain("to throw an error");
            expect(e.message).toContain("to not throw an error but 'Error' was thrown");
        }
    });

    it("should capture exceptions with wrapped chai assertion library", () => {
        const x = false;
        softAssert(x);
        softAssert.ok(x);
        softAssert.throws(() => {});
        try {
            //This is just to showcase, you should not try catch the result of flush.
            flush();
            //As there are assertion errors above this will not be reached
            expect(false).toBeTruthy();
        } catch(e) {
            expect(e.message).toContain("expected false to be truthy");
            expect(e.message).toContain("expected [Function] to throw an error");
        }
    }); 
});
   
```

#### Assert

```js
const assert = require("assert");

const softAssert /* needed for TS : typeof assert */ = proxy(assert);

describe("something", () => {
    it("should capture exceptions with wrapped assert assertion library", () => {
        const x = false;
        softAssert(x);
        softAssert.ok(x);
        softAssert.strict.ok(x);
        softAssert.throws(() => {});
        try {
            //This is just to showcase, you should not try catch the result of flush.
            flush();
            //As there are assertion errors above this will not be reached
            assert.ok(false);
        } catch(e) {
            assert(e.message.indexOf("false == true") >= 0);
            expect(e.message.indexOf("Missing expected exception") >= 0);
        }
    });
});
```

#### Jest

```js
const softExpect = proxy(expect);

describe("something", () => {
    it("should capture exceptions with wrapped jest assertion library", () => {
        const x = false;
        softExpect(x).toBeTruthy();
        softExpect(() => {}).toThrow();
        try {
            //This is just to showcase, you should not try catch the result of flush.
            flush();
            //As there are assertion errors above this will not be reached
            expect(false).toBe(true);
        } catch(e) {
            expect(e.message).toMatch(/Received: .*false/);
            expect(e.message).toContain("Received function did not throw");
        }
    });
});
```

### Direct

Capture assertions with the `soft` method or capture them by wrapping with `wrap` a whole test method (for example, a `Then` implementation in cucumber). Then when ever you want, call the `flush` method to get a single assertion error wrapping all the accumulated assertion failures.

```js
const { soft, wrap, flush } = require("@alfonso-presa/soft-assert");

describe("success", () => {
    it("should not fail", () => {
        //Single soft assertion will not fail
        soft(() => assert(false));
        //But will be risen when flush is reached
        assert(flush).throws();
    });

    it("should not fail either", () => {
        wrap(() => {
            assert(false); //Wrapped method will halt at this point
            thisWillNotBeExecuted();
        })();
        //But test will continue to the end and assertion above will be keept until flush is called
        assert(flush).throws();
    });

});
```
