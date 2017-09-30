const {
  assignmentExpression,
  awaitExpression,
  callExpression,
  expressionStatement,
  functionExpression
} = require('babel-types')
const {extend} = require('js-extend')

const NoSubFunctionsVisitor = {
  Function(path) {
    path.skip();
  }
}

const containsAwait = matcher(['AwaitExpression'], NoSubFunctionsVisitor);

function matcher(types, base) {
  const MatchVisitor = extend({}, base);
  types.forEach(type => {
    MatchVisitor[type] = function (path) {
      this.match.found = true;
      path.stop();
    };
  });
  return function (path) {
    if (!path.node) {
      return false;
    }
    if (types.indexOf(path.node.type) !== -1) {
      return true;
    }
    const match = {}
    path.traverse(MatchVisitor, {match});
    return match.found;
  }
}

function wrapFunction(body) {
  const func = functionExpression(null, [], body, false, true);
  func.dirtyAllowed = true;
  return callExpression(func, []);
}

const awaitStatement = arg => expressionStatement(awaitExpression(arg));

const assign = (a, b) =>
  expressionStatement(assignmentExpression('=', a, b));


module.exports = {
  NoSubFunctionsVisitor,
  assign,
  awaitStatement,
  containsAwait,
  matcher,
  wrapFunction,
}
