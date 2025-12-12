import * as utilities from "../utilities.js";

export default async (page) => {
  try {
    const $ = await utilities.read_dom(page.path);
    const html = $("html");
    const mainContent = $(
      "#LocalValuesV1, #LocalContentV1Content, #ReviewsSystemV1List, #BlogEntry, #ArticlesEntry, #MainContent, #ContentZone"
    );

    const title = $("title").text();

    const rows = [];
    const headers = mainContent
      .find("h1,h2,h3,h4,h5")
      .map((i, el) => {
        return {
          tag: $(el).prop("tagName").toLowerCase(),
          text: $(el).html().trim(),
        };
      })
      .get();

    let n = 0;
    while (n < headers.length) {
      const paragraphs = $(`${headers[n].tag}:contains(${headers[n].text})`)
        .nextUntil("H1,H2,H3,H4,H5")
        .map((i, el) => {
          return utilities.sanitize(`<p>${$(el).html().trim()}</p>`);
        })
        .get();

      rows.push({
        location: page.name,
        home_page: page.home,
        last_modified: page.lastmod,
        page_id: page.id,
        page_url: page.path,
        meta_title: title,
        meta_description: html.find("meta[name='description']").attr("content"),
        page_type: page.page_type,
        service_category: page.page_category,
        header: `<${headers[n].tag.toLowerCase()}>${utilities.title_case(
          headers[n].text
        )}</${headers[n].tag.toLowerCase()}>`,
        paragraphs: paragraphs.join(),
        images: [],
      });

      n++;
      if (n === headers.length) break;
    }

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

    return rows;
  } catch (err) {
    console.error(err);
    return false;
  }
};
