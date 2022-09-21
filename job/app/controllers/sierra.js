const moment = require('moment')
const sierra = require('../dbs/sierra')

function getData () {
  const today = moment().format('YYYYMMDD')
  const yesterday = moment().subtract(1, 'day').format('YYYYMMDD')
  const sql = `
    SELECT transaction_gmt,
      item_record_id,
      bib_record_id,
      sierra_view.circ_trans.itype_code_num,
      item_location_code,
      ptype_code,sierra_view.circ_trans.itype_code_num,
      name,
      application_name
    FROM sierra_view.circ_trans

    LEFT JOIN sierra_view.itype_property_myuser
      ON sierra_view.itype_property_myuser.code = sierra_view.circ_trans.itype_code_num
    WHERE op_code = 'o'
      AND to_char(transaction_gmt, 'YYYYMMDD') >= $1
      AND to_char(transaction_gmt, 'YYYYMMDD') < $2
      AND substr(item_location_code,1,1) = 'w'
      AND substr(item_location_code,1,2) != 'wc'
    ORDER BY sierra_view.circ_trans.itype_code_num
  `
  const values = [yesterday, today]
  return sierra.query(sql, values)
}

module.exports = {
  getData
}
