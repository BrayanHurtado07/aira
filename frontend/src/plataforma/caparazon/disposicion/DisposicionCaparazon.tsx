import { useState, useCallback } from 'react';
import { BarraLateralCaparazon } from './BarraLateralCaparazon';
import { CabeceraCaparazon } from './CabeceraCaparazon';
import { EspacioTrabajoCaparazon } from './EspacioTrabajoCaparazon';

export function DisposicionCaparazon() {
  const [barraAbierta, setBarraAbierta] = useState(false);

  const abrirBarra  = useCallback(() => setBarraAbierta(true),  []);
  const cerrarBarra = useCallback(() => setBarraAbierta(false), []);

  return (
    <div className="disposicion-caparazon">
      {/* Overlay semitransparente — solo visible en móvil cuando la barra está abierta */}
      {barraAbierta && (
        <div
          className="barra-lateral-overlay"
          onClick={cerrarBarra}
          aria-hidden="true"
        />
      )}

      <BarraLateralCaparazon abierta={barraAbierta} alCerrar={cerrarBarra} />

      <div className="columna-caparazon-derecha">
        <CabeceraCaparazon alAbrirBarra={abrirBarra} />
        <EspacioTrabajoCaparazon />
      </div>
    </div>
  );
}
