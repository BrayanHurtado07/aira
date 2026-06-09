import { useState, useCallback } from 'react';
import { BarraLateralCaparazon } from './BarraLateralCaparazon';
import { CabeceraCaparazon } from './CabeceraCaparazon';
import { EspacioTrabajoCaparazon } from './EspacioTrabajoCaparazon';

const CLAVE_COLAPSO = 'aira:sidebar-colapsada';

export function DisposicionCaparazon() {
  const [barraAbierta, setBarraAbierta] = useState(false);
  const [colapsada, setColapsada] = useState(() => {
    try { return localStorage.getItem(CLAVE_COLAPSO) === '1'; }
    catch { return false; }
  });

  const abrirBarra  = useCallback(() => setBarraAbierta(true),  []);
  const cerrarBarra = useCallback(() => setBarraAbierta(false), []);

  const toggleColapso = useCallback(() => {
    setColapsada((prev) => {
      const siguiente = !prev;
      try { localStorage.setItem(CLAVE_COLAPSO, siguiente ? '1' : '0'); }
      catch { /* ignorar */ }
      return siguiente;
    });
  }, []);

  return (
    <div className="disposicion-caparazon">
      {barraAbierta && (
        <div
          className="barra-lateral-overlay"
          onClick={cerrarBarra}
          aria-hidden="true"
        />
      )}

      <BarraLateralCaparazon
        abierta={barraAbierta}
        alCerrar={cerrarBarra}
        colapsada={colapsada}
        alToggleColapso={toggleColapso}
      />

      {/* colapsada--colapsada sólo se aplica en desktop vía CSS */}
      <div className={['columna-caparazon-derecha', colapsada ? 'columna-caparazon-derecha--colapsada' : ''].filter(Boolean).join(' ')}>
        <CabeceraCaparazon alAbrirBarra={abrirBarra} />
        <EspacioTrabajoCaparazon />
      </div>
    </div>
  );
}
