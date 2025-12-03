import { parseArgs } from "util";
import * as utilities from "./utilities.js";

export const scrape_corp_blog = async (url) => {
  try {
    const $ = await utilities.read_dom(url);

    const page = $("html");

    const main = $("#MainZone");

    const sections = [
      {
        index: 0,
        headers: main.find("h1").text(),
        paragraphs: $("#MainZone article div p")
          .map((i, el) => {
            return `<p>${$(el).html().trim()}</p>`;
          })
          .get(),
      },
    ];

    const content = {
      location: "corporate",
      home_page: "https://www.servicemasterrestore.com/",
      page_url: url,
      meta_title: page.find("title").text(),
      meta_description: page.find("meta[name='description']").attr("content"),
      page_type: utilities.page_type(url),
      blog_category: main.find(".category").text() || "",
      sections: sections,
      images: page.find("figure img").attr("src"),
    };

    return content;
  } catch (err) {
    console.error(err);
    return false;
  }
};

scrape_corp_blog(
  "https://www.servicemasterrestore.com/blog/flood-damage/what-documents-do-we-need-to-protect-/",
  "/",
  ""
);
