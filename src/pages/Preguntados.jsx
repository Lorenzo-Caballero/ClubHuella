import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import successSound from "./sounds/success.mp3";
import failSound from "./sounds/fail.mp3";

const allQuestions = [
  { question: "¿Qué se usa para limpiar un tatuaje recién hecho?", options: ["Agua oxigenada", "Agua y jabón neutro", "Alcohol", "Aceite"], answer: "Agua y jabón neutro" },
  { question: "¿Qué debe aplicarse para cuidar un tatuaje reciente?", options: ["Protector solar", "Crema hidratante especial", "Vinagre", "Limon y virulana"], answer: "Crema hidratante especial" },
  { question: "¿Qué parte del cuerpo duele más al tatuarse?", options: ["Espalda baja", "Costillas", "Brazo", "Pantorrilla"], answer: "Costillas" },
  { question: "¿Qué estilo de tatuaje usa sólo tinta negra y líneas gruesas?", options: ["Realismo", "Blackwork", "Acuarela", "Neo tradicional"], answer: "Blackwork" },
  { question: "¿Qué representa un tatuaje de ancla tradicionalmente?", options: ["Libertad", "Estabilidad", "Aventura", "Transformación"], answer: "Estabilidad" },
  { question: "¿Qué material se usa principalmente para las agujas de tatuaje?", options: ["Hierro", "Plata", "Acero inoxidable", "Cuerdas de guitarra"], answer: "Acero inoxidable" },
  { question: "¿Cuál es un estilo de tatuaje que simula pinceladas?", options: ["Acuarela", "Old School", "Tribal", "Minimalista"], answer: "Acuarela" },
  { question: "¿Qué color suele desaparecer más rápido en un tatuaje?", options: ["Negro", "Rojo", "Azul", "Amarillo"], answer: "Amarillo" },
  { question: "¿Qué significa tradicionalmente un tatuaje de golondrina?", options: ["Libertad", "Fidelidad", "Maldad", "Poder"], answer: "Fidelidad" },
  { question: "¿Cuál crema es recomendable usar tras tatuarse?", options: ["Adermicina A", "Platsul", "Dermaglos", "Nivea"], answer: "Dermaglos" },
  { question: "¿Qué cultura es famosa por sus tatuajes tribales faciales?", options: ["Maorí", "Egipcia", "Romana", "Vikinga"], answer: "Maorí" },
  { question: "¿Qué significa el tatuaje de rosa tradicionalmente?", options: ["Dolor", "Amor", "Riqueza", "Sabiduría"], answer: "Amor" },
  { question: "¿Qué es imprescindible evitar tras tatuarse?", options: ["Agua de mar", "Dormir", "Comer dulce", "Caminar"], answer: "Agua de mar" },
  { question: "¿Qué hace un \"flash\" en tatuajes?", options: ["Es un diseño listo para tatuar", "Es una máquina de tatuaje", "Es una tinta especial", "Es una plantilla para práctica"], answer: "Es un diseño listo para tatuar" },
  { question: "¿Qué estilo mezcla dibujos animados y colores vivos?", options: ["Cartoon", "Realismo", "Tribal", "Minimalista"], answer: "Cartoon" },
  { question: "¿Cuál es la primera capa afectada al tatuarse?", options: ["Epidermis", "Dermis", "Hipodermis", "Subcutis"], answer: "Dermis" },
  { question: "¿Qué líquido ayuda a limpiar mientras tatúan?", options: ["Alcohol", "Agua destilada", "Agua jabonosa", "Aceite"], answer: "Agua jabonosa" },
  { question: "¿Qué es un \"stencil\" en tatuaje?", options: ["Aguja especial", "Diseño transferido a la piel", "Tipo de tinta", "Sombra"], answer: "Diseño transferido a la piel" },
  { question: "¿Qué tinta suele durar más tiempo?", options: ["Negra", "Roja", "Azul", "Amarilla"], answer: "Negra" },
  { question: "¿Qué precaución es vital al exponer un tatuaje reciente al sol?", options: ["Cubrirlo", "Mojarlo", "Rascarlo", "Aceitarlo"], answer: "Cubrirlo" },
  { question: "¿Qué técnica utiliza puntos pequeños para formar una imagen?", options: ["Dotwork", "Blackwork", "Lineal", "Acuarela"], answer: "Dotwork" },
  { question: "¿Qué país popularizó el estilo \"irezumi\"?", options: ["China", "Japón", "India", "Egipto"], answer: "Japón" },
  { question: "¿Qué estilo de tatuaje es famoso por su semejanza a una foto?", options: ["Realismo", "Minimalista", "Cartoon", "Old School"], answer: "Realismo" },
  { question: "¿Qué es más seguro usar en un estudio de tatuaje?", options: ["Agujas desechables", "Agujas reutilizadas", "Agujas de madera", "Agujas de vidrio"], answer: "Agujas desechables" },
  { question: "¿Qué representa un tatuaje de calavera tradicionalmente?", options: ["Vida", "Muerte", "Suerte", "Felicidad"], answer: "Muerte" },
  { question: "¿Qué parte del cuerpo suele doler menos al tatuarse?", options: ["Brazo", "Costillas", "Pie", "Rodilla"], answer: "Brazo" },
  { question: "¿Qué color de tinta suele ser más difícil de eliminar con láser?", options: ["Negro", "Verde", "Amarillo", "Rojo"], answer: "Verde" },
  { question: "¿Qué significa tradicionalmente un tatuaje de dragón en Asia?", options: ["Destrucción", "Sabiduría", "Debilidad", "Maldad"], answer: "Sabiduría" }
];

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function TattooTrivia() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [selected, setSelected] = useState(null);
  const [timer, setTimer] = useState(100);
  const [disableOptions, setDisableOptions] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const randomQuestions = shuffleArray(allQuestions).slice(0, 5).map(q => ({
      ...q,
      options: shuffleArray(q.options),
    }));
    setQuestions(randomQuestions);
  }, []);

  useEffect(() => {
    if (finished || disableOptions) return;
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 0.5);
      }, 50);
      return () => clearInterval(interval);
    } else {
      handleAnswer(null); // Timeout, no respuesta
    }
  }, [timer, disableOptions, finished]);

  const playSound = (type) => {
    const audio = new Audio(type === "success" ? successSound : failSound);
    audio.play(); // Reproducir sonido inmediatamente sin delay
  };

  const handleAnswer = (option) => {
    if (disableOptions) return;
  
    const correct = questions[current].answer;
  
    // Reproducir sonido en el momento que se hace clic
    playSound(option === correct ? "success" : "fail");
  
    setDisableOptions(true);
    setSelected(option);
  
    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent(current + 1);
        setSelected(null);
        setTimer(100);
        setDisableOptions(false);
      } else {
        setFinished(true);
        if (score + (option === correct ? 1 : 0) >= 3) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      }
    }, 1500);
  
    if (option === correct) {
      setScore(prev => prev + 1);
    }
  };
  

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 to-pink-500 overflow-hidden">
      {/* Confetti simple */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 100 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-white opacity-80"
              style={{
                top: Math.random() * -100 + "%",
                left: Math.random() * 100 + "%",
              }}
              animate={{
                y: "150vh",
                rotate: 360,
                opacity: [1, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {!finished ? (
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl relative"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">{questions[current]?.question}</h2>

          <div className="space-y-4">
            {questions[current]?.options.map((option, idx) => (
              <motion.button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={disableOptions}
                whileTap={{ scale: 0.95 }}
                className={`w-full py-3 px-4 rounded-xl text-lg font-semibold transition-all duration-300 
                  ${
                    disableOptions
                      ? option === questions[current].answer
                        ? "bg-green-500 text-white"
                        : option === selected
                        ? "bg-red-500 text-white animate-shake-fall"
                        : "bg-gray-300 text-gray-600"
                      : "bg-purple-500 text-white hover:bg-purple-600"
                  }
                `}
              >
                {option}
              </motion.button>
            ))}
          </div>

          <div className="w-full mt-6 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-3 bg-purple-600 transition-all duration-50"
              style={{ width: `${timer}%` }}
            ></div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-10 rounded-3xl shadow-2xl text-center"
        >
          {score === 5 ? (
            <>
              <h2 className="text-3xl font-bold text-green-600 mb-4">¡Perfecto! 🎉</h2>
              <p className="text-xl">¡Ganaste un 50% de descuento!</p>
            </>
          ) : score >= 3 ? (
            <>
              <h2 className="text-3xl font-bold text-green-500 mb-4">¡Bien hecho!</h2>
              <p className="text-xl">¡Ganaste un 30% de descuento!</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-red-500 mb-4">Sigue intentando</h2>
              <p className="text-lg">Aciertos: {score} / 5</p>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
