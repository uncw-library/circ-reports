const { Pool } = require('pg')

// dev uses a local circ reports db,
// so only production writes to circ reports db on rancher

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: 'circ-reports',
  port: 5432,
  host: 'circ-reports-db',
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 36000,
  application_name: 'circ-reports-webapp'
})

module.exports = {
  query: (text, params, next) => {
    return pool.query(text, params, next)
  }
}
