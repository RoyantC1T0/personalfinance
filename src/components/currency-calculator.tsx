"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, X, ArrowRightLeft, RefreshCcw } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface BlueRate {
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export function CurrencyCalculator() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("ARS");
  const [result, setResult] = useState<number | null>(null);
  const [blueRate, setBlueRate] = useState<BlueRate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Blue Dollar rate
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch("https://dolarapi.com/v1/dolares/blue");
        if (response.ok) {
          const data = await response.json();
          setBlueRate(data);
        }
      } catch (error) {
        console.error("Error fetching rate:", error);
      }
    };
    fetchRate();
  }, []);

  const currencies = [
    {
      code: "USD",
      name: language === "es" ? "Dólar" : "US Dollar",
      symbol: "US$",
    },
    {
      code: "ARS",
      name: language === "es" ? "Peso Argentino" : "Argentine Peso",
      symbol: "AR$",
    },
  ];

  const convert = () => {
    if (!amount || !blueRate) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return;

    let converted: number;

    if (fromCurrency === "USD" && toCurrency === "ARS") {
      // USD → ARS: multiply by venta
      converted = numAmount * blueRate.venta;
    } else if (fromCurrency === "ARS" && toCurrency === "USD") {
      // ARS → USD: divide by venta
      converted = numAmount / blueRate.venta;
    } else {
      // Same currency
      converted = numAmount;
    }

    setResult(converted);
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  const refreshRate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://dolarapi.com/v1/dolares/blue");
      if (response.ok) {
        const data = await response.json();
        setBlueRate(data);
      }
    } catch (error) {
      console.error("Error fetching rate:", error);
    }
    setIsLoading(false);
  };

  const formatNumber = (num: number, currency: string) => {
    return new Intl.NumberFormat(language === "es" ? "es-AR" : "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Calculator className="h-6 w-6" />
        )}
      </Button>

      {/* Calculator Modal */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 shadow-2xl z-50 border-2 animate-in slide-in-from-bottom-4 duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                {language === "es" ? "Conversor" : "Converter"}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={refreshRate}
                  disabled={isLoading}
                >
                  <RefreshCcw
                    className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {blueRate && (
              <p className="text-xs text-muted-foreground">
                Dólar Blue: ${blueRate.venta.toLocaleString("es-AR")}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label className="text-xs">
                {language === "es" ? "Monto" : "Amount"}
              </Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setResult(null);
                }}
                className="text-lg font-medium"
              />
            </div>

            {/* Currency Selection */}
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-2">
                <Label className="text-xs">
                  {language === "es" ? "De" : "From"}
                </Label>
                <Select
                  value={fromCurrency}
                  onValueChange={(val) => {
                    setFromCurrency(val);
                    setResult(null);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 mt-6"
                onClick={swapCurrencies}
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>

              <div className="flex-1 space-y-2">
                <Label className="text-xs">
                  {language === "es" ? "A" : "To"}
                </Label>
                <Select
                  value={toCurrency}
                  onValueChange={(val) => {
                    setToCurrency(val);
                    setResult(null);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Convert Button */}
            <Button
              onClick={convert}
              className="w-full"
              disabled={!amount || !blueRate}
            >
              {language === "es" ? "Convertir" : "Convert"}
            </Button>

            {/* Result */}
            {result !== null && (
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">
                  {language === "es" ? "Resultado" : "Result"}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(result, toCurrency)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {currencies.find((c) => c.code === fromCurrency)?.symbol}{" "}
                  {parseFloat(amount).toLocaleString()} ={" "}
                  {currencies.find((c) => c.code === toCurrency)?.symbol}{" "}
                  {result.toLocaleString(
                    language === "es" ? "es-AR" : "en-US",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
