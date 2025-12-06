export type Table = {
  id: string;
  name: string;
  oracleName: string;
};

export const tables: Table[] = [
    { id: 'tbl_clientes', name: 'tbl_clientes', oracleName: 'cliente_ventas'},
    { id: 'tiendas', name: 'tiendas', oracleName: 'sucursal_tienda' },
    { id: 'tbl_tecnicos', name: 'tbl_tecnicos', oracleName: 'empleado_tecnico' },
    { id: 'productos', name: 'productos', oracleName: 'catalogo_productos' },
    { id: 'inventario_tienda', name: 'inventario_tienda', oracleName: 'inventario_productos' },
    { id: 'servicio_ordenes', name: 'servicio_ordenes', oracleName: 'orden_servicio' },
    { id: 'tbl_facturas', name: 'tbl_facturas', oracleName: 'facturacion_clientes' },
    { id: 'componentes', name: 'componentes', oracleName: 'repuesto_taller' },
    { id: 'factura_componentes', name: 'factura_componentes', oracleName: 'detalle_factura_repuesto' },
    { id: 'movimientos_stock', name: 'movimientos_stock', oracleName: 'transferencia_stock' },
];

export type Log = {
  id: string;
  severity: 'High' | 'Medium' | 'Low';
  timestamp: Date;
  message: string;
};

export type Activity = {
  id: string;
  timestamp: Date;
  event: string;
};

export const replicationStats = {
  lastSync: new Date(Date.now() - 120000),
  pendingRecords: 15, // as percentage
  successPercentage: 99.8,
};
