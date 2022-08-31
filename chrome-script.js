const chromium = require('chrome-aws-lambda');

exports.getBrowser = async () => {
    let browser = await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: true,
        devtools: false,
        ignoreDefaultArgs: ['--disable-extensions'],
    });
    
    return browser;
}