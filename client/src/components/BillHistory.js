import React, { useState } from 'react';
import './BillHistory.css';

export default function BillHistory({ history }) {
  const [expanded, setExpanded] = useState(false);

  if (!history || history.length === 0) return null;

  const sorted = [...history].reverse();
  const display = expanded ? sorted : sorted.slice(0, 3);

  return (
    <div className="bill-history-card">
      <div className="history-header">
        <h3 className="history-title">Bill History</h3>
        <span className="history-count">{history.length} bills</span>
      </div>
      <div className="history-list">
        {display.map((bill) => (
          <div className="history-item" key={bill._id}>
            <div className="history-item-top">
              <span className="history-month">{bill.month}</span>
              <span className="history-total mono">NPR {bill.totalBill.toLocaleString()}</span>
            </div>
            <div className="history-breakdown">
              <span>Rent: NPR {bill.rent.toLocaleString()}</span>
              <span>Water: NPR {bill.waterBill.toLocaleString()}</span>
              <span>Wastage: NPR {bill.wastageBill.toLocaleString()}</span>
              <span>Electricity: NPR {bill.electricityBill.toLocaleString()} ({bill.consumedUnits} units)</span>
            </div>
          </div>
        ))}
      </div>
      {history.length > 3 && (
        <button className="history-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less ▲' : `Show all ${history.length} bills ▼`}
        </button>
      )}
    </div>
  );
}
