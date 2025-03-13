"use server";
import axios from "axios";

const fetcher = axios.create({
  baseURL: "https://financialmodelingprep.com/api",
});

const regionKeyExs: Record<string, Set<string>> = {
  us: new Set(["NASDAQ", "NYSE"]),
  hk: new Set(["HKEX"]),
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

export async function getMostReleventSearchTickerSymbol(
  query: string,
  region: string,
): Promise<SearchTickerSymbolItemDto | null> {
  try {
    const { data } = (await fetcher.get(`/v3/search`, {
      params: {
        apikey: process.env.FMP_API_KEY,
        query,
        limit: 10,
      },
    })) as SearchTickerSymbolResponseDto;
    console.log(data);

    if (!data.length) return null;

    const exs = regionKeyExs[region];
    const ticker = data.find((d) => exs.has(d.exchangeShortName));
    if (!ticker) return null;

    return ticker;
  } catch (error) {
    console.error(error);
    return null;
  }
}
