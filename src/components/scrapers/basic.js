import * as utilities from "../utilities.js";

const new_row = (page) => {
  return {
    location: page.name,
    page_id: page.id,
    paragraph_index: -1,
    home_page: page.home,
    last_modified: page.lastmod,
    page_url: page.path,
    page_type: page.page_type,
    page_category: page.page_category,
    page_audience: page.page_audience,
    meta_title: page.title,
    meta_description: page.desc,
    header: null,
    paragraphs: "",
    sub_menu: null,
    images: null,
  };
};

export default async (page) => {
  try {
    const $ = await utilities.read_dom(page.path);
    const html = $("html");

    page.title = utilities.sanitize($("title").text());
    page.desc = utilities.sanitize(
      html.find("meta[name='description']").attr("content")
    );

    const rows = [];

    // check for a sub-nav on the page
    const sub_menu = $("#SideNav")
      .find("ul:first-child")
      .map((i, el) => {
        return utilities.sanitize(`<li>${$(el).html().trim()}</li>`, true);
      })
      .get();

    if (sub_menu.length > 0) {
      rows.push({
        location: page.name,
        page_id: page.id,
        paragraph_index: -1,
        home_page: page.home,
        last_modified: page.lastmod,
        page_url: page.path,
        page_type: page.page_type,
        page_category: page.page_category,
        page_audience: page.page_audience,
        meta_title: page.title,
        meta_description: page.desc,
        header: "sub-menu",
        paragraphs: "",
        sub_menu: `<ul>${sub_menu.join("")}</ul>`,
        images: null,
      });
    }

    // look for the content elements on the page
    const mainContent = $(
      "#LocalValuesV1, #LocalContentV1Content, #ReviewsSystemV1List, #BlogEntry, #ArticlesEntry, #MainContent, #ContentZone, #LocalStaffSystemV1"
    );
    const elements = mainContent
      .find("h1,h2,h3,h4,h5,p,ul")
      .map((i, el) => {
        return {
          tag: $(el).prop("tagName").toLowerCase(),
          value: $(el).html(),
        };
      })
      .get();

    let row = new_row(page);
    let h = 0;
    let i = 0;
    while (i < elements.length) {
      const el = elements[i];

      if (el.tag == "p" || el.tag == "ul") {
        // another paragraph tag, add it!
        row.paragraphs += `<${el.tag}>${utilities.sanitize(el.value, true)}</${
          el.tag
        }>`;
      }

      if (el.tag.includes("h")) {
        if (i > 0) {
          // this is a new header, push all paragraphs and reset collection.
          rows.push(row);
          row = new_row(page);
        }

        // asign the new header
        row.header = `<${el.tag}>${utilities.sanitize(el.value, true, [
          "img",
        ])}</${el.tag}>`;
        row.paragraph_index = h++;
      }

      if (i > elements.length) break;
      i++;
    }
    // push remaining content into rows
    rows.push(row);

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
