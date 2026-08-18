export default function Spinner({
  type = 'border',   // 'border' o 'grow'
  color = 'primary', // primary, secondary, success, danger, etc.
  size = '',         // 'sm' para pequeño, vacío para normal
  className = '',    // para márgenes o alineación extra (m-5, float-end)
  as = 'span'
}) {
  const Component = as;

  const spinnerClass = `spinner-${type}`;
  const sizeClass = size ? `spinner-${type}-${size}` : '';
  const colorClass = color ? `text-${color}` : '';

  return (
    <Component
      className={`${spinnerClass} ${sizeClass} ${colorClass} ${className}`}
      role="status"
      aria-hidden={as === 'span' ? "true" : "false"}
    >
    </Component>
  );
}
