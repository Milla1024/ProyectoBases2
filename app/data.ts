export type Connection = {
  name: "Oracle" | "MySQL";
  status: "Connected" | "Disconnected" | "Error";
};

export type Metric = {
  title: string;
  value: string;
};

export type ReplicationEvent = {
  id: string;
  timestamp: string;
  status: "Success" | "Failed" | "In Progress";
  details: string;
};

export type SyncError = {
  id: string;
  recordId: string;
  table: string;
  errorMessage: string;
  timestamp: string;
};

export const connections: Connection[] = [
  { name: "Oracle", status: "Connected" },
  { name: "MySQL", status: "Connected" },
];

export const metrics: Metric[] = [
  { title: "Pending Records", value: "15" },
  { title: "Success Rate", value: "98.2%" },
];

export const tablesForSync: string[] = [
  "customers",
  "orders",
  "products",
  "employees",
  "suppliers",
  "invoices",
  "payments",
  "shipments",
];

export const activityLog: ReplicationEvent[] = [
  { id: "EVT789012", timestamp: "2023-10-27 10:05:00", status: "Success", details: "Replicated table: products" },
  { id: "EVT789011", timestamp: "2023-10-27 10:04:30", status: "Success", details: "Replicated table: orders" },
  { id: "EVT789010", timestamp: "2023-10-27 10:02:15", status: "Failed", details: "Connection lost to MySQL" },
  { id: "EVT789009", timestamp: "2023-10-27 09:55:00", status: "Success", details: "Replicated table: customers" },
  { id: "EVT789008", timestamp: "2023-10-27 09:50:00", status: "Success", details: "Replicated table: employees" },
  { id: "EVT789007", timestamp: "2023-10-27 09:45:00", status: "In Progress", details: "Replicating table: suppliers" },
  { id: "EVT789006", timestamp: "2023-10-27 09:40:00", status: "Success", details: "Replicated table: invoices" },
  { id: "EVT789005", timestamp: "2023-10-27 09:35:00", status: "Success", details: "Replicated table: payments" },
  { id: "EVT789004", timestamp: "2023-10-27 09:30:00", status: "Success", details: "Replicated table: shipments" },
  { id: "EVT789003", timestamp: "2023-10-27 09:25:00", status: "Success", details: "Replication cycle completed" },
];

export const errorLog: SyncError[] = [
  { id: "ERR501", recordId: "CUST-0123", table: "customers", errorMessage: "Duplicate primary key", timestamp: "2023-10-27 09:55:00" },
  { id: "ERR502", recordId: "PROD-4567", table: "products", errorMessage: "Data type mismatch on column: price", timestamp: "2023-10-27 10:05:00" },
  { id: "ERR503", recordId: "ORD-8910", table: "orders", errorMessage: "Foreign key constraint fails", timestamp: "2023-10-27 10:04:30" },
  { id: "ERR504", recordId: "CUST-0124", table: "customers", errorMessage: "Invalid email format", timestamp: "2023-10-27 09:55:00" },
];

export const replicationTimeData = [
  { time: "10:00", replicationTime: 2.1 },
  { time: "11:00", replicationTime: 2.3 },
  { time: "12:00", replicationTime: 2.0 },
  { time: "13:00", replicationTime: 2.8 },
  { time: "14:00", replicationTime: 2.5 },
  { time: "15:00", replicationTime: 3.1 },
  { time: "16:00", replicationTime: 2.4 },
];
