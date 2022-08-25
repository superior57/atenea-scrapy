const path = require("path");
const puppeteer = require("puppeteer");
const fs = require("fs");
const { getChrome } = require("./chrome-script");

const paths = {
  login:
    "https://memsim.cenace.gob.mx/Entrenamiento/Participantes/LOGIN/Default.aspx",
  oferta:
    "https://memsim.cenace.gob.mx/Entrenamiento/Participantes/OFERTAS/EstadoDeLasOfertas.aspx",
  screenshot: "./screenshot",
  download: "./download",
};

const browserConfig = {
  waitUltil: "networkidle2",
  timeout: 180000,
};

// --------------------------------------------------

//
const sleepTime = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time * 1000));
};

//
const authByFile = (page, options) => {
  return new Promise(async (resolve) => {
    const inputCert = await page.$("#uploadCerfile0");
    const inputKey = await page.$("#uploadKeyfile0");

    inputCert.uploadFile(options.certificate);
    inputKey.uploadFile(options.key);

    await page.evaluate((options) => {
      document.querySelector("#txtPrivateKey").value = options.contrasena;
    }, options);

    await sleepTime(3);

    await page.evaluate((options) => {
      document.querySelector("#btnEnviar").click();
    }, options);

    resolve();
  });
};

//
const authByUser = (page, options) => {
  return new Promise(async (resolve) => {
    await page.evaluate((options) => {
      document.querySelector("#txtUsuario").value = options.username;
      document.querySelector("#txtPassword").value = options.password;
    }, options);

    await sleepTime(1);

    await page.evaluate((options) => {
      document.querySelector("#Button1").click();
    }, options);

    resolve();
  });
};

//
const searchData = (page, options) => {
  return new Promise(async (resolve) => {
    const tableBodySelector = "#RadGrid1_ctl00 > tbody";
    console.log("Entering operating date filter...");

    await page.evaluate(
      (options, tableBodySelector) => {
        const operatingDateFilter = document.querySelector(
          "#dateFechaInicial_dateInput"
        );
        operatingDateFilter.value = options.operating_date;
        operatingDateFilter.focus();

        document.querySelector(tableBodySelector).remove();
      },
      options,
      tableBodySelector
    );

    await page.keyboard.press("Enter");
    await page.waitForSelector(tableBodySelector, browserConfig);

    console.log("Entering unitykey filter...");
    await page.evaluate(
      (options, tableBodySelector) => {
        const unitykeyFilter = document.querySelector(
          "#RadGrid1_ctl00_ctl02_ctl01_FilterTextBox_ClavedelaUnidad"
        );
        unitykeyFilter.value = options.unitkey;
        unitykeyFilter.focus();

        document.querySelector(tableBodySelector).remove();
      },
      options,
      tableBodySelector
    );

    await page.keyboard.press("Enter");
    await page.waitForSelector(tableBodySelector, browserConfig);

    resolve();
  });
};

//
const screenshotPage = (page) => {
  return new Promise(async (resolve) => {
    const screenshotPath = path.resolve(paths.screenshot, "screenshot.png");

    await page.screenshot({
      path: screenshotPath,
    });

    resolve();
  });
};

//
const initDirectories = async () => {
  try {
    // download folder
    if (fs.existsSync(paths.download)) {
      const files = fs.readdirSync(paths.download);
      await files.map((file_name) => {
        let file_dir = path.resolve(paths.download, file_name);
        fs.unlinkSync(file_dir);
        return Promise.resolve();
      });
      console.log("clean download directory");
    } else {
      fs.mkdirSync(paths.download);
      console.log("created download directory");
    }

    // screenshot folder
    if (fs.existsSync(paths.screenshot)) {
      const files = fs.readdirSync(paths.screenshot);
      await files.map((file_name) => {
        let file_dir = path.resolve(paths.screenshot, file_name);
        fs.unlinkSync(file_dir);
        return Promise.resolve();
      });
      console.log("clean screenshot directory");
    } else {
      fs.mkdirSync(paths.screenshot);
      console.log("created screenshot directory");
    }

    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

//
const getDatasFromDirectory = () => {
  var result = {};
  // downloaded file
  var file_name = fs.readdirSync(paths.download)[0];
  if (file_name) {
    const file_dir = path.resolve(paths.download, file_name);

    const str_file = fs.readFileSync(file_dir, { encoding: "utf-8" });
    const obj_file = JSON.parse(str_file);

    result.jsonresponse = { ...obj_file };
  } else {
    console.error("Downloaded file does not exist");
  }

  // screenshot file
  file_name = fs.readdirSync(paths.screenshot)[0];
  if (file_name) {
    const file_dir = path.resolve(paths.screenshot, file_name);

    const file = fs.readFileSync(file_dir, { encoding: "base64" });

    result.screenshotBase64 = file;
  } else {
    console.error("Screenshot file does not exist");
  }

  return result;
};

// --------------------------------------------------

async function startBrowser(options) {
  let browser;
  try {
    console.log("Opening the browser......");

    const chrome = await getChrome();

    browser = await puppeteer.connect({
      browserWSEndpoint: chrome.endpoint,
      defaultViewport: { width: 1300, height: 900 },
    });

    // browser = await puppeteer.launch({
    //   headless: false,
    //   args: [`--window-size=${1300},${900}`],
    //   ignoreHTTPSErrors: true,
    //   defaultViewport: { width: 1300, height: 900 },
    // });

    var [page] = await browser.pages();

    const waitForLoad = new Promise((resolve) =>
      page.on("load", () => resolve())
    );

    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
    );

    await page.goto(paths.login, browserConfig);
    await waitForLoad;

    // File authentication
    console.log("attempting to login by credentials");
    await authByFile(page, options);

    // Waiting new page load
    await page.waitForNavigation(browserConfig);
    await waitForLoad;

    // User/Password Authentication
    console.log("attempting to login by user/pass");
    await authByUser(page, options);

    // await page.waitForNavigation({
    //   waitUltil: "networkidle2",
    //   timeout: 60000,
    // });
    // await waitForLoad;

    await sleepTime(1);

    // Go to form table
    console.log("Opening the oferta table page...");
    await page.goto(paths.oferta, browserConfig);
    await waitForLoad;

    // search data by filters...
    await searchData(page, options);
    sleepTime(2);
    console.log("Table data is ready!");

    // Collecting data from first row
    console.log("downloading json file");
    const downloadPath = path.resolve(paths.download);

    //
    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath,
    });

    const result = await page.evaluate(() => {
      const rows = document.querySelectorAll("#RadGrid1_ctl00 > tbody > tr");

      if (rows.length > 0) {
        const firstRow = rows[0];
        firstRow.querySelector("#RadGrid1_ctl00_ctl04_gbcDescarga2").click();

        const status = firstRow.querySelectorAll("td")[10]?.textContent;

        return {
          status,
        };
      }
    });

    await sleepTime(3);

    // Opening popup
    console.log("Opening popup...");
    await page.evaluate(() => {
      const rows = document.querySelectorAll("#RadGrid1_ctl00 > tbody > tr");

      if (rows.length > 0) {
        const firstRow = rows[0];

        firstRow.querySelectorAll("td")[11].querySelector("a").click();
      }
    });

    console.log("collecting data is completed!");

    // Load popup
    const newPagePromise = new Promise((resolve) =>
      browser.once("targetcreated", (target) => resolve(target.page()))
    );
    const popup = await newPagePromise;
    await popup.waitForSelector("#FieldSet1");
    console.log("loaded popup");

    // Screenshot
    console.log("Taking a screenshot");
    await screenshotPage(popup);

    // Close
    await popup.close();
    await browser.close();

    return Promise.resolve(result);
  } catch (err) {
    console.error("Could not create a browser instance => : ", err);
  }
  return browser;
}

//
exports.startScrap = async (event) => {
  const options = event.input;

  await initDirectories();
  const { status } = await startBrowser(options);
  const { jsonresponse, screenshotBase64 } = await getDatasFromDirectory();

  const data = {
    output: {
      status,
      jsonresponse,
      screenshotBase64: "data:image/png;base64, " + screenshotBase64,
    },
  };

  return data;
};
