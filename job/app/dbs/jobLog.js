const { Pool } = require('pg')

// on development, we skip writing to joblog db.  These config values are just for the production app.

const pool = new Pool({
  user: process.env.MASTER_DB_USER,
  password: process.env.MASTER_DB_PASS,
  database: 'JobLog',
  port: 5432,
  host: 'master-db',
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 36000,
  application_name: 'circ-reports-job'
})

module.exports = {
  query: (text, params, next) => {
    return pool.query(text, params, next)
  }
}
