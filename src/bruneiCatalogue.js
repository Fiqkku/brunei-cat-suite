export const BRUNEI_CATALOGUE = [
  // Dairy & Baking
  { name: 'Anchor Unsalted Butter (250g)', qty: 250, unit: 'g', price: 4.50 },
  { name: 'SCS Unsalted Butter (250g)', qty: 250, unit: 'g', price: 4.90 },
  { name: 'Tatura Cream Cheese (250g)', qty: 250, unit: 'g', price: 4.20 },
  { name: 'Philadelphia Cream Cheese (250g)', qty: 250, unit: 'g', price: 5.50 },
  { name: 'Hua Ho Eggs (1 Tray - 30 pcs)', qty: 1, unit: 'tray', price: 5.80 },
  { name: 'Wheat Flour / Tepung Gandum (1kg)', qty: 1, unit: 'kg', price: 1.80 },
  { name: 'Gula Pasir / White Sugar (1kg)', qty: 1, unit: 'kg', price: 1.50 },
  { name: 'Brown Sugar / Gula Merah (500g)', qty: 500, unit: 'g', price: 2.20 },
  { name: 'Condensed Milk / Susu Pekat (390g)', qty: 390, unit: 'g', price: 1.60 },
  { name: 'Evaporated Milk / Susu Cair (390g)', qty: 390, unit: 'g', price: 1.70 },
  { name: 'Fresh Full Cream Milk (1L)', qty: 1, unit: 'L', price: 2.60 },
  { name: 'UHT Whipping Cream (1L)', qty: 1, unit: 'L', price: 7.50 },
  { name: 'Beryl’s Dark Chocolate Coin (1kg)', qty: 1, unit: 'kg', price: 14.50 },
  { name: 'Cocoa Powder (250g)', qty: 250, unit: 'g', price: 4.80 },

  // Savory & Chicken (Nasi Katok / Meal Prep)
  { name: 'Hua Ho Whole Chicken (1.5kg)', qty: 1.5, unit: 'kg', price: 6.80 },
  { name: 'Boneless Chicken Breast (1kg)', qty: 1, unit: 'kg', price: 6.50 },
  { name: 'Cooking Oil / Minyak Masak (2L)', qty: 2, unit: 'L', price: 5.20 },
  { name: 'Fragrant Rice / Beras Wangi (5kg)', qty: 5, unit: 'kg', price: 8.50 },

  // Drinks & Packaging
  { name: 'Matcha Powder Ceremonial/Latte (100g)', qty: 100, unit: 'g', price: 12.00 },
  { name: 'Milo Powder Refill Pack (1kg)', qty: 1, unit: 'kg', price: 9.80 },
  { name: '16oz Plastic Cups + Lids (50 pcs)', qty: 50, unit: 'pcs', price: 6.50 },
  { name: '6x6 Cake / Brownie Box (10 pcs)', qty: 10, unit: 'pcs', price: 4.50 },
  { name: 'Nasi Katok Wrapping Paper (100 sheets)', qty: 100, unit: 'pcs', price: 3.50 },
];

export const UNIT_CONFIG = {
  g: { label: 'grams (g)', baseUnit: 'g', multiplier: 1 },
  kg: { label: 'kilograms (kg)', baseUnit: 'g', multiplier: 1000 },
  oz: { label: 'ounces (oz)', baseUnit: 'g', multiplier: 28.3495 },
  lb: { label: 'pounds (lb)', baseUnit: 'g', multiplier: 453.592 },
  ml: { label: 'milliliters (ml)', baseUnit: 'ml', multiplier: 1 },
  L: { label: 'liters (L)', baseUnit: 'ml', multiplier: 1000 },
  pcs: { label: 'pieces (pcs)', baseUnit: 'pc', multiplier: 1 },
  tray: { label: 'trays (30 pcs)', baseUnit: 'pc', multiplier: 30 },
};