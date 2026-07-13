import type {
  IChartApi,
  ISeriesApi,
  ISeriesPrimitive,
  ISeriesPrimitivePaneRenderer,
  ISeriesPrimitivePaneView,
  SeriesAttachedParameter,
  Time,
} from 'lightweight-charts';
import type { BacktestTrade } from '../../types';

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.length === 3 ? h[0] + h[0] : h.slice(0, 2), 16);
  const g = parseInt(h.length === 3 ? h[1] + h[1] : h.slice(2, 4), 16);
  const b = parseInt(h.length === 3 ? h[2] + h[2] : h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function pctDistance(a: number, b: number): number {
  return (Math.abs(a - b) / a) * 100;
}

function toUnixSeconds(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

interface Zone {
  x1: number; x2: number;
  yEntry: number; yTp: number; ySl: number;
  side: 'long' | 'short';
  pnl: number;
  qty: number;
  rr: number;
  entryPrice: number;
  tp: number;
  sl: number;
}

class TradeZonesPaneRenderer implements ISeriesPrimitivePaneRenderer {
  private _trades: BacktestTrade[];
  private _chart: IChartApi;
  private _series: ISeriesApi<'Candlestick'>;
  private _upColor: string;
  private _downColor: string;

  constructor(trades: BacktestTrade[], chart: IChartApi, series: ISeriesApi<'Candlestick'>, upColor: string, downColor: string) {
    this._trades = trades;
    this._chart = chart;
    this._series = series;
    this._upColor = upColor;
    this._downColor = downColor;
  }

  draw(target: Parameters<ISeriesPrimitivePaneRenderer['draw']>[0]) {
    const timeScale = this._chart.timeScale();
    const targetLine = this._upColor;
    const stopLine = this._downColor;
    const targetFill = hexToRgba(targetLine, 0.4);
    const stopFill = hexToRgba(stopLine, 0.4);

    const zones: Zone[] = [];
    for (const t of this._trades) {
      if (t.tp_price == null || t.sl_price == null) continue;
      const x1 = timeScale.timeToCoordinate(toUnixSeconds(t.entry_time) as Time);
      const x2 = timeScale.timeToCoordinate(toUnixSeconds(t.exit_time) as Time);
      const yEntry = this._series.priceToCoordinate(t.entry_price);
      const yTp = this._series.priceToCoordinate(t.tp_price);
      const ySl = this._series.priceToCoordinate(t.sl_price);
      if (x1 === null || x2 === null || yEntry === null || yTp === null || ySl === null) continue;

      const rr = Math.abs(t.entry_price - t.tp_price) / (Math.abs(t.entry_price - t.sl_price) || 1);
      zones.push({
        x1, x2, yEntry, yTp, ySl,
        side: t.side, pnl: t.pnl, qty: t.quantity, rr,
        entryPrice: t.entry_price, tp: t.tp_price, sl: t.sl_price,
      });
    }

    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      ctx.save();
      ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);

      zones.forEach(z => {
        const x = Math.min(z.x1, z.x2);
        const w = Math.abs(z.x2 - z.x1) || 1;

        ctx.fillStyle = targetFill;
        ctx.strokeStyle = targetLine;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        const targetY = Math.min(z.yEntry, z.yTp);
        const targetH = Math.abs(z.yTp - z.yEntry) || 1;
        ctx.fillRect(x, targetY, w, targetH);
        ctx.strokeRect(x, targetY, w, targetH);

        ctx.fillStyle = stopFill;
        ctx.strokeStyle = stopLine;
        const stopY = Math.min(z.yEntry, z.ySl);
        const stopH = Math.abs(z.ySl - z.yEntry) || 1;
        ctx.fillRect(x, stopY, w, stopH);
        ctx.strokeRect(x, stopY, w, stopH);

        ctx.strokeStyle = '#787b86';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, z.yEntry);
        ctx.lineTo(x + w, z.yEntry);
        ctx.stroke();
        ctx.setLineDash([]);

        if (w > 60) {
          ctx.font = '10px -apple-system, sans-serif';
          ctx.textBaseline = 'middle';

          const sideLabel = z.side === 'long' ? 'LONG' : 'SHORT';
          ctx.fillStyle = targetLine;
          ctx.textAlign = 'left';
          ctx.fillText(`Target: ${z.tp.toFixed(5)} (${pctDistance(z.entryPrice, z.tp).toFixed(2)}%)`, x + 4, targetY + 10);

          ctx.fillStyle = stopLine;
          ctx.fillText(`Stop: ${z.sl.toFixed(5)} (${pctDistance(z.entryPrice, z.sl).toFixed(2)}%)`, x + 4, stopY + stopH - 10);

          ctx.fillStyle = z.pnl >= 0 ? targetLine : stopLine;
          ctx.textAlign = 'center';
          ctx.fillText(
            `${sideLabel} · P&L: ${z.pnl >= 0 ? '+' : ''}${z.pnl.toFixed(2)} · Qty: ${Math.round(z.qty)} · R:R 1:${z.rr.toFixed(1)}`,
            x + w / 2, z.yEntry - 10
          );
        }
      });

      ctx.restore();
    });
  }
}

class TradeZonesPaneView implements ISeriesPrimitivePaneView {
  private _source: TradeZonesPrimitive;

  constructor(source: TradeZonesPrimitive) {
    this._source = source;
  }

  update() {}

  renderer(): ISeriesPrimitivePaneRenderer | null {
    if (!this._source.chart || !this._source.series) return null;
    return new TradeZonesPaneRenderer(
      this._source.trades,
      this._source.chart,
      this._source.series,
      this._source.upColor,
      this._source.downColor,
    );
  }
}

export class TradeZonesPrimitive implements ISeriesPrimitive<Time> {
  trades: BacktestTrade[];
  upColor: string;
  downColor: string;
  chart: IChartApi | null = null;
  series: ISeriesApi<'Candlestick'> | null = null;
  private _paneView: TradeZonesPaneView;

  constructor(trades: BacktestTrade[], upColor: string, downColor: string) {
    this.trades = trades;
    this.upColor = upColor;
    this.downColor = downColor;
    this._paneView = new TradeZonesPaneView(this);
  }

  attached(param: SeriesAttachedParameter<Time>) {
    this.chart = param.chart;
    this.series = param.series as ISeriesApi<'Candlestick'>;
  }

  detached() {
    this.chart = null;
    this.series = null;
  }

  updateAllViews() {}

  paneViews() {
    return [this._paneView];
  }
}
