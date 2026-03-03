import * as utilities from "../utilities.js";

export default async (url) => {
  try {
    const $ = await utilities.read_dom(
      `https://www.servicemasterrestore.com${url}/`,
    );
    let hasMap = await $('meta[itemprop="hasMap"]').prop("content");
    return hasMap;
  } catch (err) {
    return err;
  }
};
