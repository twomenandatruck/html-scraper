import {
  scrape,
  scrape_loation_urls,
  load_sitemap,
} from "./components/scraper.js";

import {empty_file} from "./components/utilities.js";

import locations from "./locations.json"  with { type: "json" };
const uat_group = locations.filter((l) => l.uat_group === true);

(async () => {
  await empty_file();

  const sitemap = await load_sitemap(
    `https://www.servicemasterrestore.com/sitemap.xml`
  );

  uat_group.forEach(async (location) => {
    location.pages = sitemap.filter((url) => url.includes(location.scorpion_url));
    const results = await scrape_loation_urls(location, "output_content");
    // console.log(results);
  });
})();
