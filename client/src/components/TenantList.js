import React, { useEffect, useRef, useState } from 'react';
import './TenantList.css';
import Icon from './Icon';
import { billForMonth, initials } from '../format';

export default function TenantList({ tenants, selectedId, month, onSelect, onEdit, onDelete, onAdd, loading }) {
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);

  // "/" jumps to search from anywhere that isn't already a text field
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const visible = q
    ? tenants.filter((t) => t.name.toLowerCase().includes(q) || String(t.roomNumber).toLowerCase().includes(q))
    : tenants;

  let body;
  if (loading) {
    body = (
      <div className="tenant-list-loading" aria-label="Loading tenants">
        {[0, 1, 2].map((i) => (
          <div className="tenant-skeleton" key={i}>
            <span className="skeleton-line tenant-skeleton-avatar" />
            <span className="skeleton-line" />
          </div>
        ))}
      </div>
    );
  } else if (tenants.length === 0) {
    body = (
      <div className="tenant-list-empty">
        <p>No tenants yet.</p>
        <button className="btn" type="button" onClick={onAdd}>
          <Icon name="plus" />
          Add your first tenant
        </button>
      </div>
    );
  } else if (visible.length === 0) {
    body = <p className="tenant-list-empty">No tenants match “{query}”.</p>;
  } else {
    body = (
      <ul className="tenant-list">
        {visible.map((t) => {
          const isSelected = t._id === selectedId;
          const billed = Boolean(billForMonth(t, month));

          return (
            <li key={t._id} className={`tenant-row ${isSelected ? 'is-selected' : ''}`}>
              <button
                className="tenant-row-main"
                type="button"
                onClick={() => onSelect(t)}
                aria-current={isSelected ? 'true' : undefined}
              >
                <span className="avatar" aria-hidden="true">{initials(t.name)}</span>
                <span className="tenant-row-text">
                  <span className="tenant-name">{t.name}</span>
                  <span className="tenant-room">Room {t.roomNumber}</span>
                </span>
                {billed && (
                  <span className="tenant-billed" title={`Billed for ${month}`}>
                    <Icon name="check" size={12} />
                    <span className="sr-only">Billed for {month}</span>
                  </span>
                )}
              </button>
              <div className="tenant-row-actions">
                <button className="icon-btn icon-btn-sm" type="button" onClick={() => onEdit(t)} aria-label={`Edit ${t.name}`} title="Edit">
                  <Icon name="pencil" size={14} />
                </button>
                <button className="icon-btn icon-btn-sm tenant-delete" type="button" onClick={() => onDelete(t._id)} aria-label={`Delete ${t.name}`} title="Delete">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <>
      <div className="tenant-list-head">
        <h2 className="section-label">
          Tenants{!loading && <span className="tenant-count">{tenants.length}</span>}
        </h2>
        <button className="icon-btn icon-btn-sm" type="button" onClick={onAdd} aria-label="Add tenant" title="Add tenant">
          <Icon name="plus" />
        </button>
      </div>

      <div className="tenant-list-scroll">{body}</div>

      <label className="tenant-search">
        <Icon name="search" />
        <input
          ref={searchRef}
          type="search"
          placeholder="Search tenants…"
          aria-label="Search tenants by name or room"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <kbd aria-hidden="true">/</kbd>
      </label>
    </>
  );
}
