import { NextResponse } from 'next/server';
import oracledb from 'oracledb';

export const dynamic = 'force-dynamic';

// On older versions of Node, oracledb may require this to be set
// oracledb.initOracleClient({ libDir: '/path/to/instantclient' });

export async function GET() {
  const user = process.env.ORACLE_USER;
  const password = process.env.ORACLE_PASSWORD;
  const connectString = process.env.ORACLE_CONNECT_STRING;

  if (!user || !password || !connectString) {
    return NextResponse.json({ status: 'Disconnected', error: 'Missing Oracle environment variables' }, { status: 500 });
  }

  let connection;
  try {
    connection = await oracledb.getConnection({
      user,
      password,
      connectString,
    });
    return NextResponse.json({ status: 'Connected' });
  } catch (error: any) {
    return NextResponse.json({ status: 'Disconnected', error: error.message }, { status: 500 });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError: any) {
        // console.error('Error closing Oracle connection:', closeError.message);
      }
    }
  }
}
