import {
  get,
  title_case,
  page_type,
  write_csv,
  write_file,
} from "./utilities.js";
import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";
const parser = new XMLParser();

import fs, { read } from "fs";
import path, { parse } from "path";
import urlModule from "url";
import { fileURLToPath } from "url";

import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const read_dom = async (url) => {
  try {
    const data = await get(url);
    return cheerio.load(data);
  } catch (err) {
    console.error(err);
  }
};

export const load_sitemap = async (url) => {
  const data = await get(url);
  const xml = await parser.parse(data);
  const urls = xml.urlset.url.map((url, i) => {
    return url.loc;
  });

  await write_file(urls, "../outputs/sitemap.csv");
  return urls;
};

export const scrape_loation_urls = async (location, callback) => {
  return await Promise.all(
    location.pages.map((u) =>
      scrape(u, location.scorpion_url, location.location_name.replace(" ", "_"))
    )
  );
};

export const scrape = async (url, home_url, filename) => {
  console.log(`Starting scrape for ${url}`);
  try {
    const $ = await read_dom(url);
    const page = $("html");
    const mainContent = $("#MainContent, #ReviewsSystemV1List, #BlogEntry");

    const title = page.find("title").text();

    const content = {
      location: filename,
      home_page: home_url,
      page_url: url,
      meta_title: title,
      meta_description: page.find("meta[name='description']").attr("content"),
      page_type: url == home_url ? "main" : page_type(url),
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

    /*
    const imageDir = path.join(
      __dirname,
      "../outputs/images",
      new URL(url).hostname
    );

   
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
    */

    await write_csv(content);

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};
