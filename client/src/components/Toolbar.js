import React from 'react';
import './Toolbar.css';
import Icon from './Icon';
import MonthSelector from './MonthSelector';

export default function Toolbar({ month, onMonthChange, onAddTenant, theme, onThemeChange }) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <div className="toolbar panel">
      <MonthSelector value={month} onChange={onMonthChange} />
      <span className="toolbar-divider" aria-hidden="true" />
      <button className="btn btn-ghost" type="button" onClick={onAddTenant}>
        <Icon name="plus" />
        Add tenant
      </button>
      <span className="toolbar-divider" aria-hidden="true" />
      <button
        className="icon-btn"
        type="button"
        onClick={() => onThemeChange(nextTheme)}
        aria-label={`Switch to ${nextTheme} mode`}
        title={`Switch to ${nextTheme} mode`}
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      </button>
    </div>
  );
}
