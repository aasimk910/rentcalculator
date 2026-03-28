import React from 'react';
import './MonthSelector.css';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function MonthSelector({ value, onChange }) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const [selMonth, selYear] = value ? value.split(' ') : [MONTHS[new Date().getMonth()], String(currentYear)];

  const handleChange = (type, val) => {
    const m = type === 'month' ? val : selMonth;
    const y = type === 'year' ? val : selYear;
    onChange(`${m} ${y}`);
  };

  return (
    <div className="month-selector">
      <label className="month-selector-label">Billing Month</label>
      <div className="month-selector-controls">
        <select
          className="month-select"
          value={selMonth}
          onChange={(e) => handleChange('month', e.target.value)}
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          className="month-select"
          value={selYear}
          onChange={(e) => handleChange('year', e.target.value)}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
