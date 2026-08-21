export type EstadoPedido =
  | "BORRADOR"
  | "CONFIRMADO"
  | "ENTREGADO"
  | "CANCELADO";

export interface Cliente {
  id: number;
  nombre: string;
  email: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Articulo {
  id: number;
  codigo: string;
  nombre: string;
  precioUnitario: string;
  stock: number;
}

export interface LineaPedido {
  id: number;
  articuloId: number;
  cantidad: number;
  precioUnitario: string;
  descuento: string;
  importe: string;
  articulo: Articulo;
}

export interface Pedido {
  id: number;
  numeroPedido: string;
  clienteId: number;
  fechaPedido: string;
  fechaEntrega: string | null;
  estado: EstadoPedido;
  creadoEn: string;
  actualizadoEn: string;
  cliente: Cliente;
  lineas: LineaPedido[];
}

export interface SessionUser {
  sub: string;
  clienteId: number;
  email: string;
  nombre: string;
}
