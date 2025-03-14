# NLP for stock ticker discovery ([Demo](https://nlp-stock-ticker.vercel.app/))

[<img src="./public/android-chrome-512x512.png" width="200" height="200" />](https://nlp-stock-ticker.vercel.app/)

## Introduction

This is a project to discover stock tickers from a given text. NextJS is used for the frontend.

## How to run

1. Clone the repository
2. Copy the `.env.example` file to `.env` and fill in the values
3. Run `npm install`
4. Run `npm run dev`

## How to deploy locally

1. Run `npm run build`
2. Run `npm run start`

## How to deploy on Vercel

1. Create a new project on Vercel
2. Connect the repository
3. Fill in the environment variables
4. Set the root directory to `./`
5. Deploy

## Tested on these sample texts

```txt
Query Location                         Expected         Output
"Find me Apple stock price"            US               AAPL
"港股阿里巴巴上升趨勢"                    HK               9988.HK
"Thoughts on HSBC"                     US               HSBC
"Thoughts on HSBC"                     HK               0005.HK
"compare BABA and NVDA"                Global           BABA, NVDA
"Microsft stock" (example of a typo)   US               MSFT
"random text"                          Global           No tickers found
"茅台股票" (Moutai stock)               China            600519.SS
```

## References

- https://site.financialmodelingprep.com/developer/docs/stable
- https://nextjs.org/docs/app/getting-started/installation
- https://vercel.com
- https://github.com/openai/openai-node
- https://platform.openai.com/docs/api-reference/authentication
