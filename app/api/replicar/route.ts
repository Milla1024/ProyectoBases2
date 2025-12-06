import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import oracledb from 'oracledb';
import { tables as tableMappings } from '@/library/data';

// Mapeos directos como en tu código original
const mysqlTables = tableMappings.map(t => t.id);
const oracleTables = tableMappings.map(t => t.oracleName);

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// =======================
// CONEXIONES
// =======================

async function getOracleConnection() {
    return await oracledb.getConnection({
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASSWORD,
        connectString: process.env.ORACLE_CONNECT_STRING
    });
}

async function getMySQLConnection() {
    return await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: Number(process.env.MYSQL_PORT || 3306),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });
}

// =======================
// MYSQL → ORACLE
// =======================

async function replicateMySQLToOracle(table, oracleCon, mysqlCon) {
    const errors = [];
    let replicatedCount = 0;

    const idx = mysqlTables.indexOf(table);
    if (idx === -1) throw new Error(`Table ${table} not found in mapping.`);
    const oracleTable = oracleTables[idx];

    const [rows] = await mysqlCon.query(
        `SELECT id_bitacora, id_registro, datos_nuevos, tipo_operacion 
         FROM bitacora 
         WHERE tabla_afectada = ? AND replicado = 0`,
        [table]
    );

    for (const row of rows) {
        try {
            await oracleCon.execute(
                `BEGIN replicador_orcl(:tabla, :id_reg, :data, :op); END;`,
                {
                    tabla: oracleTable,
                    id_reg: row.id_registro,
                    data: row.datos_nuevos,
                    op: row.tipo_operacion
                }
            );

            await mysqlCon.query(
                `UPDATE bitacora SET replicado = 1 WHERE id_bitacora = ?`,
                [row.id_bitacora]
            );

            replicatedCount++;
        } catch (e) {
            const msg = `ERROR M→O: id_bitacora=${row.id_bitacora} => ${e.message}`;
            console.error(msg);
            errors.push(msg);
        }
    }

    await oracleCon.commit();
    return { replicatedCount, errors };
}

// =======================
// ORACLE → MYSQL
// =======================

async function replicateOracleToMySQL(table, oracleCon, mysqlCon) {
    const errors = [];
    let replicatedCount = 0;

    const idx = mysqlTables.indexOf(table);
    if (idx === -1) throw new Error(`Table ${table} not found in mapping.`);
    const oracleTable = oracleTables[idx];

    const res = await oracleCon.execute(
        `SELECT id_bitacora, tabla_afectada, tipo_operacion, id_registro, datos_nuevos
         FROM bitacora
         WHERE tabla_afectada = :t AND replicado = 0`,
        { t: oracleTable }
    );

    for (const row of res.rows ?? []) {
        const id_bit = row.ID_BITACORA ?? row.id_bitacora;
        const id_reg = row.ID_REGISTRO ?? row.id_registro;
        const data = row.DATOS_NUEVOS ?? row.datos_nuevos;
        const op = row.TIPO_OPERACION ?? row.tipo_operacion;

        try {
            await mysqlCon.query(
                `CALL replicador(?, ?, ?, ?)`,
                [table, id_reg, data, op]
            );

            await oracleCon.execute(
                `UPDATE bitacora SET replicado = 1 WHERE id_bitacora = :id`,
                { id: id_bit }
            );

            replicatedCount++;
        } catch (e) {
            const msg = `ERROR O→M: id_bitacora=${id_bit} => ${e.message}`;
            console.error(msg);
            errors.push(msg);
        }
    }

    await oracleCon.commit();
    return { replicatedCount, errors };
}

// =======================
// HANDLER
// =======================

export async function POST(request) {
    console.log("=== Replication request received ===");

    let mysqlCon = null;
    let oracleCon = null;

    try {
        const body = await request.json();
        console.log("Body:", body);

        const { table, direction } = body;

        mysqlCon = await getMySQLConnection();
        oracleCon = await getOracleConnection();

        let result;
        if (direction === "mysql-to-oracle") {
            result = await replicateMySQLToOracle(table, oracleCon, mysqlCon);
        } else if (direction === "oracle-to-mysql") {
            result = await replicateOracleToMySQL(table, oracleCon, mysqlCon);
        } else {
            return NextResponse.json(
                { message: "Invalid direction." },
                { status: 400 }
            );
        }

        return NextResponse.json({
            message: "Replication completed",
            replicatedCount: result.replicatedCount,
            errors: result.errors
        });

    } catch (err) {
        console.error("🔥 BACKEND ERROR:", err);
        return NextResponse.json(
            {
                message: "Replication failed",
                error: err.message ?? String(err)
            },
            { status: 500 }
        );
    } finally {
        if (mysqlCon) try { await mysqlCon.end(); } catch {}
        if (oracleCon) try { await oracleCon.close(); } catch {}
    }
}
