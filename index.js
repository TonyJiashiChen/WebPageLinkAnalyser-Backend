const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const urlModule = require("url");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post("/url", async (req, res) => {
  console.log("I've been called");

  const { url } = req.body;
  const links = await getRes(url);

  res.status(201).json({ links });
});

const getRes = async (url) => {
  const res = await axios.get(url);
  const html = res.data;
  const $ = cheerio.load(html);

  // Extract links
  const links = [];
  // Use a traditional for loop to iterate over elements
  for (let index = 0; index < $("a").length; index++) {
    const element = $("a")[index];
    const href = $(element).attr("href");
    const opensInNewTab = $(element).attr("target") === "_blank";

    // Perform asynchronous operations inside the loop using await
    try {
      const linkStatus = await checkLinkStatus(url, href);
      links.push({
        href: urlModule.resolve(url, href),
        opensInNewTab,
        status: linkStatus,
      });
    } catch (error) {
      console.error(`Error checking link status for ${href}:`, error.message);
    }
  }

  // Wait for all asynchronous link checks to complete
  await Promise.all(links.map((link) => link.status));

  return links;
};

const checkLinkStatus = async (baseURL, relativeURL) => {
  const fullURL = urlModule.resolve(baseURL, relativeURL);

  try {
    const response = await axios.head(fullURL);
    return response.status;
  } catch (e) {
    return e.response ? e.response.status : 500;
  }
};

app.listen(8000, () => {
  console.log("app listening on 8000");
});
