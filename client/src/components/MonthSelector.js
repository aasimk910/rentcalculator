import React from 'react';
import './MonthSelector.css';
import Icon from './Icon';

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
    <div className="month-selector" role="group" aria-label="Billing month">
      <span className="select-wrap">
        <select
          className="month-select"
          aria-label="Month"
          value={selMonth}
          onChange={(e) => handleChange('month', e.target.value)}
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <Icon name="chevronDown" size={14} />
      </span>
      <span className="select-wrap">
        <select
          className="month-select"
          aria-label="Year"
          value={selYear}
          onChange={(e) => handleChange('year', e.target.value)}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <Icon name="chevronDown" size={14} />
      </span>
    </div>
  );
}
