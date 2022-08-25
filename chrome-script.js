const puppeteer = require("puppeteer");

exports.getBrowser = async () => {puppeteer
    let browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      headless: true,
      args: [`--window-size=${1300},${900}`],
      ignoreHTTPSErrors: true,
      defaultViewport: { width: 1300, height: 900 },
    });
    
    return browser;
}