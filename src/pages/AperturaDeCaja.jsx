import React, { useEffect, useState } from 'react';

const AperturaDeCaja = ({ onConfirmar }) => {
    const [empleados, setEmpleados] = useState([]);
    const [billeteras, setBilleteras] = useState([]);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');
    const [turnoSeleccionado, setTurnoSeleccionado] = useState('');
    const [billeterasSeleccionadas, setBilleterasSeleccionadas] = useState([]);
    const [montos, setMontos] = useState({});
    const [titular, setTitular] = useState([]);
    useEffect(() => {
        fetch('https://gestoradmin.store/index.php?recurso=empleados')
            .then(res => res.json())
            .then(data => setEmpleados(data))
            .catch(err => console.error(err));

        fetch('https://gestoradmin.store/index.php?recurso=billeteras')
            .then(res => res.json())
            .then(data => setBilleteras(data))
            .catch(err => console.error(err));
    }, []);

    const handleBilleteraChange = (id) => {
        if (billeterasSeleccionadas.includes(id)) {
            setBilleterasSeleccionadas(billeterasSeleccionadas.filter(bid => bid !== id));
            const updatedMontos = { ...montos };
            delete updatedMontos[id];
            setMontos(updatedMontos);
        } else {
            setBilleterasSeleccionadas([...billeterasSeleccionadas, id]);
        }
    };

    const handleMontoChange = (id, value) => {
        setMontos({ ...montos, [id]: value });
    };

    const handleSubmit = () => {
        if (!empleadoSeleccionado || !turnoSeleccionado || billeterasSeleccionadas.length === 0) {
            alert('Por favor completa todos los campos');
            return;
        }

        const data = {
            empleadoId: empleadoSeleccionado,
            turno: turnoSeleccionado,
            billeteras: billeterasSeleccionadas.map(id => ({
                id,
                monto: parseFloat(montos[id]) || 0,
                titular: titular[id],
            }))
        };

        console.log('Apertura enviada:', data);

        // Aquí activamos el componente de cierre
        if (onConfirmar) {
            onConfirmar(data);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex flex-col">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col gap-4 w-full md:w-2/3">
                    {/* Empleado Dropdown */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Empleado</label>
                        <select
                            value={empleadoSeleccionado}
                            onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-xl"
                        >
                            <option value="">Seleccione un empleado</option>
                            {empleados.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Turno Dropdown */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Turno</label>
                        <select
                            value={turnoSeleccionado}
                            onChange={(e) => setTurnoSeleccionado(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-xl"
                        >
                            <option value="">Seleccione un turno</option>
                            <option value="Mañana">Mañana</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noche">Noche</option>
                        </select>
                    </div>

                    {/* Billeteras Dropdown Múltiple */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Billeteras</label>
                        <div className="grid grid-cols-1 gap-2">
                            {billeteras.map(b => (
                                <div key={b.id} className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id={`b-${b.id}`}
                                        checked={billeterasSeleccionadas.includes(b.id)}
                                        onChange={() => handleBilleteraChange(b.id)}
                                        className="accent-green-600"
                                    />
                                    <label htmlFor={`b-${b.id}`} className="text-sm">
                                        {b.servicio} - {b.titular} - CBU: {b.cbu}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Montos por billetera seleccionada */}
                    {billeterasSeleccionadas.length > 0 && (
                        <div className="mt-4">
                            <h3 className="font-semibold text-gray-700 mb-2">Montos Iniciales</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {billeterasSeleccionadas.map(id => {
                                    const billetera = billeteras.find(b => b.id === id);
                                    return (
                                        <div key={id} className="flex items-center gap-3">
                                            <span className="w-1/2 text-sm">
                                                {billetera.servicio} - {billetera.titular}
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="Monto inicial"
                                                value={montos[id] || ''}
                                                onChange={(e) => handleMontoChange(id, e.target.value)}
                                                className="w-1/2 p-2 border border-gray-300 rounded-xl"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Botón de Confirmar */}
                <div className="w-full md:w-1/3 flex justify-end items-end">
                    <button
                        onClick={handleSubmit}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-2xl w-full md:w-auto"
                    >
                        Confirmar Apertura
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AperturaDeCaja;
