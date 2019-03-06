const pg = require('pg');

const development = (process.env.NODE_ENV !== 'production');

// create a connection pool to our MasterDB database
// The .query method will connect and release connections to the pool
// so that we don't have to keep constant open connections
const client = new pg.Pool({
  user: process.env.MASTER_DB_USER,
  password: process.env.MASTER_DB_PASS,
  database: 'JobLog',
  port: 5432,
  host: (development) ? 'libapps-staff.uncw.edu' : 'master-db',
});

module.exports = client;
