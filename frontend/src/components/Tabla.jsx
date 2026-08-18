export default function Tabla({
    columnas = [],
    children
}) {
    return (
        <div className="table-responsive">
            <table className="table table-striped table-hover table-bordered table-sm align-middle mb-0 text-dark">
                <thead className="table-dark text-white text-center">
                    <tr>
                        {columnas.map((col, index) => (
                            <th key={index} className="text-center align-middle">{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-dark" style={{ color: '#000000' }}>
                    {children}
                </tbody>
            </table>
        </div>
    );
}
