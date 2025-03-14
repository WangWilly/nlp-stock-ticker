"use server";
import { ContextDto } from "@/core/contextdto";
import axios from "axios";
import pino from "pino";

////////////////////////////////////////////////////////////////////////////////

const fetcher = axios.create({
  baseURL: "https://financialmodelingprep.com/api",
});

////////////////////////////////////////////////////////////////////////////////

const regionKeyExs: Record<string, Set<string>> = {
  us: new Set(["NASDAQ", "NYSE"]),
  hk: new Set(["HKEX", "HKSE"]),
  china: new Set(["SSE", "SZSE"]),
  global: new Set(["NASDAQ", "NYSE", "HKEX", "SSE", "SZSE"]),
};

export interface SearchTickerSymbolItemDto {
  symbol: string;
  name: string;
  currency: string;
  stockExchange: string;
  exchangeShortName: string;
}

interface SearchTickerSymbolResponseDto {
  data: SearchTickerSymbolItemDto[];
}

////////////////////////////////////////////////////////////////////////////////

export async function getMostReleventSearchTickerSymbol(
  ctx: ContextDto,
  query: string,
  region: string,
): Promise<SearchTickerSymbolItemDto | null> {
  const logger = pino({ name: "getMostReleventSearchTickerSymbol" });
  logger.info({ ctx, query, region }, "received request");

  try {
    const { data } = (await fetcher.get(`/v3/search`, {
      params: {
        apikey: process.env.FMP_API_KEY,
        query,
        limit: 10,
      },
    })) as SearchTickerSymbolResponseDto;
    logger.debug({ ctx, data }, "search result");

    if (!data.length) {
      logger.warn({ ctx }, "no data found");
      return null;
    }

    const exs = regionKeyExs[region];
    const ticker = data.find((d) => exs.has(d.exchangeShortName));
    if (!ticker) {
      logger.warn({ ctx, data, region }, "no ticker found");
      return null;
    }

    logger.info({ ctx }, "found ticker");
    return ticker;
  } catch (err) {
    logger.error({ ctx, err }, "error occurred");
    return null;
  }
}
