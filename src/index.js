import {
  scrape_location_urls,
  scrape_corporate_urls,
  load_sitemap,
} from "./components/scraper.js";

import locations from "./locations.json"  with { type: "json" };
const uat_group = locations.filter((l) => l.uat_group === true);

import corporate_urls from "./corporate.json" with {type: "json" };

(async () => {
  const sitemap = await load_sitemap(
    `https://www.servicemasterrestore.com/sitemap.xml`
  );

  
  uat_group.forEach(async (location) => {
    location.pages = sitemap.filter((url) => url.includes(location.scorpion_url));
    const loc_results = await scrape_location_urls(location);
  });

  /*
  const filtered = sitemap.filter((obj) => 
    corporate_urls.some((val) => obj.path.includes(val))
  ); 
  const corp_results =  await scrape_corporate_urls(filtered);
  */
})();
