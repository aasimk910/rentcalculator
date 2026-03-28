import React, { useState, useEffect } from 'react';
import './TenantForm.css';

const ELECTRICITY_RATE = 11;

const defaultForm = {
  name: '',
  roomNumber: '',
  phone: '',
  rent: '',
  waterBill: '',
  wastageBill: '',
  openingMeter: '',
  currentUnit: '',
};

export default function TenantForm({ onSave, editingTenant, onCancelEdit }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingTenant) {
      setForm({
        name: editingTenant.name,
        roomNumber: editingTenant.roomNumber,
        phone: editingTenant.phone || '',
        rent: editingTenant.rent,
        waterBill: editingTenant.waterBill,
        wastageBill: editingTenant.wastageBill,
        openingMeter: '',
        currentUnit: editingTenant.currentUnit,
      });
      setErrors({});
    } else {
      setForm(defaultForm);
      setErrors({});
    }
  }, [editingTenant]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Tenant name is required';
    if (!form.roomNumber.trim()) e.roomNumber = 'Room number is required';
    if (form.rent === '' || isNaN(form.rent) || Number(form.rent) < 0) e.rent = 'Enter a valid rent amount';
    if (form.waterBill === '' || isNaN(form.waterBill) || Number(form.waterBill) < 0) e.waterBill = 'Enter valid water bill';
    if (form.wastageBill === '' || isNaN(form.wastageBill) || Number(form.wastageBill) < 0) e.wastageBill = 'Enter valid wastage bill';
    if (!editingTenant) {
      if (form.openingMeter === '' || isNaN(form.openingMeter) || Number(form.openingMeter) < 0)
        e.openingMeter = 'Enter a valid opening meter reading';
    }
    if (form.currentUnit === '' || isNaN(form.currentUnit) || Number(form.currentUnit) < 0)
      e.currentUnit = 'Enter valid current unit';
    if (!editingTenant && !e.currentUnit && !e.openingMeter &&
        Number(form.currentUnit) < Number(form.openingMeter)) {
      e.currentUnit = `Current unit must be ≥ opening meter (${form.openingMeter})`;
    }
    if (editingTenant && !e.currentUnit && Number(form.currentUnit) < editingTenant.previousUnit) {
      e.currentUnit = `Current unit must be ≥ previous unit (${editingTenant.previousUnit})`;
    }
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        roomNumber: form.roomNumber.trim(),
        phone: form.phone.trim(),
        rent: Number(form.rent),
        waterBill: Number(form.waterBill),
        wastageBill: Number(form.wastageBill),
        currentUnit: Number(form.currentUnit),
      };
      if (!editingTenant) {
        payload.previousUnit = Number(form.openingMeter);
      }
      await onSave(payload, editingTenant?._id);
      if (!editingTenant) setForm(defaultForm);
      setErrors({});
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save tenant';
      setErrors({ submit: msg });
    } finally {
      setSaving(false);
    }
  };

  const prevUnitValue = editingTenant
    ? editingTenant.previousUnit
    : (form.openingMeter !== '' && !isNaN(form.openingMeter) ? Number(form.openingMeter) : null);
  const consumed = form.currentUnit !== '' && prevUnitValue !== null
    ? Math.max(0, Number(form.currentUnit) - prevUnitValue)
    : null;
  const electricityPreview = consumed !== null ? consumed * ELECTRICITY_RATE : null;

  return (
    <div className="tenant-form-card">
      <div className="form-card-header">
        <h2 className="form-card-title">
          {editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
        </h2>
        {editingTenant && (
          <button className="btn-ghost" onClick={onCancelEdit}>Cancel</button>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-section">
          <h3 className="form-section-title">Tenant Details</h3>
          <div className="form-row">
            <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
              <label htmlFor="name">Tenant Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Ram Bahadur Thapa"
                value={form.name}
                onChange={handleChange}
                autoComplete="off"
              />
              {errors.name && <span className="error-msg">{errors.name}</span>}
            </div>
            <div className={`form-group ${errors.roomNumber ? 'has-error' : ''}`}>
              <label htmlFor="roomNumber">Room Number</label>
              <input
                id="roomNumber"
                name="roomNumber"
                type="text"
                placeholder="e.g. 101"
                value={form.roomNumber}
                onChange={handleChange}
                autoComplete="off"
              />
              {errors.roomNumber && <span className="error-msg">{errors.roomNumber}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">WhatsApp Number <span style={{fontWeight:400,color:'var(--text-muted)'}}>(optional)</span></label>
              <div className="input-with-prefix">
                <span className="input-prefix">📱</span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. 9841234567"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Fixed Charges</h3>
          <div className="form-row form-row-3">
            <div className={`form-group ${errors.rent ? 'has-error' : ''}`}>
              <label htmlFor="rent">Monthly Rent</label>
              <div className="input-with-prefix">
                <span className="input-prefix">NPR</span>
                <input id="rent" name="rent" type="number" min="0" placeholder="0" value={form.rent} onChange={handleChange} />
              </div>
              {errors.rent && <span className="error-msg">{errors.rent}</span>}
            </div>
            <div className={`form-group ${errors.waterBill ? 'has-error' : ''}`}>
              <label htmlFor="waterBill">Water Bill</label>
              <div className="input-with-prefix">
                <span className="input-prefix">NPR</span>
                <input id="waterBill" name="waterBill" type="number" min="0" placeholder="0" value={form.waterBill} onChange={handleChange} />
              </div>
              {errors.waterBill && <span className="error-msg">{errors.waterBill}</span>}
            </div>
            <div className={`form-group ${errors.wastageBill ? 'has-error' : ''}`}>
              <label htmlFor="wastageBill">Wastage / Garbage Bill</label>
              <div className="input-with-prefix">
                <span className="input-prefix">NPR</span>
                <input id="wastageBill" name="wastageBill" type="number" min="0" placeholder="0" value={form.wastageBill} onChange={handleChange} />
              </div>
              {errors.wastageBill && <span className="error-msg">{errors.wastageBill}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Electricity Meter Reading</h3>
          <p className="form-section-note">Rate: NPR 11 per unit consumed</p>

          {editingTenant ? (
            <div className="prev-unit-display">
              <span className="prev-unit-label">Previous Month's Unit</span>
              <span className="prev-unit-value mono">{editingTenant.previousUnit} kWh</span>
            </div>
          ) : (
            <div className={`form-group ${errors.openingMeter ? 'has-error' : ''}`}>
              <label htmlFor="openingMeter">Opening Meter Reading</label>
              <div className="input-with-prefix">
                <span className="input-prefix">kWh</span>
                <input
                  id="openingMeter"
                  name="openingMeter"
                  type="number"
                  min="0"
                  placeholder="e.g. 1500"
                  value={form.openingMeter}
                  onChange={handleChange}
                />
              </div>
              {errors.openingMeter && <span className="error-msg">{errors.openingMeter}</span>}
            </div>
          )}

          <div className={`form-group ${errors.currentUnit ? 'has-error' : ''}`} style={{ marginTop: editingTenant ? '0.75rem' : '0' }}>
            <label htmlFor="currentUnit">Current Month's Unit</label>
            <div className="input-with-prefix">
              <span className="input-prefix">kWh</span>
              <input
                id="currentUnit"
                name="currentUnit"
                type="number"
                min="0"
                placeholder="0"
                value={form.currentUnit}
                onChange={handleChange}
              />
            </div>
            {errors.currentUnit && <span className="error-msg">{errors.currentUnit}</span>}
          </div>

          {consumed !== null && (
            <div className="electricity-preview">
              <span className="elec-calc">
                ({Number(form.currentUnit) || 0} − {prevUnitValue}) ={' '}
                <span className="mono">{consumed}</span> units × NPR 11 ={' '}
                <strong className="mono amber-text">NPR {electricityPreview.toLocaleString()}</strong>
              </span>
              {!editingTenant && (
                <span className="elec-note"> (first bill from opening meter)</span>
              )}
            </div>
          )}
        </div>

        {errors.submit && (
          <div className="error-banner">{errors.submit}</div>
        )}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : editingTenant ? 'Update Tenant' : 'Add Tenant'}
        </button>
      </form>
    </div>
  );
}
