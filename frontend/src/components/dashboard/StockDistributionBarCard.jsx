import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronDown, BarChart3, Filter } from 'lucide-react';

/* ─── Curated Color Palettes (Harmonious Military Green Spectrum) ─────── */
const PALETTE_LAYERS = [
  { key: 'base', label: 'Serviceable', color: '#15803D', lightColor: '#86EFAC', softColor: 'rgba(21, 128, 61, 0.45)' },
  { key: 'allowances', label: 'In Stores', color: '#22C55E', lightColor: '#A7F3D0', softColor: 'rgba(34, 197, 94, 0.45)' },
  { key: 'stocks', label: 'Deployed', color: '#10B981', lightColor: '#BBF7D0', softColor: 'rgba(16, 185, 129, 0.45)' },
  { key: 'bonus', label: 'Workshop', color: '#34D399', lightColor: '#D1FAE5', softColor: 'rgba(52, 211, 153, 0.45)' },
  { key: 'tax', label: 'In Transit', color: '#6EE7B7', lightColor: '#E6FFFA', softColor: 'rgba(110, 231, 183, 0.45)' },
];

/* ─── Mock Distribution Datasets (Military Engineering / Stores) ──────── */
const DATASET_ESTABLISHMENTS = [
  { id: '1', name: 'Trg Bn I', base: 420, allowances: 180, stocks: 95, bonus: 55, tax: 28 },
  { id: '2', name: 'HQ Coy', base: 210, allowances: 140, stocks: 80, bonus: 40, tax: 20 },
  { id: '3', name: '105 Engr', base: 190, allowances: 160, stocks: 90, bonus: 45, tax: 22 },
  { id: '4', name: 'Depot Rk', base: 160, allowances: 130, stocks: 75, bonus: 35, tax: 18 },
  { id: '5', name: 'Fld Park', base: 175, allowances: 135, stocks: 70, bonus: 38, tax: 19 },
  { id: '6', name: 'Signals', base: 260, allowances: 190, stocks: 110, bonus: 50, tax: 25 },
];

const DATASET_NOMENCLATURE = [
  { id: '1', name: 'Assault Rope', base: 120, allowances: 45, stocks: 30, bonus: 20, tax: 12 },
  { id: '2', name: 'Concertina', base: 85, allowances: 38, stocks: 22, bonus: 16, tax: 10 },
  { id: '3', name: 'Camo Net', base: 95, allowances: 40, stocks: 25, bonus: 18, tax: 8 },
  { id: '4', name: 'Helmets', base: 110, allowances: 50, stocks: 28, bonus: 15, tax: 14 },
  { id: '5', name: 'NBC Kits', base: 70, allowances: 30, stocks: 18, bonus: 12, tax: 6 },
  { id: '6', name: 'Drill Bits', base: 105, allowances: 42, stocks: 24, bonus: 14, tax: 9 },
];

export const StockDistributionBarCard = ({ stats }) => {
  const [viewMode, setViewMode] = useState('Establishments'); // 'Establishments' | 'Nomenclature'
  const [activeIdx, setActiveIdx] = useState(0); // 0 corresponds to first bar (highlighted by default like 'Kristin')
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const data = viewMode === 'Establishments' ? DATASET_ESTABLISHMENTS : DATASET_NOMENCLATURE;

  // Selected bar (hovered takes precedence, otherwise selected)
  const currentSelectedIdx = hoveredIdx !== null ? hoveredIdx : activeIdx;
  const currentItem = data[currentSelectedIdx] || data[0];

  // Calculate totals and max height for proportional stacked scaling
  const chartMax = useMemo(() => {
    const maxVal = Math.max(...data.map(d => d.base + d.allowances + d.stocks + d.bonus + d.tax));
    return Math.ceil(maxVal * 1.15 / 100) * 100 || 800;
  }, [data]);

  // Y-axis tick marks
  const yTicks = [
    { label: `${chartMax}`, val: chartMax },
    { label: `${Math.round(chartMax * 0.65)}`, val: Math.round(chartMax * 0.65) },
    { label: `${Math.round(chartMax * 0.35)}`, val: Math.round(chartMax * 0.35) },
    { label: `${Math.round(chartMax * 0.1)}`, val: Math.round(chartMax * 0.1) },
    { label: '0', val: 0 },
  ];

  // Chart Geometry (balanced 165px height matching donut)
  const chartHeight = 165;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
      className="equipment-donut-card stock-distribution-card w-100 h-100 d-flex flex-column mb-0"
    >
      {/* ── Card Header ───────────────────────────────────── */}
      <div>
        <div className="equipment-donut-header mb-3">
          <div className="d-flex align-items-center gap-2">
            <h2 className="equipment-donut-title mb-0">Stock Distribution</h2>
            <span className="equipment-donut-subtitle d-none d-sm-inline">
              Stores &amp; Holdings Allocation
            </span>
          </div>

          {/* View Mode Toggle Pill */}
          <div className="dropdown">
            <button
              className="equipment-filter-pill"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <Filter size={13} className="text-primary" />
              <span>By {viewMode}</span>
              <ChevronDown size={14} />
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
              <li>
                <button
                  className={`dropdown-item py-2 px-3 ${viewMode === 'Establishments' ? 'fw-bold text-primary' : ''}`}
                  onClick={() => { setViewMode('Establishments'); setActiveIdx(0); }}
                >
                  By Establishments
                </button>
              </li>
              <li>
                <button
                  className={`dropdown-item py-2 px-3 ${viewMode === 'Nomenclature' ? 'fw-bold text-primary' : ''}`}
                  onClick={() => { setViewMode('Nomenclature'); setActiveIdx(0); }}
                >
                  By Nomenclature
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Legend Dots Row ───────────────────────────────── */}
        <div className="stock-dist-legend-row d-flex align-items-center flex-wrap gap-3 mb-2">
          {PALETTE_LAYERS.map(layer => (
            <div key={layer.key} className="d-flex align-items-center gap-1.5 stock-dist-legend-item">
              <span
                className="stock-dist-legend-dot"
                style={{ backgroundColor: layer.color }}
              />
              <span className="stock-dist-legend-name">{layer.label}</span>
            </div>
          ))}
        </div>

        {/* ── Values Ribbon / Metrics Capsule Strip (matches reference image) ── */}
        <div className="stock-dist-values-strip mb-4">
          {PALETTE_LAYERS.map(layer => {
            const val = currentItem ? currentItem[layer.key] : 0;
            return (
              <div key={layer.key} className="stock-dist-val-cell">
                <span className="stock-dist-val-num">
                  {val.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Stacked Bar Chart Visualization ──────────────── */}
      <div className="stock-dist-chart-container position-relative">
        {/* Y-Axis scale on left */}
        <div className="stock-dist-yaxis">
          {yTicks.map((tick, i) => (
            <span key={i} className="stock-dist-ytick">{tick.label}</span>
          ))}
        </div>

        {/* Chart Bars Canvas Area */}
        <div className="stock-dist-bars-wrap">
          {/* Subtle horizontal grid lines */}
          <div className="stock-dist-gridlines">
            {yTicks.map((_, i) => (
              <div key={i} className="stock-dist-gridline" />
            ))}
          </div>

          {/* Stacked Columns */}
          <div className="stock-dist-columns">
            {data.map((item, colIdx) => {
              const isSelected = currentSelectedIdx === colIdx;
              const colTotal = item.base + item.allowances + item.stocks + item.bonus + item.tax;
              
              // Calculate segment heights proportionally
              const hBase = (item.base / chartMax) * chartHeight;
              const hAllowances = (item.allowances / chartMax) * chartHeight;
              const hStocks = (item.stocks / chartMax) * chartHeight;
              const hBonus = (item.bonus / chartMax) * chartHeight;
              const hTax = (item.tax / chartMax) * chartHeight;

              return (
                <div
                  key={item.id}
                  className={`stock-dist-column ${isSelected ? 'is-active' : ''}`}
                  onMouseEnter={() => setHoveredIdx(colIdx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setActiveIdx(colIdx)}
                >
                  {/* Stack of segments (rendered bottom to top) */}
                  <div
                    className="stock-dist-stack"
                    style={{ height: `${chartHeight}px` }}
                  >
                    {/* Layer 5 (Top): Transit/Tax */}
                    <div
                      className="stock-dist-segment segment-top"
                      style={{
                        height: `${Math.max(hTax, 4)}px`,
                        backgroundColor: isSelected ? PALETTE_LAYERS[4].color : PALETTE_LAYERS[4].lightColor,
                      }}
                      title={`${PALETTE_LAYERS[4].label}: ${item.tax}`}
                    />

                    {/* Layer 4: Workshop/Bonus */}
                    <div
                      className="stock-dist-segment"
                      style={{
                        height: `${Math.max(hBonus, 4)}px`,
                        backgroundColor: isSelected ? PALETTE_LAYERS[3].color : PALETTE_LAYERS[3].lightColor,
                      }}
                      title={`${PALETTE_LAYERS[3].label}: ${item.bonus}`}
                    />

                    {/* Layer 3: Deployed/Stocks */}
                    <div
                      className="stock-dist-segment"
                      style={{
                        height: `${Math.max(hStocks, 4)}px`,
                        backgroundColor: isSelected ? PALETTE_LAYERS[2].color : PALETTE_LAYERS[2].lightColor,
                      }}
                      title={`${PALETTE_LAYERS[2].label}: ${item.stocks}`}
                    />

                    {/* Layer 2: In Stores/Allowances */}
                    <div
                      className="stock-dist-segment"
                      style={{
                        height: `${Math.max(hAllowances, 4)}px`,
                        backgroundColor: isSelected ? PALETTE_LAYERS[1].color : PALETTE_LAYERS[1].lightColor,
                      }}
                      title={`${PALETTE_LAYERS[1].label}: ${item.allowances}`}
                    />

                    {/* Layer 1 (Bottom): Serviceable/Base */}
                    <div
                      className="stock-dist-segment segment-bottom"
                      style={{
                        height: `${Math.max(hBase, 6)}px`,
                        backgroundColor: isSelected ? PALETTE_LAYERS[0].color : PALETTE_LAYERS[0].lightColor,
                        boxShadow: isSelected ? `0 6px 16px ${PALETTE_LAYERS[0].color}55` : 'none'
                      }}
                      title={`${PALETTE_LAYERS[0].label}: ${item.base}`}
                    />
                  </div>

                  {/* X-Axis Category Label */}
                  <span className={`stock-dist-xlabel ${isSelected ? 'is-active-label' : ''}`}>
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StockDistributionBarCard;
