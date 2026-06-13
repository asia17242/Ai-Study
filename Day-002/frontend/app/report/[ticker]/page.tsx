"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiService, AIReport } from "@/services/api";

export default function ReportPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await apiService.getAIReport(ticker);
        setReport(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "生成報告失敗，可能該個股尚無任何券商研究資料。");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [ticker]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    if (!report) return;
    
    const textReport = `
【AI 投資研究情報平台 - 股權研究報告】
個股名稱: ${report.company_name} (${report.ticker})
產業別: ${report.sector}
報告日期: ${report.generated_date}

一、 市場共識摘要
- 市場共識評等: ${report.consensus_rating}
- 平均目標價: NT$ ${report.average_target_price}
- 目前估計市價: NT$ ${report.current_price}
- 潛在上漲空間: ${report.upside}%
- 市場情緒分佈: 買進 ${report.rating_percentages.buy}%, 中立 ${report.rating_percentages.hold}%, 賣出 ${report.rating_percentages.sell}%

二、 執行摘要 (Executive Summary)
${report.executive_summary}

三、 看多論點 (Bull Thesis)
${report.bull_thesis.map((b, i) => `${i + 1}. ${b}`).join("\n")}

四、 看空論點與風險 (Bear Thesis)
${report.bear_thesis.map((b, i) => `${i + 1}. ${b}`).join("\n")}

五、 投資結論 (Conclusion)
${report.investment_conclusion}
    `.trim();

    navigator.clipboard.writeText(textReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span>AI 正在彙整數據並編寫報告中...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rose-450"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        <span className="text-lg font-medium">{error || "報告生成失敗"}</span>
        <Link
          href={`/stock/${ticker}`}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-750"
        >
          返回個股分析
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-8 bg-slate-950/20">
      {/* Top action header - hidden during print */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href={`/stock/${ticker}`}
            className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="返回個股分析"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </Link>
          <div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
              AI 智能報告生成
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              {report.company_name} ({report.ticker}) 股權研究報告
            </h1>
          </div>
        </div>

        {/* Print / Copy actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            {copied ? "已複製！" : "複製報告"}
          </button>
          
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/15 transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            匯出 / 列印 PDF
          </button>
        </div>
      </header>

      {/* The Printable Report Page Area */}
      <article className="max-w-4xl mx-auto w-full bg-slate-900 border border-slate-800 p-8 sm:p-12 rounded-3xl shadow-2xl relative print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0">
        
        {/* Document Header Logo / Line */}
        <div className="flex justify-between items-end border-b-2 border-indigo-650 pb-6 mb-8 print:border-slate-800">
          <div>
            <p className="text-indigo-400 font-extrabold tracking-widest text-xs uppercase print:text-indigo-600">
              Equity Research Report
            </p>
            <h2 className="text-3xl font-extrabold text-white mt-1 print:text-slate-900">
              {report.company_name} ({report.ticker})
            </h2>
            <p className="text-slate-400 text-sm mt-0.5 print:text-slate-500">
              板塊分類：{report.sector}
            </p>
          </div>
          
          <div className="text-right text-xs text-slate-400 print:text-slate-500">
            <p className="font-semibold text-slate-300 print:text-slate-700">AI 投資情報研究小組</p>
            <p className="mt-0.5">發布時間：{report.generated_date}</p>
          </div>
        </div>

        {/* Executive Summary Statistics Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6 rounded-2xl bg-slate-950/50 border border-slate-800/80 print:bg-slate-100 print:border-slate-300 print:text-slate-950">
          <div>
            <p className="text-slate-455 text-xs font-semibold print:text-slate-500">市場共識評等</p>
            <p className="text-2xl font-extrabold text-teal-400 mt-1 print:text-emerald-600">
              {report.consensus_rating}
            </p>
            <p className="text-xs text-slate-505 mt-1">
              買進 {report.rating_percentages.buy}% | 中立 {report.rating_percentages.hold}% | 賣出 {report.rating_percentages.sell}%
            </p>
          </div>

          <div>
            <p className="text-slate-455 text-xs font-semibold print:text-slate-500">共識目標價 / 市價</p>
            <p className="text-2xl font-extrabold text-white mt-1 print:text-slate-900">
              NT$ {report.average_target_price} <span className="text-xs font-normal text-slate-400">/ {report.current_price}</span>
            </p>
            <p className="text-xs text-slate-505 mt-1">
              以目前估計市價計算
            </p>
          </div>

          <div>
            <p className="text-slate-455 text-xs font-semibold print:text-slate-500">預期潛在上漲空間</p>
            <p className={`text-2xl font-extrabold mt-1 print:text-slate-900 ${report.upside >= 0 ? "text-emerald-400 print:text-emerald-600" : "text-rose-455"}`}>
              {report.upside > 0 ? `+${report.upside}` : report.upside}%
            </p>
            <p className="text-xs text-slate-505 mt-1">
              上行收益比率
            </p>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2 mb-3 print:text-slate-900 print:border-slate-300">
            一、 執行摘要 (Executive Summary)
          </h3>
          <p className="text-slate-350 text-sm leading-relaxed text-justify print:text-slate-850">
            {report.executive_summary}
          </p>
        </section>

        {/* Section 2: Bull Thesis */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2 mb-3 print:text-slate-900 print:border-slate-300">
            二、 利多投資論點 (Bull Thesis)
          </h3>
          <ul className="space-y-3">
            {report.bull_thesis.map((point, index) => (
              <li key={index} className="flex gap-3 text-sm text-slate-350 leading-relaxed print:text-slate-850">
                <span className="text-emerald-500 font-bold print:text-emerald-600">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 3: Bear Thesis & Risks */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2 mb-3 print:text-slate-900 print:border-slate-300">
            三、 關鍵風險因素 (Bear Thesis & Risks)
          </h3>
          <ul className="space-y-3">
            {report.bear_thesis.map((point, index) => (
              <li key={index} className="flex gap-3 text-sm text-slate-350 leading-relaxed print:text-slate-850">
                <span className="text-rose-500 font-bold print:text-rose-600">⚠️</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 4: Financial Outlook Table */}
        <section className="mb-8 page-break-inside-avoid">
          <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2 mb-3 print:text-slate-900 print:border-slate-300">
            四、 券商財務預測展望
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/20 print:border-slate-300 print:bg-transparent">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider print:border-slate-300 print:text-slate-700">
                  <th className="py-3 px-4">預估券商</th>
                  <th className="py-3 px-4 text-right">預估營收成長率</th>
                  <th className="py-3 px-4 text-right">預估每股盈餘 (EPS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-350 text-sm print:divide-slate-300 print:text-slate-900">
                {report.financial_outlook.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500">無財務預估資料</td>
                  </tr>
                ) : (
                  report.financial_outlook.map((outlook, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/10">
                      <td className="py-3 px-4 font-semibold text-slate-200 print:text-slate-950">{outlook.broker}</td>
                      <td className="py-3 px-4 text-right">
                        {outlook.revenue_growth !== null ? `${outlook.revenue_growth}%` : "未設定"}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-white print:text-slate-900">
                        {outlook.eps !== null ? `NT$ ${outlook.eps}` : "未設定"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Broker Comparison */}
        <section className="mb-8 page-break-inside-avoid">
          <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2 mb-3 print:text-slate-900 print:border-slate-300">
            五、 主要收錄券商對照
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/20 print:border-slate-300 print:bg-transparent">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider print:border-slate-300 print:text-slate-700">
                  <th className="py-3 px-4">發布券商</th>
                  <th className="py-3 px-4">分析師</th>
                  <th className="py-3 px-4">評等</th>
                  <th className="py-3 px-4 text-right">預期目標價</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-350 text-sm print:divide-slate-300 print:text-slate-900">
                {report.brokers_comparison.map((broker, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/10">
                    <td className="py-3 px-4 font-semibold text-slate-250 print:text-slate-950">{broker.broker}</td>
                    <td className="py-3 px-4 text-slate-400">{broker.analyst || "-"}</td>
                    <td className="py-3 px-4 font-bold">{broker.rating}</td>
                    <td className="py-3 px-4 text-right font-bold text-white print:text-slate-950">
                      {broker.target_price !== null ? `NT$ ${broker.target_price}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 6: Investment Conclusion */}
        <section className="mb-6">
          <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2 mb-3 print:text-slate-900 print:border-slate-300">
            六、 投資結論 (Conclusion)
          </h3>
          <p className="text-slate-350 text-sm leading-relaxed text-justify whitespace-pre-line print:text-slate-850">
            {report.investment_conclusion}
          </p>
        </section>

        {/* Document Footer Stamp */}
        <div className="border-t border-slate-800 mt-12 pt-6 flex justify-between items-center text-xs text-slate-500 print:border-slate-350 print:text-slate-450">
          <p>© 2026 AI Investment Research Intelligence Platform. All rights reserved.</p>
          <p>本報告由 AI 自動聚合編寫，不代表任何實質投資建議。</p>
        </div>
      </article>
    </div>
  );
}
