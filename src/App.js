import React, { useState, useEffect } from "react";
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";
import "./App.css";

function App() {
  const API_KEY = '05bd2c29296f4f9586c34b6f3e8d699b';

  const [watchlist, setWatchlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [candlestickData, setCandlestickData] = useState([]);
  const [chartFullView, setChartFullView] = useState(false);

  // Function to fetch live prices for all stocks in the watchlist
  const fetchLivePrices = async () => {
    const client = require("twelvedata")({ key: API_KEY });
    const symbols = watchlist.map((stock) => stock.symbol).join(",");
    const params = { symbols };

    try {
      const response = await client.price(params);
      const updatedWatchlist = watchlist.map((stock) => ({
        ...stock,
        price: response[stock.symbol]?.price || stock.price,
        trend: parseFloat(response[stock.symbol]?.price) >= parseFloat(stock.price) ? "up" : "down",
      }));
      setWatchlist(updatedWatchlist);
    } catch (error) {
      console.error("Error fetching live prices:", error);
    }
  };

  // Function to fetch candlestick data for the selected stock
  const fetchCandlestickData = async (symbol) => {
    const client = require("twelvedata")({ key: API_KEY });
    const params = { symbol, interval: "1day", outputsize: 30 };

    try {
      const response = await client.timeSeries(params);
      setCandlestickData(
        response.values.reverse().map((item) => [
          new Date(item.datetime).getTime(),
          parseFloat(item.open),
          parseFloat(item.high),
          parseFloat(item.low),
          parseFloat(item.close),
        ])
      );
    } catch (error) {
      console.error("Error fetching candlestick data:", error);
    }
  };

  // Add stock to the watchlist
  const addStockToWatchlist = (symbol, name) => {
    if (!watchlist.find((stock) => stock.symbol === symbol)) {
      setWatchlist((prev) => [...prev, { symbol, name, price: "-", trend: "neutral" }]);
    }
    setSearchQuery("");
  };

  useEffect(() => {
    if (selectedStock) {
      fetchCandlestickData(selectedStock.symbol);
    }
  }, [selectedStock]);

  useEffect(() => {
    if (watchlist.length > 0) {
      const interval = setInterval(fetchLivePrices, 5000); // Update prices every 5 seconds
      return () => clearInterval(interval);
    }
  }, [watchlist]);

  // Highcharts options for candlestick chart
  const candlestickOptions = {
    title: {
      text: `${selectedStock?.name} Candlestick Chart`,
    },
    rangeSelector: {
      selected: 1,
    },
    series: [
      {
        type: "candlestick",
        name: selectedStock?.symbol,
        data: candlestickData,
        tooltip: {
          valueDecimals: 2,
        },
      },
    ],
    xAxis: {
      type: "datetime",
    },
  };

  return (
    <div className="App">
      <h1>Stock Screener</h1>

      <div>
        <input
          type="text"
          placeholder="Search stock symbol"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          onClick={() => addStockToWatchlist(searchQuery.toUpperCase(), "Sample Stock")}
        >
          Add Stock
        </button>
      </div>

      <h2>Watchlist</h2>
      <ul>
        {watchlist.map((stock) => (
          <li
            key={stock.symbol}
            style={{ color: stock.trend === "up" ? "green" : stock.trend === "down" ? "red" : "black" }}
            onClick={() => {
              setSelectedStock(stock);
              setChartFullView(false);
            }}
          >
            {stock.name} ({stock.symbol}) - ${stock.price}
          </li>
        ))}
      </ul>

      {/* Candlestick Chart */}
      {selectedStock && candlestickData.length > 0 && (
        <>
          <h2>{selectedStock.name} Candlestick Chart</h2>
          <div
            style={{
              width: chartFullView ? "1920px" : "80%",
              height: chartFullView ? "1080px" : "500px",
              margin: "0 auto",
            }}
          >
            <HighchartsReact
              highcharts={Highcharts}
              options={candlestickOptions}
              constructorType={"stockChart"}
            />
          </div>
          <button onClick={() => setChartFullView(!chartFullView)}>
            {chartFullView ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </>
      )}
    </div>
  );
}

export default App;
