import { assert } from "console";
import { soft, flush, wrap } from "./soft-assert";
import { expect } from "chai";

describe("soft-assert", () => {

    afterEach(() => {
        try {flush()} catch(e) {}
    });

    it("should not fail if no assertion errors", flush);

    it("should support promises", async () => {
        let pass = false;
        await soft(async () => {
            pass = true;
        });
        assert(pass);
    });

    it("should capture exceptions and not make tests fail", () => {
        soft(() => expect("a").to.equal("b"));
        soft(() => expect("c").to.equal("b"));
    });

    it("should capture exceptions with wrap and not make tests fail", wrap(() => {
        expect("a").to.equal("b");
        expect("c").to.equal("b");
    }));    

    it("should capture exceptions and flush them when with a single assertion failure when requested", () => {
        soft(() => expect("a").to.equal("b"));
        soft(() => expect("c").to.equal("b"));
        try {
            flush();
            expect(false, "should not be reached").to.be.true;
        } catch(e) {
            expect(e.message).to.contain("expected 'a' to equal 'b'");
            expect(e.message).to.contain("expected 'c' to equal 'b'");
        }
    });

});