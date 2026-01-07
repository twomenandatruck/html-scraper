import {
  scrape_location_pages,
  scrape_corporate_urls,
  load_sitemap,
} from "./components/scraper.js";

import locations from "./locations.json"  with { type: "json" };
const uat_group = locations.filter((l) => l.uat_group === true);

import * as utilities from "./components/utilities.js";
import corporate_urls from "./corporate.json" with {type: "json" };

const run_local = async (sitemap) => {
   // find matching pages from the sitemap
  const results = uat_group.map(l => ({
    ...l,
    pages: sitemap.filter(p => p.path.includes(l.scorpion_url))
  }));

  const content_rows = (await scrape_location_pages(results)).flat();

  await utilities.write_csv("../outputs/pages.txt");                                    // clear text file
  await utilities.write_csv("../outputs/pages.txt", Object.keys(content_rows[0]));      // write headers to text file
  await utilities.write_csv("../outputs/pages.txt", content_rows);                      // write content to text file
}

const run_corp = async (sitemap) => {
  const filtered = sitemap.filter((obj) => 
    corporate_urls.some((val) => obj.path.includes(val))
  ); 
  const corp_results =  (await scrape_corporate_urls(filtered)).flat();

  await utilities.write_csv("../outputs/corp_pages.txt");
  await utilities.write_csv("../outputs/corp_pages.txt", Object.keys(corp_results[0]));
  await utilities.write_csv("../outputs/corp_pages.txt", corp_results);
}

(async () => {
  const sitemap = await load_sitemap(
    `https://www.servicemasterrestore.com/sitemap.xml`
  );

  // await run_local(sitemap);

  await run_corp(sitemap);
})();
