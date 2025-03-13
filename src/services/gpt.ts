"use server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TickerDto {
  ticker: string;
  company: string;
}

export async function createResponse({
  model,
  selectedLang,
  input,
}: {
  model: string;
  selectedLang: string;
  input: string;
}): Promise<TickerDto[]> {
  const resp = await client.responses.create({
    model,
    instructions: `Analyze the user insight and provide all possible ticker symbols and company names. The user insight is in ${selectedLang}. The output should be formateed as a list of english ticker symbols and company names in plain Json format without any decoration. Example result: {"ticker": "AAPL","company": "Apple Inc."}`,
    input,
  });
  //   console.log(resp);
  const res = JSON.parse(resp.output_text);
  return res;
}
