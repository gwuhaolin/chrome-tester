const assert = require('assert');
const Tester = require('../index');

process.on('unhandledRejection', console.trace);

describe('Tester', function () {
  this.timeout(5000);

  it('basic', async function () {
    const tester = new Tester();
    await tester.init();
    const job = {
      url: 'https://github.com/',
      referrer: '',
      cookies: {},
      headers: {},
      injectScript: null,
      tests: [
        {
          script: `return 123`
        },
        {
          script: `throw 123`
        }
      ]
    }
    const executor = await tester.exec(job);

    executor.on('log', (consoleMessage) => {
      assert.notEqual(consoleMessage, null);
    });

    executor.on('test-pass', (test, value) => {
      assert.notEqual(test, null);
      assert.notEqual(value, null);
    });

    executor.on('test-failed', (test, exceptionDetails) => {
      assert.notEqual(test, null);
      assert.notEqual(exceptionDetails, null);
    });

    executor.on('done', () => {
    });

    executor.on('pageload-failed', (request) => {
      assert.notEqual(request, null);
    });

    executor.on('network-failed', (request) => {
      assert.notEqual(request, null);
    });

    executor.on('network-received', (request) => {
      assert.notEqual(request, null);
    });

    await executor.wait();
    return await tester.destroy();
  });

  it('pageload-failed', function (done) {
    (async () => {
      const tester = new Tester();
      await tester.init();
      const job = {
        url: 'https://cant.cant-cant.cant',
      }
      const executor = await tester.exec(job);
      executor.on('pageload-failed', (params) => {
        assert.equal(params.type, 'Document');
        done();
      });
      await executor.wait();
      await tester.destroy();
    })();
  });

  it('network-failed', function (done) {
    (async () => {
      const tester = new Tester();
      await tester.init();
      const job = {
        url: 'https://cant.cant-cant.cant',
      }
      const executor = await tester.exec(job);
      executor.on('network-failed', (params) => {
        assert.equal(params.type, 'Document');
        done();
      });
      await executor.wait();
      await tester.destroy();
    })();
  });

  it('inject script before test', function (done) {
    (async () => {
      const tester = new Tester();
      await tester.init();
      const job = {
        url: 'https://github.com/',
        injectScript: `window.$=520`,
        tests: [
          {
            des: 'injectScript',
            script: `return window.$`
          }
        ]
      }
      const executor = await tester.exec(job);
      executor.on('test-pass', (test, value) => {
        if (test.des === 'injectScript') {
          assert.equal(value, 520);
          done();
        }
      });
      await executor.wait();
      await tester.destroy();
    })();
  });

  it('test succ and test fail', function (done) {
    (async () => {
      const tester = new Tester();
      await tester.init();
      const job = {
        url: 'https://github.com/',
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
      done();
      await tester.destroy();
    })();
  });

  it('get log', function (done) {
    (async () => {
      const tester = new Tester();
      await tester.init();
      const job = {
        url: 'https://github.com/',
        tests: [
          {
            des: 'log test',
            script: `console.log('log chrome-tester')`
          },
        ]
      }
      const executor = await tester.exec(job);
      executor.on('log', (consoleMessage) => {
        console.log(consoleMessage);
        assert.equal(consoleMessage.level, 'log');
        assert.equal(consoleMessage.text, 'log chrome-tester');
      });
      await executor.wait();
      done();
      await tester.destroy();
    })();
  });

  it('get DOM snapshot after wait', async function () {
    const tester = new Tester();
    await tester.init();
    const job = {
      url: 'https://github.com/',
    }
    const executor = await tester.exec(job);
    const dom = await executor.getDOM();
    assert.equal(dom.nodeName, '#document');
    await tester.destroy();
  })
})
