import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const ANCHOS = {
  sm: '24rem',
  md: '32rem',
  lg: '48rem',
  xl: '64rem',
};

interface PropiedadesModal {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
  pie?: React.ReactNode;
  ancho?: keyof typeof ANCHOS;
  sinCerrarAlFondo?: boolean;
}

export function Modal({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  children,
  pie,
  ancho = 'md',
  sinCerrarAlFondo = false,
}: PropiedadesModal) {
  return (
    <AnimatePresence>
      {abierto && (
        <div className="modal-overlay">
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={sinCerrarAlFondo ? undefined : alCerrar}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            className="modal-panel"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{ maxWidth: ANCHOS[ancho] }}
          >
            {/* Cabecera */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 'var(--espacio-md)',
                padding: 'var(--espacio-lg)',
                borderBottom: '1px solid var(--color-borde)',
                flexShrink: 0,
              }}
            >
              <div>
                <h2 style={{ fontSize: 'var(--tamano-lg)', fontWeight: 600, color: 'var(--color-texto)', margin: 0 }}>
                  {titulo}
                </h2>
                {descripcion && (
                  <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)', marginTop: '0.25rem' }}>
                    {descripcion}
                  </p>
                )}
              </div>
              <button
                onClick={alCerrar}
                className="btn-aira"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2rem',
                  height: '2rem',
                  borderRadius: 'var(--radio-md)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--color-texto-suave)',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            {/* Cuerpo */}
            <div
              style={{
                padding: 'var(--espacio-lg)',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {children}
            </div>

            {/* Pie */}
            {pie && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 'var(--espacio-sm)',
                  padding: 'var(--espacio-md) var(--espacio-lg)',
                  borderTop: '1px solid var(--color-borde)',
                  backgroundColor: 'var(--color-superficie-2)',
                  flexShrink: 0,
                }}
              >
                {pie}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
