const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { pipeline } = require("stream/promises");
const { log } = require("console");

const PORT = 3000;
const TARGET_URL = "http://omnissolucoes.com/teste3/";

/* 
<ul>
<li>0003 - Arquivo documento145 
<a href="FT1.pdf" codigo="FT1" download>
*/

const LOG_FILE = path.join(__dirname, "error.log");
const DOWNLOAD_DIR = path.join(__dirname, "downloads");

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

async function downloadFile(file) {
  try {
    const url = new URL(file.fullUrl, TARGET_URL).toString();
    const filePath = path.join(DOWNLOAD_DIR, path.basename(file.fullUrl));

    const response = await axios.get(url, {
      responseType: "stream",
      timeout: 10000,
    });
    await pipeline(response.data, fs.createWriteStream(filePath));

    return filePath;
  } catch (err) {
    const status = err.response?.status;
    if (status === 404 || status === 403) {
      logError(`Arquivo não encontrado: ${file.fullUrl} (${status})`);
    } else {
      logError(`Erro ao baixar ${file.fullUrl}: ${err.message}`);
    }
    return null;
  }
}

async function createZip(files) {
  return new Promise((resolve, reject) => {
    const zipPath = path.join(DOWNLOAD_DIR, "arquivos.zip");
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve(zipPath));
    archive.on("error", reject);

    archive.pipe(output);

    files.forEach((filePath) => {
      const name = path.basename(filePath);
      archive.file(filePath, { name });
    });

    archive.finalize();
  });
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

app.get("/download", async (req, res) => {
  try {
    const filesToDownload = await extractFiles(TARGET_URL);

    const downloadedFiles = [];

    for (const file of filesToDownload) {
      const filePath = await downloadFile(file);

      if (filePath) downloadedFiles.push(filePath);
    }

    if (downloadedFiles.length === 0) {
      return res
        .status(404)
        .json({ message: "Nenhum arquivo disponível para download." });
    }

    const zipPath = await createZip(downloadedFiles);
    res.download(zipPath, "arquivos.zip");
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);
