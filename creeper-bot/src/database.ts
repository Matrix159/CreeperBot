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

export async function unwatchUser(watcher: string, watchee: string) {
  console.log('Unwatched user');
  const queryText = 'DELETE FROM watched_users WHERE watcher = $1 AND watchee = $2;';
  await pgPool.query(queryText, [watcher, watchee]);
}

export async function getUsersWatching(watchee: string): Promise<string[]> {
  console.log('Watched user');
  const queryText = 'SELECT * FROM watched_users WHERE watchee = $1';
  const { rows } = await pgPool.query(queryText, [watchee]);
  console.log(rows);
  return rows.map(row => row.watcher);
}

export async function getWatchedUsers(): Promise<string[]> {
  const queryText = 'SELECT watchee FROM watched_users';
  const { rows } = await pgPool.query(queryText);
  console.log(rows);
  return rows.map(row => row.watchee);
}
