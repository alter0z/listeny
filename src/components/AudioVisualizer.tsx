'use client';

import React, { useEffect, useRef } from 'react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

interface AudioVisualizerProps {
  type?: 'bars' | 'wave';
  className?: string;
}

export function AudioVisualizer({ type = 'bars', className = '' }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isPlaying, getFrequencyData } = useAudioPlayer();
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const data = getFrequencyData();
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (!data || !isPlaying) {
        // Render idle resting bars
        const barCount = 32;
        const barWidth = (width / barCount) * 0.65;
        const gap = (width / barCount) * 0.35;

        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + gap);
          const idleHeight = 3 + Math.sin(Date.now() / 600 + i * 0.3) * 2;
          const y = height - idleHeight;

          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, idleHeight, 2);
          ctx.fill();
        }

        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      if (type === 'bars') {
        const barCount = Math.min(data.length, 36);
        const barWidth = (width / barCount) * 0.68;
        const gap = (width / barCount) * 0.32;

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(0.6, '#06b6d4');
        gradient.addColorStop(1, '#8b5cf6');

        for (let i = 0; i < barCount; i++) {
          const value = data[i] || 0;
          const percent = value / 255;
          const barHeight = Math.max(4, percent * height * 0.95);
          const x = i * (barWidth + gap);
          const y = height - barHeight;

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      } else {
        // Smooth waveform visualizer
        ctx.beginPath();
        const sliceWidth = width / data.length;
        let x = 0;

        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(0.5, '#06b6d4');
        gradient.addColorStop(1, '#8b5cf6');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < data.length; i++) {
          const v = data[i] / 255.0;
          const y = height - v * height;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, getFrequencyData, type]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={64}
      className={`w-full h-full ${className}`}
    />
  );
}
