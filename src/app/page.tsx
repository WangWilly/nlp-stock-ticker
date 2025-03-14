"use client";

import {
  getTickerSymbolByCompanyNameOrPartialSymbol,
  SearchTickerSymbolItemDto,
} from "@/services/fmp";
import { createResponse } from "@/services/gpt";
import { ContextDto } from "@/core/contextdto";

import { v4 } from "uuid";
import pino from "pino";

import {
  NextUIProvider,
  Textarea,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
} from "@nextui-org/react";
import { useMemo, useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/dropdown";
import { Button } from "@nextui-org/button";

////////////////////////////////////////////////////////////////////////////////

export default function Home() {
  const [selectedRegions, setSelectedRegions] = useState(new Set(["china"]));
  const regionKeyValues = {
    us: "The United States",
    hk: "Hong Kong",
    china: "China",
    global: "Global",
  };
  const selectedValue = useMemo(
    () =>
      regionKeyValues[
        Array.from(selectedRegions)[0] as keyof typeof regionKeyValues
      ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedRegions],
  );

  //////////////////////////////////////////////////////////////////////////////

  const [selectedLang, setSelectedLang] = useState(new Set(["sc"]));
  const langKeyValues = {
    en: "English",
    sc: "简体中文",
    tc: "繁體中文",
  };
  const selectedLangValue = useMemo(
    () =>
      langKeyValues[Array.from(selectedLang)[0] as keyof typeof langKeyValues],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedLang],
  );

  //////////////////////////////////////////////////////////////////////////////

  const [userInsight, setUserInsight] = useState("");

  //////////////////////////////////////////////////////////////////////////////

  const [resultJson, setResultJson] = useState<
    SearchTickerSymbolItemDto[] | null
  >([]);

  const [isLoading, setIsLoading] = useState(false);
  const onClickSubmit = async () => {
    const userCtx: ContextDto = {
      uuid: v4(),
    };
    const logger = pino({ name: "onClickSubmit" });
    logger.info({ userCtx }, "new user");

    ////////////////////////////////////////////////////////////////////////////

    logger.info({ userCtx, userInsight }, "submitting request");
    setIsLoading(true);
    try {
      const response = await createResponse(userCtx, {
        model: "gpt-4o-mini",
        selectedLang: selectedLangValue,
        input: userInsight,
      });
      logger.debug({ userCtx, response }, "response from openai");

      const tickerSymbols = (
        await Promise.allSettled(
          response.map((r) =>
            getTickerSymbolByCompanyNameOrPartialSymbol(
              userCtx,
              r.company,
              r.ticker,
              Array.from(selectedRegions)[0],
            ),
          ),
        )
      )
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value)
        .filter((r) => r !== null);

      if (tickerSymbols.length) {
        logger.info({ userCtx, tickerSymbols }, "found ticker symbols");
        setResultJson(tickerSymbols);
      } else {
        logger.warn({ userCtx }, "no ticker symbols found");
        setResultJson(null);
      }
    } catch (error) {
      logger.error({ userCtx, error }, "error occurred");
      setResultJson(null);
    } finally {
      setIsLoading(false);
    }
  };

  //////////////////////////////////////////////////////////////////////////////

  return (
    <NextUIProvider>
      <div className="bg-gradient-to-r from-blue-700 to-[#B06AB3] px-6 py-12">
        <div className="container mx-auto flex flex-col justify-center items-center text-center">
          <h2 className="text-white sm:text-4xl text-3xl font-bold mb-6">
            Ticker Discovery 🔬
          </h2>
          <p className="text-white text-base text-center mb-12">
            Give me what you thinking about the market and I will give you the
            ticker symbols base on where you are interested in.
          </p>
        </div>
      </div>
      <main className="flex flex-col pt-3 pl-80 pr-80 content-center">
        <div className="flex flex-row gap-4 mb-4 w-full">
          <div className="w-full">
            <label className="mb-2 text-medium">Applied language: </label>
            <Dropdown>
              <DropdownTrigger>
                <Button className="capitalize" variant="bordered">
                  {selectedLangValue}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Language selection"
                closeOnSelect={true}
                selectedKeys={selectedLang}
                selectionMode="single"
                variant="flat"
                onSelectionChange={(keys) =>
                  setSelectedLang(new Set([keys.anchorKey as string]))
                }
              >
                {Object.entries(langKeyValues).map(([key, value]) => (
                  <DropdownItem key={key} className="text-center">
                    {value}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
          <div className="w-full">
            <label className="mb-2 text-medium">Desired market region: </label>
            <Dropdown>
              <DropdownTrigger>
                <Button className="capitalize" variant="bordered">
                  {selectedValue}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Regions selection"
                closeOnSelect={true}
                selectedKeys={selectedRegions}
                selectionMode="single"
                variant="flat"
                onSelectionChange={(keys) =>
                  setSelectedRegions(new Set([keys.anchorKey as string]))
                }
              >
                {Object.entries(regionKeyValues).map(([key, value]) => (
                  <DropdownItem key={key} className="text-center">
                    {value}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        <div className="w-full mb-4">
          <Textarea
            label="Insight"
            placeholder="What's on your mind?"
            onChange={(e) => setUserInsight(e.target.value)}
          />
        </div>
        <Button
          className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg mb-2"
          radius="sm"
          onPress={onClickSubmit}
          disabled={!userInsight || isLoading}
        >
          {isLoading ? (
            <Spinner size="md" color="secondary" />
          ) : (
            "Search ticker symbols"
          )}
        </Button>
        {resultJson === null && (
          <div className="text-red-500 text-center">
            No ticker symbols found.
          </div>
        )}
        {resultJson !== null && resultJson.length !== 0 && (
          <div>
            <Table aria-label="Example static collection table">
              <TableHeader>
                <TableColumn>Ticker symbol</TableColumn>
                <TableColumn>Exchange code</TableColumn>
                <TableColumn>Exchange full name</TableColumn>
              </TableHeader>
              <TableBody>
                {resultJson.map((item) => (
                  <TableRow key={item.symbol}>
                    <TableCell>{item.symbol}</TableCell>
                    <TableCell>{item.exchangeShortName}</TableCell>
                    <TableCell>{item.stockExchange}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center"></footer>
    </NextUIProvider>
  );
}
