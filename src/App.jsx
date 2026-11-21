import { useState, useEffect } from 'react';

export default function App() {
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState('');
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

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
        🐱 Chef Kucing: Ingredient Pantry
      </h1>
      <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 20 }}>
        Type your ingredient details below to calculate & save the cost per gram.
      </p>

      <form
        onSubmit={handleSave}
        style={{
          background: '#fff',
          padding: 18,
          borderRadius: 14,
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
            style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 8, border: '1px solid #d1d5db' }}
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
              style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 8, border: '1px solid #d1d5db' }}
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
              style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
          </div>
        </div>

        <div style={{ padding: 14, background: '#fff7ed', borderRadius: 10, border: '1px solid #fed7aa' }}>
          <div style={{ fontSize: 13, color: '#9a3412' }}>{name || 'Ingredient'} cost per gram:</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#c2410c' }}>
            BND ${costPerGram.toFixed(4)} <span style={{ fontSize: 14, fontWeight: 400 }}>/ g</span>
          </div>
        </div>

        <button
          type="submit"
          style={{
            padding: 14,
            fontSize: 16,
            fontWeight: 600,
            background: '#ea580c',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          + Save to My Pantry
        </button>
      </form>

      {pantry.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
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
                    background: '#fee2e2',
                    color: '#b91c1c',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: 8,
                    fontSize: 13,
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
    </div>
  );
}