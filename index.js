const ChromePool = require('chrome-pool');
const Executor = require('./executor');

class Tester {

  async init() {
    this.chromePool = await ChromePool.new({
      maxTab: 30,
      protocols: ['Page', 'Network', 'Runtime', 'Console'],
    });
  }

  async destroy() {
    return await this.chromePool.destroyPoll();
  }

  /**
   *
   * @param job
   * {
   *  url {string}: web page url
   *  referrer {string}: http request referrer header
   *  cookies {Object}: http request cookies
   *  headers {Object}: http request headers
   *  injectScript {string}: inject script to exec after domContentEventFired
   *  tests {Array}: unit tests will run after injectScript has been inject
   * }
   * element in tests should be:
   * {
   *  script {string}: unit test script content,
   *  ... other props
   * }
   * tests will be run one by one in order
   *
   * @returns {Promise.<Executor>}
   */
  async exec(job) {
    const tab = await this.chromePool.require();
    const executor = new Executor(tab, job);
    executor.once('done', async () => {
      await this.chromePool.release(executor.tab.tabId);
    });
    setTimeout(executor.start.bind(executor), 0);
    return executor;
  }

}

module.exports = Tester;
