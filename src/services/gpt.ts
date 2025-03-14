"use server";
import { ContextDto } from "@/core/contextdto";
import OpenAI from "openai";
import pino from "pino";

////////////////////////////////////////////////////////////////////////////////

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

////////////////////////////////////////////////////////////////////////////////

export interface TickerDto {
  ticker: string;
  company: string;
}

////////////////////////////////////////////////////////////////////////////////

export async function createResponse(
  ctx: ContextDto,
  {
    model,
    selectedLang,
    input,
  }: {
    model: string;
    selectedLang: string;
    input: string;
  },
): Promise<TickerDto[]> {
  const logger = pino({ name: "createResponse" });
  logger.info({ ctx, model, selectedLang, input }, "received request");

  try {
    const resp = await client.responses.create({
      model,
      instructions: `Analyze the user insight and provide all possible ticker symbols and company names. The user insight is in ${selectedLang}. The output should be formateed as a list of english ticker symbols and company names in plain Json format without any decoration. Example result: [{"ticker": "AAPL","company": "Apple Inc."},{"ticker": "GOOGL","company": "Alphabet Inc."}]`,
      input,
    });
    logger.debug({ ctx, resp }, "response from openai");

    logger.info({ ctx }, "response from openai");
    const res = JSON.parse(resp.output_text);
    return res;
  } catch (err) {
    logger.error({ ctx, err }, "error from openai");
    throw err;
  }
}
