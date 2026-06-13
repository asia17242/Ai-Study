from decimal import Decimal
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.db.models import Stock, Report, Broker, BullPoint, BearPoint

# Current stock prices lookup for upside calculations
# If not in this list, we'll estimate the current price as 85% of the average target price.
CURRENT_PRICES = {
    "2330": 950.0,
    "2454": 1250.0,
    "2317": 180.0,
    "3008": 2500.0
}

class AnalyticsEngine:
    @staticmethod
    def get_current_price(ticker: str) -> float:
        """
        Retrieves the current market price of a stock.
        """
        return CURRENT_PRICES.get(ticker, 0.0)

    @staticmethod
    def calculate_consensus(db: Session, stock_id: int) -> Dict[str, Any]:
        """
        Calculates the consensus target price and rating distributions.
        """
        reports = db.query(Report).filter(Report.stock_id == stock_id).all()
        if not reports:
            return {
                "avg_target_price": 0.0,
                "buy": 0,
                "hold": 0,
                "sell": 0,
                "total_reports": 0
            }

        total_reports = len(reports)
        tp_list = [float(r.target_price) for r in reports if r.target_price is not None]
        avg_target_price = sum(tp_list) / len(tp_list) if tp_list else 0.0

        # Count ratings
        buy_count = sum(1 for r in reports if r.rating == "BUY")
        hold_count = sum(1 for r in reports if r.rating == "HOLD")
        sell_count = sum(1 for r in reports if r.rating == "SELL")

        # Percentages
        buy_pct = round((buy_count / total_reports) * 100) if total_reports > 0 else 0
        hold_pct = round((hold_count / total_reports) * 100) if total_reports > 0 else 0
        sell_pct = round((sell_count / total_reports) * 100) if total_reports > 0 else 0

        # Adjust potential rounding error to sum to 100
        if total_reports > 0 and (buy_pct + hold_pct + sell_pct) != 100:
            diff = 100 - (buy_pct + hold_pct + sell_pct)
            # Add difference to the largest share
            if buy_pct >= hold_pct and buy_pct >= sell_pct:
                buy_pct += diff
            elif hold_pct >= buy_pct and hold_pct >= sell_pct:
                hold_pct += diff
            else:
                sell_pct += diff

        return {
            "avg_target_price": round(avg_target_price, 2),
            "buy": buy_pct,
            "hold": hold_pct,
            "sell": sell_pct,
            "buy_count": buy_count,
            "hold_count": hold_count,
            "sell_count": sell_count,
            "total_reports": total_reports
        }

    @staticmethod
    def calculate_upside(avg_target_price: float, current_price: float) -> float:
        """
        Calculates the percentage upside of target price over current price.
        """
        if current_price <= 0:
            return 0.0
        upside = (avg_target_price - current_price) / current_price
        return round(upside * 100, 2)

    @staticmethod
    def calculate_sentiment_score(db: Session, stock_id: int) -> Dict[str, Any]:
        """
        Calculates a sentiment distribution score from Bull/Bear weights.
        Bull Point weight = 1
        Bear Point weight = -1
        """
        reports = db.query(Report).filter(Report.stock_id == stock_id).all()
        if not reports:
            return {"bullish": 50, "neutral": 50, "bearish": 0}

        total_bull = 0
        total_bear = 0

        for r in reports:
            total_bull += db.query(func.count(BullPoint.id)).filter(BullPoint.report_id == r.id).scalar() or 0
            total_bear += db.query(func.count(BearPoint.id)).filter(BearPoint.report_id == r.id).scalar() or 0

        total_points = total_bull + total_bear
        if total_points == 0:
            # Fallback based on ratings if points are missing
            consensus = AnalyticsEngine.calculate_consensus(db, stock_id)
            return {
                "bullish": consensus["buy"],
                "neutral": consensus["hold"],
                "bearish": consensus["sell"]
            }

        # Sentiment percentages
        bullish_pct = round((total_bull / total_points) * 100)
        bearish_pct = round((total_bear / total_points) * 100)
        neutral_pct = 100 - (bullish_pct + bearish_pct)

        # Make sure no negative percentages
        if neutral_pct < 0:
            neutral_pct = 0
            # Normalize to 100
            sum_val = bullish_pct + bearish_pct
            bullish_pct = round((bullish_pct / sum_val) * 100)
            bearish_pct = 100 - bullish_pct

        return {
            "bullish": bullish_pct,
            "neutral": neutral_pct,
            "bearish": bearish_pct
        }

    @staticmethod
    def get_broker_rankings(db: Session) -> List[Dict[str, Any]]:
        """
        Ranks brokers by number of reports and aggregates historical target prices.
        Includes simulated metrics (Accuracy, Hit Rate).
        """
        brokers = db.query(Broker).all()
        rankings = []

        # Mock database stats for demonstration
        mock_stats = {
            "Goldman Sachs": {"accuracy": 91.5, "hit_rate": 84.0},
            "Morgan Stanley": {"accuracy": 88.0, "hit_rate": 79.5},
            "Citi": {"accuracy": 86.4, "hit_rate": 75.0},
            "JPMorgan": {"accuracy": 89.2, "hit_rate": 81.0},
            "UBS": {"accuracy": 85.0, "hit_rate": 72.0},
            "國泰投顧": {"accuracy": 87.5, "hit_rate": 78.0},
            "元大投顧": {"accuracy": 89.0, "hit_rate": 80.0},
        }

        for broker in brokers:
            reports_count = db.query(func.count(Report.id)).filter(Report.broker_id == broker.id).scalar() or 0
            if reports_count == 0:
                continue
                
            stats = mock_stats.get(broker.broker_name, {"accuracy": 85.0, "hit_rate": 75.0})
            
            rankings.append({
                "id": broker.id,
                "broker_name": broker.broker_name,
                "reports_count": reports_count,
                "accuracy": stats["accuracy"],
                "hit_rate": stats["hit_rate"]
            })

        # Sort by accuracy
        rankings.sort(key=lambda x: x["accuracy"], reverse=True)
        return rankings

    @staticmethod
    def get_trend_analysis(db: Session, stock_id: int, period: str = "6M") -> Dict[str, Any]:
        """
        Aggregates report rating upgrades/downgrades and target price movements.
        Supported periods: 3M, 6M, 1Y, 3Y.
        """
        now = datetime.utcnow().date()
        if period == "3M":
            start_date = now - timedelta(days=90)
        elif period == "6M":
            start_date = now - timedelta(days=180)
        elif period == "1Y":
            start_date = now - timedelta(days=365)
        elif period == "3Y":
            start_date = now - timedelta(days=365 * 3)
        else:
            start_date = now - timedelta(days=180) # Default to 6M

        reports = db.query(Report).filter(
            Report.stock_id == stock_id,
            Report.report_date >= start_date
        ).order_by(Report.report_date.asc()).all()

        historical_points = []
        upgrades = 0
        downgrades = 0
        tp_upgrades = 0
        tp_cuts = 0

        # We need to compute changes sequentially to track upgrades/downgrades
        # To do this correctly, we track the last rating/target price per broker
        broker_last_ratings = {}
        broker_last_tps = {}

        for r in reports:
            broker_name = r.broker.broker_name
            current_rating = r.rating
            current_tp = float(r.target_price) if r.target_price is not None else None

            # Check rating change
            if broker_name in broker_last_ratings:
                last_r = broker_last_ratings[broker_name]
                # BUY > HOLD > SELL
                r_weights = {"BUY": 3, "HOLD": 2, "SELL": 1}
                if r_weights.get(current_rating, 2) > r_weights.get(last_r, 2):
                    upgrades += 1
                elif r_weights.get(current_rating, 2) < r_weights.get(last_r, 2):
                    downgrades += 1

            # Check target price change
            if broker_name in broker_last_tps and current_tp is not None:
                last_tp = broker_last_tps[broker_name]
                if last_tp is not None:
                    if current_tp > last_tp:
                        tp_upgrades += 1
                    elif current_tp < last_tp:
                        tp_cuts += 1

            # Update records
            broker_last_ratings[broker_name] = current_rating
            if current_tp is not None:
                broker_last_tps[broker_name] = current_tp

            # Create plot point
            historical_points.append({
                "date": r.report_date.strftime("%Y-%m-%d"),
                "broker": broker_name,
                "rating": current_rating,
                "target_price": current_tp
            })

        # Generate summary stats
        return {
            "historical_points": historical_points,
            "metrics": {
                "rating_upgrades": upgrades,
                "rating_downgrades": downgrades,
                "target_price_upgrades": tp_upgrades,
                "target_price_cuts": tp_cuts
            }
        }
