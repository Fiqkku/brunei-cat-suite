import { useRef, useState, useEffect } from 'react';

export default function CatDoodlePad() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#1f2937');
  const [brushSize, setBrushSize] = useState(4);
  const [catName, setCatName] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (e) => {
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCat = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    const safeName = (catName.trim() || 'my-kucing').toLowerCase().replace(/\s+/g, '-');
    link.download = `${safeName}-doodle.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const colors = ['#1f2937', '#ea580c', '#dc2626', '#2563eb', '#16a34a', '#ec4899'];

  return (
    <div style={{ background: '#fff', padding: 18, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>🎨 Draw Your Own Kucing</h2>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 14 }}>
        Sketch a cat with your finger or mouse! Save it to submit for our weekly community poster.
      </p>

      {/* Color & Brush Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: c,
                border: color === c ? '3px solid #facc15' : '2px solid #e5e7eb',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {[3, 7, 14].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setBrushSize(size)}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: brushSize === size ? '#fff7ed' : '#fff',
                fontWeight: brushSize === size ? 700 : 400,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {size === 3 ? 'Thin' : size === 7 ? 'Med' : 'Thick'}
            </button>
          ))}
        </div>
      </div>

      {/* Drawing Canvas */}
      <canvas
        ref={canvasRef}
        width={360}
        height={320}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{
          width: '100%',
          height: 'auto',
          border: '2px dashed #fed7aa',
          borderRadius: 12,
          touchAction: 'none',
          cursor: 'crosshair',
          display: 'block',
        }}
      />

      <input
        type="text"
        placeholder="Give your cat a name (e.g. Kucing Nasi Katok)"
        value={catName}
        onChange={(e) => setCatName(e.target.value)}
        style={{
          width: '100%',
          padding: 12,
          fontSize: 16,
          borderRadius: 10,
          border: '1px solid #d1d5db',
          marginTop: 12,
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 12 }}>
        <button
          type="button"
          onClick={clearCanvas}
          style={{
            minHeight: 48,
            background: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={downloadCat}
          style={{
            minHeight: 48,
            background: '#ea580c',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          ⬇️ Save Cat PNG
        </button>
      </div>
    </div>
  );
}