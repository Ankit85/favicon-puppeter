import { AirtableConf } from "./conf.js";
import axios from "axios";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

async function getURLfromAirtable() {
  const headers = {
    Authorization: `Bearer ${AirtableConf.BEARER_TOKEN}`,
  };

  try {
    let airtableProductURLList = [];
    let offset = null;
    do {
      const response = await axios.get(
        `${AirtableConf.BASE_URL}/${AirtableConf.BASE_ID}/${AirtableConf.TABLE_ID}`,
        {
          headers,
          params: {
            offset,
          },
        }
      );

      if (response.status === 200) {
        const records = await response.data["records"];
        const websiteList = await records.map(
          (item) => item.fields.WebsiteLink
        );
        airtableProductURLList.push(...websiteList);
        offset = response.data.offset;
      }
    } while (offset);

    return airtableProductURLList;
  } catch (error) {
    throw new Error("Error while fetching airtable records: ==> ", error);
  }
}
function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}
async function runPuppeterScript(url) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox"],
  });

  try {
    const page = await browser.newPage();

    console.log("url", url.split("/")[2]);
    // Set up download behavior
    const downloadPath = path.resolve(`./downloads/${url.split("/")[2]}`);
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath);
    }

    // Configure Puppeteer to use the download path
    await page._client().send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadPath,
    });

    // Extract domain name from URL
    const domain = new URL(url).hostname;

    await page.goto("http://www.getfavicon.org/", {
      waitUntil: "networkidle0",
    });
    await page.setViewport({ width: 1080, height: 1024 });

    const inputElement = await page.$("#inputurl");
    const submitElement = await page.$("#submitbutton");

    if (inputElement && submitElement) {
      console.log(`Processing: ${url}`);
      await inputElement.type(url);
      await submitElement.click();

      // Wait for the download link to appear
      /*   await page.waitForSelector('a[href$=".png"], a[href$=".ico"]', {
        timeout: 30000,
      }); */
      await delay(4000);
    } else {
      console.log(`Input element not found for URL: ${url}`);
    }
  } catch (error) {
    console.error(`Error processing ${url}: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    const res = await getURLfromAirtable();
    console.log(`Airtable has total website length: ${res.length}`);
    /* for (const url of res) {
      await runPuppeterScript(url);
    } */
    await runPuppeterScript(res[0]);
  } catch (error) {
    console.error(`Error in main function: ${error.message}`);
  }
}

main()
  .then(() => console.log("Script execution completed."))
  .catch((er) => console.error("Error in main execution:", er));
