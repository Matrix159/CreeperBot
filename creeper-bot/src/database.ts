import pg from 'pg';

const pgPool = new pg.Pool({
  connectionString: process.env.PSQL_CONNECTION_STRING,
  ssl: true,
});

export function watchUser(watcher: string, watchee: string) {
  console.log('Watched user');
  const queryText = 'INSERT INTO watched_users VALUES($1, $2)'
  pgPool.query(queryText, [watcher, watchee], (err, response) => {
    console.log(err);
    console.log(response);
  });
}
