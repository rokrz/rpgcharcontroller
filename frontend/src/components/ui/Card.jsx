function Card({ active = false, children, className = "", ...rest }) {
  const base = "bg-parchment-deep border border-parchment-edge rounded-sheet shadow-page";
  const activeCls = active ? "ring-2 ring-gold bg-gold-wash" : "";
  return (
    <div className={`${base} ${activeCls} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

function Header({ children, className = "" }) {
  return (
    <div className={`px-4 pt-4 pb-2 flex items-start justify-between gap-3 ${className}`.trim()}>
      {children}
    </div>
  );
}

function Body({ children, className = "" }) {
  return <div className={`px-4 py-2 ${className}`.trim()}>{children}</div>;
}

function Footer({ children, className = "" }) {
  return (
    <div className={`px-4 pt-2 pb-4 border-t border-parchment-edge/60 mt-2 ${className}`.trim()}>
      {children}
    </div>
  );
}

Card.Header = Header;
Card.Body = Body;
Card.Footer = Footer;

export default Card;
