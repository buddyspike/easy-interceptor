import R from 'ramda';
import proxy from '../lib/proxy';

describe('proxy', () => {
  describe('to a function', () => {
    let proxyFunction;

    beforeEach(() => {
      proxyFunction = proxy(() => 42);
    });

    it('should invoke that function', () => {
      proxyFunction().should.equal(42);
    });
  });

  describe('to a function with args', () => {
    let target;

    beforeEach(() => {
      target = proxy(a => a);
    });

    it('should pipe the args', () => {
      target(42).should.equal(42);
    });

    describe('with specific return value for input', () => {
      beforeEach(() => {
        target.withArgs(42).returns(43);
      });

      it('should return the configured value for matching input', () => {
        target(42).should.equal(43);
      });
    });
  });

  describe('throwing on specific call', () => {
    let target;

    beforeEach(() => {
      target = proxy(() => 42);
      target.onCall(0).throws(new Error('doh'));
    });

    it('should throw specified error for that call', () => {
      (() => target()).should.throw(/doh/);
    });

    it('should not throw an error for other calls', () => {
      const firstCall = R.tryCatch(target, R.F);

      firstCall();
      target().should.equal(42);
    });
  });

  describe('throwing on specific args', () => {
    let target;

    beforeEach(() => {
      target = proxy(() => 42);
      target.withArgs('a').throws(new Error('doh'));
    });

    it('should throw an error for matching args', () => {
      (() => target('a')).should.throw(/doh/);
    });

    it('should not throw an error for other calls', () => {
      target('b').should.equal(42);
    });
  });

  describe('configure value on call', () => {
    let proxyFunction;

    beforeEach(() => {
      proxyFunction = proxy(() => 42);
      proxyFunction.onCall(0).returns(1);
    });

    it('should return the configured value for that call', () => {
      proxyFunction().should.equal(1);
    });
  });

  describe('configure a return value', () => {
    let proxyFunction;

    beforeEach(() => {
      proxyFunction = proxy(() => 42);
      proxyFunction.returns(43);
    });

    it('should return the configured value', () => {
      proxyFunction().should.equal(43);
    });

    describe('with a specific call configuration', () => {
      beforeEach(() => {
        proxyFunction.onCall(0).returns(44);
      });

      it('should return call specific value for that call', () => {
        proxyFunction().should.equal(44);
      });

      it('should return the default value of all other calls', () => {
        proxyFunction();
        proxyFunction().should.equal(43);
      });
    });
  });

  describe('call', () => {
    let proxyFunction;

    beforeEach(() => {
      proxyFunction = proxy(() => 42);
    });

    it('should provide access to arguments', () => {
      proxyFunction('a');
      proxyFunction('b');
      proxyFunction.call(0).args[0].should.equal('a');
      proxyFunction.call(1).args[0].should.equal('b');
    });

    it('should return undefined for invalid calls', () => {
      (proxyFunction.call(0) || false).should.be.false;
    });
  });

  describe('received', () => {
    let proxyFunction;

    beforeEach(() => {
      proxyFunction = proxy(() => 42);
      proxyFunction('a');
    });

    it('should return matching calls', () => {
      proxyFunction.received('a')[0].args[0].should.equal('a');
    });

    it('should return false for non-matching calls', () => {
      proxyFunction.received('b').should.be.false;
    });
  });

  describe('receivedAny', () => {
    let proxyFunction;

    beforeEach(() => {
      proxyFunction = proxy(() => 42);
      proxyFunction('a');
    });

    it('should return true for matching calls', () => {
      proxyFunction.receivedAny('a').should.be.true;
    });

    it('should return false for non-matching calls', () => {
      proxyFunction.receivedAny('b').should.be.false;
    });
  });

  describe('quick calls', () => {
    let proxyFunction;

    beforeEach(() => {
      proxyFunction = proxy(() => 42);
      proxyFunction('a');
      proxyFunction('b');
      proxyFunction('c');
    });

    it('should include the first call', () => {
      proxyFunction.firstCall().args[0].should.equal('a');
    });

    it('should include the second call', () => {
      proxyFunction.secondCall().args[0].should.equal('b');
    });

    it('should include the third call', () => {
      proxyFunction.thirdCall().args[0].should.equal('c');
    });
  });

  describe('throws', () => {
    let proxyFunction;

    beforeEach(() => {
      proxyFunction = proxy(() => 42);
      proxyFunction.throws(new Error('doh'));
    });

    it('should throw the specified error', () => {
      (() => proxyFunction()).should.throw(/doh/);
    });
  });

  describe('with an alternative implementation', () => {
    it('should receive arguments', () => {
      const target = proxy(() => 42);
      target.onCall(0).returns(a => a);
      target(43).should.equal(43);
    });

    it('should provide call info as the last argument', () => {
      const target = proxy(() => 42);

      target.onCall(0).returns((input, call) => {
        input.should.equal('a');
        call.count.should.equal(1);
      });

      target('a');
    });

    describe('for specific call', () => {
      let target;

      beforeEach(() => {
        target = proxy(() => 42);
        target.onCall(0).returns(() => 43);
      });

      it('should invoke the alternative impl for matching call', () => {
        target().should.equal(43);
      });

      it('should not invoke the alternative impl for other calls', () => {
        target();
        target().should.equal(42);
      });
    });

    describe('for call with specific args', () => {
      let target;

      beforeEach(() => {
        target = proxy(() => 42);
        target.withArgs('a').returns(() => 43);
      });

      it('should invoke the alternative impl for matching calls', () => {
        target('a').should.equal(43);
      });

      it('should not invoke the alternative impl for other calls', () => {
        target('b').should.equal(42);
      });
    });

    describe('accessing this from an arrow function', () => {
      function Foo() {
        this._state = 0;

        this.inc = () => {
          return this._state++;
        };

        this.invokeProxy = () => {
          const p = proxy(() => this.inc() );
          return p();
        }
      }

      it('should provide the correct reference', () => {
        const f = new Foo();
        f.invokeProxy();
        f.invokeProxy().should.equal(1);
      });
    });
  });
});
