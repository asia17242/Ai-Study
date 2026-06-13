"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiService, StockOverview } from "@/services/api";
import ClearButton from "@/components/ClearButton";

export default function Dashboard() {
  const [stocks, setStocks] = useState<StockOverview[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");

  const fetchStocks = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await apiService.getStocks();
      setStocks(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("無法連線至後端 API。請確認後端服務已運行於 http://localhost:8000");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 直接使用定義好的 fetchStocks 函式，減少冗餘代碼
    fetchStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await apiService.seedDatabase();
      await fetchStocks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert("載入模擬數據失敗: " + errorMessage);
    } finally {
      setSeeding(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("確定要清除所有數據嗎？這將會刪除資料庫中所有的研究報告與個股資訊，且無法復原。")) {
      return;
    }
    try {
      await apiService.resetDatabase();
      setStocks([]);
      setError("");
    } catch (err) {
      alert("清除數據失敗，請檢查後端連線。");
    }
  };

  // Filter stocks by search query
  const filteredStocks = stocks.filter(
    (s) =>
      s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      // 防止 sector 為 null 時導致的崩潰
      (s.sector?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())
  );

  // Compute KPI totals
  const totalStocks = stocks.length;
  const totalReports = stocks.reduce((acc, curr) => acc + curr.report_count, 0);
  
  // Calculate average bullish sentiment ratio
  const avgSentiment =
    totalStocks > 0
      ? Math.round(stocks.reduce((acc, curr) => acc + curr.sentiment_score, 0) / totalStocks)
      : 0;

  // Find stock with highest sentiment score
  const mostBullishStock =
    stocks.length > 0
      ? [...stocks].sort((a, b) => b.sentiment_score - a.sentiment_score)[0]
      : null;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-8 relative">
      {/* 一鍵清除按鈕 - 位於右上方 */}
      <ClearButton onClear={handleReset} />

      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            AI 投資研究情報平台
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            自動彙整券商 PDF 報告，轉換為可視化、可比較的個股評等與目標價共識
          </p>
        </div>

        {/* Reload / Seed Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStocks()}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-2 border border-slate-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={loading ? "animate-spin" : ""}
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8" />
              <polyline points="21 3 21 8 16 8" />
            </svg>
            重新整理
          </button>
          
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-indigo-500/10 disabled:opacity-50 flex items-center gap-2"
          >
            {seeding ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                載入中...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v20" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                一鍵載入模擬數據
              </>
            )}
          </button>
        </div>
      </header>

      {/* Error State Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-300 flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 mt-0.5 shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="text-sm">
            <p className="font-semibold">連線錯誤</p>
            <p className="mt-1 opacity-90">{error}</p>
            <p className="mt-2 text-xs opacity-75">
              請在終端機中啟動後端：<code>uvicorn backend.main:app --reload</code>
            </p>
          </div>
        </div>
      )}

      {/* Seed Warning Banner when database has no records */}
      {!loading && totalStocks === 0 && !error && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-blue-950/30 to-indigo-950/30 border border-blue-800/30 text-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 mt-0.5 shrink-0 text-blue-400"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <h3 className="font-bold text-lg text-white">歡迎來到 AI 投資研究情報平台！</h3>
              <p className="text-sm text-slate-300 mt-1">
                目前系統尚未錄入個股資料。您可以前往「報告上傳解析」上傳券商 PDF 報告，或直接點擊按鈕載入模擬的個股歷史評等共識數據。
              </p>
            </div>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shrink-0 shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
          >
            {seeding ? "載入中..." : "立刻載入模擬數據"}
          </button>
        </div>
      )}

      {/* KPI Cards Area */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* KPI 1 */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">追蹤個股總數</p>
          <h2 className="text-4xl font-extrabold text-white mt-2 tracking-tight">
            {loading ? "..." : totalStocks} <span className="text-lg font-normal text-slate-400">檔</span>
          </h2>
          <p className="text-slate-500 text-xs mt-2">涵蓋科技、半導體與光學龍頭</p>
        </div>

        {/* KPI 2 */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">收錄券商報告</p>
          <h2 className="text-4xl font-extrabold text-white mt-2 tracking-tight">
            {loading ? "..." : totalReports} <span className="text-lg font-normal text-slate-400">份</span>
          </h2>
          <p className="text-slate-500 text-xs mt-2">避免重複分析，自動去重校驗</p>
        </div>

        {/* KPI 3 */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 7v5l3 3"/></svg>
          </div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">市場平均看多情緒</p>
          <h2 className="text-4xl font-extrabold text-teal-400 mt-2 tracking-tight">
            {loading ? "..." : `${avgSentiment}%`}
          </h2>
          <p className="text-slate-500 text-xs mt-2">評等加權 Bullish 情緒指標</p>
        </div>

        {/* KPI 4 */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">最受青睞個股 (Bullish)</p>
          <h2 className="text-xl font-bold text-white mt-3 truncate">
            {loading ? "..." : mostBullishStock ? `${mostBullishStock.company_name} (${mostBullishStock.ticker})` : "無資料"}
          </h2>
          <p className="text-slate-500 text-xs mt-2.5">
            {mostBullishStock ? `看多比例高達 ${mostBullishStock.sentiment_score}%` : "上傳報告後即時更新"}
          </p>
        </div>
      </section>

      {/* Stocks Table Search & Table Section */}
      <section className="glass-panel rounded-2xl flex-1 flex flex-col min-h-[400px] overflow-hidden border border-slate-800">
        {/* Search Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-lg text-white">追蹤個股評等共識</h3>
          
          {/* Search Input */}
          <div className="relative max-w-xs w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-500"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              type="text"
              placeholder="搜尋代號、名稱、產業..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:border-blue-500 text-slate-200 placeholder-slate-500 transition-colors"
            />
          </div>
        </div>

        {/* Table Body Container */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <span>載入中，請稍候...</span>
            </div>
          ) : filteredStocks.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
              <span>無個股數據，請上傳報告或點擊「一鍵載入模擬數據」</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold bg-slate-950/40 uppercase tracking-wider">
                  <th className="py-4 px-6">股票代碼</th>
                  <th className="py-4 px-6">公司名稱</th>
                  <th className="py-4 px-6">產業別</th>
                  <th className="py-4 px-6">市場共識</th>
                  <th className="py-4 px-6 text-right">估計市價 / 平均目標價</th>
                  <th className="py-4 px-6 text-right">上漲空間</th>
                  <th className="py-4 px-6">看多情緒 (Bullish)</th>
                  <th className="py-4 px-6 text-center">收錄報告</th>
                  <th className="py-4 px-6 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-350 text-sm">
                {filteredStocks.map((stock) => {
                  // Standard Rating Colors
                  let ratingBadge = "";
                  if (stock.consensus.includes("BUY")) {
                    ratingBadge = "bg-emerald-950/60 text-emerald-400 border border-emerald-500/25";
                  } else if (stock.consensus.includes("SELL")) {
                    ratingBadge = "bg-rose-950/60 text-rose-400 border border-rose-500/25";
                  } else {
                    ratingBadge = "bg-amber-950/60 text-amber-400 border border-amber-500/25";
                  }

                  return (
                    <tr
                      key={stock.id}
                      className="hover:bg-slate-900/35 transition-colors group/row"
                    >
                      <td className="py-4 px-6 font-bold text-white tracking-wider">
                        {stock.ticker}
                      </td>
                      <td className="py-4 px-6 text-slate-100 font-semibold group-hover/row:text-blue-400 transition-colors">
                        {stock.company_name}
                      </td>
                      <td className="py-4 px-6 text-slate-400">{stock.sector}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${ratingBadge}`}>
                          {stock.consensus}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-medium">
                        <span className="text-xs text-slate-500 mr-2">
                          NT$ {stock.current_price}
                        </span>
                        /
                        <span className="text-slate-100 ml-2">
                          NT$ {stock.avg_target_price}
                        </span>
                      </td>
                      <td className={`py-4 px-6 text-right font-bold ${stock.upside >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {stock.upside > 0 ? `+${stock.upside}` : stock.upside}%
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3 w-40">
                          {/* Mini visual progress bar for sentiment */}
                          <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                            <div
                              className="bg-emerald-500 h-full"
                              style={{ width: `${stock.sentiment.bullish}%` }}
                            />
                            <div
                              className="bg-slate-500 h-full"
                              style={{ width: `${stock.sentiment.neutral}%` }}
                            />
                            <div
                              className="bg-rose-500 h-full"
                              style={{ width: `${stock.sentiment.bearish}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-300">
                            {stock.sentiment_score}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-semibold text-slate-350">
                        {stock.report_count}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Link
                            href={`/stock/${stock.ticker}`}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                          >
                            個股分析
                          </Link>
                          <Link
                            href={`/report/${stock.ticker}`}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-400 border border-indigo-800/40 transition-colors"
                          >
                            AI 報告
                          </Link>
                        </div>
                      </td>
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
