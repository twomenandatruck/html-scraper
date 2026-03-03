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

export const scrape_location_pages = async (locations, filename) => {
  const flattened = locations.flatMap((location) =>
    location.pages.map((page) => ({
      id: page.id,
      path: page.path,
      lastmod: page.last_mod,
      home: location["Website URL"],
      name: location["Internal Location Name"].replace(" ", "_"),
    })),
  );

  return await Promise.all(
    flattened.map((page) =>
      limit(() =>
        scrape(
          page.id,
          page.path,
          page.lastmod,
          page.home,
          page.name,
          filename,
        ),
      ),
    ),
  );
};

export const scrape_corporate_urls = async (pages, filename) => {
  return await Promise.all(
    pages.map((p) =>
      limit(() =>
        scrape(
          p.id,
          p.path,
          p.lastmod,
          "https://www.servicemasterrestore.com/",
          "corporate",
          filename,
        ),
      ),
    ),
  );
};

export const scrape = async (id, path, lastmod, home, name, filename) => {
  const classification = utilities.classify_url(path, home);

  const page_type = classification.page_type;
  const page_audience = classification.audience;
  const page_category = classification.primary_category;
  const template = utilities.scrape_template(page_type);

  let content = await scraper[template]({
    id,
    path,
    lastmod,
    home,
    name,
    page_type,
    page_category,
    page_audience,
    classification,
  });

  if (!content || !Array.isArray(content)) return false;
  content.sort((a, b) => a.paragraph_index - b.paragraph_index);

  //console.log(content);
  //exit();

  return await utilities.write_rows(filename, content);
};

export const scrape_map_links = async (urls) => {
  return await Promise.all(
    urls.map(async (u) => {
      return { path: u, map_link: await scraper["map_links"](u) };
    }),
  );
};

/**** Use this for testing an individual page */
/*
console.log(
  await scrape(
    1,
    "https://www.servicemasterrestore.com/servicemaster-of-tacoma/",
    "2025-01-02",
    "https://www.servicemasterrestore.com/servicemaster-of-tacoma/",
    "tacoma"
  )
);
*/
