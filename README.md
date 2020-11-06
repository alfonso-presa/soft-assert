# `@alfonso-presa/soft-assert`

This library allows you to capture assertion errors that happen during your tests in order to delay the failure until the end of the tests (or when ever you want). This is useful in case you want to test several things and you want a full feedback of assertions failing instead of just knowing the last one.

## Instalation

```sh
npm i -D @alfonso-presa/soft-assert
```

## Usage

Capture assertions with the `soft` method or capture them by wrapping with `wrap` a whole test method. Then when ever you want, call the `flush` method to get a single assertion error wrapping all the accumulated assertion failures.

```js
const { soft, wrap, flush } = require("@alfonso-presa/soft-assert");

describe("success", () => {
    it("should not fail", () => {
        soft(() => assert(false));
        assert(flush).throws();
    });

    it("should not fail either", wrap(() => {
        assert(false);
        assert(flush).throws();
    }));
});
```
