import { useState, useEffect, useRef } from 'react';
import CatDoodlePad from './CatDoodlePad';
import { BRUNEI_CATALOGUE, UNIT_CONFIG } from './bruneiCatalogue';

// 👇 PASTE YOUR PUBLISHED GOOGLE SHEET CSV LINK INSIDE THE QUOTES BELOW:
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhRAOL3BxRNRd300orqT1ATx_gcH6SEH9MYdmMM4TWOIvPt4LZ3rz8Q55UeXD360tgz4hR5Rk11vKa/pub?gid=0&single=true&output=csv';

function parseCatalogueCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, '').trim());
      const [name, qty, unit, price] = cols;
      if (!name || !qty || !unit || !price || !UNIT_CONFIG[unit]) return null;
      return {
        name,
        qty: parseFloat(qty),
        unit,
        price: parseFloat(price),
      };
    })
    .filter(Boolean);
}

export default function App() {
  const [activeTab, setActiveTab] = useState('pantry');

  // --- PANTRY STATE ---
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('g');
  const [price, setPrice] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef(null);

  const [catalogue, setCatalogue] = useState(() => {
    const cached = localStorage.getItem('chef_kucing_catalogue_cache');
    return cached ? JSON.parse(cached) : BRUNEI_CATALOGUE;
  });

  useEffect(() => {
    if (!SHEET_CSV_URL) return;
    fetch(SHEET_CSV_URL)
      .then((res) => res.text())
      .then((csvText) => {
        const parsed = parseCatalogueCSV(csvText);
        if (parsed.length > 0) {
          setCatalogue(parsed);
          localStorage.setItem('chef_kucing_catalogue_cache', JSON.stringify(parsed));
        }
      })
      .catch(() => {});
  }, []);

  const [pantry, setPantry] = useState(() => {
    const saved = localStorage.getItem('chef_kucing_pantry');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('chef_kucing_pantry', JSON.stringify(pantry));
  }, [pantry]);

  // --- RECIPE & PRICING STATE ---
  const [recipes, setRecipes] = useState(() => {
    const saved = localStorage.getItem('chef_kucing_recipes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('chef_kucing_recipes', JSON.stringify(recipes));
  }, [recipes]);

  const [recipeName, setRecipeName] = useState('');
  const [batchYield, setBatchYield] = useState('12');
  const [overheadCost, setOverheadCost] = useState('');
  const [selectedPantryId, setSelectedPantryId] = useState('');
  const [amountUsed, setAmountUsed] = useState('');
  const [recipeItems, setRecipeItems] = useState([]);
  const [customSellPrice, setCustomSellPrice] = useState('');
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);
  const [editingRecipeId, setEditingRecipeId] = useState(null);

  // --- PANTRY HANDLERS ---
  const unitInfo = UNIT_CONFIG[unit] || UNIT_CONFIG.g;
  const totalBaseQty = parseFloat(qty) > 0 ? parseFloat(qty) * unitInfo.multiplier : 0;
  const costPerBaseUnit = totalBaseQty > 0 && parseFloat(price) > 0 ? parseFloat(price) / totalBaseQty : 0;

  const filteredSuggestions = catalogue.filter((item) =>
    item.name.toLowerCase().includes(name.toLowerCase())
  );

  const handleSelectSuggestion = (item) => {
    setName(item.name);
    setQty(String(item.qty));
    setUnit(item.unit);
    setPrice(item.price.toFixed(2));
    setShowSuggestions(false);
  };

  const handleSavePantry = (e) => {
    e.preventDefault();
    if (!name || !qty || !price || costPerBaseUnit <= 0) return;

    const newItem = {
      id: Date.now(),
      name,
      qty: parseFloat(qty),
      unit,
      baseUnit: unitInfo.baseUnit,
      totalBaseQty,
      price: parseFloat(price),
      costPerBaseUnit,
    };

    setPantry([newItem, ...pantry]);
    setName('');
    setQty('');
    setUnit('g');
    setPrice('');
  };

  const handleDeletePantry = (id) => {
    setPantry(pantry.filter((item) => item.id !== id));
  };

  // --- RECIPE BUILDER & MARGIN CALCULATIONS ---
  const activePantryItem = pantry.find((p) => String(p.id) === String(selectedPantryId));

  const handleAddIngredientToRecipe = () => {
    if (!activePantryItem || !amountUsed || parseFloat(amountUsed) <= 0) return;
    const rate = activePantryItem.costPerBaseUnit ?? activePantryItem.costPerGram ?? 0;
    const baseUnit = activePantryItem.baseUnit || 'g';
    const qtyNum = parseFloat(amountUsed);

    setRecipeItems([
      ...recipeItems,
      {
        id: Date.now(),
        pantryId: activePantryItem.id,
        name: activePantryItem.name,
        amountUsed: qtyNum,
        baseUnit,
        lineCost: qtyNum * rate,
      },
    ]);
    setAmountUsed('');
  };

  const handleRemoveRecipeItem = (id) => {
    setRecipeItems(recipeItems.filter((item) => item.id !== id));
  };

  const ingredientsTotal = recipeItems.reduce((sum, item) => sum + item.lineCost, 0);
  const extraCostNum = parseFloat(overheadCost) > 0 ? parseFloat(overheadCost) : 0;
  const totalBatchCost = ingredientsTotal + extraCostNum;
  const yieldNum = parseFloat(batchYield) > 0 ? parseFloat(batchYield) : 1;
  const costPerPiece = totalBatchCost / yieldNum;

  const resetRecipeForm = () => {
    setRecipeName('');
    setBatchYield('12');
    setOverheadCost('');
    setRecipeItems([]);
    setCustomSellPrice('');
    setEditingRecipeId(null);
  };

  const handleSaveRecipe = (e) => {
    e.preventDefault();
    if (!recipeName.trim() || recipeItems.length === 0) return;

    const recipeData = {
      id: editingRecipeId || Date.now(),
      name: recipeName.trim(),
      batchYield: yieldNum,
      overheadCost: extraCostNum,
      items: recipeItems,
      totalBatchCost,
      costPerPiece,
      suggestedSellPrice: parseFloat(customSellPrice) > 0 ? parseFloat(customSellPrice) : costPerPiece * 1.5,
    };

    if (editingRecipeId) {
      setRecipes(recipes.map((r) => (r.id === editingRecipeId ? recipeData : r)));
      setExpandedRecipeId(editingRecipeId);
    } else {
      setRecipes([recipeData, ...recipes]);
      setExpandedRecipeId(recipeData.id);
    }

    resetRecipeForm();
  };

  const handleLoadRecipeToEdit = (recipe) => {
    setEditingRecipeId(recipe.id);
    setRecipeName(recipe.name);
    setBatchYield(String(recipe.batchYield));
    setOverheadCost(recipe.overheadCost > 0 ? String(recipe.overheadCost) : '');
    setRecipeItems(recipe.items || []);
    setCustomSellPrice(recipe.suggestedSellPrice ? recipe.suggestedSellPrice.toFixed(2) : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRecipe = (id) => {
    setRecipes(recipes.filter((r) => r.id !== id));
    if (expandedRecipeId === id) setExpandedRecipeId(null);
    if (editingRecipeId === id) resetRecipeForm();
  };

  // --- BACKUP HANDLERS ---
  const handleExportBackup = () => {
    const dataStr = JSON.stringify({ pantry, recipes, exportedAt: new Date().toISOString() }, null, 2);
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
          if (Array.isArray(parsed.recipes)) setRecipes(parsed.recipes);
          alert(`Restored ${parsed.pantry.length} ingredients & ${parsed.recipes?.length || 0} recipes!`);
        } else {
          alert('Invalid backup file.');
        }
      } catch {
        alert('Could not read that file. Make sure it is a .json backup.');
      }
    };
    reader.readAsText(file);
  };

  const marginTiers = [
    { label: '30% Margin', sub: 'Budget / Wholesale', multiplier: 1.3 },
    { label: '50% Margin', sub: 'Standard Home Biz', multiplier: 1.5 },
    { label: '100% Margin', sub: '2x Cost / Café', multiplier: 2.0 },
  ];

  const activeSellPrice = parseFloat(customSellPrice) > 0 ? parseFloat(customSellPrice) : costPerPiece * 1.5;
  const profitPerPiece = activeSellPrice - costPerPiece;
  const profitPerBatch = profitPerPiece * yieldNum;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 96px' }}>
      <header style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Brunei Cat Suite • Beta
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>
          {activeTab === 'pantry' && '🐱 Chef Kucing: Pantry'}
          {activeTab === 'recipes' && '🧁 Recipe & Profit Calc'}
          {activeTab === 'doodle' && '🐾 Cat Doodle Club'}
          {activeTab === 'backup' && '💾 Data & Backup'}
        </h1>
      </header>

      {/* ==================== TAB 1: INGREDIENT PANTRY ==================== */}
      {activeTab === 'pantry' && (
        <>
          <form
            onSubmit={handleSavePantry}
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
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                Ingredient / Item Name
              </label>
              <input
                type="text"
                placeholder="Tap to pick Brunei staples or type your own..."
                value={name}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowSuggestions(true);
                }}
                style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 10, border: '1px solid #d1d5db' }}
              />

              {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #fed7aa',
                    borderRadius: 12,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                    maxHeight: 220,
                    overflowY: 'auto',
                    zIndex: 30,
                    marginTop: 4,
                  }}
                >
                  <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#9a3412', background: '#fff7ed' }}>
                    🇧🇳 Quick-Fill Brunei Staples ({catalogue.length} items)
                  </div>
                  {filteredSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => handleSelectSuggestion(item)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 14,
                      }}
                    >
                      <span style={{ fontWeight: 500, color: '#111827' }}>{item.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#ea580c', whiteSpace: 'nowrap', marginLeft: 8 }}>
                        ~${item.price.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  Pack Size / Qty
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 250 or 1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 10, border: '1px solid #d1d5db' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 16,
                    borderRadius: 10,
                    border: '1px solid #d1d5db',
                    background: '#fff',
                  }}
                >
                  {Object.entries(UNIT_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                Price Paid (BND $)
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

            <div style={{ padding: 14, background: '#fff7ed', borderRadius: 12, border: '1px solid #fed7aa' }}>
              <div style={{ fontSize: 13, color: '#9a3412' }}>
                {name || 'Item'} ({totalBaseQty > 0 ? `${totalBaseQty.toLocaleString()} ${unitInfo.baseUnit}` : `per ${unitInfo.baseUnit}`}):
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#c2410c' }}>
                BND ${costPerBaseUnit.toFixed(4)}{' '}
                <span style={{ fontSize: 14, fontWeight: 400 }}>/ {unitInfo.baseUnit}</span>
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
                {pantry.map((item) => {
                  const baseUnit = item.baseUnit || 'g';
                  const unitRate = item.costPerBaseUnit ?? item.costPerGram ?? 0;
                  const displayQty = item.qty ? `${item.qty} ${item.unit}` : `${item.weight}g`;

                  return (
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
                          {displayQty} for BND ${item.price.toFixed(2)} •{' '}
                          <strong>
                            ${unitRate.toFixed(4)}/{baseUnit}
                          </strong>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePantry(item.id)}
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
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== TAB 2: RECIPE BUILDER & PROFIT CALCULATOR ==================== */}
      {activeTab === 'recipes' && (
        <>
          {pantry.length === 0 ? (
            <div style={{ background: '#fff', padding: 22, borderRadius: 16, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🥣</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Your Pantry is Empty</h2>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                Add at least 1 ingredient in your Pantry first so you can build recipes and calculate profits!
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('pantry')}
                style={{
                  minHeight: 48,
                  padding: '0 20px',
                  background: '#ea580c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Go to Pantry →
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSaveRecipe}
              style={{
                background: '#fff',
                padding: 18,
                borderRadius: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {editingRecipeId && (
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    padding: '10px 12px',
                    borderRadius: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 13,
                    color: '#1e40af',
                    fontWeight: 600,
                  }}
                >
                  <span>✏️ Editing saved recipe</span>
                  <button
                    type="button"
                    onClick={resetRecipeForm}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1d4ed8',
                      textDecoration: 'underline',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel Edit
                  </button>
                </div>
              )}

              {/* SCREEN 2: RECIPE DETAILS */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  Recipe / Menu Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Choc Chip Cookies or Iced Matcha"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 10, border: '1px solid #d1d5db' }}
                />
              </div>

              {/* Pick Ingredient from Pantry */}
              <div style={{ background: '#f9fafb', padding: 14, borderRadius: 12, border: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#111827' }}>
                  1. Add Ingredients Used in This Batch
                </div>

                <select
                  value={selectedPantryId}
                  onChange={(e) => setSelectedPantryId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 16,
                    borderRadius: 10,
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    marginBottom: 10,
                  }}
                >
                  <option value="">-- Choose from My Pantry --</option>
                  {pantry.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (${(item.costPerBaseUnit ?? item.costPerGram ?? 0).toFixed(4)}/{item.baseUnit || 'g'})
                    </option>
                  ))}
                </select>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                  <input
                    type="number"
                    step="any"
                    placeholder={
                      activePantryItem
                        ? `Amount used (${activePantryItem.baseUnit || 'g'})`
                        : 'Amount used'
                    }
                    value={amountUsed}
                    onChange={(e) => setAmountUsed(e.target.value)}
                    style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 10, border: '1px solid #d1d5db' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddIngredientToRecipe}
                    style={{
                      minHeight: 48,
                      background: '#111827',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: 'pointer',
                    }}
                  >
                    + Add
                  </button>
                </div>

                {/* List of Added Recipe Ingredients */}
                {recipeItems.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {recipeItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: '#fff',
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                          fontSize: 14,
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600 }}>{item.name}</span>{' '}
                          <span style={{ color: '#6b7280' }}>
                            ({item.amountUsed} {item.baseUnit})
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: '#ea580c' }}>
                            ${item.lineCost.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipeItem(item.id)}
                            style={{
                              background: '#fee2e2',
                              color: '#b91c1c',
                              border: 'none',
                              borderRadius: 6,
                              padding: '4px 8px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Extra Costs & Batch Yield */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                    Packaging / Gas ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 2.00"
                    value={overheadCost}
                    onChange={(e) => setOverheadCost(e.target.value)}
                    style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 10, border: '1px solid #d1d5db' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                    Batch Yield (pcs/cups)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 24"
                    value={batchYield}
                    onChange={(e) => setBatchYield(e.target.value)}
                    style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 10, border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              {/* ==================== SCREEN 3: SELLING PRICE & PROFIT MARGIN CALCULATOR ==================== */}
              <div style={{ background: '#fff7ed', padding: 16, borderRadius: 14, border: '1px solid #fed7aa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14, color: '#9a3412' }}>
                  <span>Total Batch Cost:</span>
                  <strong>BND ${totalBatchCost.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#7c2d12' }}>Cost per Piece / Cup:</span>
                  <span style={{ fontSize: 26, fontWeight: 800, color: '#c2410c' }}>
                    BND ${costPerPiece.toFixed(2)}
                  </span>
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: '#9a3412', marginBottom: 8, textTransform: 'uppercase' }}>
                  Tap a Suggested Selling Price:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {marginTiers.map((tier) => {
                    const suggested = costPerPiece * tier.multiplier;
                    return (
                      <button
                        key={tier.label}
                        type="button"
                        onClick={() => setCustomSellPrice(suggested.toFixed(2))}
                        style={{
                          background: '#fff',
                          border: '1px solid #fdba74',
                          borderRadius: 10,
                          padding: '8px 6px',
                          textAlign: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c' }}>{tier.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '2px 0' }}>
                          ${suggested.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 10, color: '#6b7280' }}>{tier.sub}</div>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#7c2d12', marginBottom: 4 }}>
                    Your Selling Price per Piece (BND $)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder={`e.g. ${(costPerPiece * 1.5).toFixed(2)}`}
                    value={customSellPrice}
                    onChange={(e) => setCustomSellPrice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 12,
                      fontSize: 16,
                      borderRadius: 10,
                      border: '1px solid #fdba74',
                      background: '#fff',
                    }}
                  />
                </div>

                {totalBatchCost > 0 && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 10,
                      background: profitPerPiece >= 0 ? '#dcfce7' : '#fee2e2',
                      borderRadius: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 14,
                      fontWeight: 700,
                      color: profitPerPiece >= 0 ? '#166534' : '#991b1b',
                    }}
                  >
                    <span>Net Profit: ${profitPerPiece.toFixed(2)} / pc</span>
                    <span>${profitPerBatch.toFixed(2)} / batch</span>
                  </div>
                )}
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
                {editingRecipeId ? '✅ Update Recipe Card' : '💾 Save Recipe Card'}
              </button>
            </form>
          )}

          {/* SAVED RECIPES LIST (TAP TO EXPAND FULL INGREDIENT BREAKDOWN) */}
          {recipes.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
                Saved Recipes ({recipes.length})
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>
                Tap any recipe card to view its full ingredient list or edit measurements.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recipes.map((r) => {
                  const netProfitPiece = r.suggestedSellPrice - r.costPerPiece;
                  const netProfitBatch = netProfitPiece * r.batchYield;
                  const isOpen = expandedRecipeId === r.id;

                  return (
                    <div
                      key={r.id}
                      style={{
                        background: '#fff',
                        borderRadius: 14,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        border: isOpen ? '1px solid #fdba74' : '1px solid transparent',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Clickable Header */}
                      <div
                        onClick={() => setExpandedRecipeId(isOpen ? null : r.id)}
                        style={{
                          padding: 14,
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{r.name}</div>
                          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                            {r.items?.length || 0} ingredients • Makes {r.batchYield} pcs • Cost:{' '}
                            <strong>${r.costPerPiece.toFixed(2)}/pc</strong>
                          </div>
                          <div style={{ fontSize: 13, color: '#166534', fontWeight: 600, marginTop: 4 }}>
                            Sell @ BND ${r.suggestedSellPrice.toFixed(2)} → Profit: +${netProfitBatch.toFixed(2)}/batch
                          </div>
                        </div>

                        <span style={{ fontSize: 18, color: '#9ca3af', paddingLeft: 10 }}>
                          {isOpen ? '▲' : '▼'}
                        </span>
                      </div>

                      {/* Expanded Kitchen View (Full Ingredient List + Edit/Delete) */}
                      {isOpen && (
                        <div
                          style={{
                            borderTop: '1px solid #f3f4f6',
                            background: '#fffaf5',
                            padding: 14,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#9a3412',
                              textTransform: 'uppercase',
                              marginBottom: 8,
                            }}
                          >
                            Ingredient Breakdown (1 Batch = {r.batchYield} pcs)
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                            {(r.items || []).map((item, idx) => (
                              <div
                                key={item.id || idx}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: 14,
                                  background: '#fff',
                                  padding: '8px 10px',
                                  borderRadius: 8,
                                  border: '1px solid #fed7aa',
                                }}
                              >
                                <span>
                                  <strong>
                                    {item.amountUsed} {item.baseUnit}
                                  </strong>{' '}
                                  {item.name}
                                </span>
                                <span style={{ fontWeight: 600, color: '#4b5563' }}>
                                  ${item.lineCost.toFixed(2)}
                                </span>
                              </div>
                            ))}

                            {r.overheadCost > 0 && (
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: 14,
                                  background: '#fff',
                                  padding: '8px 10px',
                                  borderRadius: 8,
                                  border: '1px solid #fed7aa',
                                }}
                              >
                                <span>Packaging / Gas / Extra</span>
                                <span style={{ fontWeight: 600, color: '#4b5563' }}>
                                  ${r.overheadCost.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 13,
                              color: '#7c2d12',
                              fontWeight: 700,
                              paddingBottom: 12,
                              borderBottom: '1px solid #fed7aa',
                              marginBottom: 12,
                            }}
                          >
                            <span>Total Batch Cost: BND ${r.totalBatchCost.toFixed(2)}</span>
                            <span>Profit/pc: +${netProfitPiece.toFixed(2)}</span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => handleLoadRecipeToEdit(r)}
                              style={{
                                minHeight: 42,
                                background: '#ea580c',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              ✏️ Edit / Recalculate
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecipe(r.id)}
                              style={{
                                minHeight: 42,
                                background: '#fee2e2',
                                color: '#b91c1c',
                                border: 'none',
                                borderRadius: 10,
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== TAB 3: CAT DOODLE PAD ==================== */}
      {activeTab === 'doodle' && <CatDoodlePad />}

      {/* ==================== TAB 4: EXPORT / RESTORE BACKUP ==================== */}
      {activeTab === 'backup' && (
        <div style={{ background: '#fff', padding: 18, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Keep Your Data Safe</h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 18 }}>
            Your ingredients and saved recipes stay offline on this device. Download a backup file anytime so you can restore it on a new phone.
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

      {/* ==================== MOBILE-FIRST BOTTOM NAVIGATION BAR ==================== */}
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
        <div style={{ maxWidth: 480, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
          {[
            { id: 'pantry', icon: '🥣', label: 'Pantry' },
            { id: 'recipes', icon: '🧁', label: 'Recipes' },
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
                fontSize: 12,
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