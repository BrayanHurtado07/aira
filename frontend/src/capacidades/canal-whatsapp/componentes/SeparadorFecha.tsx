// Separador de día dentro del hilo de chat ("Hoy", "Ayer", "23 ene 2026").
export function SeparadorFecha({ etiqueta }: { etiqueta: string }) {
  return (
    <div className="wa-separador-fecha" role="separator" aria-label={etiqueta}>
      <span>{etiqueta}</span>
    </div>
  )
}
