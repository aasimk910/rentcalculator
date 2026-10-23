import React, { useState } from 'react';
import './Inspector.css';
import Icon from './Icon';
import BillHistory from './BillHistory';
import { ELECTRICITY_RATE } from '../billing';
import { billForMonth, initials, npr } from '../format';

function Prop({ label, children }) {
  return (
    <div className="prop">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function MonthOverview({ tenants, month, onSelect }) {
  const billed = tenants.filter((t) => billForMonth(t, month));
  const pending = tenants.filter((t) => !billForMonth(t, month));
  const total = billed.reduce((sum, t) => sum + billForMonth(t, month).totalBill, 0);
  const progress = tenants.length ? (billed.length / tenants.length) * 100 : 0;

  return (
    <>
      <div className="inspector-head">
        <div>
          <p className="section-label">Overview</p>
          <h2 className="inspector-title">{month}</h2>
        </div>
      </div>

      <div className="inspector-body">
        <section className="inspector-section">
          <div className="stat-grid">
            <div className="stat">
              <span className="stat-label">Billed</span>
              <span className="stat-value num">{billed.length}<span className="stat-of"> / {tenants.length}</span></span>
            </div>
            <div className="stat">
              <span className="stat-label">Total billed</span>
              <span className="stat-value num">{npr(total)}</span>
            </div>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-label={`Tenants billed for ${month}`}
            aria-valuemin={0}
            aria-valuemax={tenants.length}
            aria-valuenow={billed.length}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </section>

        <section className="inspector-section">
          <h3 className="section-label">Still to bill</h3>
          {tenants.length === 0 ? (
            <p className="inspector-note">Add a tenant to start billing.</p>
          ) : pending.length === 0 ? (
            <p className="inspector-note">Everyone is billed for {month}.</p>
          ) : (
            <ul className="pending-list">
              {pending.map((t) => (
                <li key={t._id}>
                  <button className="pending-row" type="button" onClick={() => onSelect(t)}>
                    <span className="avatar" aria-hidden="true">{initials(t.name)}</span>
                    <span className="pending-text">
                      <span className="pending-name">{t.name}</span>
                      <span className="pending-room">Room {t.roomNumber}</span>
                    </span>
                    <Icon name="chevronRight" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

export default function Inspector({ tenant, tenants, month, onSelect, onEdit, onDelete, onBillUpdate }) {
  const [tab, setTab] = useState('details');

  if (!tenant) return <MonthOverview tenants={tenants} month={month} onSelect={onSelect} />;

  const bills = tenant.billHistory || [];

  return (
    <>
      <div className="inspector-head">
        <span className="avatar avatar-lg" aria-hidden="true">{initials(tenant.name)}</span>
        <div className="inspector-head-text">
          <h2 className="inspector-title">{tenant.name}</h2>
          <p className="inspector-sub">Room {tenant.roomNumber}</p>
        </div>
        <button className="icon-btn" type="button" onClick={() => onEdit(tenant)} aria-label={`Edit ${tenant.name}`} title="Edit tenant">
          <Icon name="pencil" />
        </button>
      </div>

      <div className="inspector-tabs">
        <div className="segmented" role="tablist" aria-label="Tenant information">
          <button type="button" role="tab" id="tab-details" aria-controls="tabpanel-details" aria-selected={tab === 'details'} onClick={() => setTab('details')}>
            Details
          </button>
          <button type="button" role="tab" id="tab-bills" aria-controls="tabpanel-bills" aria-selected={tab === 'bills'} onClick={() => setTab('bills')}>
            Bills <span className="tab-count">{bills.length}</span>
          </button>
        </div>
      </div>

      <div className="inspector-body" role="tabpanel" id={`tabpanel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'details' ? (
          <>
            <section className="inspector-section">
              <h3 className="section-label">Monthly charges</h3>
              <dl className="prop-list">
                <Prop label="Rent"><span className="num">{npr(tenant.rent)}</span></Prop>
                <Prop label="Water"><span className="num">{npr(tenant.waterBill)}</span></Prop>
                <Prop label="Wastage"><span className="num">{npr(tenant.wastageBill)}</span></Prop>
              </dl>
            </section>
            <section className="inspector-section">
              <h3 className="section-label">Electricity</h3>
              <dl className="prop-list">
                <Prop label="Last reading"><span className="num">{tenant.previousUnit} kWh</span></Prop>
                <Prop label="Rate"><span className="num">NPR {ELECTRICITY_RATE} / unit</span></Prop>
              </dl>
            </section>
            <section className="inspector-section">
              <h3 className="section-label">Contact</h3>
              <dl className="prop-list">
                <Prop label="WhatsApp">
                  {tenant.phone ? (
                    <span className="num">{tenant.phone}</span>
                  ) : (
                    <button type="button" className="link-btn" onClick={() => onEdit(tenant)}>Add number</button>
                  )}
                </Prop>
              </dl>
            </section>
          </>
        ) : (
          <BillHistory history={bills} tenant={tenant} onBillUpdate={onBillUpdate} />
        )}
      </div>

      <div className="inspector-foot">
        <button className="btn btn-ghost btn-danger btn-block" type="button" onClick={() => onDelete(tenant._id)}>
          <Icon name="trash" />
          Delete tenant
        </button>
      </div>
    </>
  );
}
