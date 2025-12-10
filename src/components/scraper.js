import * as utilities from "./utilities.js";
import { XMLParser } from "fast-xml-parser";
const parser = new XMLParser();

import * as scraper from "./scrapers/index.js";

export const load_sitemap = async (url) => {
  const data = await utilities.get(url);
  const xml = await parser.parse(data);
  const entries = xml.urlset.url.map((url, i) => {
    return { path: url.loc, last_mod: url.lastmod };
  });

  await utilities.write_csv("../outputs/sitemap.txt", entries);
  return entries;
};

export const scrape_location_urls = async (location) => {
  return await Promise.all(
    location.pages.map((u) =>
      scrape({
        path: u,
        home: location.scorpion_url,
        name: location.location_name.replace(" ", "_"),
      })
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

  await utilities.write_csv("../outputs/corporate_pages.txt", content);

  return true;
};

export const scrape = async (page) => {
  console.log(`Starting scrape for ${page.path}`);
  const page_type = utilities.page_type(page.path);
  const template = utilities.scrape_template(page_type);
  try {
    const content = await scraper[template](page);

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
