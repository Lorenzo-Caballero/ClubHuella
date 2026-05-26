import { useState } from "react";
import Checkout from "./Producto";
import Envios from "./Envio";

export default function App() {
  const [step, setStep] = useState("producto");

  return (
    <>
      {step === "producto" && (
        <Checkout onContinuar={() => setStep("envios")} />
      )}

      {step === "envios" && (
        <Envios onBack={() => setStep("producto")} />
      )}
    </>
  );
}