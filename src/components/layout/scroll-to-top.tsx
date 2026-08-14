import * as React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Restaura el scroll vertical al inicio (top: 0) cada vez que el usuario
 * cambia de página o ruta.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
