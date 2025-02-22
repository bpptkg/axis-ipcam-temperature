import { createConnection, createPool } from 'mysql2/promise';

export const dbConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
}

export const db = createPool({
    ...dbConfig,
    database: process.env.MYSQL_DB_NAME,
});

export const createDatabase = async () => {
    const connection = await createConnection(dbConfig)
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DB_NAME}\`;`)
    await connection.end();
}

export const createTable = async (table: string) => {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS \`${table}\` (
      id INT(11) AUTO_INCREMENT PRIMARY KEY,
      max_temp FLOAT NULL,
      min_temp FLOAT NULL,
      avg_temp FLOAT NULL,
      timestamp DATETIME NULL
    );`;

    await db.query(createTableQuery);
}

export const insertData = async (table: string, data: {
    min: string,
    max: string,
    avg: string,
}) => {
    const sql =
        `INSERT INTO \`${table}\`(\`max_temp\`, \`min_temp\`, \`avg_temp\`, \`timestamp\`) VALUES (?, ?, ?, ?);`;
    await db.execute(sql, [data.max, data.min, data.avg, new Date()]);
}