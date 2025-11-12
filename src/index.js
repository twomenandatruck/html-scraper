import { scrape } from "./components/scrapper.js";

const pages = [
  "https://www.servicemasterrestore.com/grand-rapids",
  "https://www.servicemasterrestore.com/servicemaster-restoration-by-the-disaster-response-experts/",
];

(async () => {
  const results = [];
  pages.forEach((p) => {
    results.push(scrape(p));
  });
})();
