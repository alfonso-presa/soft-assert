import { soft, flush, wrap, proxy } from "./soft-assert";
import { expect as chaiExpect, assert as chaiAssert } from "chai";
import assert from "assert";

const softExpect = proxy(expect);
const softChaiExpect = proxy(chaiExpect);
const softChaiAssert = proxy(chaiAssert);
const softAssert: typeof assert = proxy(assert);

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
        expect(pass).toBe(true);
    });

    it("should capture exceptions and not make tests fail", () => {
        soft(() => expect("a").toEqual("b"));
        soft(() => expect("c").toEqual("b"));
    });

    it("should capture exceptions with wrap and not make tests fail", wrap(() => {
        expect("a").toEqual("b");
        expect("c").toEqual("b");
    }));
   
    it("should capture exceptions with wrapped chai expectation library", () => {
        softChaiExpect("a").to.equal("b");
        softChaiExpect(false).to.be.true;
        softChaiExpect(() => {}).to.throw("Error");
        softChaiExpect(() => {throw new Error();}).to.not.throw();
        try {
            flush();
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
        softChaiAssert(x);
        softChaiAssert.ok(x);
        softChaiAssert.throws(() => {});
        try {
            flush();
            expect(false).toBe(true);
        } catch(e) {
            expect(e.message).toContain("expected false to be truthy");
            expect(e.message).toContain("expected [Function] to throw an error");
        }
    });    


    it("should capture exceptions with wrapped jest assertion library", () => {
        const x = false;
        softExpect(x).toBeTruthy();
        softExpect(() => {}).toThrow();
        try {
            flush();
            expect(false).toBe(true);
        } catch(e) {
            expect(e.message).toMatch(/Received: .*false/);
            expect(e.message).toContain("Received function did not throw");
        }
    });

    it("should capture exceptions with wrapped assert assertion library", () => {
        const x = false;
        softAssert(x);
        softAssert.ok(x);
        softAssert.strict.ok(x);
        softAssert.throws(() => {});
        try {
            flush();
            expect(false).toBe(true);
        } catch(e) {
            expect(e.message).toContain("false == true");
            expect(e.message).toContain("Missing expected exception");
        }
    });
    
    it("wrap should not fail on unexpected types", () => {
        proxy(false);
        proxy(null);
        proxy(undefined);
    }); 

    it("should capture exceptions and flush them when with a single assertion failure when requested", () => {
        soft(() => expect("a").toEqual("b"));
        soft(() => expect("c").toEqual("b"));
        try {
            flush();
            expect(false).toBe(true);
        } catch(e) {
            expect(e.message).toMatch(/Expected: .*"b"/);
            expect(e.message).toMatch(/Received: .*"a"/);
            expect(e.message).toMatch(/Received: .*"c"/);
        }
    });

    it("should raise the same assertion when only one failure happened", () => {
        let error;
        soft(() => {
            try {
                expect("a").toEqual("b");
            } catch(e) {
                error = e;
                throw e;
            }
        });
        try {
            flush();
            expect(false).toBe(true);
        } catch(e) {
            expect(e).toEqual(error);
        }
    });    

});