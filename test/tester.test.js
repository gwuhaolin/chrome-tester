const assert = require('assert');
const Tester = require('../index');

process.on('unhandledRejection', console.trace);

describe('Tester', function () {

  it('basic', async function () {
    const tester = new Tester();
    await tester.init();
    const job = {
      url: 'https://ke.qq.com',
      referrer: '',
      cookies: {},
      headers: {},
      injectScript: null,
      tests: [
        {
          script: `console.log(123)`
        }
      ]
    }
    const executor = await tester.exec(job);
    executor.on('log', (consoleMessage) => {
      console.log('log', consoleMessage);
    });

    executor.on('test-done', (test) => {
      console.log('test-done', test);
    });

    executor.on('done', async () => {
      console.log('done');
    });

    executor.on('load-failed', () => {
      console.log('load-failed');
    });

    executor.on('network-failed', (params) => {
      console.log('network-failed', params);
    });

    executor.on('network-received', (params) => {
      console.log('network-received', params);
    });

    await executor.wait();
    return await tester.destroy();
  });

  it('inject script', function (done) {
    (async () => {
      const tester = new Tester();
      await tester.init();
      const job = {
        url: 'https://ke.qq.com',
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

  it('unit test succ or fail', function (done) {
    (async () => {
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
      done();
      await tester.destroy();
    })();
  });

  it('get log', function (done) {
    (async () => {
      const tester = new Tester();
      await tester.init();
      const job = {
        url: 'https://ke.qq.com',
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
  })
})
