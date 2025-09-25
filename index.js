const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const TARGET_URL = "http://omnissolucoes.com/teste3/";

/* 
<ul>
<li>0003 - Arquivo documento145 
<a href="FT1.pdf" codigo="FT1" download>
*/

const LOG_FILE = path.join(__dirname, "error.log");

const app = express();

function logError(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  fs.appendFileSync(LOG_FILE, logMessage);
}

async function extractFiles(url) {
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);

    const items = [];

    $("li").each((_, li) => {
      const $li = $(li);
      const text = $li.clone().children().remove().end().text().trim();

      const [code, ...nameParts] = text.split(/\s*-\s*/);
      const name = nameParts.join(" - ").trim();
      const href = $li.find("a").attr("href");

      if (!code || !name || !href) {
        logError(`Formato inesperado no <li>: "${text}"`);
        return;
      }

      const fullUrl = href ? new URL(href, TARGET_URL).href : null;

      items.push({ code, name, fullUrl });
    });

    return items;
  } catch (err) {
    logError(`Erro ao acessar ${url}: ${err.message}`);

    throw new Error(`Falha ao acessar a página alvo: ${err.message}`);
  }
}

(async () => {
  try {
    const files = await extractFiles(TARGET_URL);
    console.log(`Arquivos encontrados: ${files.length}`);
    console.table(files);
  } catch (err) {
    console.error(err.message);
  }
})();

app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);
