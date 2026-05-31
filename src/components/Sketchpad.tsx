'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Palette, Eraser, Trash2, Undo, Check, Brush } from 'lucide-react';

interface SketchpadProps {
  initialImageUrl?: string;
  onSave: (base64Data: string) => void;
  onCancel?: () => void;
}

export default function Sketchpad({ initialImageUrl, onSave, onCancel }: SketchpadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  
  // History stack for Undo functionality
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set up canvas sizing for crisp lines on high-DPI screens
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(2, 2);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;

    // Fill white background so images aren't transparent
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, rect.width, rect.height);

    // Save initial blank canvas state to history
    setHistory([canvas.toDataURL()]);

    // Load initial image if provided
    if (initialImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        context.drawImage(img, 0, 0, rect.width, rect.height);
        setHistory([canvas.toDataURL()]);
      };
      img.src = initialImageUrl;
    }
  }, [initialImageUrl]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const context = contextRef.current;
    if (!context) return;

    context.beginPath();
    context.moveTo(x, y);
    
    // Set drawing properties
    context.strokeStyle = isEraser ? '#ffffff' : color;
    context.lineWidth = brushSize;
    
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const { x, y } = getCoordinates(e);
    const context = contextRef.current;
    if (!context) return;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Save state to undo history
    const dataUrl = canvas.toDataURL();
    setHistory(prev => [...prev, dataUrl]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);

    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const previousState = newHistory[newHistory.length - 1];
    const img = new Image();
    img.onload = () => {
      const rect = canvas.getBoundingClientRect();
      context.clearRect(0, 0, rect.width, rect.height);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, rect.width, rect.height);
      context.drawImage(img, 0, 0, rect.width, rect.height);
    };
    img.src = previousState;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    context.clearRect(0, 0, rect.width, rect.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, rect.width, rect.height);

    // Save cleared state to history
    const dataUrl = canvas.toDataURL();
    setHistory(prev => [...prev, dataUrl]);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/png'));
  };

  const presetColors = [
    '#000000', // Black
    '#2b8a3e', // Forest Green
    '#a61e4d', // Red
    '#d9480f', // Orange
    '#f59f00', // Yellow
    '#1c7ed6', // Blue
    '#862e9c', // Purple
    '#868e96', // Slate Gray
  ];

  return (
    <div className="sketchpad-container">
      {/* Controls Bar */}
      <div className="sketchpad-toolbar">
        {/* Colors Selection */}
        <div className="toolbar-section colors-section">
          <Palette className="tool-icon" size={18} />
          <div className="color-presets">
            {presetColors.map(c => (
              <button
                key={c}
                type="button"
                className={`color-btn ${color === c && !isEraser ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
          {/* Native Color Picker */}
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              setIsEraser(false);
            }}
            className="native-color-picker"
            title="Custom Color"
          />
        </div>

        {/* Brush Size */}
        <div className="toolbar-section brush-size-section">
          <Brush className="tool-icon" size={18} />
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="brush-slider"
            title="Brush Size"
          />
          <span className="size-label">{brushSize}px</span>
        </div>

        {/* Action Buttons */}
        <div className="toolbar-section actions-section">
          <button
            type="button"
            className={`action-btn ${isEraser ? 'active' : ''}`}
            onClick={() => setIsEraser(!isEraser)}
            title="Eraser"
          >
            <Eraser size={18} />
          </button>
          
          <button
            type="button"
            className="action-btn"
            onClick={handleUndo}
            disabled={history.length <= 1}
            title="Undo"
          >
            <Undo size={18} />
          </button>

          <button
            type="button"
            className="action-btn delete-btn"
            onClick={handleClear}
            title="Clear Board"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Canvas Drawing Area */}
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="drawing-canvas"
        />
      </div>

      {/* Action Footer */}
      <div className="sketchpad-footer">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          <Check size={18} /> 儲存繪圖
        </button>
      </div>
    </div>
  );
}
