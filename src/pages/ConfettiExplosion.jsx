import { useEffect, useState } from 'react';

const colores = ['#f87171', '#facc15', '#4ade80', '#60a5fa', '#c084fc', '#f472b6'];

export default function ConfettiExplosion({ cantidad = 40 }) {
  const [confetis, setConfetis] = useState([]);

  useEffect(() => {
    const nuevos = Array.from({ length: cantidad }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // porcentaje
      y: Math.random() * 20,
      rot: Math.random() * 360,
      dur: 2 + Math.random() * 2,
      size: 6 + Math.random() * 6,
      color: colores[Math.floor(Math.random() * colores.length)],
    }));
    setConfetis(nuevos);

    const timer = setTimeout(() => setConfetis([]), 5000); // limpiar
    return () => clearTimeout(timer);
  }, [cantidad]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetis.map(c => (
        <div
          key={c.id}
          className="absolute rounded-full opacity-90"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: `${c.size}px`,
            height: `${c.size}px`,
            backgroundColor: c.color,
            animation: `fall ${c.dur}s ease-out forwards`,
            transform: `rotate(${c.rot}deg)`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
