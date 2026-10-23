import React, { useState } from 'react';
import './BillHistory.css';
import Icon from './Icon';
import { whatsAppUrl } from '../billing';
import { updateBill } from '../api';
import { npr } from '../format';

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

  const cancelEdit = () => {
    setIsEditing(false);
    setEditError('');
    setEditPrev(String(bill.previousUnit));
    setEditCurr(String(bill.currentUnit));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="bill-detail-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title" id="bill-detail-title">{bill.month}</h3>
            <p className="modal-sub">{tenant.name} · Room {tenant.roomNumber}</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close bill details">
            <Icon name="x" />
          </button>
        </div>

        <div className="modal-body">
          <dl className="bh-rows">
            <div className="bh-row"><dt>Rent</dt><dd className="num">{npr(bill.rent)}</dd></div>
            <div className="bh-row"><dt>Water</dt><dd className="num">{npr(bill.waterBill)}</dd></div>
            <div className="bh-row"><dt>Wastage</dt><dd className="num">{npr(bill.wastageBill)}</dd></div>
            <div className="bh-row">
              <dt>
                Electricity
                {!isEditing && (
                  <span className="bh-units num">{bill.previousUnit} → {bill.currentUnit} kWh · {bill.consumedUnits} units</span>
                )}
              </dt>
              <dd className="num">{npr(bill.electricityBill)}</dd>
            </div>
          </dl>

          {isEditing && (
            <div className="bh-edit-row">
              <label className="field">
                <span className="field-label">Previous reading</span>
                <input
                  className="input num"
                  type="number"
                  min="0"
                  value={editPrev}
                  onChange={(e) => { setEditPrev(e.target.value); setEditError(''); }}
                />
              </label>
              <span className="bh-edit-arrow" aria-hidden="true">→</span>
              <label className="field">
                <span className="field-label">Current reading</span>
                <input
                  className="input num"
                  type="number"
                  min="0"
                  value={editCurr}
                  onChange={(e) => { setEditCurr(e.target.value); setEditError(''); }}
                />
              </label>
            </div>
          )}
          {editError && <p className="error-msg bh-edit-error" role="alert">{editError}</p>}

          <div className="bh-total">
            <span>Total due</span>
            <span className="bh-total-value num">{npr(bill.totalBill)}</span>
          </div>
        </div>

        <div className="modal-actions">
          {!isEditing ? (
            <>
              <button className="btn btn-ghost" type="button" onClick={() => setIsEditing(true)}>
                <Icon name="pencil" />
                Correct readings
              </button>
              {tenant.phone && (
                <a className="btn btn-primary" href={whatsAppUrl(tenant, bill)} target="_blank" rel="noopener noreferrer">
                  <Icon name="message" />
                  Send on WhatsApp
                </a>
              )}
            </>
          ) : (
            <>
              <button className="btn btn-ghost" type="button" onClick={cancelEdit}>Cancel</button>
              <button className="btn btn-primary" type="button" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save correction'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BillHistory({ history, tenant, onBillUpdate }) {
  const [selectedBill, setSelectedBill] = useState(null);

  if (!history || history.length === 0) {
    return (
      <div className="bh-empty">
        <Icon name="receipt" size={20} />
        <p>No bills yet. Enter this month's meter reading to create the first one.</p>
      </div>
    );
  }

  const sorted = [...history].reverse();

  return (
    <>
      <ul className="bh-list">
        {sorted.map((bill) => (
          <li key={bill._id}>
            <button className="bh-item" type="button" onClick={() => setSelectedBill(bill)}>
              <span className="bh-item-text">
                <span className="bh-item-month">{bill.month}</span>
                <span className="bh-item-meta num">{bill.consumedUnits} units</span>
              </span>
              <span className="bh-item-total num">{npr(bill.totalBill)}</span>
              <Icon name="chevronRight" />
            </button>
          </li>
        ))}
      </ul>

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
