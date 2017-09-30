const {
  blockStatement,
  callExpression,
  cloneDeep,
  functionExpression,
  identifier,
  isExpressionStatement,
  memberExpression,
  newExpression,
  returnStatement,
  throwStatement
} = require('babel-types')
const {extend} = require('js-extend')
const {NoSubFunctionsVisitor} = require('./utils')

module.exports = class PromiseChain {
  // add, addCatch and addFinally were designed to be called only one time each
  // at most. Call them more at your own risk.
  //
  // addCatch() and addFinally() are not guaranteed to handle return values
  // correctly. FIXME.
  constructor(inner, dirtyAllowed, respName, errName) {
    this._inner = inner;
    this._dirtyAllowed = dirtyAllowed;
    this._respName = respName;
    this._errName = errName;

    this.resolved = false

    this.ast = newExpression(identifier('Promise'), [
      functionExpression(
        null,
        [
          identifier('resolve'),
          identifier('reject'),
        ],
        blockStatement([])
      ),
    ])
    this.firstBlock = this.ast.arguments[0].body
  }
  add(block) {
    if (!block.length) {
      return;
    }

    if (!this.resolved) {
      let current = this.firstBlock
      block.forEach(path => {
        const awaitInfos = []
        path.traverse(PromisifyPrepVisitor, { awaitInfos, respName: this._respName });

        if (!awaitInfos.length && this.ast.type === 'NewExpression' && path.node.type === 'ReturnStatement') {
            const arg = path.node.argument
            path.remove()
            path.node = callExpression(identifier('resolve'), [arg])
        }

        awaitInfos.forEach(awaitInfo => {
          current.body.push(callExpression(identifier('resolve'), [awaitInfo.arg]));
          const params = awaitInfo.passID ? [identifier(this._respName)] : [];
          current = this._addLink('then', params)
        })

        if (path.node) {
          current.body.push(path.node);
        }
      });

      this.resolved = true
      return
    }


    let current = this._addLink('then', []);
    block.forEach(path => {
      const awaitInfos = [];
      path.traverse(PromisifyPrepVisitor, {awaitInfos, respName: this._respName});

      awaitInfos.forEach(awaitInfo => {
        current.body.push(returnStatement(awaitInfo.arg));
        const params = awaitInfo.passID ? [identifier(this._respName)] : [];
        current = this._addLink('then', params);
      });
      if (path.node) {
        current.body.push(path.node);
      }
    });
  }

  _addLink(type, params, secondParams) {
    this._cleanup();

    const current = {body: []};
    const handlerBody = blockStatement(current.body);
    const handlers = [functionExpression(null, params, handlerBody)];

    if (secondParams) {
      current.secondBody = [];
      const secondHandlerBody = blockStatement(current.secondBody);
      handlers.push(functionExpression(null, secondParams, secondHandlerBody));
    }

    const method = memberExpression(this.ast, identifier(type));
    this.ast = callExpression(method, handlers);

    return current;
  }
  _cleanup() {
    return
    // XXX disabled for now...

    // if resolving to non-undefined when there is no return is allowed, and
    // the last part of the chain is .then(function () {}), then chop off that
    // part
    const chopOff = (
      this._dirtyAllowed &&
      this.ast.callee.property.name === 'then' &&
      this.ast.arguments.length === 1 &&
      !this.ast.arguments[0].body.body.length
    );
    if (chopOff) {
      this.ast = this.ast.callee.object;
    }
  }
  addCatch(block, errID) {
    const current = this._addLink('catch', [errID]);
    const catchChain = this._subChain();
    catchChain.add(block);
    current.body.push(returnStatement(catchChain.toAST()));
  }
  _subChain() {
    return new PromiseChain(true, true, this._respName, this._errName);
  }
  addFinally(block) {
    const errID = identifier(this._errName);
    const current = this._addLink('then', [], [errID]);

    const finallyChain = this._subChain();

    // disable optimalizations
    finallyChain._inner = false;
    finallyChain._dirtyAllowed = false;
    finallyChain.add(block);
    const secondAST = cloneDeep(finallyChain.toAST());
    // smuggle in the throw statement
    secondAST.arguments[0].body.body.push(throwStatement(errID));
    current.secondBody.push(returnStatement(secondAST));

    // re-enable optimalizations
    finallyChain._inner = true;
    finallyChain._dirtyAllowed = true;
    const ast = returnStatement(finallyChain.toAST());
    current.body.push(ast);
  }
  toAST() {
//    this._cleanup();
    return this.ast;

    const callee = this.ast.callee.object.callee;
    if (this._inner && callee && callee.object.name === 'Promise') {
      // only one handler to the promise - because we're in an inner function
      // there's no reason to wrap the handler in promise code. Convenienly,
      // such a handler is inlineable later on.
      //
      // Summary:
      // ``Promise.resolve().then(function () {...})``
      // becomes
      // ``function () {...}()``
      return callExpression(this.ast.arguments[0], []);
    }
    return this.ast;
  }
}

const PromisifyPrepVisitor = extend({
  AwaitExpression: {
    exit(path) {
      // exit so awaits are evaluated inside out if there are multiple in
      // the expression
      const info = {arg: path.node.argument};
      if (isExpressionStatement(path.parent)) {
        path.remove();
      } else {
        info.passID = true;
        path.replaceWith(identifier(this.respName));
      }
      this.awaitInfos.push(info);
    }
  },
}, NoSubFunctionsVisitor);
