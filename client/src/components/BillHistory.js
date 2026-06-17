import React, { useState } from 'react';
import './BillHistory.css';
import { updateBill } from '../api';

function BillDetailModal({ bill, tenant, onClose, onBillUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrev, setEditPrev] = useState(String(bill.previousUnit));
  const [editCurr, setEditCurr] = useState(String(bill.currentUnit));
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const handleSaveEdit = async () => {
    const prev = Number(editPrev);
    const curr = Number(editCurr);
    if (isNaN(prev) || isNaN(curr) || prev < 0 || curr < 0) {
      setEditError('Enter valid unit values');
      return;
    }
    if (curr < prev) {
      setEditError(`Current unit must be ≥ previous unit (${prev})`);
      return;
    }
    setSaving(true);
    try {
      const { data } = await updateBill(tenant._id, bill._id, { previousUnit: prev, currentUnit: curr });
      onBillUpdated(data.tenant);
      onClose();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update bill');
    } finally {
      setSaving(false);
    }
  };

  const qrCodeUrl = `${window.location.origin}/WhatsApp%20Image%202026-04-17%20at%208.38.49%20AM.jpeg`;

  const whatsappMessage =
    `*Rent Bill - ${bill.month}*\n` +
    `Tenant: ${tenant.name}\n` +
    `Room: ${tenant.roomNumber}\n` +
    `\n` +
    `Rent:         NPR ${bill.rent.toLocaleString()}\n` +
    `Water:        NPR ${bill.waterBill.toLocaleString()}\n` +
    `Wastage:      NPR ${bill.wastageBill.toLocaleString()}\n` +
    `Electricity:  NPR ${bill.electricityBill.toLocaleString()} (${bill.previousUnit} → ${bill.currentUnit} = ${bill.consumedUnits} units @ NPR 11)\n` +
    `─────────────────────\n` +
    `*Total: NPR ${bill.totalBill.toLocaleString()}*\n` +
    `\n💳 Scan QR to pay:\n${qrCodeUrl}\n` +
    `\nThank you!`;

  return (
    <div className="bh-modal-overlay" onClick={onClose}>
      <div className="bh-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bh-modal-header">
          <div>
            <h3 className="bh-modal-title">{bill.month}</h3>
            <p className="bh-modal-sub">{tenant.name} · Room {tenant.roomNumber}</p>
          </div>
          <button className="bh-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="bh-modal-rows">
          <div className="bh-modal-row">
            <span>🏠 Monthly Rent</span>
            <span className="mono">NPR {bill.rent.toLocaleString()}</span>
          </div>
          <div className="bh-modal-row">
            <span>💧 Water Bill</span>
            <span className="mono">NPR {bill.waterBill.toLocaleString()}</span>
          </div>
          <div className="bh-modal-row">
            <span>🗑️ Wastage / Garbage</span>
            <span className="mono">NPR {bill.wastageBill.toLocaleString()}</span>
          </div>
          <div className="bh-modal-row">
            <span>⚡ Electricity
              {!isEditing && (
                <span className="bh-units"> ({bill.previousUnit} → {bill.currentUnit} = {bill.consumedUnits} units)</span>
              )}
            </span>
            <span className="mono">NPR {bill.electricityBill.toLocaleString()}</span>
          </div>

          {isEditing && (
            <div className="bh-edit-row">
              <label className="bh-edit-label">
                Previous unit
                <input
                  className="bh-edit-input"
                  type="number"
                  min="0"
                  value={editPrev}
                  onChange={(e) => { setEditPrev(e.target.value); setEditError(''); }}
                />
              </label>
              <span className="bh-edit-arrow">→</span>
              <label className="bh-edit-label">
                Current unit
                <input
                  className="bh-edit-input"
                  type="number"
                  min="0"
                  value={editCurr}
                  onChange={(e) => { setEditCurr(e.target.value); setEditError(''); }}
                />
              </label>
            </div>
          )}
          {editError && <p className="bh-edit-error">{editError}</p>}
        </div>

        <div className="bh-modal-total">
          <span>Total Amount Due</span>
          <span className="mono bh-total-val">NPR {bill.totalBill.toLocaleString()}</span>
        </div>

        <div className="bh-modal-actions">
          {!isEditing ? (
            <button className="bh-edit-btn" onClick={() => setIsEditing(true)}>
              ✏️ Correct meter readings
            </button>
          ) : (
            <>
              <button className="bh-save-btn" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Saving…' : '✓ Save correction'}
              </button>
              <button className="bh-cancel-btn" onClick={() => { setIsEditing(false); setEditError(''); setEditPrev(String(bill.previousUnit)); setEditCurr(String(bill.currentUnit)); }}>
                Cancel
              </button>
            </>
          )}
        </div>

        {tenant.phone && (
          <a
            className="bh-whatsapp-btn"
            href={`https://wa.me/${tenant.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            📲 Send WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

export default function BillHistory({ history, tenant, onBillUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  if (!history || history.length === 0) return null;

  const sorted = [...history].reverse();
  const display = expanded ? sorted : sorted.slice(0, 3);

  return (
    <>
      <div className="bill-history-card">
        <div className="history-header">
          <h3 className="history-title">Bill History</h3>
          <span className="history-count">{history.length} bills</span>
        </div>
        <div className="history-list">
          {display.map((bill) => (
            <div
              className="history-item history-item-clickable"
              key={bill._id}
              onClick={() => setSelectedBill(bill)}
            >
              <div className="history-item-top">
                <span className="history-month">{bill.month}</span>
                <span className="history-total mono">NPR {bill.totalBill.toLocaleString()}</span>
              </div>
              <div className="history-breakdown">
                <span>Rent: NPR {bill.rent.toLocaleString()}</span>
                <span>Water: NPR {bill.waterBill.toLocaleString()}</span>
                <span>Wastage: NPR {bill.wastageBill.toLocaleString()}</span>
                <span>Electricity: NPR {bill.electricityBill.toLocaleString()} ({bill.previousUnit} → {bill.currentUnit} = {bill.consumedUnits} units)</span>
              </div>
              <span className="history-item-hint">Tap for details →</span>
            </div>
          ))}
        </div>
        {history.length > 3 && (
          <button className="history-toggle" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Show less ▲' : `Show all ${history.length} bills ▼`}
          </button>
        )}
      </div>

      {selectedBill && tenant && (
        <BillDetailModal
          bill={selectedBill}
          tenant={tenant}
          onClose={() => setSelectedBill(null)}
          onBillUpdated={(updatedTenant) => {
            setSelectedBill(null);
            if (onBillUpdate) onBillUpdate(updatedTenant);
          }}
        />
      )}
    </>
  );
}
