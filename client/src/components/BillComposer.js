import React, { useEffect, useState } from 'react';
import './BillComposer.css';
import Icon from './Icon';
import { ELECTRICITY_RATE, calculateBill, whatsAppUrl } from '../billing';
import { billForMonth, npr } from '../format';

function BillLine({ icon, label, detail, amount }) {
  return (
    <div className="bill-line">
      <dt>
        <span className="bill-line-icon"><Icon name={icon} /></span>
        <span className="bill-line-text">
          <span className="bill-line-label">{label}</span>
          {detail && <span className="bill-line-detail">{detail}</span>}
        </span>
      </dt>
      <dd className={`num ${amount == null ? 'is-pending' : ''}`}>{amount == null ? '—' : npr(amount)}</dd>
    </div>
  );
}

export default function BillComposer({ tenant, month, onSave, saving, onEditTenant }) {
  const [unit, setUnit] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setUnit('');
    setError('');
  }, [tenant._id, month]);

  const savedBill = billForMonth(tenant, month);
  const unitNum = unit !== '' && !isNaN(unit) ? Number(unit) : null;
  const draft = unitNum !== null && unitNum >= tenant.previousUnit
    ? calculateBill({ ...tenant, currentUnit: unitNum })
    : null;

  const bill = savedBill || {
    month,
    rent: tenant.rent,
    waterBill: tenant.waterBill,
    wastageBill: tenant.wastageBill,
    previousUnit: tenant.previousUnit,
    currentUnit: unitNum,
    consumedUnits: draft?.consumedUnits ?? null,
    electricityBill: draft?.electricityBill ?? null,
    totalBill: draft?.totalBill ?? null,
  };

  const electricityDetail = bill.consumedUnits != null
    ? `${bill.previousUnit} → ${bill.currentUnit} kWh · ${bill.consumedUnits} units × NPR ${ELECTRICITY_RATE}`
    : `From ${bill.previousUnit} kWh · NPR ${ELECTRICITY_RATE} per unit`;

  const validate = () => {
    if (unit === '' || isNaN(unit) || Number(unit) < 0) {
      setError('Enter a valid meter reading');
      return false;
    }
    if (Number(unit) < tenant.previousUnit) {
      setError(`Reading must be at least the previous reading (${tenant.previousUnit} kWh)`);
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!tenant.phone) {
      await onSave(tenant._id, month, unitNum);
      return;
    }

    const waUrl = whatsAppUrl(tenant, { ...bill, ...draft, currentUnit: unitNum });
    // Open the tab during the click so browsers don't block it as a popup,
    // then only point it at WhatsApp once the bill has actually been saved
    const waWindow = window.open('', '_blank');
    const saved = await onSave(tenant._id, month, unitNum);
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
    <div className="composer">
      <article className="bill-card panel" aria-labelledby="bill-card-title">
        <header className="bill-card-head">
          <div>
            <p className="section-label">{month}</p>
            <h2 className="bill-card-title" id="bill-card-title">{tenant.name}</h2>
            <p className="bill-card-sub">Room {tenant.roomNumber}</p>
          </div>
          {savedBill ? (
            <span className="badge badge-accent"><Icon name="check" size={12} />Saved</span>
          ) : (
            <span className="badge">Draft</span>
          )}
        </header>

        <dl className="bill-lines">
          <BillLine icon="home" label="Rent" amount={bill.rent} />
          <BillLine icon="droplet" label="Water" amount={bill.waterBill} />
          <BillLine icon="leaf" label="Wastage" amount={bill.wastageBill} />
          <BillLine icon="zap" label="Electricity" detail={electricityDetail} amount={bill.electricityBill} />
        </dl>

        <div className="bill-total">
          <span>Total due</span>
          <span className={`bill-total-value num ${bill.totalBill == null ? 'is-pending' : ''}`}>
            {bill.totalBill == null ? 'Enter reading' : npr(bill.totalBill)}
          </span>
        </div>
      </article>

      {savedBill ? (
        <div className="composer-bar panel composer-bar-done">
          <p className="composer-done-text">
            Saved for {month}. Next month starts from {tenant.previousUnit} kWh.
          </p>
          {tenant.phone && (
            <a className="btn btn-primary" href={whatsAppUrl(tenant, savedBill)} target="_blank" rel="noopener noreferrer">
              <Icon name="message" />
              Send on WhatsApp
            </a>
          )}
        </div>
      ) : (
        <form className="composer-bar panel" onSubmit={handleSubmit} noValidate>
          <label className="composer-label" htmlFor="meter-reading">This month's meter reading</label>
          <div className="composer-row">
            <div className={`input-group composer-input ${error ? 'has-error' : ''}`}>
              <input
                id="meter-reading"
                className="input"
                type="number"
                inputMode="numeric"
                min={tenant.previousUnit}
                placeholder={`Previous reading was ${tenant.previousUnit}`}
                value={unit}
                onChange={(e) => { setUnit(e.target.value); setError(''); }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'meter-error' : 'meter-hint'}
              />
              <span className="input-affix">kWh</span>
            </div>
            <button type="submit" className="btn btn-primary composer-send" disabled={saving || unit === ''}>
              {saving ? 'Saving…' : tenant.phone ? <><Icon name="message" />Save &amp; send</> : <><Icon name="check" />Save bill</>}
            </button>
          </div>
          {error ? (
            <p className="error-msg" id="meter-error" role="alert">{error}</p>
          ) : (
            <p className="field-hint" id="meter-hint">
              {tenant.phone ? (
                <>Saves the bill and opens WhatsApp to {tenant.phone}.</>
              ) : (
                <>No WhatsApp number saved. <button type="button" className="link-btn" onClick={onEditTenant}>Add one</button> to send bills directly.</>
              )}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
