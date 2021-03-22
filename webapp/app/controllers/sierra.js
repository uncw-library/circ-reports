const moment = require('moment')
const sierra = require('../dbs/sierra')

const getITypes = () => {
  const sql = `
  SELECT itype_code_num, max(name) as name,
    CASE
      WHEN itype_code_num = 32 THEN 'Equipment'
      WHEN itype_code_num = 36 THEN 'Equipment'
      WHEN itype_code_num = 27 THEN 'Equipment'
      WHEN itype_code_num = 35 THEN 'Equipment'
      WHEN itype_code_num = 25 THEN 'Equipment'
      WHEN itype_code_num = 87 THEN 'Equipment'
      WHEN itype_code_num = 88 THEN 'Equipment'
      WHEN itype_code_num = 89 THEN 'Equipment'
      WHEN itype_code_num = 90 THEN 'Equipment'
      WHEN itype_code_num = 0 THEN 'Books/AV'
      WHEN itype_code_num = 1 THEN 'Books/AV'
      WHEN itype_code_num = 2 THEN 'Books/AV'
      WHEN itype_code_num = 3 THEN 'Books/AV'
      WHEN itype_code_num = 4 THEN 'Books/AV'
      WHEN itype_code_num = 5 THEN 'Books/AV'
      WHEN itype_code_num = 6 THEN 'Books/AV'
      WHEN itype_code_num = 8 THEN 'Books/AV'
      WHEN itype_code_num = 118 THEN 'Books/AVs'
      WHEN itype_code_num = 10 THEN 'Course Reserves'
      WHEN itype_code_num = 24 THEN 'Course Reserves'
      WHEN itype_code_num = 11 THEN 'Course Reserves'
      WHEN itype_code_num = 12 THEN 'Course Reserves'
      ELSE 'Other'
    END AS rec_type
  
  FROM sierra_view.circ_trans
  LEFT JOIN sierra_view.itype_property_myuser
    ON sierra_view.itype_property_myuser.code = sierra_view.circ_trans.itype_code_num
  WHERE substr(item_location_code,1,1) = 'w'
    AND substr(item_location_code,1,2) != 'wc'
    AND substr(item_location_code,1,2)!='we'
  GROUP BY itype_code_num
  `
  return sierra.query(sql)
}

module.exports = {
  getITypes
}
