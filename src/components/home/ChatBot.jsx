import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CohereClient } from 'cohere-ai';
import axios from 'axios';
import assistent from '../../assets/Nuvio.png';

const ChatBot = () => {
  const [chatAbierto, setChatAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [cohereToken, setCohereToken] = useState(null);
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const mensajesRef = useRef(null);
  const [mostrarTooltip, setMostrarTooltip] = useState(false);

  useEffect(() => {
    obtenerTokenCohere();
  }, []);

  const obtenerTokenCohere = async () => {
    try {
      const response = await axios.get('https://gestoradmin.store/index.php?recurso=apiai');
      const token = response.data[0]?.ia;
      setCohereToken(token);
    } catch (error) {
      console.error('Error al obtener el token de la API:', error);
    }
  };

  const handleMouseEnter = () => setMostrarTooltip(true);
  const handleMouseLeave = () => setMostrarTooltip(false);

  const scrollToBottom = () => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje.trim() || enviandoMensaje) return;
    setEnviandoMensaje(true);
    setMensajes(prev => [...prev, { texto: nuevoMensaje, origen: 'usuario' }]);
    setNuevoMensaje('');
    try {
      const respuesta = await obtenerRespuestaCohere(nuevoMensaje);
      setMensajes(prev => [...prev, { texto: respuesta, origen: 'asistente' }]);
    } finally {
      setEnviandoMensaje(false);
    }
  };

  const obtenerRespuestaCohere = async (userMessage) => {
    try {
      if (!cohereToken) throw new Error('Token de Cohere no disponible');

      const cohere = new CohereClient({
        token: cohereToken,
        language: 'es',
        model: 'command-r-plus',
      });

      setEscribiendo(true);

      const chatHistory = [
        {
          role: 'SYSTEM',
          message: ` Sos un asistente de Nuvio, das respuestas breves, no superás 4 renglones. Sos argentino.  Usá algunos emojis y mantené las respuestas amables. Máximo 70 tokens.
          Nuvio es una empresa de desarrollo de software con base en Argentina, especializada en la creación de sitios web profesionales para emprendedores que desean mostrar su negocio al mundo de forma moderna, clara y efectiva.

          Nuestro enfoque está en ofrecer soluciones completas, accesibles y personalizadas para quienes buscan dar el salto digital sin complicaciones.
          
          🔧 ¿Qué incluye cada proyecto Nuvio?
          – Diseño web moderno y adaptado a tu marca
          – Chatbot con Inteligencia Artificial entrenado para tu negocio
          – Redirección automática a WhatsApp para convertir más
          – Hosting incluido por 1 año o más!
          
          🎯 Nuvio no solo crea páginas web. Creamos tu presencia digital. 
          INFO DE COTIZACIONES:Desde mi empresa de desarrollo de software, podemos ayudarte a crear una landing page profesional, clara, y adaptable, donde puedas mostrar tus servicios, promociones mensuales, fotos y cualquier otro contenido que quieras ir actualizando mes a mes.

          📄 Opción sin chatbot:
          
          Setup inicial: $100.000 (único pago)
          
          Mantenimiento mensual: $30.000 (incluye hasta 5 cambios mensuales)
          
          Incluye hosting por 1 año
          
          
          🤖 Opción con chatbot con inteligencia artificial (IA)
          
          Setup inicial: $130.000 (único pago)
          
          Mantenimiento mensual: $30.000 (también incluye hasta 5 cambios mensuales)
          
          También con hosting por 1 año incluido
          
          `,
        },
        { role: 'USER', message: userMessage },
      ];

      const response = await cohere.chat({
        message: userMessage,
        model: 'command-r-plus',
        chat_history: chatHistory,
        language: 'es',
      });

      setEscribiendo(false);
      return response.text;
    } catch (error) {
      console.error('Error al llamar a Cohere AI:', error);
      setEscribiendo(false);
      return 'Lo siento, hubo un problema al procesar tu solicitud.';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleEnviarMensaje();
  };

  const handleChatToggle = () => setChatAbierto(!chatAbierto);
  const handleCloseChat = () => setChatAbierto(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
    {/* Botón flotante con fondo blanco */}
    <motion.button
      onClick={handleChatToggle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-[0_0_20px_#dea7ff] focus:outline-none transition-transform ${
        chatAbierto ? 'hidden' : ''
      }`}
    >
      <img
        src={assistent}
        alt="Asistente"
        className="w-12 h-12 object-cover scale-110 rounded-full"
      />
    </motion.button>
  
    {/* Tooltip */}
    {mostrarTooltip && !chatAbierto && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-20 right-2 px-3 py-1 bg-purple-600 text-white text-sm rounded-md shadow-lg"
      >
        Soy Nuvio! Tu asistente virtual
      </motion.div>
    )}
  
    {/* Ventana de chat con fondo blanco-violeta animado */}
    {chatAbierto && (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative p-4 rounded-t-2xl shadow-2xl w-full max-w-sm sm:max-w-xs md:max-w-md border border-white/20 overflow-hidden text-violet-900"
      >
        {/* Fondo animado blanco y violeta */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_#ffffff,_#7c3aed,_#f5f3ff)] bg-[length:400%_400%] animate-[gradientMove_10s_ease_infinite] z-0" />
  
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-xl tracking-wide">Nuvio</h2>
            <button
              onClick={handleCloseChat}
              className="w-8 h-8 flex items-center justify-center bg-white/30 hover:bg-white/50 text-violet-900 font-bold text-lg rounded-full transition duration-300 shadow-sm hover:scale-105"
            >
              X
            </button>
          </div>
  
          <div
            ref={mensajesRef}
            className="h-64 overflow-y-auto space-y-2 mb-3 pr-1 scrollbar-thin scrollbar-thumb-violet-800/30 scrollbar-track-transparent"
          >
            {mensajes.map((mensaje, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: mensaje.origen === 'usuario' ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`px-4 py-2 rounded-2xl w-fit max-w-[90%] whitespace-pre-line break-words overflow-hidden shadow-md ${
                  mensaje.origen === 'usuario'
                    ? 'ml-auto bg-purple-500 text-white'
                    : 'mr-auto bg-white text-violet-900'
                }`}
              >
                <strong className="block mb-1 text-sm opacity-70">
                  {mensaje.origen === 'usuario' ? 'Tú' : 'Nuvio'}
                </strong>
                {mensaje.texto}
              </motion.div>
            ))}
            {escribiendo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-left px-4 py-2 rounded-lg bg-purple-600 text-white w-fit"
              >
                <strong>Escribiendo...</strong>
              </motion.div>
            )}
          </div>
  
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribí algo..."
              className="flex-1 bg-white/30 border border-violet-900/20 text-violet-900 placeholder-violet-900/50 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-900/20"
              disabled={enviandoMensaje}
            />
            <button
              onClick={handleEnviarMensaje}
              disabled={enviandoMensaje}
              className="bg-violet-900 text-white font-semibold px-4 py-2 rounded-full text-sm hover:bg-violet-800 transition-all shadow-md"
            >
              Enviar
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </div>
  
  
  );
};

export default ChatBot;
