import React, { useState, useEffect } from 'react';
import './TenantForm.css';
import Icon from './Icon';
import { ELECTRICITY_RATE } from '../billing';

const defaultForm = {
  name: '',
  roomNumber: '',
  phone: '',
  rent: '',
  waterBill: '',
  wastageBill: '',
  previousUnit: '',
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
        previousUnit: editingTenant.previousUnit,
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
    if (form.previousUnit === '' || isNaN(form.previousUnit) || Number(form.previousUnit) < 0)
      e.previousUnit = editingTenant
        ? 'Enter a valid previous unit'
        : 'Enter a valid opening meter reading';
    if (form.currentUnit === '' || isNaN(form.currentUnit) || Number(form.currentUnit) < 0)
      e.currentUnit = 'Enter valid current unit';
    if (!e.currentUnit && !e.previousUnit && Number(form.currentUnit) < Number(form.previousUnit)) {
      e.currentUnit = `Current unit must be ≥ previous unit (${form.previousUnit})`;
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
        previousUnit: Number(form.previousUnit),
        currentUnit: Number(form.currentUnit),
      };
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
    ? (form.previousUnit !== '' && !isNaN(form.previousUnit) ? Number(form.previousUnit) : null)
    : (form.previousUnit !== '' && !isNaN(form.previousUnit) ? Number(form.previousUnit) : null);
  const consumed = form.currentUnit !== '' && prevUnitValue !== null
    ? Math.max(0, Number(form.currentUnit) - prevUnitValue)
    : null;
  const electricityPreview = consumed !== null ? consumed * ELECTRICITY_RATE : null;

  const field = (name, label, { type = 'text', affix, placeholder, optional } = {}) => (
    <div className={`field ${errors[name] ? 'has-error' : ''}`}>
      <label className="field-label" htmlFor={name}>
        {label}{optional && <span className="field-optional"> (optional)</span>}
      </label>
      {affix ? (
        <div className="input-group">
          {affix.before && <span className="input-affix input-affix-before">{affix.before}</span>}
          <input
            id={name}
            name={name}
            className="input"
            type={type}
            min={type === 'number' ? '0' : undefined}
            inputMode={type === 'number' ? 'numeric' : undefined}
            placeholder={placeholder}
            value={form[name]}
            onChange={handleChange}
            autoComplete="off"
            aria-invalid={Boolean(errors[name])}
          />
          {affix.after && <span className="input-affix">{affix.after}</span>}
        </div>
      ) : (
        <input
          id={name}
          name={name}
          className="input"
          type={type}
          placeholder={placeholder}
          value={form[name]}
          onChange={handleChange}
          autoComplete="off"
          aria-invalid={Boolean(errors[name])}
        />
      )}
      {errors[name] && <span className="error-msg">{errors[name]}</span>}
    </div>
  );

  return (
    <div className="tenant-form panel">
      <div className="tenant-form-head">
        <div>
          <p className="section-label">{editingTenant ? 'Edit tenant' : 'New tenant'}</p>
          <h2 className="tenant-form-title">{editingTenant ? editingTenant.name : 'Add a tenant'}</h2>
        </div>
        {onCancelEdit && (
          <button className="icon-btn" type="button" onClick={onCancelEdit} aria-label="Close form" title="Close">
            <Icon name="x" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <section className="form-section">
          <h3 className="section-label">Tenant</h3>
          <div className="form-grid">
            {field('name', 'Name', { placeholder: 'e.g. Ram Bahadur Thapa' })}
            {field('roomNumber', 'Room', { placeholder: 'e.g. 101' })}
          </div>
          {field('phone', 'WhatsApp number', { type: 'tel', placeholder: 'e.g. 9841234567', optional: true, affix: { before: <Icon name="message" size={14} /> } })}
        </section>

        <section className="form-section">
          <h3 className="section-label">Monthly charges</h3>
          <div className="form-grid form-grid-3">
            {field('rent', 'Rent', { type: 'number', placeholder: '0', affix: { before: 'NPR' } })}
            {field('waterBill', 'Water', { type: 'number', placeholder: '0', affix: { before: 'NPR' } })}
            {field('wastageBill', 'Wastage', { type: 'number', placeholder: '0', affix: { before: 'NPR' } })}
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-head">
            <h3 className="section-label">Electricity meter</h3>
            <span className="field-hint">NPR {ELECTRICITY_RATE} per unit</span>
          </div>
          <div className="form-grid">
            {field('previousUnit', editingTenant ? 'Previous reading' : 'Opening reading', { type: 'number', placeholder: 'e.g. 1500', affix: { after: 'kWh' } })}
            {field('currentUnit', 'Current reading', { type: 'number', placeholder: '0', affix: { after: 'kWh' } })}
          </div>

          {consumed !== null && (
            <div className="electricity-preview">
              <Icon name="zap" />
              <span className="num">
                {consumed} units × NPR {ELECTRICITY_RATE} = <strong>NPR {electricityPreview.toLocaleString()}</strong>
                {!editingTenant && <span className="field-hint"> · first bill counts from the opening reading</span>}
              </span>
            </div>
          )}
        </section>

        {errors.submit && (
          <div className="error-banner" role="alert"><Icon name="alert" />{errors.submit}</div>
        )}

        <div className="tenant-form-actions">
          {onCancelEdit && <button className="btn btn-ghost" type="button" onClick={onCancelEdit}>Cancel</button>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editingTenant ? 'Save changes' : 'Add tenant'}
          </button>
        </div>
      </form>
    </div>
  );
}
