export class ErrorHTTP extends Error {
  constructor(
    public readonly codigo: string,
    public readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorHTTP';
  }
}

export class ErrorNoAutorizado extends ErrorHTTP {
  constructor() {
    super('no_autorizado', 401, 'Sesión no válida o expirada');
    this.name = 'ErrorNoAutorizado';
  }
}

export class ErrorSinConexion extends Error {
  constructor() {
    super('Sin conexión con el servidor');
    this.name = 'ErrorSinConexion';
  }
}

export function esErrorDominio(error: unknown, codigo: string): boolean {
  return error instanceof ErrorHTTP && error.codigo === codigo;
}
