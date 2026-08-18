import Titulo from './Titulo';
import Texto from './Texto';

export default function Card({
    color_background = "#ffffff",
    color_texto = "negro",
    alineado_card = "",
    titulo,
    header,
    footer,
    card_width = "18rem",
    responsivo = false,
    texto_alineado = "left",

    chil_top,
    chil_body,
    chil_bottom
}) {

    const color_text = {
      "azul": "text-primary",
      "gris": "text-secondary",
      "verde": "text-success",
      "rojo": "text-danger",
      "amarillo": "text-warning",
      "celeste": "text-info",
      "blanco": "text-light",
      "negro": "text-dark",
      "blue": "text-primary",
      "grey": "text-secondary",
      "green": "text-success",
      "red": "text-danger",
      "yellow": "text-warning",
      "skyblue": "text-info",
      "white": "text-light",
      "black": "text-dark"
    }[color_texto] || "";

    const alineacion_card = {
      "left": "me-auto",
      "center": "mx-auto",
      "right": "ms-auto",
      "izquierda": "me-auto",
      "centro": "mx-auto",
      "derecha": "ms-auto"
    }[alineado_card] || "";

    const alineado_text = {
      "left": "text-start",
      "center": "text-center",
      "right": "text-end",
      "izquierda": "text-start",
      "centro": "text-center",
      "derecha": "text-end"
    }[texto_alineado] || "";

    const card_responsive = responsivo ? "w-100" : "";

    return (
        <div
            className={`card ${color_text} ${alineacion_card} ${alineado_text} shadow rounded ${card_responsive}`.trim()}
            style={{ width: card_width, ...(color_background ? { backgroundColor: color_background } : {}) }}
        >
            {titulo ? (
                <div className="card-header fw-semibold">
                    <Titulo tipografia="h5" texto={titulo} color_text="black" alineado={texto_alineado} />
                </div>
            ) : header ? (
                <div className="card-header fw-semibold">
                    {typeof header === 'string' ? <Texto texto={header} color_text="black" alineado={texto_alineado} /> : header}
                </div>
            ) : null}

            {chil_top}

            <div className="card-body">
                {chil_body}
            </div>

            {chil_bottom}

            {footer && (
                <div className="card-footer">
                    {typeof footer === 'string' ? <Texto texto={footer} color_text="black" alineado={texto_alineado} /> : footer}
                </div>
            )}
        </div>
    );
}
