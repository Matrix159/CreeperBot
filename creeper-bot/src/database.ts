import pg from 'pg';

const pgPool = new pg.Pool({
  connectionString: process.env.PSQL_CONNECTION_STRING,
  ssl: true,
});

export async function watchUser(watcher: string, watchee: string) {
  console.log('Watched user');
  const queryText = 'INSERT INTO watched_users VALUES($1, $2)';
  await pgPool.query(queryText, [watcher, watchee]);
}

export async function getUsersWatching(watchee: string): Promise<string[]> {
  console.log('Watched user');
  const queryText = 'SELECT * FROM watched_users WHERE watchee = $1';
  const { rows } = await pgPool.query(queryText, [watchee]);
  console.log(rows);
  return rows.map(row => row.watcher);
}
