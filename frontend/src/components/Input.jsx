export default function Input({
    tipo = "text",
    label,
    placeholder = "",
    value,
    onChange,
    name,
    min,
    max
}) {
    return (
        <div>
            {label && <label className="form-label">{label}</label>}
            <input
                type={tipo}
                name={name}
                className="form-control"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                min={min}
                max={max}
            />
        </div>
    );
}
