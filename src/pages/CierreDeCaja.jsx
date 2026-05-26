import React, { useEffect, useState } from 'react';

const CierreDeCaja = ({ apertura, onCerrarCaja }) => {
  const [montosFinales, setMontosFinales] = useState({});
  const [premiosPagados, setPremiosPagados] = useState('');
  const [bonos, setBonos] = useState('');
  const [billeteras, setBilleteras] = useState([]);
  const [retiros, setRetiros] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [retiro, setRetiro] = useState({ desde: '', hasta: '', monto: '' });

  useEffect(() => {
    fetch('https://gestoradmin.store/index.php?recurso=billeteras')
      .then(res => res.json())
      .then(data => setBilleteras(data))
      .catch(err => console.error(err));
  }, []);

  const handleMontoFinalChange = (id, value) => {
    setMontosFinales({ ...montosFinales, [id]: value });
  };

  const agregarRetiro = () => {
    if (retiro.desde && retiro.hasta && retiro.monto && retiro.desde !== retiro.hasta) {
      setRetiros([...retiros, retiro]);
      setRetiro({ desde: '', hasta: '', monto: '' });
      setModalAbierto(false);
    }
  };

  const handleCerrarCaja = () => {
    const dataCierre = {
      empleadoId: apertura.empleadoId,
      turno: apertura.turno,
      billeteras: apertura.billeteras.map(b => ({
        id: b.id,
        montoInicial: b.monto,
        montoFinal: montosFinales[b.id] || 0
      })),
      premiosPagados: parseFloat(premiosPagados) || 0,
      bonos: parseFloat(bonos) || 0,
      retiros
    };

    console.log('Datos de cierre:', dataCierre);

    // Aquí deberías enviar esto a tu backend para guardar el cierre
    onCerrarCaja(dataCierre);
  };

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Cierre de Caja</h2>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl"
        >
          Retiros
        </button>
      </div>

      <div className="space-y-4">
        {apertura.billeteras.map(b => (
          <div key={b.id} className="flex items-center gap-4">
            <span className="w-1/2 text-sm">
              {b.servicio} - {b.titular}
            </span>
            <input
              type="number"
              placeholder="Monto final"
              value={montosFinales[b.id] || ''}
              onChange={(e) => handleMontoFinalChange(b.id, e.target.value)}
              className="w-1/2 p-2 border border-gray-300 rounded-xl"
            />
          </div>
        ))}

        <div>
          <label className="block text-gray-700 font-semibold mb-1">Premios Pagados</label>
          <input
            type="number"
            value={premiosPagados}
            onChange={(e) => setPremiosPagados(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-xl"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1">Bonos</label>
          <input
            type="number"
            value={bonos}
            onChange={(e) => setBonos(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-xl"
          />
        </div>
      </div>

      {/* Botón Cerrar Caja */}
      <div className="flex justify-end mt-8">
        <button
          onClick={handleCerrarCaja}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-2xl"
        >
          CERRAR CAJA
        </button>
      </div>

      {/* Modal de Retiros */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Registrar Retiro</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium">Desde</label>
              <select
                value={retiro.desde}
                onChange={(e) => setRetiro({ ...retiro, desde: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-xl"
              >
                <option value="">Seleccionar</option>
                {billeteras.map(b => (
                  <option
                    key={b.id}
                    value={b.id}
                    disabled={b.id === retiro.hasta}
                  >
                    {b.servicio} - {b.titular}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Hasta</label>
              <select
                value={retiro.hasta}
                onChange={(e) => setRetiro({ ...retiro, hasta: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-xl"
              >
                <option value="">Seleccionar</option>
                {billeteras.map(b => (
                  <option
                    key={b.id}
                    value={b.id}
                    disabled={b.id === retiro.desde}
                  >
                    {b.servicio} - {b.titular}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium">Monto</label>
              <input
                type="number"
                value={retiro.monto}
                onChange={(e) => setRetiro({ ...retiro, monto: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalAbierto(false)}
                className="px-4 py-2 rounded-2xl border border-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={agregarRetiro}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-2xl"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CierreDeCaja;
