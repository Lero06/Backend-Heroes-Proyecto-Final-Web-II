export default function Titulo({
    tipografia = "h1",
    texto,
    alineado = "izquierda",
    color_text = "negro"
}) {
    const Tag = tipografia;

    const alineacion = {
        "izquierda": "text-start",
        "centro": "text-center",
        "derecha": "text-end"
    }[alineado];

    const colorStyle = {
        "negro": "black",
        "blanco": "white",
        "azul": "#0d6efd",
        "gris": "#6c757d",
        "verde": "#198754",
        "rojo": "#dc3545",
        "amarillo": "#ffc107",
        "celeste": "#0dcaf0"
    }[color_text] || color_text || "black";

    return (
        <Tag className={`${tipografia} ${alineacion}`} style={{ color: colorStyle }}>
            {texto}
        </Tag>
    );
}
