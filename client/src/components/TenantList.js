import React, { useState } from 'react';
import './TenantList.css';

const ELECTRICITY_RATE = 11;

const QR_CODE_URL = `${window.location.origin}/WhatsApp%20Image%202026-03-17%20at%2011.14.22%20AM.jpeg`;

function buildWhatsAppMessage(tenant, month, unitNum, consumed, electricityBill, total) {
  return (
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
    `\n💳 Scan QR to pay:\n${QR_CODE_URL}\n` +
    `\nPlease pay by the end of the month. Thank you!`
  );
}

function QuickBillModal({ tenant, month, onConfirm, onClose, saving }) {
  const [unit, setUnit] = useState('');
  const [error, setError] = useState('');

  const unitNum = unit !== '' && !isNaN(unit) ? Number(unit) : null;
  const consumed = unitNum !== null ? unitNum - tenant.previousUnit : null;
  const electricityBill = consumed !== null ? consumed * ELECTRICITY_RATE : null;
  const total =
    consumed !== null
      ? tenant.rent + tenant.waterBill + tenant.wastageBill + electricityBill
      : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (unit === '' || isNaN(unit) || Number(unit) < 0) {
      setError('Enter a valid unit reading');
      return;
    }
    if (Number(unit) < tenant.previousUnit) {
      setError(`Must be ≥ previous unit (${tenant.previousUnit})`);
      return;
    }
    setError('');
    onConfirm(tenant._id, month, Number(unit));
  };

  return (
    <div className="qb-backdrop" onClick={onClose}>
      <div className="qb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qb-header">
          <div>
            <div className="qb-title">Calculate Bill</div>
            <div className="qb-subtitle">{tenant.name} · Room {tenant.roomNumber} · {month}</div>
          </div>
          <button className="qb-close" onClick={onClose}>✕</button>
        </div>

        <div className="qb-prev-unit">
          <span className="qb-label">Previous unit</span>
          <span className="qb-value mono">{tenant.previousUnit} kWh</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={`qb-field ${error ? 'has-error' : ''}`}>
            <label htmlFor="qb-unit">Current Month's Unit Reading</label>
            <div className="input-with-prefix">
              <span className="input-prefix">kWh</span>
              <input
                id="qb-unit"
                type="number"
                min="0"
                placeholder={`e.g. ${tenant.previousUnit + 30}`}
                value={unit}
                onChange={(e) => { setUnit(e.target.value); setError(''); }}
                autoFocus
              />
            </div>
            {error && <span className="error-msg">{error}</span>}
          </div>

          {consumed !== null && consumed >= 0 && (
            <div className="qb-preview">
              <div className="qb-preview-row">
                <span>Electricity</span>
                <span className="mono">({unitNum} − {tenant.previousUnit}) × NPR 11 = <strong>NPR {electricityBill.toLocaleString()}</strong></span>
              </div>
              <div className="qb-preview-row">
                <span>Rent</span>
                <span className="mono">NPR {tenant.rent.toLocaleString()}</span>
              </div>
              <div className="qb-preview-row">
                <span>Water</span>
                <span className="mono">NPR {tenant.waterBill.toLocaleString()}</span>
              </div>
              <div className="qb-preview-row">
                <span>Wastage</span>
                <span className="mono">NPR {tenant.wastageBill.toLocaleString()}</span>
              </div>
              <div className="qb-preview-total">
                <span>Total</span>
                <span className="mono amber-text">NPR {total.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="qb-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            {consumed !== null && consumed >= 0 && tenant.phone && (
              <a
                className="btn-whatsapp"
                href={`https://wa.me/${tenant.phone.replace(/\D/g, '')}?text=${encodeURIComponent(buildWhatsAppMessage(tenant, month, unitNum, consumed, electricityBill, total))}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                📲 Send WhatsApp
              </a>
            )}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TenantList({ tenants, selectedId, onSelect, onEdit, onDelete, onGenerateBill, month, generating, loading }) {
  const [billTarget, setBillTarget] = useState(null); // tenant for quick bill modal

  const handleConfirm = async (id, billMonth, currentUnit) => {
    await onGenerateBill(id, billMonth, currentUnit);
    setBillTarget(null);
  };

  if (loading) {
    return (
      <div className="tenant-list-card">
        <div className="list-header"><h2 className="list-title">Tenants</h2></div>
        <div className="list-loading">Loading tenants…</div>
      </div>
    );
  }

  return (
    <>
      <div className="tenant-list-card">
        <div className="list-header">
          <h2 className="list-title">Tenants</h2>
          <span className="list-count">{tenants.length} {tenants.length === 1 ? 'tenant' : 'tenants'}</span>
        </div>

        {tenants.length === 0 ? (
          <div className="list-empty">
            <p>No tenants yet. Add one using the form.</p>
          </div>
        ) : (
          <ul className="tenant-list">
            {tenants.map((t) => {
              const isSelected = t._id === selectedId;

              return (
                <li
                  key={t._id}
                  className={`tenant-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelect(t)}
                >
                  <div className="tenant-item-main">
                    <div className="tenant-item-info">
                      <span className="tenant-name">{t.name}</span>
                      <span className="tenant-room">Room {t.roomNumber}</span>
                    </div>
                  </div>
                  <div className="tenant-item-actions">
                    <button
                      className="btn-action btn-bill"
                      onClick={(e) => { e.stopPropagation(); setBillTarget(t); }}
                      title="Calculate Bill"
                    >
                      🧾 Calculate Bill
                    </button>
                    <button
                      className="btn-action btn-edit"
                      onClick={(e) => { e.stopPropagation(); onEdit(t); }}
                      title="Edit"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={(e) => { e.stopPropagation(); onDelete(t._id); }}
                      title="Delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {billTarget && (
        <QuickBillModal
          tenant={billTarget}
          month={month}
          onConfirm={handleConfirm}
          onClose={() => setBillTarget(null)}
          saving={generating}
        />
      )}
    </>
  );
}
