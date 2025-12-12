import * as utilities from "./utilities.js";
import { XMLParser } from "fast-xml-parser";
const parser = new XMLParser();

import { pLimit } from "plimit-lit";
const limit = pLimit(10);

import * as scraper from "./scrapers/index.js";
import { copyFileSync } from "fs";

export const load_sitemap = async (url) => {
  const data = await utilities.get(url);
  const xml = await parser.parse(data);
  const entries = xml.urlset.url.map((url, i) => {
    return { id: i, path: url.loc, last_mod: url.lastmod };
  });

  await utilities.write_csv("../outputs/sitemap.txt", entries);
  return entries;
};
4;

/*
 pages is expect to be an array of page objects, containing path, home, and lastmod
*/
export const scrape_pages = async (pages) => {
  const results = await Promise.all(pages.map((p) => scrape(p)));

  return results;
};

export const scrape_location_pages = async (locations) => {
  const flattened = locations.flatMap((location) =>
    location.pages.map((page) => ({
      id: page.id,
      path: page.path,
      lastmod: page.last_mod,
      home: location.scorpion_url,
      name: location.location_name.replace(" ", "_"),
    }))
  );

  return await Promise.all(
    flattened.map((page) =>
      limit(() =>
        scrape(page.id, page.path, page.lastmod, page.home, page.name)
      )
    )
  );
};

export const scrape_corporate_urls = async (pages) => {
  const content = await Promise.all(
    pages.map((p) =>
      scraper.corp_blog(
        p,
        "https://www.servicemasterrestore.com/",
        "0000_corporate"
      )
    )
  );

  return content;
};

export const scrape = async (id, path, lastmod, home, name) => {
  console.log(`Starting scrape for ${path}`);

  const page_type = utilities.page_type(path);
  const page_category =
    page_type === "service" ? utilities.service_category(path) : "";
  const template = utilities.scrape_template(page_type);

  const content = await scraper[template]({
    id,
    path,
    lastmod,
    home,
    name,
    page_type,
    page_category,
  });

  return content;
};
