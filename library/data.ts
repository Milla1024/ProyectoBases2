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

export const errorLogs: Log[] = [
  { id: '1', severity: 'High', timestamp: new Date(Date.now() - 3600000), message: 'Conflict on table `tbl_users` row 42: Primary key violation.' },
  { id: '2', severity: 'Medium', timestamp: new Date(Date.now() - 7200000), message: 'MySQL connection timed out during `tbl_orders` sync.' },
  { id: '3', severity: 'Low', timestamp: new Date(Date.now() - 86400000), message: 'Skipped nullable column `last_login` in `tbl_users`.' },
  { id: '4', severity: 'High', timestamp: new Date(Date.now() - 172800000), message: 'Data type mismatch in `tbl_products`. Expected INT, got VARCHAR.' },
  { id: '5', severity: 'Medium', timestamp: new Date(Date.now() - 259200000), message: 'Character set conversion issue for `tbl_customers`.' },
];

export type Activity = {
  id: string;
  timestamp: Date;
  event: string;
};

export const activityLogs: Activity[] = [
  { id: '10', timestamp: new Date(Date.now() - 120000), event: 'Sync completed for `tbl_inventory`.' },
  { id: '9', timestamp: new Date(Date.now() - 300000), event: 'Sync started for `tbl_inventory`.' },
  { id: '8', timestamp: new Date(Date.now() - 600000), event: 'Sync completed for `tbl_customers`.' },
  { id: '7', timestamp: new Date(Date.now() - 900000), event: 'Sync started for `tbl_customers`.' },
  { id: '6', timestamp: new Date(Date.now() - 1200000), event: 'User triggered manual sync for all tables.' },
  { id: '5', timestamp: new Date(Date.now() - 1500000), event: 'Sync completed for `tbl_orders`.' },
  { id: '4', timestamp: new Date(Date.now() - 1800000), event: 'Sync started for `tbl_orders`.' },
  { id: '3', timestamp: new Date(Date.now() - 2100000), event: 'Sync completed for `tbl_products`.' },
  { id: '2', timestamp: new Date(Date.now() - 2400000), event: 'Sync started for `tbl_products`.' },
  { id: '1', timestamp: new Date(Date.now() - 2700000), event: 'Sync completed for `tbl_users`.' },
];

export const replicationStats = {
  lastSync: new Date(Date.now() - 120000),
  pendingRecords: 15, // as percentage
  successPercentage: 99.8,
};
