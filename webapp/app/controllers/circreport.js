const moment = require('moment')
const circReport = require('../dbs/circreport')

const getTransactionsByDate = (startDate, endDate) => {
  const sql = `
  SELECT MAX(itype_code_num) as itype_code_num,
    sum(transactions) as total
  FROM summary
  WHERE day >= $1
    AND day < $2
  GROUP BY itype_code_num
  `

  const values = [moment(startDate).format('YYYY-MM-DD'), moment(endDate).format('YYYY-MM-DD')]

  return circReport.query(sql, values)
}

module.exports = {
  getTransactionsByDate
}
