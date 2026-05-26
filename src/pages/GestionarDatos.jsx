import React, { useEffect, useState } from 'react';
import EmpleadoForm from './sinoca/EmpleadoForm';
import BilleteraForm from './sinoca/BilleteraForm';
import EmpleadoList from './sinoca/EmpleadoList';
import BilleteraList from './sinoca/BilleteraList';

const API = 'https://gestoradmin.store/index.php';

export default function GestionarDatos() {
  const [empleados, setEmpleados] = useState([]);
  const [billeteras, setBilleteras] = useState([]);
  const [mensaje, setMensaje] = useState('');

  const fetchEmpleados = async () => {
    const res = await fetch(`${API}?recurso=empleados`);
    const data = await res.json();
    setEmpleados(data);
  };

  const fetchBilleteras = async () => {
    const res = await fetch(`${API}?recurso=billeteras`);
    const data = await res.json();
    setBilleteras(data);
  };

  const crearEmpleado = async (nuevo) => {
    const res = await fetch(`${API}?recurso=empleados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevo),
    });
    const data = await res.json();
    setMensaje(data.message);
    fetchEmpleados();
  };

  const actualizarEmpleado = async (empleado) => {
    await fetch(`${API}?recurso=empleados&id=${empleado.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(empleado),
    });
    fetchEmpleados();
  };

  const eliminarEmpleado = async (id) => {
    await fetch(`${API}?recurso=empleados&id=${id}`, { method: 'DELETE' });
    fetchEmpleados();
  };

  const crearBilletera = async (nueva) => {
    const res = await fetch(`${API}?recurso=billeteras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nueva),
    });
    const data = await res.json();
    setMensaje(data.message);
    fetchBilleteras();
  };

  const actualizarBilletera = async (billetera) => {
    await fetch(`${API}?recurso=billeteras&id=${billetera.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billetera),
    });
    fetchBilleteras();
  };

  const eliminarBilletera = async (id) => {
    await fetch(`${API}?recurso=billeteras&id=${id}`, { method: 'DELETE' });
    fetchBilleteras();
  };

  useEffect(() => {
    fetchEmpleados();
    fetchBilleteras();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl space-y-10">
        <EmpleadoForm onCrear={crearEmpleado} />
        <EmpleadoList empleados={empleados} onUpdate={actualizarEmpleado} onDelete={eliminarEmpleado} />
        <BilleteraForm onCrear={crearBilletera} />
        <BilleteraList billeteras={billeteras} onUpdate={actualizarBilletera} onDelete={eliminarBilletera} />
        {mensaje && (
          <div className="text-center text-sm text-green-700 bg-green-100 border border-green-300 rounded-xl p-3">
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
}
