import React, { useRef, useEffect } from 'react';
import { Results } from '@mediapipe/hands';
import { NailDesign, PARTS } from '../constants';

interface NailCanvasProps {
  results: Results | null;
  design: NailDesign;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export default function NailCanvas({ results, design, videoRef }: NailCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !results) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks) {
      results.multiHandLandmarks.forEach((landmarks) => {
        // Finger maps: tip and its two joints below for better orientation
        const fingers = [
          { tip: 4, joints: [3, 2] },   // Thumb
          { tip: 8, joints: [7, 6] },   // Index
          { tip: 12, joints: [11, 10] }, // Middle
          { tip: 16, joints: [15, 14] }, // Ring
          { tip: 20, joints: [19, 18] }  // Pinky
        ];

        fingers.forEach((finger, idx) => {
          const tip = landmarks[finger.tip];
          const j1 = landmarks[finger.joints[0]];
          
          const tx = tip.x * canvas.width;
          const ty = tip.y * canvas.height;
          const j1x = j1.x * canvas.width;
          const j1y = j1.y * canvas.height;

          const vx = tx - j1x;
          const vy = ty - j1y;
          const angle = Math.atan2(vy, vx) + Math.PI / 2;
          
          const dist = Math.sqrt(vx * vx + vy * vy);
          
          // Get individual design for this finger if it exists
          const fingerDesign = design.useIndividual ? design.individualFingers[idx] : null;
          
          const fingerLength = fingerDesign?.length ?? design.length;
          const fingerWidthScale = fingerDesign?.widthScale ?? design.widthScale;
          const fingerAnchorOffset = fingerDesign?.anchorOffset ?? design.anchorOffset;
          const fingerSizeScale = fingerDesign?.sizeScale ?? design.sizeScale;

          // Apply manual fitting scales
          const widthMultipliers = [1.1, 0.85, 0.9, 0.85, 0.75]; // thumb, index, middle, ring, pinky
          const baseHeightRatio = 1.3; // Standard ratio for the part on the fingertip
          const nailWidth = dist * widthMultipliers[idx] * fingerWidthScale * fingerSizeScale; 
          const nailHeight = dist * (baseHeightRatio * fingerSizeScale + (fingerLength - 1) * 2); 

          ctx.save();
          // Anchor near the base of the nail bed
          const anchorFactor = fingerAnchorOffset + 0.15;
          ctx.translate(tx - vx * anchorFactor, ty - vy * anchorFactor);
          ctx.rotate(angle);

          // Get color for this specific finger
          const fingerColor = fingerDesign ? fingerDesign.color : design.color;
          const fingerBaseColor = fingerDesign ? (fingerDesign.baseColor || design.baseColor) : design.baseColor;

          // Build base fill
          let nailFill: string | CanvasGradient | CanvasPattern = fingerColor;
          
          if (design.art === 'french') {
            nailFill = fingerBaseColor;
          }

          // Subtle Shadows
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowOffsetY = 2;

          // Main Nail Shape
          ctx.fillStyle = nailFill;
          ctx.beginPath();
          const hw = nailWidth / 2;
          const bh = dist * baseHeightRatio; // height of the nail bed part
          const th = nailHeight - bh; // height of the free edge (extension)
          
          // Drawing from bottom (y=0) to top (y=-nailHeight)
          if (design.shape === 'square') {
            const br = hw * 0.8; // base radius
            ctx.roundRect(-hw, -nailHeight, nailWidth, nailHeight, [2, 2, br, br]);
          } else if (design.shape === 'almond') {
            ctx.moveTo(-hw, 0);
            ctx.bezierCurveTo(-hw, -th, -hw * 0.2, -nailHeight, 0, -nailHeight);
            ctx.bezierCurveTo(hw * 0.2, -nailHeight, hw, -th, hw, 0);
            ctx.ellipse(0, 0, hw, hw * 0.8, 0, 0, Math.PI, false);
            ctx.closePath();
          } else if (design.shape === 'stiletto') {
            ctx.moveTo(-hw, 0);
            ctx.lineTo(0, -nailHeight * 1.2);
            ctx.lineTo(hw, 0);
            ctx.ellipse(0, 0, hw, hw * 0.8, 0, 0, Math.PI, false);
            ctx.closePath();
          } else if (design.shape === 'duck') {
            const flare = 1.6;
            ctx.moveTo(-hw, 0);
            ctx.lineTo(-hw * flare, -nailHeight);
            ctx.lineTo(hw * flare, -nailHeight);
            ctx.lineTo(hw, 0);
            ctx.ellipse(0, 0, hw, hw * 0.8, 0, 0, Math.PI, false);
            ctx.closePath();
          } else if (design.shape === 'ballerina') {
            const taper = 0.6; // flat top width ratio
            ctx.moveTo(-hw, 0);
            ctx.lineTo(-hw * taper, -nailHeight);
            ctx.lineTo(hw * taper, -nailHeight);
            ctx.lineTo(hw, 0);
            ctx.ellipse(0, 0, hw, hw * 0.8, 0, 0, Math.PI, false);
            ctx.closePath();
          } else if (design.shape === 'round') { // round - Improved
            ctx.moveTo(-hw, 0);
            ctx.bezierCurveTo(-hw, -nailHeight * 0.8, -hw, -nailHeight, 0, -nailHeight);
            ctx.bezierCurveTo(hw, -nailHeight, hw, -nailHeight * 0.8, hw, 0);
            ctx.ellipse(0, 0, hw, hw * 0.8, 0, 0, Math.PI, false);
            ctx.closePath();
          } else { // default to round if unknown
            ctx.moveTo(-hw, 0);
            ctx.bezierCurveTo(-hw, -nailHeight * 0.8, -hw, -nailHeight, 0, -nailHeight);
            ctx.bezierCurveTo(hw, -nailHeight, hw, -nailHeight * 0.8, hw, 0);
            ctx.ellipse(0, 0, hw, hw * 0.8, 0, 0, Math.PI, false);
            ctx.closePath();
          }
          ctx.fill();

          // Art Overlays
          if (design.art === 'french') {
            ctx.save();
            ctx.clip(); 
            ctx.fillStyle = fingerColor;
            
            // Fix: Improved French Tip - Smile line
            const tipHeight = nailHeight * 0.25;
            ctx.beginPath();
            ctx.moveTo(-hw * 2, -nailHeight);
            ctx.lineTo(hw * 2, -nailHeight);
            ctx.lineTo(hw * 2, -nailHeight + tipHeight);
            ctx.bezierCurveTo(
              hw * 0.5, -nailHeight + tipHeight * 0.4,
              -hw * 0.5, -nailHeight + tipHeight * 0.4,
              -hw * 2, -nailHeight + tipHeight
            );
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }

          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'rgba(0,0,0,0.1)';
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // Texture Overlays
          if (design.texture === 'glossy') {
            const gloss = ctx.createLinearGradient(-hw, -nailHeight/2, hw, -nailHeight/2);
            gloss.addColorStop(0, 'rgba(255,255,255,0)');
            gloss.addColorStop(0.2, 'rgba(255,255,255,0.3)');
            gloss.addColorStop(0.25, 'rgba(255,255,255,0.1)');
            gloss.addColorStop(0.8, 'rgba(255,255,255,0.2)');
            gloss.addColorStop(1, 'rgba(0,0,0,0.05)');
            ctx.fillStyle = gloss;
            ctx.fill();
          } else if (design.texture === 'matte') {
            ctx.fillStyle = 'rgba(255,255,255,0.02)';
            ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.02)';
            ctx.fill();
          }

          // Depth Curve
          const vGradient = ctx.createLinearGradient(0, -nailHeight, 0, 0);
          vGradient.addColorStop(0, 'rgba(255,255,255,0.1)');
          vGradient.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = vGradient;
          ctx.fill();

          // Draw Decor
          design.parts.forEach((partId, pIdx) => {
            const part = PARTS.find(p => p.id === partId);
            if (part) {
              const fontSize = nailWidth * 0.6;
              ctx.font = `${fontSize}px serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              const py = -nailHeight * 0.6 + (pIdx * fontSize * 1.1);
              
              // Part shadow
              ctx.shadowBlur = 4;
              ctx.shadowColor = 'rgba(0,0,0,0.3)';
              ctx.fillText(part.icon, 1, py + 1);
              ctx.shadowBlur = 0;
              ctx.fillText(part.icon, 0, py);
            }
          });

          ctx.restore();
        });
      });
    }
  }, [results, design]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-20 pointer-events-none"
      width={1280}
      height={720}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}
