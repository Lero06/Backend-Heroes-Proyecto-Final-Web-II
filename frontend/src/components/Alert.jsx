import Button from './Buttons';
import Texto from './Texto';
import Titulo from './Titulo';

export default function Alert({
  titulo,
  texto,
  color,
  fondoBlanco = false,
  tamano_letra = "5",
  dismissible = false,
  onDismiss,
  acciones = []
}) {

  const alertColor = {
    "azul": "alert-primary",
    "gris": "alert-secondary",
    "verde": "alert-success",
    "rojo": "alert-danger",
    "amarillo": "alert-warning",
    "celeste": "alert-info",
    "blanco": "alert-light",
    "negro": "alert-dark"
  }[color] || "alert-primary";

  const borderColor = {
    "azul": "border-primary",
    "gris": "border-secondary",
    "verde": "border-success",
    "rojo": "border-danger",
    "amarillo": "border-warning",
    "celeste": "border-info",
    "blanco": "border-light",
    "negro": "border-dark"
  }[color] || "border-secondary";

  const bgAndBorder = fondoBlanco ? `bg-white border border-2 ${borderColor}` : alertColor;

  return (
    <div className={`alert ${bgAndBorder} py-2 px-3 ${dismissible ? "alert-dismissible fade show" : ""}`} role="alert">
      {titulo && <Titulo tipografia="h5" texto={titulo} color_text="black" alineado="center" />}
      {texto && (
        <Texto
          texto={texto}
          color_text="black"
          tamano_letra={tamano_letra}
          alineado="center"
        />
      )}

      {dismissible && (
        <Button texto="×" color={color} tamano="pequeño" onClick={onDismiss} />
      )}

      {acciones && acciones.length > 0 && (
        <div className="row g-2 mt-2">
          {acciones.map((accion, index) => (
            <div key={index} className="col-md-6">
              <Button
                color={accion.color || 'gris'}
                tamano="grande"
                onClick={accion.onClick}
                children={accion.label}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
