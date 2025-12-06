import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import oracledb from 'oracledb';
import { tables as tableMappings } from '@/library/data';

const mysqlTables = tableMappings.map(t => t.id);
const oracleTables = tableMappings.map(t => t.oracleName);

// 🔹 Normalizador de nombres para evitar errores por mayúsculas o espacios
const normalize = (str?: string) =>
  (str ?? '').trim().toLowerCase();

/* ============================================
   ORACLE CONNECTION
=============================================== */
async function getOracleConnection() {
  const user = process.env.ORACLE_USER;
  const password = process.env.ORACLE_PASSWORD;
  const connectString = process.env.ORACLE_CONNECT_STRING;

  if (!user || !password || !connectString) {
    throw new Error('Missing Oracle environment variables');
  }

  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  oracledb.autoCommit = false;

  return await oracledb.getConnection({ user, password, connectString });
}

/* ============================================
   MYSQL CONNECTION
=============================================== */
async function getMySQLConnection() {
  const host = process.env.MYSQL_HOST;
  const port = process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE || 'bicicletas';

  if (!host || !user || !password) {
    throw new Error('Missing MySQL environment variables');
  }

  return await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: false,
  });
}

/* ============================================================
   REPLICAR DE MYSQL ➜ ORACLE
=============================================================== */
async function replicateMySQLToOracle(table: string, oracleCon: oracledb.Connection, mysqlCon: mysql.Connection) {
  const errors: string[] = [];
  let replicatedCount = 0;

  const tableNorm = normalize(table);
  const mysqlTablesNorm = mysqlTables.map(t => normalize(t));

  if (!mysqlTablesNorm.includes(tableNorm)) {
    console.log('⚠ Tabla ignorada por mismatch:', table);
    return { errors, replicatedCount };
  }

  const tableIndex = mysqlTablesNorm.indexOf(tableNorm);
  const oracleTableName = oracleTables[tableIndex];

  const [rows] = await mysqlCon.execute(
    `SELECT * FROM bitacora WHERE tabla_afectada <=> ? AND replicado = FALSE`,
    [table]
  );

  const records = rows as any[];
  if (!records.length) return { errors, replicatedCount };

  for (const row of records) {
    const { tabla_afectada, tipo_operacion, fecha_hora, id_registro, datos_nuevos, usuario_bd, ip_origen } = row;

    try {
      // 🔹 Llamada directa al procedimiento Oracle (sin CLOB)
      await oracleCon.execute(
        `BEGIN replicador_orcl(:tabla, :id, :data, :op); END;`,
        {
          tabla: oracleTableName,
          id: id_registro,
          data: datos_nuevos || '',
          op: tipo_operacion,
        }
      );

      await oracleCon.commit();

      // 🔹 UPDATE seguro usando <=> para NULL
      await mysqlCon.execute(
        `UPDATE bitacora SET replicado = TRUE 
         WHERE tabla_afectada <=> ?
         AND tipo_operacion <=> ?
         AND fecha_hora <=> ?
         AND id_registro <=> ?
         AND usuario_bd <=> ?
         AND ip_origen <=> ?`,
        [
          tabla_afectada,
          tipo_operacion,
          fecha_hora,
          id_registro,
          usuario_bd,
          ip_origen
        ]
      );

      await mysqlCon.execute('COMMIT');

      replicatedCount++;
    } catch (e: any) {
      try { await oracleCon.rollback(); } catch {}
      try { await mysqlCon.execute('ROLLBACK'); } catch {}

      errors.push(`MySQL→Oracle Error en id=${id_registro}: ${e.message}`);
    }
  }

  return { errors, replicatedCount };
}

/* ============================================================
   REPLICAR DE ORACLE ➜ MYSQL
=============================================================== */
async function replicateOracleToMySQL(table: string, oracleCon: oracledb.Connection, mysqlCon: mysql.Connection) {
  const errors: string[] = [];
  let replicatedCount = 0;

  const tableNorm = normalize(table);
  const mysqlTablesNorm = mysqlTables.map(t => normalize(t));

  if (!mysqlTablesNorm.includes(tableNorm)) {
    console.log('⚠ Tabla ignorada por mismatch:', table);
    return { errors, replicatedCount };
  }

  const tableIndex = mysqlTablesNorm.indexOf(tableNorm);
  const oracleTableName = oracleTables[tableIndex];

  const result = await oracleCon.execute(
    `SELECT * FROM bitacora WHERE tabla_afectada = :tbl AND replicado = 0`,
    { tbl: oracleTableName }
  );

  if (!result.rows?.length) return { errors, replicatedCount };

  for (const row of result.rows as any[]) {
    const tabla_afectada = row.TABLA_AFECTADA;
    const tipo_operacion = row.TIPO_OPERACION;
    const fecha_hora = row.FECHA_HORA;
    const id_registro = row.ID_REGISTRO;
    const datos_nuevos = row.DATOS_NUEVOS || '';
    const usuario_bd = row.USUARIO_BD || null;
    const ip_origen = row.IP_ORIGEN || null;

    try {
      await mysqlCon.execute(
        `CALL replicador(?, ?, ?, ?)`,
        [table, id_registro, datos_nuevos, tipo_operacion]
      );

      await oracleCon.execute(
        `UPDATE bitacora SET replicado = 1
         WHERE tabla_afectada = :1
         AND tipo_operacion = :2
         AND fecha_hora = :3
         AND id_registro = :4
         AND usuario_bd IS NOT DISTINCT FROM :5
         AND ip_origen IS NOT DISTINCT FROM :6`,
        [
          tabla_afectada,
          tipo_operacion,
          fecha_hora,
          id_registro,
          usuario_bd,
          ip_origen
        ]
      );

      await oracleCon.commit();
      await mysqlCon.execute('COMMIT');

      replicatedCount++;
    } catch (e: any) {
      try { await oracleCon.rollback(); } catch {}
      try { await mysqlCon.execute('ROLLBACK'); } catch {}

      errors.push(`Oracle→MySQL Error en id=${id_registro}: ${e.message}`);
    }
  }

  return { errors, replicatedCount };
}

/* ============================================================
   POST HANDLER
=============================================================== */
export async function POST(request: Request) {
  const body = await request.json();
  const { table, direction } = body;

  if (!table) {
    return NextResponse.json({ message: 'Debe especificar una tabla.' }, { status: 400 });
  }

  let oracleCon: any;
  let mysqlCon: any;

  try {
    oracleCon = await getOracleConnection();
    mysqlCon = await getMySQLConnection();

    let result;

    if (direction === 'mysql-to-oracle') {
      result = await replicateMySQLToOracle(table, oracleCon, mysqlCon);
    } else if (direction === 'oracle-to-mysql') {
      result = await replicateOracleToMySQL(table, oracleCon, mysqlCon);
    } else {
      return NextResponse.json(
        { message: 'Dirección inválida.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Replicación completada',
      replicatedCount: result.replicatedCount,
      errors: result.errors,
      success: result.errors.length === 0
    });

  } catch (error: any) {
    return NextResponse.json({
      message: error.message,
      success: false
    }, { status: 500 });

  } finally {
    try { if (oracleCon) await oracleCon.close(); } catch {}
    try { if (mysqlCon) await mysqlCon.end(); } catch {}
  }
}
