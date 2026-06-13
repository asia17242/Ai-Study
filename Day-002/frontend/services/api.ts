const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface StockOverview {
  id: number;
  ticker: string;
  company_name: string;
  sector: string;
  consensus: string;
  current_price: number;
  avg_target_price: number;
  upside: number;
  sentiment_score: number;
  report_count: number;
  sentiment: {
    bullish: number;
    neutral: number;
    bearish: number;
  };
}

export interface BrokerRating {
  broker: string;
  analyst: string;
  rating: string;
  target_price: number | null;
  date: string;
}

export interface StockDetails {
  ticker: string;
  company_name: string;
  sector: string;
  current_price: number;
  avg_target_price: number;
  upside: number;
  consensus: {
    avg_target_price: number;
    buy: number;
    hold: number;
    sell: number;
    buy_count: number;
    hold_count: number;
    sell_count: number;
    total_reports: number;
  };
  sentiment: {
    bullish: number;
    neutral: number;
    bearish: number;
  };
  brokers: BrokerRating[];
  bull_themes: string[];
  bear_themes: string[];
  tp_distribution: number[];
  trend_data: {
    historical_points: {
      date: string;
      broker: string;
      rating: string;
      target_price: number | null;
    }[];
    metrics: {
      rating_upgrades: number;
      rating_downgrades: number;
      target_price_upgrades: number;
      target_price_cuts: number;
    };
  };
}

export interface AIReport {
  ticker: string;
  company_name: string;
  sector: string;
  generated_date: string;
  consensus_rating: string;
  average_target_price: number;
  current_price: number;
  upside: number;
  rating_percentages: {
    buy: number;
    hold: number;
    sell: number;
  };
  sentiment: {
    bullish: number;
    neutral: number;
    bearish: number;
  };
  executive_summary: string;
  bull_thesis: string[];
  bear_thesis: string[];
  financial_outlook: {
    broker: string;
    revenue_growth: number | null;
    eps: number | null;
  }[];
  brokers_comparison: BrokerRating[];
  investment_conclusion: string;
}

export interface ChatSource {
  index: number;
  broker: string;
  ticker: string;
  company_name: string;
  text: string;
  score: number;
}

export interface ChatResponse {
  answer: string;
  structured_data: {
    ticker?: string;
    company_name?: string;
    total_reports?: number;
    avg_target_price?: number;
    current_price?: number;
    upside?: number;
    buy_pct?: number;
    hold_pct?: number;
    sell_pct?: number;
  };
  sources: ChatSource[];
}

export const apiService = {
  // Get all stocks
  async getStocks(): Promise<StockOverview[]> {
    const res = await fetch(`${API_BASE_URL}/stocks`);
    if (!res.ok) throw new Error("取得個股清單失敗");
    return res.json();
  },

  // Get specific stock details
  async getStockDetail(ticker: string): Promise<StockDetails> {
    const res = await fetch(`${API_BASE_URL}/stocks/${ticker}`);
    if (!res.ok) throw new Error("取得個股詳情失敗");
    return res.json();
  },

  // Upload PDF
  async uploadPdf(file: File): Promise<{ success: boolean; file_name: string; file_path: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "PDF 上傳失敗");
    }
    return res.json();
  },

  // Process uploaded PDF
  async processPdf(fileName: string): Promise<{ success: boolean; skipped: boolean; message: string; extracted_data?: any }> {
    const res = await fetch(`${API_BASE_URL}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_name: fileName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "分析報告失敗");
    }
    return res.json();
  },

  // Get generated AI report
  async getAIReport(ticker: string): Promise<AIReport> {
    const res = await fetch(`${API_BASE_URL}/report/${ticker}`);
    if (!res.ok) throw new Error("生成 AI 報告失敗");
    return res.json();
  },

  // Chat RAG
  async chat(message: string, ticker?: string): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, ticker }),
    });
    if (!res.ok) throw new Error("發送問答失敗");
    return res.json();
  },

  // Seed data
  async seedDatabase(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/seed`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("載入種子資料失敗");
    return res.json();
  }
};
