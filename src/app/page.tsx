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
import { useEffect, useMemo, useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/dropdown";
import { Button } from "@nextui-org/button";

////////////////////////////////////////////////////////////////////////////////

export default function Home() {
  const [selectedRegions, setSelectedRegions] = useState(new Set(["global"]));
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
      const response = await createResponse(
        userCtx,
        "gpt-4o-mini",
        selectedLangValue,
        userInsight,
      );
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

  const ctrlPlusEnterToSubmit = (
    e: KeyboardEvent,
    _userInsight: string,
    _isLoading: boolean,
  ) => {
    if (!_userInsight.length || _isLoading) {
      return;
    }
    if (e.key === "Enter" && e.ctrlKey) {
      onClickSubmit();
    }
  };
  useEffect(() => {
    const event = (e: KeyboardEvent) =>
      ctrlPlusEnterToSubmit(e, userInsight, isLoading);
    document.addEventListener("keydown", event);
    return () => {
      document.removeEventListener("keydown", event);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInsight, isLoading]);

  //////////////////////////////////////////////////////////////////////////////

  return (
    <NextUIProvider className="h-screen">
      <div className="bg-gradient-to-r from-blue-700 to-[#B06AB3] px-6 py-12">
        <div className="container mx-auto flex flex-col justify-center items-center text-center">
          <h2 className="text-white sm:text-4xl text-3xl font-bold mb-6">
            Ticker Discovery 🔬
          </h2>
          <p className="text-white text-base text-center mb-12">
            Give me what you thinking about the market. The agent will give you
            the ticker symbols based on where you are interested in.
          </p>
        </div>
      </div>

      <main className="flex flex-col pt-3 pl-60 pr-60 pb-40 content-center">
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
        <text className="text-right text-sm font-mono">
          Press [Ctrl+Enter] to submit
        </text>
        <Button
          className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg mb-2"
          radius="sm"
          onPress={onClickSubmit}
          isDisabled={!userInsight.length || isLoading}
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

      <footer className="bg-gray-900 pt-12 pb-6 px-10 tracking-wide">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:flex lg:items-center">
              <ul className="flex space-x-6">
                <li>
                  <a href="https://github.com/WangWilly/nlp-stock-ticker">
                    <svg
                      width="98"
                      height="96"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                        fill="#24292f"
                      />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-am mb-6 text-white">Information</h4>
              <ul className="space-y-4 pl-2">
                <li>
                  <a
                    href="https://github.com/WangWilly"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    About Willywangkaa
                  </a>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </footer>
    </NextUIProvider>
  );
}
