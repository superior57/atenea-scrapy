// const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer");

exports.getBrowser = async () => {
  // let browser = await chromium.puppeteer.launch({
  //     args: chromium.args,
  //     defaultViewport: chromium.defaultViewport,
  //     executablePath: await chromium.executablePath,
  //     headless: true,
  //     devtools: false,
  //     ignoreDefaultArgs: ['--disable-extensions'],
  // });

  let browser = await puppeteer.launch({
    headless: false,
    args: [`--window-size=${1300},${900}`],
    ignoreHTTPSErrors: true,
    defaultViewport: { width: 1300, height: 900 },
  });

  return browser;
};
