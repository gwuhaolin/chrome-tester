const EventEmitter = require('events');
const { wrapWithPromise } = require('./util');
const package_json = require('./package.json');

/**
 * web page spider
 *
 * a spider work a job, when spider do a job some event will emit:
 * - log: chrome console out
 * - test-pass: unit test exec complete
 * - test-failed: unit test exec complete
 * - done: exec complete
 * - pageload-failed: page cant load
 * - network-failed: Network.loadingFailed event
 * - network-received: Network.loadingFailed event
 */
class Executor extends EventEmitter {

  constructor(protocol, job) {
    super();
    this.protocol = protocol;
    this.job = job;
  }

  async start() {
    return new Promise(async (resolve) => {
      const { Page, Network, Runtime, Console } = this.protocol;
      const { url, referrer, cookies, headers, injectScript, tests = [] } = this.job;

      // inject cookies
      if (cookies && typeof cookies === 'object') {
        Object.keys(cookies).forEach((name) => {
          // Sets a cookie with the given cookie data; may overwrite equivalent cookies if they exist.
          // https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-setCookie
          Network.setCookie({
            url: url,
            name: name,
            value: cookies[name],
          });
        })
      }

      // inject headers
      if (headers && typeof headers === 'object') {
        // Specifies whether to always send extra HTTP headers with the requests from this page.
        // https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-setExtraHTTPHeaders
        Network.setExtraHTTPHeaders({
          headers: Object.assign({
            'x-chrome-tester': package_json.version
          }, headers),
        });
      }

      // detect page load failed error
      (() => {
        // store the first request which is request web page
        let firstRequestId;
        // https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-requestWillBeSent
        Network.requestWillBeSent((params) => {
          if (firstRequestId === undefined) {
            firstRequestId = params.requestId;
          }
        });
        // https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-requestWillBeSent
        Network.loadingFailed((params) => {
          this.emit('network-failed', params);

          if (params.requestId === firstRequestId) {
            // page cant load
            this.emit('pageload-failed', params);
            this.emit('done');
            resolve();
          }
        });
        // https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-responseReceived
        Network.responseReceived((params) => {
          this.emit('network-received', params);
        });
      })();

      // collect page log
      // https://chromedevtools.github.io/devtools-protocol/tot/Console/#event-messageAdded
      Console.messageAdded((consoleMessage) => {
        this.emit('log', consoleMessage.message);
      });


      // run unit tests after domContentEventFired
      // https://chromedevtools.github.io/devtools-protocol/tot/Page/#event-domContentEventFired
      Page.domContentEventFired(async () => {
        // inject script to exec after domContentEventFired
        if (injectScript && typeof injectScript === 'string') {
          await Runtime.evaluate({
            awaitPromise: true,
            expression: wrapWithPromise(injectScript),
          });
        }

        // run unit test after injectScript has been inject
        for (let i = 0; i < tests.length; i++) {
          let test = tests[i];
          const { result, exceptionDetails } = await Runtime.evaluate({
            awaitPromise: true,
            returnByValue: true,
            expression: wrapWithPromise(test.script),
          });
          if (exceptionDetails) {
            this.emit('test-failed', test, exceptionDetails);
          } else {
            this.emit('test-pass', test, result.value);
          }
        }

        // exec job complete
        this.emit('done');
        resolve();
      });

      // to go page
      // https://chromedevtools.github.io/devtools-protocol/tot/Page/
      await Page.navigate({
        url,
        referrer,
      });
    });
  }

  async getDOM() {
    const { DOM } = this.protocol;
    // https://chromedevtools.github.io/devtools-protocol/tot/DOM/#method-getDocument
    const ret = await DOM.getDocument();
    return ret.root;
  }

  async wait() {
    return new Promise((resolve) => {
      this.once('done', resolve);
    });
  }

}

module.exports = Executor;

