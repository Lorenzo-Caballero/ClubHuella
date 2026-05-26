import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function EmugamesPurchasePage() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let stars = [];

    function createStars() {
      stars = [];
      for (let i = 0; i < 300; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5,
          alpha: Math.random(),
          dx: Math.random() * 0.4 - 0.2,
          dy: Math.random() * 0.4 - 0.2,
        });
      }
    }

    function drawGalaxy() {
      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
      gradient.addColorStop(0, "#0f0c29");
      gradient.addColorStop(0.4, "#302b63");
      gradient.addColorStop(0.7, "#6e44ff");
      gradient.addColorStop(1, "#00d4ff");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();

        star.x += star.dx;
        star.y += star.dy;

        if (star.x < 0 || star.x > width) star.dx *= -1;
        if (star.y < 0 || star.y > height) star.dy *= -1;
      });

      if (Math.random() < 0.01) {
        drawShootingStar();
      }

      requestAnimationFrame(drawGalaxy);
    }

    function drawShootingStar() {
      const x = Math.random() * width;
      const y = Math.random() * height / 2;
      const length = Math.random() * 80 + 50;
      const angle = Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + length * Math.cos(angle), y + length * Math.sin(angle));
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    createStars();
    drawGalaxy();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      createStars();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />
      <div className="absolute top-0 left-0 w-full h-full z-0 animate-gradient-xy bg-gradient-to-br from-cyan-500 via-purple-500 to-indigo-900 opacity-20" />

      <div className="relative z-10 flex flex-col pb-8 items-center justify-center h-full px-6 md:px-12 text-white text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-5xl"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-cyan-300 via-violet-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,255,255,0.5)] mb-8 leading-tight">
            Bienvenido a Emugames 
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="w-full max-w-6xl aspect-video rounded-3xl overflow-hidden border-4 border-cyan-400 shadow-lg shadow-violet-500 mb-12"
        >
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Demo Emugames"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-br from-cyan-500 via-violet-500 to-indigo-600 text-white font-bold py-4 px-16 rounded-full shadow-2xl hover:shadow-cyan-400/50 transition duration-300 text-lg tracking-wide"
          onClick={() => alert("¡Has comprado el sistema Emugames! ¡Gracias!")}
        >
          Comprar ahora a solo $10.000 pesos!
        </motion.button>
      </div>
    </div>
  );
}