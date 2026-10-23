import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import TenantForm from './components/TenantForm';
import TenantList from './components/TenantList';
import BillHistory from './components/BillHistory';
import MonthSelector from './components/MonthSelector';
import { getTenants, createTenant, updateTenant, deleteTenant, restoreTenant, generateBill } from './api';
import './App.css';

const THEME_KEY = 'rent-calculator-theme';
const THEME_COLORS = { light: '#ffffff', dark: '#19232c' };
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

const defaultMonth = () => {
  const d = new Date();
  return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
};

export default function App() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [month, setMonth] = useState(defaultMonth());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);
  const [themePref, setThemePref] = useState(() => localStorage.getItem(THEME_KEY) || 'system');
  const [systemDark, setSystemDark] = useState(darkQuery.matches);
  const systemTheme = systemDark ? 'dark' : 'light';
  const theme = themePref === 'system' ? systemTheme : themePref;

  useEffect(() => {
    const onChange = (e) => setSystemDark(e.matches);
    darkQuery.addEventListener('change', onChange);
    return () => darkQuery.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  }, [theme]);

  // Choosing the theme the OS already uses goes back to following the OS.
  const changeTheme = (next) => {
    if (next === systemTheme) {
      setThemePref('system');
      localStorage.removeItem(THEME_KEY);
    } else {
      setThemePref(next);
      localStorage.setItem(THEME_KEY, next);
    }
  };

  const toastTimer = useRef(null);

  // action: optional { label, onClick } shown as a button in the toast
  const showToast = (msg, type = 'success', action = null) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type, action });
    toastTimer.current = setTimeout(() => setToast(null), action ? 8000 : 3000);
  };

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getTenants();
      setTenants(Array.isArray(data) ? data : []);
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
      setShowTenantForm(false);
      showToast('Tenant updated successfully');
    } else {
      const { data } = await createTenant(formData);
      setTenants((prev) => [data, ...prev]);
      setSelectedTenant(data);
      setShowTenantForm(false);
      showToast('Tenant added successfully');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tenant?')) return;
    try {
      await deleteTenant(id);
      setTenants((prev) => prev.filter((t) => t._id !== id));
      if (selectedTenant?._id === id) setSelectedTenant(null);
      if (editingTenant?._id === id) setEditingTenant(null);
      showToast('Tenant deleted', 'success', { label: 'Undo', onClick: () => handleRestore(id) });
    } catch (err) {
      showToast('Failed to delete tenant', 'error');
    }
  };

  const handleRestore = async (id) => {
    try {
      const { data } = await restoreTenant(id);
      setTenants((prev) => [data, ...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      showToast(`${data.name} restored`);
    } catch (err) {
      showToast('Failed to restore tenant', 'error');
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
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save bill', 'error');
      return false;
    } finally {
      setGenerating(false);
    }
  };

  const handleEdit = (tenant) => {
    setEditingTenant(tenant);
    setShowTenantForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Header theme={theme} onThemeChange={changeTheme} />
      <main className="app-main" id="main-content">
        <div className="app-layout">
          {/* Left column */}
          <div className="left-col">
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
            {!showTenantForm && (
              <button className="add-tenant-toggle" onClick={() => setShowTenantForm(true)}>
                <span className="add-tenant-icon">+</span>
                Add New Tenant
              </button>
            )}
            {showTenantForm && (
              <TenantForm
                onSave={handleSave}
                editingTenant={editingTenant}
                onCancelEdit={() => {
                  setEditingTenant(null);
                  setShowTenantForm(false);
                }}
              />
            )}
          </div>

          {/* Right column */}
          <div className="right-col">
            <div className="month-bar">
              <MonthSelector value={month} onChange={setMonth} />
            </div>
            {selectedTenant && (
              <BillHistory
                history={selectedTenant.billHistory}
                tenant={selectedTenant}
                onBillUpdate={(updatedTenant) => {
                  setTenants((prev) => prev.map((t) => (t._id === updatedTenant._id ? updatedTenant : t)));
                  setSelectedTenant(updatedTenant);
                }}
              />
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <span>Rent Calculator</span>
        <span>Built for clear monthly billing</span>
      </footer>

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
          {toast.action && (
            <button className="toast-action" type="button" onClick={() => { setToast(null); toast.action.onClick(); }}>
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
