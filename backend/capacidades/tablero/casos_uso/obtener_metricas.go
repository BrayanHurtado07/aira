package casos_uso

import (
	"context"
	"fmt"
	"time"

	"aira/capacidades/tablero"
)

type CasoUsoObtenerMetricasTablero struct {
	repositorio tablero.RepositorioTablero
}

func NuevoCasoUsoObtenerMetricasTablero(repo tablero.RepositorioTablero) *CasoUsoObtenerMetricasTablero {
	return &CasoUsoObtenerMetricasTablero{repositorio: repo}
}

type SolicitudObtenerMetricas struct {
	EmpresaID   string
	FechaInicio string
	FechaFin    string
	SucursalID  string
}

func (c *CasoUsoObtenerMetricasTablero) Ejecutar(
	ctx context.Context,
	s SolicitudObtenerMetricas,
) (tablero.MetricasTablero, error) {
	inicio, fin := resolverPeriodo(s.FechaInicio, s.FechaFin)

	return c.repositorio.ObtenerMetricas(ctx, tablero.SolicitudMetricasTablero{
		EmpresaID:   s.EmpresaID,
		FechaInicio: inicio,
		FechaFin:    fin,
		SucursalID:  s.SucursalID,
	})
}

// resolverPeriodo devuelve el rango validado o el mes actual si está vacío.
func resolverPeriodo(inicio, fin string) (string, string) {
	ahora := time.Now().UTC()
	layoutEntrada := "2006-01-02"

	if inicio == "" || fin == "" {
		primerDia := time.Date(ahora.Year(), ahora.Month(), 1, 0, 0, 0, 0, time.UTC)
		ultimoDia := primerDia.AddDate(0, 1, -1)
		return primerDia.Format(layoutEntrada), ultimoDia.Format(layoutEntrada)
	}

	// Validar que las fechas sean parseables; si no, usar el mes actual
	if _, err := time.Parse(layoutEntrada, inicio); err != nil {
		inicio = fmt.Sprintf("%d-%02d-01", ahora.Year(), ahora.Month())
	}
	if _, err := time.Parse(layoutEntrada, fin); err != nil {
		t := time.Date(ahora.Year(), ahora.Month()+1, 0, 0, 0, 0, 0, time.UTC)
		fin = t.Format(layoutEntrada)
	}

	return inicio, fin
}
