import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import urlModule from "url";
import { fileURLToPath } from "url";

import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const title_case = (str) => {
  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
};

export async function scrape(url) {
  console.log(`Starting scrape for ${url}`);
  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) throw new Error(response.statusText);
    const data = await response.text();

    const $ = cheerio.load(data);
    const page = $("html");
    const mainContent = $("#MainContent");

    const content = {
      url: url,
      meta: {
        title: page.find("title").text(),
        description: page.find("meta[name='description']").attr("content"),
      },
      sections: [],
      images: [],
    };

    const headers = mainContent
      .find("h1,h2,h3,h4,h5")
      .map((i, el) => {
        return {
          tag: $(el).prop("tagName"),
          text: $(el).text().trim(),
        };
      })
      .get();

    let n = 0;
    const sections = [];
    while (n < headers.length) {
      const content = $(`${headers[n].tag}:contains(${headers[n].text})`)
        .nextUntil("H1,H2,H3,H4,H5")
        .map((i, el) => {
          return `<p>${$(el).html().trim()}</p>`;
        })
        .get();

      sections.push({
        index: n,
        header: title_case(headers[n].text),
        paragraphs: content.join(),
      });

      n++;
      if (n === headers.length) break;
    }

    content.sections = sections;

    const imageDir = path.join(__dirname, "images", new URL(url).hostname);

    await fs.mkdir(imageDir, { recursive: true });

    await Promise.all(
      page
        .find("#MainContent img")
        .map(async (i, el) => {
          let src = $(el).attr("src");
          if (src) {
            src = urlModule.resolve(url, src);
            content.images.push(src);
            const imgPath = path.join(imageDir, path.basename(src));
            const response = await fetch(src, { method: "GET" });
            const buffer = await response.buffer();
            fs.writeFileSync("image.jpg", buffer);
          }
        })
        .get()
    );

    console.log(JSON.stringify(content, null, 2));
    return content;
  } catch (err) {
    console.error(err);
    return null;
  }
}
