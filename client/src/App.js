import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import TenantForm from './components/TenantForm';
import TenantList from './components/TenantList';
import BillSummary from './components/BillSummary';
import BillHistory from './components/BillHistory';
import MonthSelector from './components/MonthSelector';
import { getTenants, createTenant, updateTenant, deleteTenant, generateBill } from './api';
import './App.css';

const defaultMonth = () => {
  const d = new Date();
  return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
};

export default function App() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [month, setMonth] = useState(defaultMonth());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getTenants();
      setTenants(data);
      // Keep selected in sync
      if (selectedTenant) {
        const updated = data.find((t) => t._id === selectedTenant._id);
        setSelectedTenant(updated || null);
      }
    } catch (err) {
      showToast('Failed to load tenants', 'error');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleSave = async (formData, id) => {
    if (id) {
      const { data } = await updateTenant(id, formData);
      setTenants((prev) => prev.map((t) => (t._id === id ? data : t)));
      if (selectedTenant?._id === id) setSelectedTenant(data);
      setEditingTenant(null);
      showToast('Tenant updated successfully');
    } else {
      const { data } = await createTenant(formData);
      setTenants((prev) => [data, ...prev]);
      setSelectedTenant(data);
      showToast('Tenant added successfully');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tenant? This cannot be undone.')) return;
    try {
      await deleteTenant(id);
      setTenants((prev) => prev.filter((t) => t._id !== id));
      if (selectedTenant?._id === id) setSelectedTenant(null);
      if (editingTenant?._id === id) setEditingTenant(null);
      showToast('Tenant deleted');
    } catch (err) {
      showToast('Failed to delete tenant', 'error');
    }
  };

  const handleGenerateBill = async (id, billMonth, currentUnit) => {
    setGenerating(true);
    try {
      const { data } = await generateBill(id, billMonth, currentUnit);
      // Update tenant in list and selected — previousUnit is now rolled over to currentUnit
      const updatedTenant = data.tenant;
      setTenants((prev) => prev.map((t) => (t._id === id ? updatedTenant : t)));
      setSelectedTenant(updatedTenant);
      showToast(`Bill saved. Previous unit updated to ${updatedTenant.previousUnit} kWh for next month.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save bill', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleEdit = (tenant) => {
    setEditingTenant(tenant);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <div className="app-layout">
          {/* Left column */}
          <div className="left-col">
            <TenantForm
              onSave={handleSave}
              editingTenant={editingTenant}
              onCancelEdit={() => setEditingTenant(null)}
            />
            <TenantList
              tenants={tenants}
              selectedId={selectedTenant?._id}
              onSelect={setSelectedTenant}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onGenerateBill={handleGenerateBill}
              month={month}
              generating={generating}
              loading={loading}
            />
          </div>

          {/* Right column */}
          <div className="right-col">
            <div className="month-bar">
              <MonthSelector value={month} onChange={setMonth} />
            </div>
            <BillSummary
              tenant={selectedTenant}
              month={month}
              onGenerateBill={handleGenerateBill}
              generating={generating}
            />
            {selectedTenant && (
              <BillHistory history={selectedTenant.billHistory} />
            )}
          </div>
        </div>
      </main>

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </div>
  );
}
