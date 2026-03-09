import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sanitizeHtml from "sanitize-html";
import * as cheerio from "cheerio";

import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const get = async (url) => {
  try {
    const options = {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      },
    };
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(response.statusText);
    return await response.text();
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const title_case = (str) => {
  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase(),
  );
};

const force_utf8 = (str) => {
  return Buffer.from(str, "utf8").toString("utf8");
};

const remove_line_breaks = (str) => {
  str = str.replaceAll("\n", "");
  str = str.replaceAll("\r", "");
  return str;
};

const remove_tabs = (str) => {
  return str.replaceAll("\t", " ");
};

const remove_empty_p = (str) => {
  return str.replaceAll("<p></p>", "");
};

export const sanitize = (
  str,
  html = false,
  tags = [
    "b",
    "i",
    "em",
    "strong",
    "a",
    "p",
    "br",
    "li",
    "ol",
    "ul",
    "img",
    "div",
  ],
) => {
  str = force_utf8(str);
  str = remove_line_breaks(str);
  str = remove_tabs(str);
  str = remove_empty_p(str);

  str = html
    ? sanitizeHtml(str, {
        allowedTags: tags,
        allowedAttributes: {
          a: ["href"],
          img: ["src", "alt", "data-src"],
        },
        allowedIframeHostnames: ["youtube.com"],
      })
    : str;

  return str;
};

const escapeCsv = (value) => {
  if (value == null) return "";
  const str = String(value);
  return /[,"\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export const write_rows = (filename, data) => {
  return Promise.all(data.map((r) => write_row(filename, r)));
};

export const write_row = async (file, data, delim = "\t") => {
  const filename = path.join(__dirname, file);
  const values = Object.values(data).map((v) => {
    return escapeCsv(v);
  });

  await fs.promises.appendFile(filename, values.join(delim).trim() + "\n");
};

export const write_header = async (file, data, delim = "\t") => {
  let filename = path.join(__dirname, file);
  await fs.promises.writeFile(filename, ""); // clear the file
  await fs.promises.writeFile(filename, Object.keys(data).join(delim) + "\n");
};

export const write_csv = async (file, data, delim = "\t") => {
  const filename = path.join(__dirname, file);
  if (!data || data.length === 0) return fs.promises.writeFile(filename, "");

  let headers, rows;

  if (Array.isArray(data[0])) {
    // Array of arrays: first row = headers
    [headers, ...rows] = data;
  } else {
    // Array of objects
    headers = Object.keys(data[0]);
    rows = data;
  }

  const lines = [
    headers.map(escapeCsv).join(delim),
    ...rows.map((row) =>
      headers
        .map((h) => {
          let val = Array.isArray(row) ? row[headers.indexOf(h)] : row[h];
          if (val && typeof val === "object") val = JSON.stringify(val);
          return escapeCsv(val);
        })
        .join(delim),
    ),
  ];

  await fs.promises.writeFile(filename, lines.join("\n"), "utf-8");
};

export const write_file = async (data, file) => {
  try {
    const filename = path.join(__dirname, file);
    await fs.promises.writeFile(filename, data.join("\n"), { flag: "w" });

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const read_dom = async (url) => {
  try {
    const data = await get(url);
    return cheerio.load(data);
  } catch (err) {
    console.error(err);
  }
};

export const page_type = (path, home = "/") => {
  const service_terms = [
    "damage",
    "trauma",
    "bio-hazard",
    "mold",
    "specialty-service",
    "pre-loss",
  ];

  if (`/${path}` == `${home}`) return "main";
  if (path.includes("blog")) return "blog";
  if (service_terms.some((t) => path.includes(t))) return "service";
  if (path.includes("areas-we-serve")) return "city";
  if (path.includes("team")) return "team";
  if (path.includes("contact")) return "contact";
  if (path.includes("about-us")) return "about";
  if (path.includes("career")) return "careers";
  if (path.includes("testimonials")) return "reviews";
  if (path.includes("faq")) return "faq";

  return "basic";
};

export const page_category = (url) => {
  if (["water-damage"].some((v) => url.includes(v))) return "water damage";
  if (["fire-damage", "fire-and-smoke-damage"].some((v) => url.includes(v)))
    return `fire damage`;
  if (["weather-damange", "storm-damage"].some((v) => url.includes(v)))
    return `weather damage`;
  if (["mold"].some((v) => url.includes(v))) return `mold remediation`;
  if (["trauma", "bio-hazard"].some((v) => url.includes(v)))
    return `bio-hazard`;
  if (["odor-damage"].some((v) => url.includes(v))) return `odor damange`;
  if (["pre-loss"].some((v) => url.includes(v))) return `pre-loss`;
  // ... else ...
  return `specialty`;
};

export const page_audience = (url) => {
  if (/\/residential\//i.test(url)) return "residential";
  if (/\/commercial\//i.test(url)) return "commercial";
  return "all";
};

export const classify_url = (url, home) => {
  const pattern = new RegExp(
    "^https?\:\/\/[^\/]+\/([^\/]+)?\/?(residential|commercial)\/([^/]+)(?:\/([^\/]+))?\/?$",
  );

  url = url.replaceAll("https://www.servicemasterrestore.com/", "");
  url = url.replace(/\/$/, "");
  const segments = url.split("/");

  const classification = {
    url: url,
    location:
      /commercial|residential|blog|blog-system|locations|why-us|video-center|dsi-locations|do-not-sell-or-share-my-personal-information|your-privacy-choices|privacy-policy|site-map/i.test(
        segments[0],
      )
        ? "corporate"
        : segments[0],
    page_type: page_type(url, home),
    city_sub_page: page_type(url) === "service" && /areas-we-serve/i.test(url),
    audience: page_audience(url) || "all",
    primary_category: "none",
    sub_category: "none",
  };

  if (classification.page_type === "service") {
    if (classification.location === "corporate") {
      classification.primary_category = segments[1];
      classification.sub_category = segments[2] || "";
    } else {
      classification.primary_category = segments[2];
      classification.sub_category = segments[3] || "";
    }
  }

  if (classification.page_type === "blog") {
    if (classification.location === "corporate") {
      classification.primary_category = segments[1];
    }
  }

  return classification;
};

export const define_page = (id, path, lastmod, home, name) => {
  const classification = classify_url(path, home);

  const page_type = classification.page_type;
  const page_audience = classification.audience;
  const page_category = classification.primary_category;

  return {
    id,
    path,
    lastmod,
    home,
    name,
    page_type,
    page_category,
    page_audience,
    classification,
  };
};

export const new_row = (page) => {
  return {
    location: page.name,
    page_id: page.id,
    paragraph_index: -1,
    home_page: page.home,
    last_modified: page.lastmod,
    page_url: page.path,
    page_type: page.classification.page_type,
    city_sub_page: page.classification.city_sub_page,
    primary_category: page.classification.primary_category,
    sub_category: page.classification.sub_category,
    page_audience: page.classification.audience,
    meta_title: page.title,
    meta_description: page.desc,
    header: null,
    paragraphs: "",
    sub_menu: null,
    images: null,
  };
};

export const scrape_template = (page_type) => {
  return "basic";
};

/*
console.log(
  classify_url(
    // "https://www.servicemasterrestore.com/servicemaster-services-tyler/areas-we-serve/smith-county/water-damage/",
    //"https://www.servicemasterrestore.com/servicemaster-fire-and-water-recovery-by-qrt/residential/specialty-services/trauma-and-biohazard/",
    //"https://www.servicemasterrestore.com/residential/specialty-services/",
    //"https://www.servicemasterrestore.com/blog/some-blog-title",
    // "https://www.servicemasterrestore.com/servicemaster-fire-and-water-recovery-by-qrt/commercial/pre-loss-planning/",
    // "https://www.servicemasterrestore.com/residential-reconstruction-services-faq/",
    "https://www.servicemasterrestore.com/blog/water-damage/navigating-water-damage-insurance-claims-vs-paying-out-of-pocket/",
  ),
);
*/
