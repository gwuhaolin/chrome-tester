function wrapWithPromise(js) {
  return `
(async () => {
  ${js}
})()`
}

module.exports = {
  wrapWithPromise,
}
