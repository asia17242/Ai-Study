CREATE TABLE IF NOT EXISTS stocks (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    sector VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    broker VARCHAR(255) NOT NULL,
    report_date DATE NOT NULL,
    file_name VARCHAR(500) UNIQUE NOT NULL,
    file_hash VARCHAR(64) UNIQUE NOT NULL,
    raw_text TEXT,
    page_count INTEGER DEFAULT 0,
    processed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    rating_raw VARCHAR(100),
    rating_standard VARCHAR(10) CHECK (rating_standard IN ('BUY', 'HOLD', 'SELL')),
    target_price NUMERIC(12, 2),
    currency VARCHAR(10) DEFAULT 'TWD',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bull_bear_points (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    point_type VARCHAR(10) CHECK (point_type IN ('bull', 'bear')),
    category VARCHAR(100),
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_metrics (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC(20, 2),
    metric_year INTEGER,
    metric_period VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reports_stock_id ON reports(stock_id);
CREATE INDEX idx_reports_broker ON reports(broker);
CREATE INDEX idx_reports_date ON reports(report_date);
CREATE INDEX idx_ratings_stock_id ON ratings(stock_id);
CREATE INDEX idx_ratings_standard ON ratings(rating_standard);
CREATE INDEX idx_bull_bear_stock_id ON bull_bear_points(stock_id);
CREATE INDEX idx_financial_metrics_stock_id ON financial_metrics(stock_id);
