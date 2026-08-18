import Spinner from './Spinner';

export default function Button({
  texto,
  color = "azul",
  tamano,
  posicion,
  mostrarBorde = false,
  colorBorde,
  colorTexto,
  sombra = "",
  tipo = "button",
  type,
  disabled = false,
  cargando = false,
  onClick,
  paddingY,
  paddingX,
  fontSize,
  children,
  id,
  className = ""
}) {

  const buttonColor = {
    "azul": "btn-primary",
    "gris": "btn-secondary",
    "verde": "btn-success",
    "rojo": "btn-danger",
    "amarillo": "btn-warning",
    "celeste": "btn-info",
    "blanco": "btn-light",
    "negro": "btn-dark"
  }[color] || "btn-primary";

  const coloresTexto = {
    "azul": "text-primary",
    "gris": "text-secondary",
    "verde": "text-success",
    "rojo": "text-danger",
    "amarillo": "text-warning",
    "celeste": "text-info",
    "blanco": "text-light",
    "negro": "text-dark"
  }[colorTexto] || "";

  const buttonSize = {
    "grande": "btn-lg",
    "pequeño": "btn-sm"
  }[tamano] || "";

  const buttonPosition = {
    "izquierda": "",
    "centro": "mx-auto d-block",
    "derecha": "ms-auto"
  }[posicion] || "";

  const borderColor = {
    "azul": "border-primary",
    "gris": "border-secondary",
    "verde": "border-success",
    "rojo": "border-danger",
    "amarillo": "border-warning",
    "celeste": "border-info",
    "blanco": "border-light",
    "negro": "border-dark"
  }[colorBorde];

  const shadowType = {
    "pequeña": "shadow-sm",
    "normal": "shadow",
    "grande": "shadow-lg"
  }[sombra] || "";

  const borderClass = mostrarBorde ? `border ${borderColor}` : "";

  const customStyles = {
    ...(paddingY && { "--bs-btn-padding-y": paddingY }),
    ...(paddingX && { "--bs-btn-padding-x": paddingX }),
    ...(fontSize && { "--bs-btn-font-size": fontSize })
  };

  const htmlType = type || tipo || "button";

  return (
    <button
      id={id}
      type={htmlType}
      className={`btn ${buttonColor} ${buttonSize} ${buttonPosition} ${borderClass} ${shadowType} ${coloresTexto} ${className}`.trim()}
      style={customStyles}
      onClick={onClick}
      disabled={disabled || cargando}
    >
      {cargando ? (
        <>
          <Spinner size="sm" color={color === 'blanco' ? 'dark' : 'light'} className="me-2" />
          {texto || children || 'Cargando...'}
        </>
      ) : (
        children || texto
      )}
    </button>
  );
}
