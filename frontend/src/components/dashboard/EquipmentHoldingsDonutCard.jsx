import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Radio, Activity, RefreshCw } from 'lucide-react';

const PALETTE = [
  { key: 'serviceable', label: 'Serviceable (Operational)', color: '#16A34A', textColor: '#15803D', hoverColor: '#15803D', lightBg: 'rgba(22, 163, 74, 0.14)' },
  { key: 'underRepair', label: 'Under Repair (Workshop)', color: '#86EFAC', textColor: '#166534', hoverColor: '#4ADE80', lightBg: 'rgba(134, 239, 172, 0.22)' },
  { key: 'active', label: 'Active Operations', color: '#22C55E', textColor: '#15803D', hoverColor: '#16A34A', lightBg: 'rgba(34, 197, 94, 0.16)' },
  { key: 'reserve', label: 'Reserve / In Stores', color: '#064E3B', textColor: '#064E3B', hoverColor: '#022C22', lightBg: 'rgba(6, 78, 59, 0.16)' }
];

export const EquipmentHoldingsDonutCard = ({ stats }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [timeFilter, setTimeFilter] = useState('Live Real-time');

  const total = Number(stats?.totalPhysicalItems) || 0;
  const serviceable = Number(stats?.serviceableCount) || 0;
  const underRepair = Number(stats?.underRepairCount) || 0;
  const active = Number(stats?.activeTasksCount) || 0;

  // Calculate reserve/unassigned if any remain
  const accounted = serviceable + underRepair + active;
  const reserve = total > accounted ? total - accounted : 0;

  const rawSegments = [
    { ...PALETTE[0], value: serviceable },
    { ...PALETTE[1], value: underRepair },
    { ...PALETTE[2], value: active },
    ...(reserve > 0 ? [{ ...PALETTE[3], value: reserve }] : [])
  ];

  // Filter out 0 value items if total > 0
  const activeSegments = total > 0 
    ? rawSegments.map(s => {
        const rawPct = total > 0 ? (s.value / total) * 100 : 0;
        const rounded = Math.round(rawPct);
        const percentDisplay = s.value > 0 && rounded === 0 ? '< 1%' : `${rounded}%`;
        return {
          ...s,
          percent: rounded,
          percentDisplay,
          fraction: total > 0 ? s.value / total : 0
        };
      })
    : [
        { ...PALETTE[0], value: 0, percent: 0, percentDisplay: '0%', fraction: 0.5 },
        { ...PALETTE[1], value: 0, percent: 0, percentDisplay: '0%', fraction: 0.3 },
        { ...PALETTE[2], value: 0, percent: 0, percentDisplay: '0%', fraction: 0.2 }
      ];

  // SVG Donut geometry (240px base for crisp, prominent ring)
  const size = 240;
  const strokeWidth = 32;
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 6;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke offsets
  let accumulatedPercent = 0;
  const svgSegments = activeSegments.map((seg, idx) => {
    const fraction = total > 0 ? seg.fraction : (idx === 0 ? 0.5 : idx === 1 ? 0.3 : 0.2);
    const strokeDasharray = `${fraction * circumference} ${circumference * (1 - fraction)}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += fraction;

    return {
      ...seg,
      strokeDasharray,
      strokeDashoffset,
      idx
    };
  });

  const activeHovered = hoveredIdx !== null ? svgSegments[hoveredIdx] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="equipment-donut-card w-100 h-100 d-flex flex-column justify-content-between mb-0"
    >
      {/* Card Header */}
      <div className="equipment-donut-header">
        <div className="d-flex align-items-center gap-2">
          <h2 className="equipment-donut-title mb-0">Analytics</h2>
          <span className="equipment-donut-subtitle d-none d-sm-inline">
            Sapper Equipment Holdings &amp; Task Readiness
          </span>
        </div>

        {/* Dropdown Pill Button */}
        <div className="dropdown">
          <button
            className="equipment-filter-pill"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <Activity size={14} className="text-success" />
            <span>{timeFilter}</span>
            <ChevronDown size={14} />
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
            {['Live Real-time', 'Monthly View', 'Quarterly Audit', 'Annual Cycle'].map(item => (
              <li key={item}>
                <button
                  className="dropdown-item py-2 px-3"
                  onClick={() => setTimeFilter(item)}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Card Body */}
      <div className="equipment-donut-body">
        {/* Left: Donut Chart */}
        <div className="equipment-donut-chart-box">
          <div className="equipment-donut-svg-wrapper">
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${size} ${size}`}
              className="equipment-donut-svg"
            >
              {/* Background circle track */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="var(--border-color)"
                strokeWidth={strokeWidth}
                opacity={0.3}
              />

              {/* Data Segments */}
              {svgSegments.map((seg, idx) => {
                const isHovered = hoveredIdx === idx;
                return (
                  <circle
                    key={seg.key}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="butt"
                    transform={`rotate(-90 ${center} ${center})`}
                    style={{
                      cursor: 'pointer',
                      transition: 'stroke-width 0.25s ease, filter 0.25s ease, opacity 0.25s ease',
                      filter: isHovered ? `drop-shadow(0 4px 12px ${seg.color}66)` : 'none',
                      opacity: hoveredIdx !== null && !isHovered ? 0.65 : 1
                    }}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
            </svg>

            {/* Donut Center Content */}
            <div className="equipment-donut-center-info">
              <span className="equipment-donut-center-label">
                {activeHovered ? activeHovered.label : 'Total Tagged Equipment'}
              </span>
              <span className="equipment-donut-center-val">
                {activeHovered ? activeHovered.value.toLocaleString() : total.toLocaleString()}
              </span>
              {activeHovered && (
                <span className="equipment-donut-center-badge" style={{ color: activeHovered.textColor || activeHovered.color, background: activeHovered.lightBg }}>
                  {activeHovered.percentDisplay} of total
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Legend Breakdown List */}
        <div className="equipment-donut-legend">
          {svgSegments.map((seg, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={seg.key}
                className={`equipment-legend-item ${isHovered ? 'is-hovered' : ''}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="d-flex align-items-center justify-content-end gap-2">
                  <span
                    className="equipment-legend-dot"
                    style={{
                      backgroundColor: seg.color,
                      boxShadow: isHovered ? `0 0 10px ${seg.color}` : 'none'
                    }}
                  />
                  <span className="equipment-legend-label">{seg.label}</span>
                </div>
                <div className="d-flex align-items-baseline justify-content-end gap-2 mt-1">
                  <span className="equipment-legend-percent">{seg.percentDisplay}</span>
                  <span className="equipment-legend-count">
                    ({seg.value.toLocaleString()} {seg.value === 1 ? 'unit' : 'units'})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default EquipmentHoldingsDonutCard;
