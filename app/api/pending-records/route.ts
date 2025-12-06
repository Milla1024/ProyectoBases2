import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import oracledb from 'oracledb';

async function getOracleConnection() {
  const user = process.env.ORACLE_USER;
  const password = process.env.ORACLE_PASSWORD;
  const connectString = process.env.ORACLE_CONNECT_STRING;
  if (!user || !password || !connectString) {
    throw new Error('Missing Oracle environment variables');
  }
  return await oracledb.getConnection({ user, password, connectString });
}

async function getMySQLConnection() {
  const host = process.env.MYSQL_HOST;
  const port = process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE || 'bicicletas';
  if (!host || !user || !password) {
    throw new Error('Missing MySQL environment variables');
  }
  return await mysql.createConnection({ host, port, user, password, database });
}

export async function GET() {
  let oracleCon: oracledb.Connection | undefined;
  let mysqlCon: mysql.Connection | undefined;

  try {
    oracleCon = await getOracleConnection();
    mysqlCon = await getMySQLConnection();

    // Oracle pending records
    const oracleQuery = `SELECT COUNT(*) FROM bitacora WHERE replicado = 0`;
    const oracleResult = await oracleCon.execute(oracleQuery);

    const oracleRow = oracleResult.rows?.[0] ?? {};
    const oraclePending = Number(Object.values(oracleRow)[0] ?? 0);


    // MySQL pending records
    const mysqlQuery = `SELECT COUNT(*) as pending_count FROM bitacora WHERE replicado = 0 OR replicado = FALSE`;
    const [mysqlRows] = await mysqlCon.execute(mysqlQuery);
    const mysqlPending = (mysqlRows as any[])[0]?.pending_count ?? 0;

    const totalPending = oraclePending + mysqlPending;

    return NextResponse.json({ 
      oraclePending,
      mysqlPending,
      pendingRecords: totalPending 
    });

  } catch (error: any) {
    console.error('Error fetching pending records:', error);
    return NextResponse.json({ message: error.message ?? String(error), error: 'Failed to fetch pending records' }, { status: 500 });
  } finally {
    if (oracleCon) {
      try { await oracleCon.close(); } catch (e) { console.warn('Error closing Oracle connection', e); }
    }
    if (mysqlCon) {
      try { await mysqlCon.end(); } catch (e) { console.warn('Error closing MySQL connection', e); }
    }
  }
}
