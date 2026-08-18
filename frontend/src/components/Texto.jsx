export default function Texto({
    texto,
    alineado="center",
    color_text="white",
    tamano_letra="16px"
 })
{

    const alineacion = {
        "left": "text-start",
        "center": "text-center",
        "right": "text-end"
    }[alineado] || "text-center";

    const fontSize = {
        "1": "fs-1",
        "2": "fs-2",
        "3": "fs-3",
        "4": "fs-4",
        "5": "fs-5",
        "6": "fs-6"
    }[tamano_letra] || "";

    return (
        <p className={`${alineacion} ${fontSize} mb-0`} style={{color: color_text}}>
            {texto}
        </p>
    );
}
