export default function Select({
    label,
    options = [],
    value,
    onChange,
    texto = "Selecciona una opción",
    placeholderSeleccionable = true
}) {
    return (
        <div>
            {label && <label className="form-label">{label}</label>}
            <select
                className="form-select"
                value={value}
                onChange={onChange}
            >
                <option value="" disabled={!placeholderSeleccionable} hidden={!placeholderSeleccionable}>
                    {texto}
                </option>

                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.text}
                    </option>
                ))}
            </select>
        </div>
    );
}
