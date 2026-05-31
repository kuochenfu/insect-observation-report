'use client';

import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { ObservationRecord } from '@/lib/types';

// Register all Chart.js components
Chart.register(...registerables);

interface GrowthChartProps {
  records: ObservationRecord[];
}

export default function GrowthChart({ records }: GrowthChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Destroy existing chart to prevent canvas reuse errors
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Sort records by day number
    const sortedRecords = [...records].sort((a, b) => a.dayNumber - b.dayNumber);

    const labels = sortedRecords.map(r => `第 ${r.dayNumber} 天 (${r.date.substring(5)})`);
    const lengths = sortedRecords.map(r => r.length);
    const annotations = sortedRecords.map(r => r.appearanceDescription);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(43, 138, 62, 0.4)'); // Theme Forest Green
    gradient.addColorStop(1, 'rgba(43, 138, 62, 0.02)');

    chartInstanceRef.current = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '昆蟲體長 (mm)',
            data: lengths,
            borderColor: '#2b8a3e', // Forest Green
            borderWidth: 3,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35, // Smooth curves
            pointBackgroundColor: '#2b8a3e',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: '#1b6a2e',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                family: 'system-ui, -apple-system, sans-serif',
                size: 13,
                weight: 'bold'
              },
              color: '#374151' // slate-700
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)', // slate-900
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => `體長: ${context.parsed.y} mm`,
              footer: (items) => {
                const index = items[0].dataIndex;
                const desc = annotations[index];
                if (!desc) return '';
                // Truncate long descriptions in tooltips
                return desc.length > 30 ? `描述: ${desc.substring(0, 30)}...` : `描述: ${desc}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12
              },
              color: '#4b5563'
            },
            title: {
              display: true,
              text: '觀察天數',
              font: {
                weight: 'bold',
                size: 13
              },
              color: '#374151'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#e5e7eb'
            },
            ticks: {
              font: {
                size: 12
              },
              color: '#4b5563',
              callback: (value) => `${value} mm`
            },
            title: {
              display: true,
              text: '體長 (mm)',
              font: {
                weight: 'bold',
                size: 13
              },
              color: '#374151'
            }
          }
        }
      }
    });

    // Cleanup on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [records]);

  return (
    <div className="chart-container-inner" style={{ position: 'relative', height: '100%', width: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
