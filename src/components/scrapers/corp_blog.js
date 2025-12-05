import * as utilities from "../utilities.js";

export default async (page) => {
  console.log(`Scraping content from ${page.path}.`);
  try {
    const $ = await utilities.read_dom(page.path);
    if (!$) return false;
    const html = $("html");
    const main = $("#MainZone");

    const sections = [
      {
        index: 0,
        headers: main.find("h1").text(),
        paragraphs: $("#MainZone article div p")
          .map((i, el) => {
            return `<p>${utilities.sanitize($(el).html().trim())}</p>`;
          })
          .get(),
      },
    ];

    const content = {
      location: "corporate",
      home_page: "https://www.servicemasterrestore.com/",
      page_url: page.path,
      last_modified: page.lastmod,
      meta_title: html.find("title").text(),
      meta_description: html.find("meta[name='description']").attr("content"),
      page_type: utilities.page_type(page.path),
      blog_category: main.find(".category").text() || "",
      sections: sections,
      images: html.find("figure img").attr("src"),
    };

    return content;
  } catch (err) {
    console.error(err);
    return false;
  }
};
