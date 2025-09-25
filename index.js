const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const PORT = 3000;
const TARGET_URL = "http://omnissolucoes.com/teste3/";


/* 
<ul>
<li>0003 - Arquivo documento145 
<a href="FT1.pdf" codigo="FT1" download>
*/

const app = express();

async function extractFiles(url) {
  const { data } = await axios.get(url, { timeout: 10000 });
  const $ = cheerio.load(data);
  const base = new URL(url).href.replace(/\/[^/]*$/, "/");

  return $("a")
    .toArray()
    .map((el) => {
      const $el = $(el);
      const href = $el.attr("href");
      if (!href) return null;

      const name = $el.closest("li").text().trim() || $el.text().trim() || href;

      return {
        name,
        code: $el.attr("codigo"),
        fullUrl: new URL(href, base).toString(),
      };
    })
    .filter(Boolean);
}

app.get("/run", async (req, res) => {
  try {
    const items = await extractFiles(TARGET_URL);

    res.json({ ok: true, count: items.length, files: items });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);
