
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import oracledb from 'oracledb';
import { tables as tableMappings } from '@/library/data';

const mysqlTables = tableMappings.map(t => t.id);
const oracleTables = tableMappings.map(t => t.oracleName);

async function getOracleConnection() {
  const user = process.env.ORACLE_USER;
  const password = process.env.ORACLE_PASSWORD;
  const connectString = process.env.ORACLE_CONNECT_STRING;
  if (!user || !password || !connectString) {
    throw new Error('Missing Oracle environment variables');
  }
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
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

/**
 * Replicación MySQL -> Oracle
 */
async function replicateMySQLToOracle(table: string, oracleCon: oracledb.Connection, mysqlCon: mysql.Connection) {
  const errors: string[] = [];
  let replicatedCount = 0;

  const tableIndex = mysqlTables.indexOf(table);
  if (tableIndex === -1) {
    throw new Error(`Table ${table} not found in mapping.`);
  }
  const oracleTableName = oracleTables[tableIndex];

  // Selecciono todas las columnas como en el código Java para el UPDATE
  const selectQuery = `SELECT * FROM bitacora WHERE tabla_afectada = ? AND (replicado = 0 OR replicado = FALSE)`;
  const [rows] = await mysqlCon.execute(selectQuery, [table]);

  const records = rows as any[];
  if (!records.length) return { errors, replicatedCount };

  await mysqlCon.beginTransaction();

  try {
    for (const row of records) {
      const { tabla_afectada, tipo_operacion, fecha_hora, id_registro, datos_nuevos, usuario_bd, ip_origen } = row;
      try {
        await oracleCon.execute(
          `BEGIN replicador_orcl(:p_table_oracle, :p_id_registro, :p_datos_nuevos, :p_tipo_operacion); END;`,
          {
            p_table_oracle: oracleTableName,
            p_id_registro: id_registro,
            p_datos_nuevos: datos_nuevos,
            p_tipo_operacion: tipo_operacion
          }
        );

        // Replicar la lógica de actualización del código Java
        const updateQuery = `UPDATE bitacora SET replicado = 1 WHERE tabla_afectada = ? AND tipo_operacion = ? AND fecha_hora = ? AND id_registro = ? AND usuario_bd = ? AND ip_origen = ?`;
        await mysqlCon.execute(updateQuery, [tabla_afectada, tipo_operacion, fecha_hora, id_registro, usuario_bd, ip_origen]);

        replicatedCount++;
      } catch (e: any) {
        const errorMessage = `Error replicating (MySQL->Oracle) for record id_registro=${id_registro}, table=${table}: ${e.message || e}`;
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    }
    await mysqlCon.commit();
    await oracleCon.commit();
  } catch (outerErr: any) {
    await mysqlCon.rollback();
    try { await oracleCon.rollback(); } catch (_) { /* ignore */ }
    throw outerErr;
  }

  return { errors, replicatedCount };
}

/**
 * Replicación Oracle -> MySQL
 */
async function replicateOracleToMySQL(table: string, oracleCon: oracledb.Connection, mysqlCon: mysql.Connection) {
  const errors: string[] = [];
  let replicatedCount = 0;

  const tableIndex = mysqlTables.indexOf(table);
  if (tableIndex === -1) {
    throw new Error(`Table ${table} not found in mapping.`);
  }
  const oracleTableName = oracleTables[tableIndex];

  // Selecciono todas las columnas necesarias para el UPDATE posterior
  const query = `SELECT * FROM bitacora WHERE tabla_afectada = :tableName AND replicado = 0`;
  const result = await oracleCon.execute(query, { tableName: oracleTableName });

  if (!result.rows || result.rows.length === 0) {
    return { errors, replicatedCount };
  }
  
  await oracleCon.setAutoCommit(false);

  try {
    for (const rowObj of result.rows as any[]) {
      const { TABLA_AFECTADA, TIPO_OPERACION, FECHA_HORA, ID_REGISTRO, DATOS_NUEVOS, USUARIO_BD, IP_ORIGEN } = rowObj;

      try {
        await mysqlCon.query(`CALL replicador(?, ?, ?, ?)`, [table, ID_REGISTRO, DATOS_NUEVOS, TIPO_OPERACION]);

        // Replicar la lógica de actualización del código Java
        const updateQuery = `UPDATE bitacora SET replicado = 1 WHERE tabla_afectada = :1 AND tipo_operacion = :2 AND fecha_hora = :3 AND id_registro = :4 AND usuario_bd = :5 AND ip_origen = :6`;
        await oracleCon.execute(updateQuery, [TABLA_AFECTADA, TIPO_OPERACION, FECHA_HORA, ID_REGISTRO, USUARIO_BD, IP_ORIGEN]);

        replicatedCount++;
      } catch (e: any) {
        const errorMessage = `Error replicating (Oracle->MySQL) for record id_registro=${ID_REGISTRO}, oracle_table=${TABLA_AFECTADA}: ${e.message || e}`;
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    }

    await oracleCon.commit();
  } catch (outerErr: any) {
    try { await oracleCon.rollback(); } catch (_) { /* ignore */ }
    throw outerErr;
  }

  return { errors, replicatedCount };
}

export async function POST(request: Request) {
  const body = await request.json();
  const { table, direction } = body;

  if (!table || typeof table !== 'string') {
    return NextResponse.json({ message: 'A single table must be specified for replication.' }, { status: 400 });
  }

  let oracleCon: oracledb.Connection | undefined;
  let mysqlCon: mysql.Connection | undefined;

  try {
    oracleCon = await getOracleConnection();
    mysqlCon = await getMySQLConnection();

    let result;
    if (direction === 'mysql-to-oracle') {
      result = await replicateMySQLToOracle(table, oracleCon, mysqlCon);
    } else if (direction === 'oracle-to-mysql') {
      result = await replicateOracleToMySQL(table, oracleCon, mysqlCon);
    } else {
      return NextResponse.json({ message: 'Invalid replication direction specified.' }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Replication process completed.',
      replicatedCount: result.replicatedCount,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('Replication top-level error:', error);
    return NextResponse.json({ message: error.message ?? String(error), errors: [error.message ?? String(error)] }, { status: 500 });
  } finally {
    if (oracleCon) {
      try { await oracleCon.close(); } catch (e) { console.warn('Error closing Oracle connection', e); }
    }
    if (mysqlCon) {
      try { await mysqlCon.end(); } catch (e) { console.warn('Error closing MySQL connection', e); }
    }
  }
}
