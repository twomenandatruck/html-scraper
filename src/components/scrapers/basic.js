import * as utilities from "../utilities.js";

export default async (page) => {
  try {
    const $ = await utilities.read_dom(page.path);
    const html = $("html");
    const mainContent = $(
      "#MainContent, #ReviewsSystemV1List, #BlogEntry, #ArticlesEntry"
    );

    const title = $("title").text();

    const content = {
      location: page.name,
      home_page: page.home,
      page_url: page.path,
      meta_title: title,
      meta_description: html.find("meta[name='description']").attr("content"),
      page_type:
        page.path == page.home ? "main" : utilities.page_type(page.path),
      sections: [],
      images: [],
    };

    const headers = mainContent
      .find("h1,h2,h3,h4,h5")
      .map((i, el) => {
        return {
          tag: $(el).prop("tagName"),
          text: $(el).text().trim(),
        };
      })
      .get();

    let n = 0;
    const sections = [];
    while (n < headers.length) {
      const content = $(`${headers[n].tag}:contains(${headers[n].text})`)
        .nextUntil("H1,H2,H3,H4,H5")
        .map((i, el) => {
          return `<p>${utilities.sanitize($(el).html().trim(), true)}</p>`;
        })
        .get();

      sections.push({
        index: n,
        header: utilities.title_case(headers[n].text),
        paragraphs: content.join(),
      });

      n++;
      if (n === headers.length) break;
    }
    content.sections = sections;

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
    return content;
  } catch (err) {
    console.error(err);
    return false;
  }
};
