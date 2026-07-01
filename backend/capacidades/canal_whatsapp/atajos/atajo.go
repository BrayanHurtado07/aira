package atajos

import "context"

// Atajo es una respuesta rápida que el operador inserta con 1 toque en el chat.
type Atajo struct {
	ID        string `json:"id"`
	EmpresaID string `json:"empresa_id"`
	Titulo    string `json:"titulo"`
	Contenido string `json:"contenido"`
	Orden     int    `json:"orden"`
}

// RepositorioAtajo persiste y consulta los atajos de respuesta de una empresa.
type RepositorioAtajo interface {
	Crear(ctx context.Context, a Atajo, creadoPor string) (string, error)
	ListarPorEmpresa(ctx context.Context, empresaID string) ([]Atajo, error)
	Eliminar(ctx context.Context, atajoID string) error
}
