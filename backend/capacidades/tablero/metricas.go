package tablero

type SolicitudMetricasTablero struct {
	EmpresaID   string
	FechaInicio string // "2026-05-01"
	FechaFin    string // "2026-05-31"
	SucursalID  string // vacío = todas las sedes
}

type MetricasTablero struct {
	Periodo              PeriodoMetricas    `json:"periodo"`
	Reservas             ResumenReservas    `json:"reservas"`
	Ingresos             ResumenIngresos    `json:"ingresos"`
	Clientes             ResumenClientes    `json:"clientes"`
	Hoy                  ResumenHoy         `json:"hoy"`
	Barberos             []MetricaBarbero   `json:"barberos"`
	ServiciosTop         []MetricaServicio  `json:"servicios_top"`
	OrigenReservas       OrigenReservas     `json:"origen_reservas"`
	Lealtad              MetricaLealtad     `json:"lealtad"`
	InventarioAlertas    []AlertaInventario `json:"inventario_alertas"`
	ComisionesPendientes float64            `json:"comisiones_pendientes"`
}

type PeriodoMetricas struct {
	Inicio string `json:"inicio"`
	Fin    string `json:"fin"`
}

type ResumenReservas struct {
	Total        int     `json:"total"`
	Completadas  int     `json:"completadas"`
	Confirmadas  int     `json:"confirmadas"`
	Pendientes   int     `json:"pendientes"`
	Canceladas   int     `json:"canceladas"`
	NoAsistio    int     `json:"no_asistio"`
	TasaCompletado float64 `json:"tasa_completado"` // 0.0–1.0
}

type ResumenIngresos struct {
	Total          float64 `json:"total"`
	VariacionPct   float64 `json:"variacion_pct"` // vs período anterior
}

type ResumenClientes struct {
	Total  int `json:"total"`
	Nuevos int `json:"nuevos"`
}

type ResumenHoy struct {
	ReservasTotal      int     `json:"reservas_total"`
	ReservasCompletadas int    `json:"reservas_completadas"`
	ReservasPendientes int     `json:"reservas_pendientes"`
	Ingresos           float64 `json:"ingresos"`
}

type MetricaBarbero struct {
	ID                  string  `json:"id_barbero"`
	Nombre              string  `json:"nombre"`
	Reservas            int     `json:"reservas"`
	Completadas         int     `json:"completadas"`
	NoAsistio           int     `json:"no_asistio"`
	Ingresos            float64 `json:"ingresos"`
	RatingPromedio      float64 `json:"rating_promedio"`
	ComisionPendiente   float64 `json:"comision_pendiente"`
}

type MetricaServicio struct {
	ID           string  `json:"id_servicio"`
	Nombre       string  `json:"nombre"`
	VecesVendido int     `json:"veces_vendido"`
	IngresoTotal float64 `json:"ingreso_total"`
}

type OrigenReservas struct {
	WhatsApp int `json:"whatsapp"`
	Web      int `json:"web"`
	Manual   int `json:"manual"`
}

type MetricaLealtad struct {
	TarjetasActivas    int `json:"tarjetas_activas"`
	SellosAcumulados   int `json:"sellos_acumulados"`
	ListosParaCanjear  int `json:"listos_para_canjear"`
	CanjesPeriodo      int `json:"canjes_periodo"`
}

type AlertaInventario struct {
	ID              string  `json:"id_producto"`
	Nombre          string  `json:"nombre"`
	CantidadActual  float64 `json:"cantidad_actual"`
	CantidadMinima  float64 `json:"cantidad_minima"`
}
