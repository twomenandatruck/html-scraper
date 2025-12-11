import {
  scrape_location_pages,
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
    // grab this locations sub pages
    location.pages = sitemap.filter(page => page.path.includes(location.scorpion_url));
    console.log(location.pages);
    exit();

    const loc_results = await scrape_location_pages(location);
    // console.log(results);
  });
  



  /*
  const filtered = sitemap.filter((obj) => 
    corporate_urls.some((val) => obj.path.includes(val))
  ); 
  const corp_results =  await scrape_corporate_urls(filtered);
  */
})();
