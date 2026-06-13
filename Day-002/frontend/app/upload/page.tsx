"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiService, StockOverview, ExtractedReportData } from "@/services/api";

interface UploadTask {
  id: string;
  name: string;
  size: number;
  progress: number; // 0 to 100
  status: "idle" | "uploading" | "parsing" | "completed" | "failed";
  stepText: string;
  duplicate?: boolean;
  extractedData?: ExtractedReportData;
  error?: string;
}

export default function UploadPage() {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [stocksList, setStocksList] = useState<StockOverview[]>([]);
  const [dragging, setDragging] = useState(false);

  const fetchTrackedStocks = async () => {
    try {
      const data = await apiService.getStocks();
      setStocksList(data);
    } catch (err) {
      console.error("無法取得追蹤個股", err);
    }
  };

  useEffect(() => {
    let active = true;
    apiService.getStocks()
      .then((data) => {
        if (active) setStocksList(data);
      })
      .catch((err) => {
        console.error("無法取得追蹤個股", err);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      const pdfFiles = filesArray.filter((f) => f.name.endsWith(".pdf"));
      
      if (pdfFiles.length === 0) {
        alert("只支援上傳 PDF 格式個股研究報告！");
        return;
      }
      
      pdfFiles.forEach((file) => startUploadPipeline(file));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const pdfFiles = filesArray.filter((f) => f.name.endsWith(".pdf"));
      
      if (pdfFiles.length === 0) {
        alert("只支援上傳 PDF 格式個股研究報告！");
        return;
      }
      
      pdfFiles.forEach((file) => startUploadPipeline(file));
    }
  };

  const startUploadPipeline = async (file: File) => {
    const taskId = Date.now().toString() + "_" + Math.random().toString(36).substr(2, 5);
    
    const newTask: UploadTask = {
      id: taskId,
      name: file.name,
      size: file.size,
      progress: 10,
      status: "uploading",
      stepText: "正在上傳 PDF 檔案至伺服器...",
    };
    
    setTasks((prev) => [newTask, ...prev]);

    try {
      // Step 1: Upload File
      const uploadRes = await apiService.uploadPdf(file);
      
      // Step 2: Trigger processing (update state to parsing)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                progress: 40,
                status: "parsing",
                stepText: "檔案上傳完成！正在進行 PDF 文本抽取與雜湊去重...",
              }
            : t
        )
      );

      // Step 3: Run pipeline API
      const processRes = await apiService.processPdf(uploadRes.file_name);

      if (processRes.skipped) {
        // Report already exists in database (duplicate hash check)
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  progress: 100,
                  status: "completed",
                  stepText: "完成！此報告 SHA-256 雜湊已存在，系統已自動去重，跳過分析。",
                  duplicate: true,
                }
              : t
          )
        );
      } else {
        // New report successfully processed
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  progress: 100,
                  status: "completed",
                  stepText: "分析完成！結構化數據與向量切片已成功存儲。",
                  extractedData: processRes.extracted_data,
                }
              : t
          )
        );
      }
      
      // Refresh stocks list dashboard stats
      fetchTrackedStocks();
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "發生未知錯誤";
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: "failed",
                progress: 100,
                stepText: "管線處理失敗。",
                error: errorMessage,
              }
            : t
        )
      );
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-8">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          研究報告上傳解析中心
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          支援上傳 .pdf 檔案，自動提取關鍵投資比率、目標價預測與 Bull/Bear 重點，並建立向量索引
        </p>
      </header>

      {/* Upload zone & Tasks split columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 items-start">
        {/* Left Drag & Drop Upload Block */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`h-72 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
              dragging
                ? "border-blue-500 bg-blue-500/5 glow-indigo"
                : "border-slate-800 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/35"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* Upload Icon */}
            <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center mb-4 text-slate-400 group-hover:text-blue-500 transition-colors shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            
            <h3 className="font-bold text-slate-200 text-base">拖曳 PDF 報告至此，或點擊瀏覽檔案</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
              僅接受標準可讀寫的 PDF 研究報告格式。<br />
              命名範例：<code>2330_Goldman.pdf</code>
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
            <span className="text-slate-200 font-bold mt-0.5">ℹ️ 解析說明：</span>
            <div className="leading-relaxed">
              系統配備 **SHA-256 雜湊防重複機制**。若偵測到相同內容的報告（如：重新上傳同份檔案），會直接提示跳過，不佔用 LLM 運算額度。
            </div>
          </div>
        </div>

        {/* Right Active Pipeline Tasks Tracker */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <h3 className="font-bold text-lg text-white">上傳解析管線進度 ({tasks.length})</h3>
          
          {tasks.length === 0 ? (
            <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              <span>目前尚無進行中的解析任務。請於左側區域上傳 PDF 檔案開始。</span>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col gap-4"
                >
                  {/* Task Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm truncate max-w-md" title={task.name}>
                        {task.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        檔案大小：{formatBytes(task.size)}
                      </p>
                    </div>
                    
                    {/* Status Badge */}
                    <div>
                      {task.status === "completed" && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          task.duplicate
                            ? "bg-amber-950 text-amber-400 border border-amber-800/30"
                            : "bg-emerald-950 text-emerald-400 border border-emerald-800/30"
                        }`}>
                          {task.duplicate ? "已去重" : "完成"}
                        </span>
                      )}
                      {task.status === "failed" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-450 border border-rose-800/30">
                          失敗
                        </span>
                      )}
                      {(task.status === "uploading" || task.status === "parsing") && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800/30 animate-pulse">
                          處理中
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar & Text */}
                  <div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full transition-all duration-300 ${
                          task.status === "failed"
                            ? "bg-rose-550"
                            : task.status === "completed"
                            ? "bg-emerald-500"
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 font-semibold">{task.stepText}</p>
                    {task.error && (
                      <p className="text-xs text-rose-400 mt-1.5 font-medium">
                        錯誤明細: {task.error}
                      </p>
                    )}
                  </div>

                  {/* If analysis is completed & data is extracted, show preview card */}
                  {task.status === "completed" && task.extractedData && (
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850/80 text-xs text-slate-400 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="col-span-2 sm:col-span-3 border-b border-slate-800 pb-1.5 mb-0.5 font-bold text-slate-350 flex justify-between">
                        <span>🤖 AI 結構化提取成果</span>
                        <Link
                          href={`/stock/${task.extractedData.ticker}`}
                          className="text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          進入個股分析 →
                        </Link>
                      </div>
                      <div>
                        標的股票: <span className="text-slate-200 font-semibold">{task.extractedData.company} ({task.extractedData.ticker})</span>
                      </div>
                      <div>
                        發布券商: <span className="text-slate-200 font-semibold">{task.extractedData.broker}</span>
                      </div>
                      <div>
                        評等建議: <span className="text-emerald-400 font-bold">{task.extractedData.rating}</span>
                      </div>
                      <div>
                        預估目標價: <span className="text-slate-200 font-semibold">{task.extractedData.target_price ? `NT$ ${task.extractedData.target_price}` : "未提及"}</span>
                      </div>
                      <div>
                        營收預估: <span className="text-slate-200 font-semibold">{task.extractedData.revenue_growth ? `+${task.extractedData.revenue_growth}%` : "未提及"}</span>
                      </div>
                      <div>
                        每股 EPS: <span className="text-slate-200 font-semibold">{task.extractedData.eps ? `NT$ ${task.extractedData.eps}` : "未提及"}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tracked Stocks Overview Footer Section */}
      <section className="glass-panel rounded-2xl border border-slate-800 p-5 flex flex-col">
        <h3 className="font-bold text-lg text-white mb-4">目前已收錄的分析個股</h3>
        
        {stocksList.length === 0 ? (
          <p className="text-slate-550 text-sm py-4">無收錄個股。請上傳報告解析以建立資料。</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {stocksList.map((stock) => (
              <Link
                key={stock.id}
                href={`/stock/${stock.ticker}`}
                className="p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col"
              >
                <span className="text-xs font-semibold text-slate-500 uppercase">{stock.sector}</span>
                <span className="font-bold text-white text-lg mt-1">{stock.ticker}</span>
                <span className="font-bold text-slate-350 text-sm mt-0.5">{stock.company_name}</span>
                <span className="text-xs text-indigo-400 font-semibold mt-3">
                  共 {stock.report_count} 份報告
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
