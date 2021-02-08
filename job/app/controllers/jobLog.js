const moment = require('moment')
const jobLog = require('../dbs/jobLog')

function writeEvent () {
  const sql = `
    UPDATE daily_jobs
    SET last_ran = '${moment().format('YYYY-MM-DD')}'
    WHERE name = 'circ_job'
  `
  return jobLog.query(sql)
}

module.exports = {
  writeEvent
}
