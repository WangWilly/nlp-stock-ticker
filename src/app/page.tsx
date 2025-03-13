"use client";
import {
  getMostReleventSearchTickerSymbol,
  SearchTickerSymbolItemDto,
} from "@/services/fmp";
import { createResponse } from "@/services/gpt";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  HeroUIProvider,
  Textarea,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { useMemo, useState } from "react";

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
    sc: "中文",
    tc: "繁體",
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

  const [resultJson, setResultJson] = useState<SearchTickerSymbolItemDto[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const onClickSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await createResponse({
        model: "gpt-4o-mini",
        selectedLang: selectedLangValue,
        input: userInsight,
      });
      const tickerSymbols = (
        await Promise.allSettled(
          response.map((r) =>
            getMostReleventSearchTickerSymbol(
              r.company,
              Array.from(selectedRegions)[0],
            ),
          ),
        )
      )
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value)
        .filter((r) => r !== null);
      // console.log(tickerSymbols);
      if (tickerSymbols.length) {
        setResultJson(tickerSymbols);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  //////////////////////////////////////////////////////////////////////////////

  return (
    <HeroUIProvider>
      <div className="bg-gradient-to-r from-blue-700 to-[#B06AB3] px-6 py-12">
        <div className="container mx-auto flex flex-col justify-center items-center text-center">
          <h2 className="text-white sm:text-4xl text-3xl font-bold mb-6">
            Ticker Discovery 🔬
          </h2>
          <p className="text-white text-base text-center mb-12">
            Give me what you thought about the market and I will give you the
            ticker symbols base on where you are interested in.
          </p>
        </div>
      </div>
      <main className="text-foreground bg-background content-center flex flex-col">
        <div className="p-3 flex flex-row gap-4 mb-4 w-full">
          <div className="mx-auto font-[sans-serif] w-full">
            <label className="mb-2 text-sm text-black">
              Applied language:{" "}
            </label>
            <Dropdown>
              <DropdownTrigger>
                <Button className="capitalize" variant="bordered">
                  {selectedLangValue}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Language selection"
                closeOnSelect={false}
                selectedKeys={selectedLang}
                selectionMode="multiple"
                variant="flat"
                onSelectionChange={(keys) =>
                  setSelectedLang(new Set([keys.anchorKey as string]))
                }
              >
                {Object.entries(langKeyValues).map(([key, value]) => (
                  <DropdownItem key={key}>{value}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
          <div className="mx-auto font-[sans-serif] w-full">
            <label className="mb-2 text-sm text-black">
              Desired market region:{" "}
            </label>
            <Dropdown>
              <DropdownTrigger>
                <Button className="capitalize" variant="bordered">
                  {selectedValue}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Regions selection"
                closeOnSelect={false}
                selectedKeys={selectedRegions}
                selectionMode="multiple"
                variant="flat"
                onSelectionChange={(keys) =>
                  setSelectedRegions(new Set([keys.anchorKey as string]))
                }
              >
                {Object.entries(regionKeyValues).map(([key, value]) => (
                  <DropdownItem key={key}>{value}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        <div className="mt-2">
          <Textarea
            className="max-w-xs block"
            label="User insight"
            placeholder="What comes into your mind?"
            onChange={(e) => setUserInsight(e.target.value)}
          />
        </div>
        <button
          className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold"
          onClick={onClickSubmit}
          disabled={!userInsight || isLoading}
        >
          {isLoading ? "Searching..." : "Search ticker symbols"}
        </button>
        {resultJson.length !== 0 && (
        <div className="mt-2">
          <Table aria-label="Example static collection table">
            <TableHeader>
              <TableColumn>Ticker symbol</TableColumn>
              <TableColumn>Applied Exchange</TableColumn>
            </TableHeader>
            <TableBody>
              {resultJson.map((item) => (
                <TableRow key={item.symbol}>
                  <TableCell>{item.symbol}</TableCell>
                  <TableCell>{item.exchangeShortName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center"></footer>
    </HeroUIProvider>
  );
}
