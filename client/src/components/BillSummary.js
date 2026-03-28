import React, { useRef, useEffect, useState } from 'react';
import './BillSummary.css';

const ELECTRICITY_RATE = 11;

function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(target);
  const prev = useRef(target);
  const raf = useRef(null);

  useEffect(() => {
    const from = prev.current;
    const to = target;
    if (from === to) return;

    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        raf.current = requestAnimationFrame(animate);
      } else {
        prev.current = to;
      }
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

function AnimatedAmount({ value }) {
  const animated = useCountUp(value);
  return <span>{animated.toLocaleString()}</span>;
}

export default function BillSummary({ tenant, month, onGenerateBill, generating }) {
  const printRef = useRef(null);

  if (!tenant) {
    return (
      <div className="bill-summary-card bill-empty">
        <div className="bill-empty-icon">🧾</div>
        <p className="bill-empty-text">Select a tenant to view their bill summary</p>
      </div>
    );
  }

  const consumed = tenant.currentUnit - tenant.previousUnit;
  const electricityBill = consumed * ELECTRICITY_RATE;
  const total = tenant.rent + tenant.waterBill + tenant.wastageBill + electricityBill;

  const handlePrint = () => window.print();

  const whatsappMessage =
    `*Rent Bill - ${month}*\n` +
    `Tenant: ${tenant.name}\n` +
    `Room: ${tenant.roomNumber}\n` +
    `\n` +
    `Rent:         NPR ${tenant.rent.toLocaleString()}\n` +
    `Water:        NPR ${tenant.waterBill.toLocaleString()}\n` +
    `Wastage:      NPR ${tenant.wastageBill.toLocaleString()}\n` +
    `Electricity:  NPR ${electricityBill.toLocaleString()} (${consumed} units @ NPR 11)\n` +
    `─────────────────────\n` +
    `*Total: NPR ${total.toLocaleString()}*\n` +
    `\nPlease pay by the end of the month. Thank you!`;

  const rows = [
    { label: 'Monthly Rent', value: tenant.rent, icon: '🏠' },
    { label: 'Water Bill', value: tenant.waterBill, icon: '💧' },
    { label: 'Wastage / Garbage Bill', value: tenant.wastageBill, icon: '🗑️' },
  ];

  return (
    <div className="bill-summary-card">
      <div className="bill-card-header">
        <h2 className="bill-card-title">Bill Summary</h2>
        <span className="bill-month-badge">{month}</span>
      </div>

      {/* Print Area */}
      <div ref={printRef} className="print-area">
        <div className="receipt-header no-screen">
          <h2>Rent Receipt</h2>
          <p>Month: {month}</p>
          <p>Generated: {new Date().toLocaleDateString('en-NP', { day:'2-digit', month:'long', year:'numeric' })}</p>
        </div>

        <div className="tenant-info">
          <div className="tenant-info-row">
            <span className="ti-label">Tenant</span>
            <span className="ti-value">{tenant.name}</span>
          </div>
          <div className="tenant-info-row">
            <span className="ti-label">Room No.</span>
            <span className="ti-value mono">{tenant.roomNumber}</span>
          </div>
        </div>

        <div className="bill-rows">
          {rows.map((row) => (
            <div className="bill-row" key={row.label}>
              <span className="bill-row-icon">{row.icon}</span>
              <span className="bill-row-label">{row.label}</span>
              <span className="bill-row-value mono">
                NPR <AnimatedAmount value={row.value} />
              </span>
            </div>
          ))}

          <div className="bill-row electricity-row">
            <span className="bill-row-icon">⚡</span>
            <div className="elec-label-group">
              <span className="bill-row-label">Electricity Bill</span>
              <span className="elec-formula">
                ({tenant.currentUnit} − {tenant.previousUnit}) = <strong className="mono">{consumed}</strong> units × NPR {ELECTRICITY_RATE}
              </span>
            </div>
            <span className="bill-row-value mono">
              NPR <AnimatedAmount value={electricityBill} />
            </span>
          </div>
        </div>

        <div className="bill-total">
          <span className="total-label">Total Amount Due</span>
          <span className="total-value mono">
            NPR <AnimatedAmount value={total} />
          </span>
        </div>
      </div>

      <div className="bill-actions no-print">
        <button
          className="btn-generate"
          onClick={() => onGenerateBill(tenant._id, month)}
          disabled={generating}
        >
          {generating ? 'Saving…' : '💾 Save Bill to History'}
        </button>
        {tenant.phone && (
          <a
            className="btn-whatsapp"
            href={`https://wa.me/${tenant.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            📲 Send WhatsApp
          </a>
        )}
        <button className="btn-print" onClick={handlePrint}>
          🖨️ Print Receipt
        </button>
      </div>
    </div>
  );
}
