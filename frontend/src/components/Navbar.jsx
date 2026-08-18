export default function Navbar( { 
    
    clases = "lg", 
    texto = "Navbar",
    navList = false,
    links = [],
    text_Search = "Search",
    color = "azul",
    inputSearch = false,
    reponsive_navbar = true,

    brandContent,
    buttonContent
} 
){
    
    //Controla como se expande o se comprime en forma hamburguesa.
    const navbar_expand = {
        "sm": "navbar-expand-sm",
        "md": "navbar-expand-md",
        "lg": "navbar-expand-lg",
        "xl": "navbar-expand-xl",
        "xxl": "navbar-expand-xxl"
    }[clases] || "navbar-expand-lg";

    const colorBg = {
        "azul": "bg-primary navbar-dark",
        "gris": "bg-secondary navbar-dark",
        "verde": "bg-success navbar-dark",
        "rojo": "bg-danger navbar-dark",
        "amarillo": "bg-warning",
        "celeste": "bg-info",
        "blanco": "bg-white",
        "negro": "bg-dark navbar-dark"
    }[color];

    const navListClass = navList 
        ? "me-auto mb-2 mb-lg-0"
        : "";

    const navClasses = `navbar ${navbar_expand} ${colorBg || ''} shadow-sm mb-4`.trim();
    const navStyles = !colorBg && color ? { backgroundColor: color } : {};

    return(
        <nav className={navClasses} style={navStyles}> 
            <div className="container-fluid px-4">
                
                {texto && <a className="navbar-brand fw-semibold text-white" href="#">
                    {brandContent}
                    {texto}
                </a>}

                {reponsive_navbar && <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>}

                <div className="collapse navbar-collapse" id="navbarSupportedContent">

                    {links && <ul className={`navbar-nav ${navListClass}`}>
                        {links.map((link, index ) => (
                            <li className="nav-item" key={index}>
                                <a className={`nav-link ${link.active ? 'active fw-semibold' : ''}`} href={link.url}>
                                    {link.texto}
                                </a>
                            </li>
                        ))}
                    </ul>}
                    
                    {inputSearch  && <form className="d-flex" role="search">
                        <input className="form-control me-2" type="search" placeholder="Buscar" aria-label="Search"/>
                    </form>}
                    {buttonContent}
                </div>
            </div>
        </nav>
    );
}
