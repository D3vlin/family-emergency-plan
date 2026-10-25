// @commitlint/config-conventional brings the 11 standard types
// (feat, fix, perf, revert, docs, style, refactor, test, build, ci, chore)
// as the only valid type-enum — any other type rejects the commit.
export default {
  extends: ['@commitlint/config-conventional'],
}
