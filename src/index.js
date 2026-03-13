import {
  scrape_location_pages,
  scrape_corporate_urls,
  scrape_map_links,
  load_sitemap,
} from "./components/scraper.js";

import locations from "./locations.json" with { type: "json" };
const test_group = locations.filter((l) => l.test_group === true);

import * as utilities from "./components/utilities.js";

import exclusions from "./exclusions.json" with { type: "json" };
import { cpSync } from "fs";

const map_links = async (locations) => {
  const results = locations
    .filter((l) => l["Has local webpage"])
    .map((l) => l["Website URL"]);

  const links = await scrape_map_links(results);
  await utilities.write_csv("../outputs/map_links.txt", links, "\t");
};

const run_local = async (sitemap, filename) => {
  // find matching pages from the sitemap
  const results = locations
    .filter((l) => l["Has local webpage"] == 1)
    .map((l) => ({
      ...l,
      pages: sitemap.filter((p) => p.path.includes(`${l["Website URL"]}/`)),
    }))
    .filter((r) => r.pages.length > 0);
    
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

  // clear file and write headers
  await utilities.write_header(filename, first_page);
  first_page = null;

  // scrape pages
  await scrape_location_pages(results, filename);
};

const run_all = async (sitemap, home_path, filename) => {
  // use page, and row defining functions to create a header row
  let first_page = utilities.new_row(
    utilities.define_page(
      sitemap[0].id,
      sitemap[0].path,
      sitemap[0].last_mod,
      home_path,
      "corporate",
    ),
  );

  // clear file and write headers
  await utilities.write_header(`../outputs/${filename}`, first_page);
  first_page = null;

  // scrape pages
  await scrape_corporate_urls(sitemap, home_path, filename);
};

(async () => {
  const sitemap = await load_sitemap(
    `https://www.servicemasterrestore.com/sitemap.xml`,
    //"https://www.srmcat.com/sitemap.xml",
    // "https://www.srmcat.ca/sitemap.xml",
  );

  const exclusionSet = new Set(exclusions);
  const filtered = sitemap.filter((p) => {
    let path = p.path.replace("https://www.servicemasterrestore.com", "");
    return !exclusionSet.has(path);
  });

  const location_pages = utilities.location_pages(filtered, locations);
  const corporate_pages = utilities.corporate_pages(filtered, locations);
  const team_pages = utilities.team_pages(filtered, locations);

  await utilities.write_json(
    corporate_pages,
    "../outputs/corporate_pages.json",
  );
  await utilities.write_json(location_pages, "../outputs/location_pages.json");
  await utilities.write_json(team_pages, "../outputs/team_pages.json");

  //await run_local(location_pages, "../outputs/location_pages.txt");

  await run_local(team_pages, "../outputs/team_pages.txt");

  // await run_all( corporate_pages, "https://www.servicemaster.com/", "../outputs/corporate_pages.txt", );

  // await map_links(locations);
})();
