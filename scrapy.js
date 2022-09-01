const path = require("path");
const fs = require("fs");
const { getBrowser } = require("./chrome-script");

const paths = {
  login:
    "https://memsim.cenace.gob.mx/Entrenamiento/Participantes/LOGIN/Default.aspx",
  oferta:
    "https://memsim.cenace.gob.mx/Entrenamiento/Participantes/OFERTAS/EstadoDeLasOfertas.aspx",
  screenshot: "/tmp/screenshot",
  download: "/tmp/download",
  certificate: "/tmp/certs/cert.cer",
  key: "/tmp/certs/cert.key",
};

const browserConfig = {
  waitUltil: "networkidle2",
  timeout: 180000,
};

// --------------------------------------------------

//
const authByFile = async (page, options) => {
  try {
    const inputCert = await page.$("#uploadCerfile0");
    const inputKey = await page.$("#uploadKeyfile0");

    await inputCert.uploadFile(paths.certificate);
    await inputKey.uploadFile(paths.key);

    await page.evaluate((options) => {
      document.querySelector("#txtPrivateKey").value = options.contrasena;
    }, options);

    await page.waitForTimeout(1000);
    await page.evaluate(() => document.querySelector("#btnEnviar").click());

    await page.waitForSelector("#txtUsuario");

    return;
  } catch (error) {
    throw new Error(
      "An error occured while attempting login by credentials. Error: " +
        error.message
    );
  }
};

//
const authByUser = async (page, options) => {
  try {
    await page.evaluate((options) => {
      document.querySelector("#txtUsuario").value = options.username;
      document.querySelector("#txtPassword").value = options.password;
    }, options);

    // sleep 1
    await page.evaluate((options) => {
      document.querySelector("#Button1").click();
    }, options);

    return;
  } catch (error) {
    throw new Error(
      "An error occured while attempting login by username and password. Error: " +
        error.message
    );
  }
};

//
const searchData = async (page, options) => {
  try {
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

    return;
  } catch (error) {
    throw new Error(
      "An error occured while getting data in oferta table. Error: " +
        error.message
    );
  }
};

//
const screenshotPage = async (page) => {
  try {
    const screenshotPath = path.resolve(paths.screenshot, "screenshot.png");

    await page.screenshot({
      path: screenshotPath,
    });

    return;
  } catch (error) {
    throw new Error(
      "An error occured while taking screenshot. Error: " + error.message
    );
  }
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

    return;
  } catch (error) {
    throw new Error(
      "An error occured while initing directories. Error: " + error.message
    );
  }
};

//
const generateCertsFromBase64 = async (options) => {
  try {
    // make directory for certificate files
    if (fs.existsSync(paths.certificate)) {
      fs.unlinkSync(paths.certificate);
      fs.unlinkSync(paths.key);
    } else {
      let certificateDirectory = paths.certificate.split("/");
      certificateDirectory.splice(-1, 1);
      certificateDirectory = certificateDirectory.join("/");
      fs.mkdirSync(certificateDirectory, { recursive: true });

      let keyDirectory = paths.key.split("/");
      keyDirectory.splice(-1, 1);
      keyDirectory = keyDirectory.join("/");
      fs.mkdirSync(keyDirectory, { recursive: true });
    }

    fs.writeFileSync(paths.certificate, options.certificate, {
      encoding: "base64",
    });
    fs.writeFileSync(paths.key, options.key, { encoding: "base64" });

    return;
  } catch (error) {
    throw new Error(
      "An error occured while generating certifcation files from base64 inputs. Error: " +
        error.message
    );
  }
};

//
const getDatasFromDirectory = async () => {
  try {
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
  } catch (error) {
    throw new Error(
      "An error occured while getting data from JSON and Image files. Error: " +
        error.message
    );
  }
};

// --------------------------------------------------

async function startBrowser(options) {
  let browser, popup;
  try {
    console.log("Opening the browser......");

    browser = await getBrowser();

    var [page] = await browser.pages();

    const waitForLoad = new Promise((resolve) =>
      page.on("load", () => resolve())
    );

    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
    );

    console.log("going to login page......");
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

    console.log("waiting for authentication's success");
    await page.waitForNavigation(browserConfig);
    await waitForLoad;

    // Go to form table
    console.log("Opening oferta table page...");
    await page.goto(paths.oferta, browserConfig);
    await waitForLoad;

    // search data by filters...
    await searchData(page, options);
    // sleep 2
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

    // sleep 3

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
    popup = await newPagePromise;
    await popup.waitForSelector("#FieldSet1");
    console.log("loaded popup");

    // Screenshot
    console.log("Taking a screenshot");
    await screenshotPage(popup);

    return result;
  } finally {
    // Close
    if (popup) await popup.close();
    if (browser) await browser.close();
  }
}

//
exports.startScrap = async (event) => {
  const options = event.input;

  try {
    console.log("generating certification files from base64...");
    await generateCertsFromBase64(options);
    await initDirectories();
    const { status = "NODATA" } = await startBrowser(options);
    const { jsonresponse = {}, screenshotBase64 } =
      await getDatasFromDirectory();

    const data = {
      output: {
        status: status,
        jsonresponse,
        screenshotBase64: screenshotBase64
          ? "data:image/png;base64, " + screenshotBase64
          : "",
      },
    };

    return data;
  } catch (error) {
    console.log(error);

    const data = {
      output: {
        status: "ERROR",
        jsonresponse: {},
        screenshotBase64: "",
      },
    };
    return data;
  }
};
