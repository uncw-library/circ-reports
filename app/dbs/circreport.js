const pg = require('pg')

const development = (process.env.NODE_ENV !== 'production')

// create a connection pool to our circlog database
// so that we don't have to keep constant open connections
const client = new pg.Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: 'circ-reports',
  port: 5432,
  host: 'circ-reports-db'
})

module.exports = client
