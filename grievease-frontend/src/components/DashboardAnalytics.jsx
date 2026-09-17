import { useMemo, useRef } from 'react';
import { BarChart3, Download, PieChart } from 'lucide-react';

const STATUSES = ['Open', 'In Progress', 'Resolved'];
const PRIORITIES = ['Low', 'Medium', 'Critical'];
const STATUS_COLORS = { Open: '#fbbf24', 'In Progress': '#60a5fa', Resolved: '#34d399' };
const PRIORITY_COLORS = { Low: '#60a5fa', Medium: '#a78bfa', Critical: '#f43f5e' };

const normaliseStatus = (status) => STATUSES.includes(status) ? status : 'Open';
const normalisePriority = (priority) => PRIORITIES.find((item) => item.toLowerCase() === String(priority || '').toLowerCase()) || 'Low';

const DashboardAnalytics = ({ complaints = [], title, scopeLabel, chartType = 'priority' }) => {
  const chartRef = useRef(null);
  const chartData = useMemo(() => {
    if (chartType === 'station-status') {
      const stationNames = [...new Set(complaints.map((item) => item.station || 'Unassigned'))];
      return stationNames.map((station) => ({
        label: station,
        values: Object.fromEntries(STATUSES.map((status) => [status, complaints.filter((item) => (item.station || 'Unassigned') === station && normaliseStatus(item.status) === status).length]))
      }));
    }
    const labels = chartType === 'status-donut' ? STATUSES : PRIORITIES;
    const getValue = chartType === 'status-donut' ? (item) => normaliseStatus(item.status) : (item) => normalisePriority(item.priorityLevel);
    return labels.map((label) => ({ label, value: complaints.filter((item) => getValue(item) === label).length }));
  }, [chartType, complaints]);

  const reportRows = chartType === 'station-status'
    ? [['Station', ...STATUSES], ...chartData.map((item) => [item.label, ...STATUSES.map((status) => item.values[status])])]
    : [['Metric', 'Count'], ...chartData.map((item) => [item.label, item.value])];

  const downloadAnalysis = () => {
    const rows = [['GrievEase analysis', scopeLabel], ['Generated at', new Date().toLocaleString()], [], ...reportRows, [], ['Total complaints', complaints.length]];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `grievease-analysis-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadChart = () => {
    if (!chartRef.current) return;
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(chartRef.current)], { type: 'image/svg+xml;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `grievease-chart-${new Date().toISOString().slice(0, 10)}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderStationStatusChart = () => {
    const chartWidth = Math.max(680, chartData.length * 115 + 100);
    const maxValue = Math.max(...chartData.map((item) => STATUSES.reduce((total, status) => total + item.values[status], 0)), 1);
    const ticks = [0, Math.ceil(maxValue / 4), Math.ceil(maxValue / 2), Math.ceil((maxValue * 3) / 4), maxValue];
    return <div className="overflow-x-auto"><svg ref={chartRef} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${chartWidth} 300`} className="min-w-[680px] w-full" role="img" aria-label="Station-wise complaint counts stacked by status">
      <text x="55" y="20" fill="#94a3b8" fontSize="12">Number of complaints</text>
      {ticks.map((tick) => { const y = 245 - (tick / maxValue) * 190; return <g key={tick}><line x1="55" y1={y} x2={chartWidth - 20} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="3 4" /><text x="45" y={y + 4} fill="#94a3b8" textAnchor="end" fontSize="11">{tick}</text></g>; })}
      {chartData.map((station, index) => { const x = 75 + index * 115; let currentY = 245; const total = STATUSES.reduce((sum, status) => sum + station.values[status], 0); return <g key={station.label}>{STATUSES.map((status) => { const height = (station.values[status] / maxValue) * 190; currentY -= height; return height > 0 ? <rect key={status} x={x} y={currentY} width="58" height={height} fill={STATUS_COLORS[status]}><title>{`${station.label}: ${status} ${station.values[status]}`}</title></rect> : null; })}<text x={x + 29} y={currentY - 8} fill="#e2e8f0" textAnchor="middle" fontSize="13" fontWeight="700">{total}</text><text x={x + 29} y="267" fill="#94a3b8" textAnchor="middle" fontSize="11">{station.label.length > 14 ? `${station.label.slice(0, 13)}…` : station.label}</text></g>; })}
      <line x1="55" y1="245" x2={chartWidth - 20} y2="245" stroke="#475569" strokeWidth="1" />
    </svg></div>;
  };

  const renderPriorityChart = () => { const maxValue = Math.max(...chartData.map((item) => item.value), 1); return <svg ref={chartRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 270" className="w-full" role="img" aria-label="Complaint counts by priority"><text x="55" y="20" fill="#94a3b8" fontSize="12">Number of complaints</text><line x1="55" y1="220" x2="655" y2="220" stroke="#475569" strokeWidth="1" />{chartData.map((item, index) => { const x = 130 + index * 175; const height = (item.value / maxValue) * 165; return <g key={item.label}><rect x={x} y={220 - height} width="95" height={height} rx="10" fill={PRIORITY_COLORS[item.label]}><title>{`${item.label}: ${item.value}`}</title></rect><text x={x + 47} y={208 - height} fill="#e2e8f0" textAnchor="middle" fontSize="15" fontWeight="700">{item.value}</text><text x={x + 47} y="247" fill="#cbd5e1" textAnchor="middle" fontSize="13">{item.label}</text></g>; })}</svg>; };

  const renderStatusDonut = () => { const total = complaints.length; const radius = 78; const circumference = 2 * Math.PI * radius; let offset = 0; return <div className="flex flex-col items-center gap-5 md:flex-row md:justify-center md:gap-12"><svg ref={chartRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 270" className="w-64 h-64" role="img" aria-label="Your complaint status distribution"><circle cx="135" cy="135" r={radius} fill="none" stroke="#1e293b" strokeWidth="28" />{chartData.map((item) => { const length = total ? (item.value / total) * circumference : 0; const segment = <circle key={item.label} cx="135" cy="135" r={radius} fill="none" stroke={STATUS_COLORS[item.label]} strokeWidth="28" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} transform="rotate(-90 135 135)"><title>{`${item.label}: ${item.value}`}</title></circle>; offset += length; return segment; })}<text x="135" y="128" fill="#f8fafc" textAnchor="middle" fontSize="30" fontWeight="700">{total}</text><text x="135" y="151" fill="#94a3b8" textAnchor="middle" fontSize="12">Total complaints</text></svg><div className="space-y-3">{chartData.map((item) => <div key={item.label} className="flex items-center justify-between gap-10 text-sm"><span className="flex items-center gap-2 text-slate-300"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.label] }} />{item.label}</span><span className="font-bold text-white">{item.value}</span></div>)}</div></div>; };

  const isStationChart = chartType === 'station-status';
  const icon = chartType === 'status-donut' ? <PieChart className="w-5 h-5 text-blue-400" /> : <BarChart3 className="w-5 h-5 text-blue-400" />;
  const legend = chartType === 'station-status' ? STATUSES : chartType === 'priority' ? PRIORITIES : [];
  return <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6"><div className="flex items-center gap-2"><div>{icon}</div><div><h2 className="font-bold text-white text-lg">{title}</h2><p className="text-xs text-slate-400">{scopeLabel} · {complaints.length} total complaints</p></div></div><div className="flex flex-wrap gap-2"><button onClick={downloadChart} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition"><Download className="w-4 h-4" /> Chart SVG</button><button onClick={downloadAnalysis} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition"><Download className="w-4 h-4" /> Report CSV</button></div></div>{legend.length > 0 && <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2">{legend.map((label) => <span key={label} className="flex items-center gap-2 text-xs text-slate-300"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: isStationChart ? STATUS_COLORS[label] : PRIORITY_COLORS[label] }} />{label}</span>)}</div>}{chartType === 'station-status' ? renderStationStatusChart() : chartType === 'status-donut' ? renderStatusDonut() : renderPriorityChart()}</section>;
};

export default DashboardAnalytics;
