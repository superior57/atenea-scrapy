const puppeteer = require("puppeteer");

exports.getBrowser = async () => {puppeteer
    let browser = await puppeteer.launch({
      // executablePath: '/usr/bin/chromium',
      dumpio: true,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ]
    });
    
    return browser;
}