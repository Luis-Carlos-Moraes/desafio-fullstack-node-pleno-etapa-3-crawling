# Etapa 3 (Crawling/Extração – Node.js)

## Desafio

Desenvolver uma solução em **Node.js** que **extraia informações** da página alvo, **baixe** os arquivos encontrados, **unifique** e disponibilize um **link de download** do arquivo unificado.

**Tempo sugerido:** \~30 min
**Stack:** Node.js (JavaScript, sem TypeScript) + bibliotecas de scraping/download à sua escolha (ex.: `axios`/`node-fetch`, `cheerio` ou `puppeteer`).

## Página alvo

* **URL:** `http://omnissolucoes.com/teste3/`

## Informações a extrair

* **Nome dos arquivos** listados.
* **URLs completas** desses arquivos.
* **Códigos** dos arquivos.

## Funcionalidades obrigatórias

1. **Extração**: coletar nomes, URLs e códigos a partir da página.
2. **Download**: baixar **todos** os arquivos identificados para uma pasta local (`downloads/`).
3. **Unificação**: gerar **um único arquivo** com todos os arquivos baixados:

   * Preferencial: **ZIP** (ex.: com a lib `archiver`).
   * Alternativa aceitável (para `.txt`): concatenação em um único `.txt`.
4. **Link de Download**: expor um endpoint HTTP (ex.: **`GET /download`**) que retorne o arquivo unificado.

> **Boas práticas:** lidar com timeouts, retries simples e mudanças leves no HTML da página alvo.

## Como começar

```bash
mkdir etapa-3-crawling && cd etapa-3-crawling
npm init -y
npm i axios cheerio express archiver dotenv
# opcional: puppeteer (se preferir headless browser)
# npm i puppeteer
```

## Estrutura sugerida

```
etapa-3-crawling/
  src/
    server.js            (expor /extract e /download)
    extractor.js         (lógica de scraping)
    downloader.js        (download em lote, com retries)
    zipper.js            (gera ZIP/unificado)
    logger.js            (logs simples)
  downloads/             (arquivos baixados)
  output/
    unificado.zip        (ou unificado.txt)
  .env.example
  README.md
```

### `.env.example`

```
PORT=3002
TARGET_URL=http://omnissolucoes.com/teste3/
```

## Endpoints sugeridos

* **GET `/extract`** → retorna JSON com `{ arquivos: [{ nome, url, codigo }] }`.
* **POST `/download`** → realiza o download em lote (ou dispara um job simples) e retorna status/sumário.
* **GET `/download`** → retorna o **arquivo unificado** (ex.: `application/zip`).

> Você pode unificar o fluxo em um único endpoint se preferir. O importante é conseguir **extrair**, **baixar** e **disponibilizar** o **unificado**.

## Como rodar localmente

```bash
cp .env.example .env
npm install
npm start
# servidor em http://localhost:3002

# 1) ver a extração
curl http://localhost:3002/extract

# 2) baixar (separado, caso implemente assim)
curl -X POST http://localhost:3002/download

# 3) baixar o arquivo unificado
curl -L http://localhost:3002/download --output unificado.zip
```

## Tratamento de erros (mínimo esperado)

* Timeout na página alvo.
* Link quebrado (404/403) durante download – ignorar arquivo específico e prosseguir, registrando em log.
* Falha na criação do ZIP – retornar erro claro e não travar o servidor.

## Critérios de avaliação

* **Funcionalidade:** extrair, baixar, unificar e servir o arquivo final.
* **Qualidade do Código:** organização por módulos (extração, download, unificação), nomes claros.
* **Tratamento de Erros:** mensagens úteis, resiliência a pequenas mudanças na página.
* **Documentação:** README objetivo (instalação, execução, uso).

## Entrega

* Publique em **repositório público** no GitHub e envie o link.

---

Se quiser, eu também preparo três **`.env.example`** e **sugestões de commits** padronizados (feat/chore/docs) para cada etapa.
