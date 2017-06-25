[![Npm Package](https://img.shields.io/npm/v/chrome-tester.svg?style=flat-square)](https://www.npmjs.com/package/chrome-tester)
[![Build Status](https://img.shields.io/travis/gwuhaolin/chrome-tester.svg?style=flat-square)](https://travis-ci.org/gwuhaolin/chrome-tester)
[![Dependency Status](https://david-dm.org/gwuhaolin/chrome-tester.svg?style=flat-square)](https://npmjs.org/package/chrome-tester)
[![Npm Downloads](http://img.shields.io/npm/dm/chrome-tester.svg?style=flat-square)](https://www.npmjs.com/package/chrome-tester)

# chrome-tester
Web page auto tester with headless chrome

## Use
```js
const Tester = require('chrome-tester');
const tester = new Tester();
await tester.init();
const job = {
  url: 'https://ke.qq.com',
  tests: [
    {
      des: 'succ test',
      script: `return true`
    },
    {
      des: 'fail test',
      script: `throw 1`
    }
  ]
}
const executor = await tester.exec(job);
executor.on('test-pass', (test, value) => {
  console.log('test-pass');
  assert.equal(test.des, 'succ test');
  assert.equal(value, true);
});
executor.on('test-failed', (test, exceptionDetails) => {
  console.log('test-failed');
  assert.equal(test.des, 'fail test');
  assert.equal(exceptionDetails.exception.value, 1);
});
await executor.wait();
await tester.destroy();
```
- `tester.init()`: await tester be ready
- `tester.exec(job)`: run a test job, this will return a `executor` used to listen on some events
- `await executor.wait()`: await until this test job has done
-  `tester.destroy()`: destroy this tester, close chrome, release resource

### tester.exec options
-  url {string}: web page url
-  referrer {string}: http request referrer header
-  cookies {Object}: http request cookies
-  headers {Object}: http request headers
-  injectScript {string}: inject script to exec after domContentEventFired
-  tests {Array}: unit tests will run after injectScript has been inject, tests will be run one by one in order
   element in tests should be:
   ```js
     {  
       script {string}: unit test script content,
       ... other props
     }
   ```
   
### executor events table
- log: chrome console out
- test-pass: unit test exec complete
- test-failed: unit test exec complete
- done: exec complete
- load-failed: page cant load
- network-failed: Network.loadingFailed event
- network-received: Network.loadingFailed event

see [unit test](./test/tester.test.js) for more use case.
