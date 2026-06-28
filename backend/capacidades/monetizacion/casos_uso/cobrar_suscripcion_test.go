package casos_uso

import (
	"context"
	"errors"
	"testing"

	"aira/capacidades/monetizacion/pagos"
	dominioErr "aira/compartido/errores"
	"aira/plataforma/gobierno/auditoria"
)

// ── Dobles de prueba ────────────────────────────────────────────────────────────

type auditoriaNula struct{}

func (auditoriaNula) Registrar(_ context.Context, _ auditoria.Evento) {}

type repoPagoFalso struct {
	datos      pagos.DatosCobro
	errDatos   error
	registrado *pagos.SolicitudRegistrarPago
}

func (r *repoPagoFalso) ObtenerDatosCobro(_ context.Context, _ string) (pagos.DatosCobro, error) {
	return r.datos, r.errDatos
}
func (r *repoPagoFalso) Registrar(_ context.Context, s pagos.SolicitudRegistrarPago) (pagos.Pago, error) {
	r.registrado = &s
	return pagos.Pago{ID: "pago-1"}, nil
}

type pasarelaFalsa struct {
	estado  pagos.EstadoPago
	cobrada *pagos.SolicitudCobro
}

func (pasarelaFalsa) Nombre() string { return "FALSA" }
func (p *pasarelaFalsa) Cobrar(_ context.Context, s pagos.SolicitudCobro) (pagos.ResultadoCobro, error) {
	p.cobrada = &s
	return pagos.ResultadoCobro{Estado: p.estado, ReferenciaPasarela: "REF-1"}, nil
}

func datosActiva() pagos.DatosCobro {
	return pagos.DatosCobro{
		SuscripcionID:     "susc-1",
		EmpresaID:         "emp-1",
		Monto:             99.90,
		Moneda:            "PEN",
		EstadoSuscripcion: "ACTIVA",
	}
}

// ── Tests ───────────────────────────────────────────────────────────────────────

func TestCobrarSuscripcion_Aprobado(t *testing.T) {
	repo := &repoPagoFalso{datos: datosActiva()}
	pas := &pasarelaFalsa{estado: pagos.EstadoPagoAprobado}
	cu := NuevoCasoUsoCobrarSuscripcion(repo, pas, auditoriaNula{})

	resp, err := cu.Ejecutar(context.Background(), SolicitudCobrarSuscripcion{
		SuscripcionID: "susc-1", EmpresaID: "emp-1", CobradoPor: "u-1",
	})
	if err != nil {
		t.Fatalf("error inesperado: %v", err)
	}
	if resp.Estado != "APROBADO" || resp.PagoID != "pago-1" || resp.Monto != 99.90 || resp.Moneda != "PEN" {
		t.Errorf("respuesta inesperada: %+v", resp)
	}
	if pas.cobrada == nil || pas.cobrada.Monto != 99.90 {
		t.Errorf("la pasarela no recibió el monto del plan: %+v", pas.cobrada)
	}
	if repo.registrado == nil || repo.registrado.Estado != pagos.EstadoPagoAprobado || repo.registrado.Pasarela != "FALSA" {
		t.Errorf("el pago no se registró correctamente: %+v", repo.registrado)
	}
}

func TestCobrarSuscripcion_OtraEmpresa(t *testing.T) {
	repo := &repoPagoFalso{datos: datosActiva()}
	cu := NuevoCasoUsoCobrarSuscripcion(repo, &pasarelaFalsa{estado: pagos.EstadoPagoAprobado}, auditoriaNula{})

	_, err := cu.Ejecutar(context.Background(), SolicitudCobrarSuscripcion{
		SuscripcionID: "susc-1", EmpresaID: "OTRA", CobradoPor: "u-1",
	})
	if !errors.Is(err, dominioErr.ErrSuscripcionNoExiste) {
		t.Errorf("esperaba ErrSuscripcionNoExiste; got %v", err)
	}
	if repo.registrado != nil {
		t.Error("no debía registrar pago de otra empresa")
	}
}

func TestCobrarSuscripcion_Cancelada(t *testing.T) {
	datos := datosActiva()
	datos.EstadoSuscripcion = "CANCELADA"
	repo := &repoPagoFalso{datos: datos}
	cu := NuevoCasoUsoCobrarSuscripcion(repo, &pasarelaFalsa{estado: pagos.EstadoPagoAprobado}, auditoriaNula{})

	_, err := cu.Ejecutar(context.Background(), SolicitudCobrarSuscripcion{
		SuscripcionID: "susc-1", EmpresaID: "emp-1", CobradoPor: "u-1",
	})
	if !errors.Is(err, dominioErr.ErrSuscripcionCancelada) {
		t.Errorf("esperaba ErrSuscripcionCancelada; got %v", err)
	}
}
