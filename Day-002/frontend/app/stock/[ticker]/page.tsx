"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiService, StockDetails } from "@/services/api";

// Recharts components imports
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function StockDetail({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  const [data, setData] = useState<StockDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const detail = await apiService.getStockDetail(ticker);
        setData(detail);
      } catch (err) {
        console.error(err);
        setError("載入個股詳情失敗，找不到該個股資訊。");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [ticker]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span>個股數據加載中...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rose-400"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        <span className="text-lg font-medium">{error || "找不到個股資訊"}</span>
        <Link
          href="/"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-750"
        >
          返回儀表板
        </Link>
      </div>
    );
  }

  // 1. Prepare Pie Chart Data (Rating distribution)
  const pieData = [
    { name: "買進 (BUY)", value: data.consensus.buy_count, color: "#10b981" }, // Emerald-500
    { name: "中立 (HOLD)", value: data.consensus.hold_count, color: "#f59e0b" }, // Amber-500
    { name: "賣出 (SELL)", value: data.consensus.sell_count, color: "#f43f5e" }, // Rose-500
  ].filter((d) => d.value > 0);

  // 2. Prepare Histogram Data (Target price distribution)
  // Group target prices into buckets of 100/50/20 depending on price level
  const bucketSize = data.avg_target_price > 1000 ? 100 : 50;
  const priceBuckets: Record<string, number> = {};
  data.tp_distribution.forEach((tp) => {
    const bucketStart = Math.floor(tp / bucketSize) * bucketSize;
    const bucketLabel = `${bucketStart}-${bucketStart + bucketSize - 1}`;
    priceBuckets[bucketLabel] = (priceBuckets[bucketLabel] || 0) + 1;
  });
  
  const histogramData = Object.keys(priceBuckets)
    .sort((a, b) => parseInt(a.split("-")[0]) - parseInt(b.split("-")[0]))
    .map((key) => ({
      priceBucket: key,
      "券商數量": priceBuckets[key],
    }));

  // 3. Prepare Line Chart Data (Historical trend)
  // Format the reports list chronologically and compute running average or plot directly
  const lineData = data.trend_data.historical_points.map((p) => ({
    date: p.date,
    [p.broker]: p.target_price,
    "目標價": p.target_price,
  }));

  // Standard consensus badge formatting
  let ratingText = "中立 (HOLD)";
  let ratingColor = "text-amber-400 border-amber-500/20 bg-amber-950/40";
  const consensusObj = data.consensus;
  const maxCount = Math.max(consensusObj.buy_count, consensusObj.hold_count, consensusObj.sell_count);
  if (consensusObj.total_reports === 0) {
     ratingText = "無資料";
     ratingColor = "text-slate-400 border-slate-700 bg-slate-900";
  } else if (maxCount === consensusObj.buy_count) {
     ratingText = "買進 (BUY)";
     ratingColor = "text-emerald-400 border-emerald-500/20 bg-emerald-950/40";
  } else if (maxCount === consensusObj.sell_count) {
     ratingText = "賣出 (SELL)";
     ratingColor = "text-rose-400 border-rose-500/20 bg-rose-950/40";
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-8">
      {/* Detail Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="返回儀表板"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400">
                {data.sector}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
                收錄 {consensusObj.total_reports} 份報告
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2">
              <span>{data.ticker}</span>
              <span className="text-slate-300 font-bold">{data.company_name}</span>
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href={`/report/${ticker}`}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            生成 AI 投資報告
          </Link>
          
          <Link
            href={`/chat?ticker=${ticker}`}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            個股 RAG 問答
          </Link>
        </div>
      </header>

      {/* KPI Highlight Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Consensus Rating KPI */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">市場共識評等</p>
          <div className="flex items-center justify-between mt-2.5">
            <span className={`px-3 py-1 rounded-xl text-sm font-bold border ${ratingColor}`}>
              {ratingText}
            </span>
            <span className="text-xs text-slate-500">
              看多率 {consensusObj.buy}%
            </span>
          </div>
        </div>

        {/* Current Price */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">估計市價</p>
          <h2 className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
            NT$ {data.current_price}
          </h2>
        </div>

        {/* Average TP */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">市場共識目標價</p>
          <h2 className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
            NT$ {data.avg_target_price}
          </h2>
        </div>

        {/* Upside */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">預期上漲空間</p>
          <h2 className={`text-3xl font-extrabold mt-1.5 tracking-tight ${data.upside >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {data.upside > 0 ? `+${data.upside}` : data.upside}%
          </h2>
        </div>
      </section>

      {/* Charts Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart 1: Rating Distribution (Pie) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col h-[320px]">
          <h3 className="font-bold text-slate-200 text-sm mb-4">市場評等分佈</h3>
          <div className="h-56 w-full">
            {isMounted && pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#f8fafc",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                無評等數據
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Target Price Distribution (Histogram) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col h-[320px]">
          <h3 className="font-bold text-slate-200 text-sm mb-4">目標價區間分佈</h3>
          <div className="h-56 w-full">
            {isMounted && histogramData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="priceBucket" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#f8fafc",
                    }}
                  />
                  <Bar dataKey="券商數量" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                無目標價區間數據
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Historical Trend (Line) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col h-[320px]">
          <h3 className="font-bold text-slate-200 text-sm mb-4">歷史共識目標價變動</h3>
          <div className="h-56 w-full">
            {isMounted && lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#f8fafc",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="目標價"
                    stroke="#14b8a6"
                    strokeWidth={2.5}
                    dot={{ fill: "#14b8a6", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                無歷史趨勢數據
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bull and Bear Themes Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Bull Themes Card */}
        <div className="rounded-2xl border border-emerald-900/30 bg-emerald-950/10 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-6 rounded-full bg-emerald-500" />
            <h3 className="font-bold text-lg text-emerald-400">市場利多看多重點 (Bull Thesis)</h3>
          </div>
          {data.bull_themes.length === 0 ? (
            <p className="text-slate-500 text-sm">無提取看多論點</p>
          ) : (
            <ul className="space-y-3">
              {data.bull_themes.map((theme, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-350 line-clamp-3">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>{theme}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bear Themes Card */}
        <div className="rounded-2xl border border-rose-900/30 bg-rose-950/10 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-6 rounded-full bg-rose-500" />
            <h3 className="font-bold text-lg text-rose-400">市場利空風險警示 (Bear Thesis)</h3>
          </div>
          {data.bear_themes.length === 0 ? (
            <p className="text-slate-500 text-sm">無提取看空論點</p>
          ) : (
            <ul className="space-y-3">
              {data.bear_themes.map((theme, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-350 line-clamp-3">
                  <span className="text-rose-500 font-bold mt-0.5">⚠️</span>
                  <span>{theme}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Broker List Comparison Table */}
      <section className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-800 bg-slate-900/40">
          <h3 className="font-bold text-lg text-white">收錄券商研究報告明細</h3>
        </div>
        <div className="overflow-x-auto">
          {data.brokers.length === 0 ? (
            <div className="py-12 text-center text-slate-500">無任何券商研究明細</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold bg-slate-950/40 uppercase tracking-wider">
                  <th className="py-4 px-6">發布券商</th>
                  <th className="py-4 px-6">研究分析師</th>
                  <th className="py-4 px-6">評等建議</th>
                  <th className="py-4 px-6 text-right">目標價預測</th>
                  <th className="py-4 px-6 text-center">報告日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-350 text-sm">
                {data.brokers.map((broker, idx) => {
                  let badge = "";
                  if (broker.rating === "BUY") {
                    badge = "bg-emerald-950/60 text-emerald-400 border border-emerald-500/25";
                  } else if (broker.rating === "SELL") {
                    badge = "bg-rose-950/60 text-rose-400 border border-rose-500/25";
                  } else {
                    badge = "bg-amber-950/60 text-amber-400 border border-amber-500/25";
                  }

                  return (
                    <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-100">{broker.broker}</td>
                      <td className="py-4 px-6 text-slate-400">{broker.analyst || "未填寫"}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${badge}`}>
                          {broker.rating}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-white">
                        {broker.target_price !== null ? `NT$ ${broker.target_price}` : "未設定"}
                      </td>
                      <td className="py-4 px-6 text-center text-slate-400">{broker.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
