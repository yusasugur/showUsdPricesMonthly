"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Activity,
  List,
  Trophy,
  BarChart3,
  TrendingDown,
  Clock,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
} from "lucide-react";

const WEEK_COLORS = {
  1: "#3b82f6", // Blue-500
  2: "#8b5cf6", // Violet-500
  3: "#ec4899", // Pink-500
  4: "#f59e0b", // Amber-500
  5: "#10b981", // Emerald-500
};

const App = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trendChartType, setTrendChartType] = useState("bar"); // 'bar', 'line', 'area'

  const DATA_URL = "http://46.224.6.206:3001/logs/?currency=USD";

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(DATA_URL, {
        headers: {
          "x-api-key": "J7EfLAHEhHXksKbfiA1mOJALcaZR4Jqt",
        },
      });
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const json = await response.json();
      setRawData(json);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { chartData, rankedWeeks, monthlyTrendData } = useMemo(() => {
    if (!rawData || rawData.length === 0)
      return { chartData: [], rankedWeeks: [], monthlyTrendData: [] };

    const monthlyStats = {};
    const specificWeeklyStats = {};

    rawData.forEach((item) => {
      const date = new Date(item.ts);
      if (isNaN(date.getTime())) return;

      const price = parseFloat(item.buy_price);
      if (isNaN(price)) return;

      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${year}-${month}`;

      const dayOfMonth = date.getDate();
      let weekNum = Math.ceil(dayOfMonth / 7);
      if (weekNum > 5) weekNum = 5;

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { sum: 0, count: 0 };
      }
      monthlyStats[monthKey].sum += price;
      monthlyStats[monthKey].count += 1;

      const specificWeekKey = `${monthKey}-${weekNum}`;
      if (!specificWeeklyStats[specificWeekKey]) {
        specificWeeklyStats[specificWeekKey] = {
          sum: 0,
          count: 0,
          monthKey,
          weekNum,
        };
      }
      specificWeeklyStats[specificWeekKey].sum += price;
      specificWeeklyStats[specificWeekKey].count += 1;
    });

    Object.keys(monthlyStats).forEach((key) => {
      const m = monthlyStats[key];
      m.avg = m.count > 0 ? m.sum / m.count : 0;
    });

    const generalizedBuckets = {
      1: { diffs: [], label: "1st Week (Days 1-7)" },
      2: { diffs: [], label: "2nd Week (Days 8-14)" },
      3: { diffs: [], label: "3rd Week (Days 15-21)" },
      4: { diffs: [], label: "4th Week (Days 22-28)" },
      5: { diffs: [], label: "5th Week (Days 29-31)" },
    };

    const trendMap = {};

    Object.values(specificWeeklyStats).forEach((weekData) => {
      const monthAvg = monthlyStats[weekData.monthKey]?.avg || 0;
      const weekAvg = weekData.sum / weekData.count;

      const diff = weekAvg - monthAvg;
      if (generalizedBuckets[weekData.weekNum]) {
        generalizedBuckets[weekData.weekNum].diffs.push(diff);
      }

      const { monthKey, weekNum } = weekData;
      if (!trendMap[monthKey]) {
        const [y, m] = monthKey.split("-").map(Number);
        const dateObj = new Date(y, m, 1);
        const label = dateObj.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });

        trendMap[monthKey] = {
          monthKey,
          name: label,
          fullDate: dateObj,
        };
      }
      trendMap[monthKey][`week${weekNum}`] = weekAvg;
    });

    const processed = Object.entries(generalizedBuckets).map(([key, data]) => {
      const totalDiff = data.diffs.reduce((acc, curr) => acc + curr, 0);
      const avgDiff = data.diffs.length > 0 ? totalDiff / data.diffs.length : 0;

      return {
        id: parseInt(key),
        name: `Week ${key}`,
        fullLabel: data.label,
        diff: avgDiff,
        count: data.diffs.length,
      };
    });

    const validData = processed.filter((d) => d.count > 0);
    const sortedForChart = [...validData].sort((a, b) => a.id - b.id);
    const sortedByPerformance = [...validData].sort((a, b) => b.diff - a.diff);

    const sortedTrendData = Object.values(trendMap).sort(
      (a, b) => a.fullDate - b.fullDate
    );

    return {
      chartData: sortedForChart,
      rankedWeeks: sortedByPerformance,
      monthlyTrendData: sortedTrendData,
    };
  }, [rawData]);

  const bestWeek = rankedWeeks.length > 0 ? rankedWeeks[0] : null;

  const renderTrendChart = () => {
    const commonProps = {
      data: monthlyTrendData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    const commonAxis = (
      <>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#e2e8f0"
        />
        <XAxis
          dataKey="name"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value.toFixed(2)}`}
          domain={["dataMin - 1", "auto"]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
          formatter={(value, name) => [
            `$${parseFloat(value).toFixed(4)}`,
            name,
          ]}
        />
        <Legend />
      </>
    );

    if (trendChartType === "line") {
      return (
        <LineChart {...commonProps}>
          {commonAxis}
          {[1, 2, 3, 4, 5].map((num) => (
            <Line
              key={num}
              type="monotone"
              name={`Week ${num}`}
              dataKey={`week${num}`}
              stroke={WEEK_COLORS[num]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      );
    }

    if (trendChartType === "area") {
      return (
        <AreaChart {...commonProps}>
          <defs>
            {[1, 2, 3, 4, 5].map((num) => (
              <linearGradient
                key={num}
                id={`colorWeek${num}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={WEEK_COLORS[num]}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={WEEK_COLORS[num]}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          {commonAxis}
          {[1, 2, 3, 4, 5].map((num) => (
            <Area
              key={num}
              type="monotone"
              name={`Week ${num}`}
              dataKey={`week${num}`}
              stroke={WEEK_COLORS[num]}
              fillOpacity={1}
              fill={`url(#colorWeek${num})`}
            />
          ))}
        </AreaChart>
      );
    }

    // Default to Bar
    return (
      <BarChart {...commonProps}>
        {commonAxis}
        {[1, 2, 3, 4, 5].map((num) => (
          <Bar
            key={num}
            name={`Week ${num}`}
            dataKey={`week${num}`}
            fill={WEEK_COLORS[num]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-8 h-8 text-blue-600" />
              Monthly Relative Performance
            </h1>
            <p className="text-slate-500 mt-1">
              Comparing weekly performance against{" "}
              <span className="font-semibold text-slate-700">
                monthly averages
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Fetching..." : "Refresh Data"}
            </button>
          </div>
        </div>

        {/* Error Handling */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Connection Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              {error.includes("Failed to fetch") && (
                <p className="text-red-600 text-xs mt-2">
                  <strong>Note:</strong> Endpoint is <code>http://</code>. If
                  blocked by browser security
                </p>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && chartData.length > 0 ? (
          <>
            {/* Top Stat Card */}
            {bestWeek && (
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 rounded-xl shadow-md text-white">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-green-100">
                      Most Consistent Overperformer
                    </h2>
                    <p className="text-3xl font-bold mt-1">
                      {bestWeek.name}{" "}
                      <span className="text-lg font-normal opacity-90">
                        ({bestWeek.fullLabel})
                      </span>
                    </p>
                    <p className="mt-2 text-green-100 text-sm">
                      Typically beats its month's average by{" "}
                      <span className="font-mono font-bold text-white text-lg">
                        +${bestWeek.diff.toFixed(4)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Generalized Chart Section */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-slate-500" />
                    <h3 className="text-lg font-semibold text-slate-800">
                      Avg Deviation from Monthly Mean
                    </h3>
                  </div>
                </div>

                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) =>
                          `${value > 0 ? "+" : ""}${value.toFixed(2)}`
                        }
                      />
                      <Tooltip
                        cursor={{ fill: "#f1f5f9" }}
                        contentStyle={{
                          backgroundColor: "#fff",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                        }}
                        formatter={(value) => {
                          const val = parseFloat(value);
                          return [
                            <span
                              className={
                                val >= 0
                                  ? "text-green-600 font-bold"
                                  : "text-red-600 font-bold"
                              }
                            >
                              {val > 0 ? "+" : ""}
                              {val.toFixed(4)}
                            </span>,
                            "Avg vs Month",
                          ];
                        }}
                      />
                      <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
                      <Bar dataKey="diff" radius={[2, 2, 2, 2]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.diff >= 0 ? "#10b981" : "#ef4444"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ranking Table */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <List className="w-5 h-5 text-slate-500" />
                  <h3 className="text-lg font-semibold text-slate-800">
                    Performance Rank
                  </h3>
                </div>

                <div className="space-y-3">
                  {rankedWeeks.map((week, index) => {
                    const isPositive = week.diff >= 0;
                    return (
                      <div
                        key={week.id}
                        className={`relative p-4 rounded-lg border flex justify-between items-center transition-all ${
                          index === 0
                            ? "bg-emerald-50 border-emerald-200 shadow-sm"
                            : "bg-white border-slate-100 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ${
                                index === 0
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {index + 1}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {week.name}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 ml-7">
                            {week.fullLabel}
                          </p>
                        </div>

                        <div className="text-right">
                          <div
                            className={`flex items-center justify-end gap-1 font-mono font-bold ${
                              isPositive ? "text-emerald-600" : "text-red-500"
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {isPositive ? "+" : ""}
                            {week.diff.toFixed(4)}
                          </div>
                          <p className="text-xs text-slate-400">
                            vs Monthly Avg
                          </p>
                        </div>

                        {index === 0 && (
                          <div className="absolute -top-2 -right-2">
                            <Trophy className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-sm" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NEW SECTION: Monthly Weekly Trend */}
              <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-500" />
                    <h3 className="text-lg font-semibold text-slate-800">
                      Weekly Trends by Month
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Chart Type Selector */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button
                        onClick={() => setTrendChartType("bar")}
                        className={`p-1.5 rounded-md transition-all ${
                          trendChartType === "bar"
                            ? "bg-white shadow-sm text-blue-600"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                        title="Bar Chart"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTrendChartType("line")}
                        className={`p-1.5 rounded-md transition-all ${
                          trendChartType === "line"
                            ? "bg-white shadow-sm text-blue-600"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                        title="Line Chart"
                      >
                        <LineChartIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTrendChartType("area")}
                        className={`p-1.5 rounded-md transition-all ${
                          trendChartType === "area"
                            ? "bg-white shadow-sm text-blue-600"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                        title="Area Chart"
                      >
                        <AreaChartIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderTrendChart()}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        ) : (
          !loading &&
          !error && (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
              <p className="text-slate-500">
                No data available found for the selected currency.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default App;
