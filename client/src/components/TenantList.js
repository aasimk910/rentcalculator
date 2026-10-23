import React, { useState } from 'react';
import './TenantList.css';
import { ELECTRICITY_RATE, calculateBill, whatsAppUrl } from '../billing';

function QuickBillModal({ tenant, month, onConfirm, onClose, saving }) {
  const [unit, setUnit] = useState('');
  const [error, setError] = useState('');

  const unitNum = unit !== '' && !isNaN(unit) ? Number(unit) : null;
  const bill = unitNum !== null ? calculateBill({ ...tenant, currentUnit: unitNum }) : null;
  const consumed = bill?.consumedUnits ?? null;
  const electricityBill = bill?.electricityBill ?? null;
  const total = bill?.totalBill ?? null;

  const validate = () => {
    if (unit === '' || isNaN(unit) || Number(unit) < 0) {
      setError('Enter a valid unit reading');
      return false;
    }
    if (Number(unit) < tenant.previousUnit) {
      setError(`Must be ≥ previous unit (${tenant.previousUnit})`);
      return false;
    }
    setError('');
    return true;
  };

  const handleWhatsApp = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const waUrl = whatsAppUrl(tenant, {
      month,
      rent: tenant.rent,
      waterBill: tenant.waterBill,
      wastageBill: tenant.wastageBill,
      previousUnit: tenant.previousUnit,
      currentUnit: unitNum,
      ...bill,
    });
    // Open the tab during the click so browsers don't block it as a popup,
    // then only point it at WhatsApp once the bill has actually been saved
    const waWindow = window.open('', '_blank');
    const saved = await onConfirm(tenant._id, month, unitNum);
    if (!saved) {
      waWindow?.close();
    } else if (waWindow) {
      waWindow.opener = null;
      waWindow.location.href = waUrl;
    } else {
      window.location.href = waUrl;
    }
  };

  return (
    <div className="qb-backdrop" onClick={onClose}>
      <div className="qb-modal" role="dialog" aria-modal="true" aria-labelledby="quick-bill-title" onClick={(e) => e.stopPropagation()}>
        <div className="qb-header">
          <div>
            <div className="qb-title" id="quick-bill-title">Calculate Bill</div>
            <div className="qb-subtitle">{tenant.name} · Room {tenant.roomNumber} · {month}</div>
          </div>
          <button className="qb-close" onClick={onClose} aria-label="Close bill calculator">✕</button>
        </div>

        <div className="qb-prev-unit">
          <span className="qb-label">Previous unit</span>
          <span className="qb-value mono">{tenant.previousUnit} kWh</span>
        </div>

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
              <span className="mono">({unitNum} − {tenant.previousUnit}) × NPR {ELECTRICITY_RATE} = <strong>NPR {electricityBill.toLocaleString()}</strong></span>
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
          {tenant.phone ? (
            <button
              type="button"
              className="btn-whatsapp"
              onClick={handleWhatsApp}
              disabled={saving}
            >
              {saving ? 'Saving…' : '📲 Send WhatsApp & Save'}
            </button>
          ) : (
            <button type="button" className="btn-whatsapp" disabled title="Add a WhatsApp number to this tenant to send the bill">
              📲 Send WhatsApp (no phone)
            </button>
          )}
        </div>
        {!tenant.phone && (
          <p className="error-msg">No WhatsApp number saved for {tenant.name}. Use ✏️ Edit to add one.</p>
        )}
      </div>
    </div>
  );
}

export default function TenantList({ tenants, selectedId, onSelect, onEdit, onDelete, onGenerateBill, month, generating, loading }) {
  const [billTarget, setBillTarget] = useState(null); // tenant for quick bill modal

  const handleConfirm = async (id, billMonth, currentUnit) => {
    const saved = await onGenerateBill(id, billMonth, currentUnit);
    if (saved) setBillTarget(null);
    return saved;
  };

  if (loading) {
    return (
      <div className="tenant-list-card">
        <div className="list-header"><h2 className="list-title">Tenants</h2></div>
        <div className="list-loading" aria-label="Loading tenants">
          <span className="skeleton-line skeleton-title" />
          <span className="skeleton-line" />
          <span className="skeleton-line skeleton-short" />
        </div>
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
                >
                  <button
                    className="tenant-item-main tenant-select-button"
                    type="button"
                    onClick={() => onSelect(t)}
                    aria-pressed={isSelected}
                  >
                    <div className="tenant-item-info">
                      <span className="tenant-name">{t.name}</span>
                      <span className="tenant-room">Room {t.roomNumber}</span>
                    </div>
                  </button>
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
