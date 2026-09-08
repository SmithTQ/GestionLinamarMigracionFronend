export interface ApiResponse<T> {
  codigo: number;
  mensaje: string;
  datos: T;
}
