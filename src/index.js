import {
  scrape_location_pages,
  scrape_corporate_urls,
  scrape_map_links,
  load_sitemap,
} from "./components/scraper.js";

import locations from "./locations.json" with { type: "json" };
const test_group = locations.filter((l) => l.test_group === true);

import * as utilities from "./components/utilities.js";
import corporate_urls from "./corporate.json" with { type: "json" };

import exclusions from "./exclusions.json" with { type: "json" };

const map_links = async (locations) => {
  const results = locations
    .filter((l) => l["Has local webpage"])
    .map((l) => l["Website URL"]);

  const links = await scrape_map_links(results);
  console.log(links);
};

const run_local = async (sitemap) => {
  // find matching pages from the sitemap
  const results = locations
    .filter((l) => l["Has local webpage"])
    .map((l) => ({
      ...l,
      pages: sitemap.filter((p) => p.path.includes(l["Website URL"])),
    }));

  // use page, and row defining functions to create a header row
  let tmp = results[0];
  let first_page = utilities.new_row(
    utilities.define_page(
      tmp.pages[0].id,
      tmp.pages[0].path,
      tmp.pages[0].last_mod,
      tmp["Website URL"],
      tmp["Internal Location Name"],
    ),
  );

  let filename = "../outputs/location_pages.txt";

  // clear file and write headers
  await utilities.write_header(filename, first_page);
  first_page = null;

  // scrape pages
  await scrape_location_pages(results, filename);
};

const run_corp = async (sitemap) => {
  const filtered = sitemap.filter((obj) =>
    corporate_urls.some((val) => obj.path.includes(val)),
  );
  const corp_results = (await scrape_corporate_urls(filtered)).flat();

  await utilities.write_csv("../outputs/corp_pages.txt");
  await utilities.write_csv(
    "../outputs/corp_pages.txt",
    Object.keys(corp_results[0]),
  );
  await utilities.write_csv("../outputs/corp_pages.txt", corp_results);
};

const run_all = async (sitemap) => {
  const results = (await scrape_corporate_urls(sitemap)).flat();
  await utilities.write_csv("../outputs/all_pages.txt");
  await utilities.write_csv(
    "../outputs/all_pages.txt",
    Object.keys(results[0]),
  );
  await utilities.write_csv("../outputs/all_pages.txt", results);
};

(async () => {
  const sitemap = await load_sitemap(
    `https://www.servicemasterrestore.com/sitemap.xml`,
    //"https://www.srmcat.com/sitemap.xml",
    //"https://www.srmcat.ca/sitemap.xml"
  );

  // await run_local(sitemap);

  // await run_corp(sitemap);

  // await run_local(sitemap);

  const results = await map_links(locations);
  utilities.write_csv("../outputs/map_links.txt", results, "\t");
})();
