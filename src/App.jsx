import { useState, useEffect, useRef } from 'react';
import CatDoodlePad from './CatDoodlePad';

export default function App() {
  const [activeTab, setActiveTab] = useState('pantry');
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState('');
  const fileInputRef = useRef(null);

  const [pantry, setPantry] = useState(() => {
    const saved = localStorage.getItem('chef_kucing_pantry');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('chef_kucing_pantry', JSON.stringify(pantry));
  }, [pantry]);

  const costPerGram = weight > 0 && price > 0 ? price / weight : 0;

  const handleSave = (e) => {
    e.preventDefault();
    if (!name || !weight || !price) return;
    const newItem = {
      id: Date.now(),
      name,
      weight: parseFloat(weight),
      price: parseFloat(price),
      costPerGram,
    };
    setPantry([newItem, ...pantry]);
    setName('');
    setWeight('');
    setPrice('');
  };

  const handleDelete = (id) => {
    setPantry(pantry.filter((item) => item.id !== id));
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify({ pantry, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `brunei-cat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed.pantry)) {
          setPantry(parsed.pantry);
          alert(`Restored ${parsed.pantry.length} ingredients successfully!`);
        } else {
          alert('Invalid backup file.');
        }
      } catch {
        alert('Could not read that file. Make sure it is a .json backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 96px' }}>
      {/* Top App Header */}
      <header style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Brunei Cat Suite • Beta
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>
          {activeTab === 'pantry' && '🐱 Chef Kucing: Pantry'}
          {activeTab === 'doodle' && '🐾 Cat Doodle Club'}
          {activeTab === 'backup' && '💾 Data & Backup'}
        </h1>
      </header>

      {/* TAB 1: INGREDIENT PANTRY */}
      {activeTab === 'pantry' && (
        <>
          <form
            onSubmit={handleSave}
            style={{
              background: '#fff',
              padding: 18,
              borderRadius: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                Ingredient Name
              </label>
              <input
                type="text"
                placeholder="e.g. Anchor Butter"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 10, border: '1px solid #d1d5db' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  Weight (grams)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 250"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 10, border: '1px solid #d1d5db' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  Price (BND $)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 4.50"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 10, border: '1px solid #d1d5db' }}
                />
              </div>
            </div>

            <div style={{ padding: 14, background: '#fff7ed', borderRadius: 12, border: '1px solid #fed7aa' }}>
              <div style={{ fontSize: 13, color: '#9a3412' }}>{name || 'Ingredient'} cost per gram:</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#c2410c' }}>
                BND ${costPerGram.toFixed(4)} <span style={{ fontSize: 14, fontWeight: 400 }}>/ g</span>
              </div>
            </div>

            <button
              type="submit"
              style={{
                minHeight: 48,
                fontSize: 16,
                fontWeight: 700,
                background: '#ea580c',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              + Save to My Pantry
            </button>
          </form>

          {pantry.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>
                Saved Ingredients ({pantry.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pantry.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: '#fff',
                      padding: 14,
                      borderRadius: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{item.name}</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>
                        {item.weight}g for BND ${item.price.toFixed(2)} •{' '}
                        <strong>${item.costPerGram.toFixed(4)}/g</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{
                        minHeight: 40,
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: CAT DOODLE PAD */}
      {activeTab === 'doodle' && <CatDoodlePad />}

      {/* TAB 3: EXPORT / RESTORE BACKUP */}
      {activeTab === 'backup' && (
        <div style={{ background: '#fff', padding: 18, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Keep Your Data Safe</h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 18 }}>
            Your ingredients are saved offline on this device. Download a backup file anytime so you can restore it on a new phone.
          </p>

          <button
            type="button"
            onClick={handleExportBackup}
            style={{
              width: '100%',
              minHeight: 48,
              background: '#ea580c',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            ⬇️ Download Backup File (.json)
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportBackup}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            style={{
              width: '100%',
              minHeight: 48,
              background: '#f3f4f6',
              color: '#111827',
              border: '1px solid #d1d5db',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ⬆️ Restore From Backup File
          </button>
        </div>
      )}

      {/* MOBILE-FIRST BOTTOM NAVIGATION BAR */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'center',
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: 480, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
          {[
            { id: 'pantry', icon: '🥣', label: 'Pantry' },
            { id: 'doodle', icon: '🎨', label: 'Cat Pad' },
            { id: 'backup', icon: '💾', label: 'Backup' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                minHeight: 60,
                background: 'none',
                border: 'none',
                borderTop: activeTab === tab.id ? '3px solid #ea580c' : '3px solid transparent',
                color: activeTab === tab.id ? '#ea580c' : '#6b7280',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: 13,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}