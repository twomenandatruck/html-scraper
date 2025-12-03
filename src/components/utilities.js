import fetch from "node-fetch";
import fs, { read } from "fs";
import path, { parse } from "path";
import urlModule from "url";
import { fileURLToPath } from "url";
import sanitizeHtml from "sanitize-html";
import * as cheerio from "cheerio";

import { dirname } from "path";
import { json } from "stream/consumers";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const get = async (url) => {
  try {
    const response = await fetch(url, { method: "GET" });
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
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
};

export const page_type = (url) => {
  const service_terms = ["damage", "trauma", "bio-hazard", "services", "mold"];

  if (url.includes("blog")) return "blog";
  if (service_terms.some((t) => url.includes(t))) return "service";
  if (url.includes("areas-we-serve")) return "city";
  if (url.includes("team")) return "team";
  if (url.includes("contact")) return "contact";
  if (url.includes("about-us")) return "about";
  if (url.includes("career")) return "careers";
  if (url.includes("testimonials")) return "reviews";

  return "other";
};

const force_utf8 = (str) => {
  return Buffer.from(str, "utf8").toString("utf8");
};

const remove_line_breaks = (str) => {
  return str.replaceAll(/\r|\n/g, "");
};

const remove_tabs = (str) => {
  str = str.replaceAll(/\t/g, "");
  return str.replaceAll("\t", "");
};

export const sanitize = (str, html = false) => {
  str = force_utf8(str);
  str = remove_line_breaks(str);
  str = remove_tabs(str);

  str = html
    ? sanitizeHtml(str, {
        allowedTags: [
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
          "article",
        ],
        allowedAttributes: {
          a: ["href"],
        },
        allowedIframeHostnames: ["www.youtube.com"],
      })
    : str;

  return str;
};

export const write_csv = async (content, f = "pages.txt") => {
  try {
    const filename = path.join(__dirname, "../outputs/", f);

    const row = [];

    Object.values(content).forEach((c) => {
      if (typeof c !== "string") c = sanitize(JSON.stringify(c));
      if (typeof c === "string") c = sanitize(`"${c}"`, true);
      row.push(force_utf8(c));
    });

    await fs.promises.appendFile(filename, row.join("\t") + "\n");

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
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

export const empty_file = async (file = "../outputs/pages.txt") => {
  try {
    const filename = path.join(__dirname, file);
    const headers = [
      "location",
      "location_home",
      "page_path",
      "meta_title",
      "meta_description",
      "page_type",
      "content",
    ];
    await fs.promises.writeFile(filename, headers.join("\t") + "\n", {
      flag: "w",
    });
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
