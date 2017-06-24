function unitTest(script) {
  return `
(async () => {
  ${script}
})()`
}

function injectScript(script) {
  return `
(async () => {
  ${script}
})()`
}

module.exports = {
  unitTest,
  injectScript,
}
