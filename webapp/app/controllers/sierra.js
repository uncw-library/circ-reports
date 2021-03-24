const moment = require('moment')
const sierra = require('../dbs/sierra')

const getITypes = () => {
  const sql = `
  SELECT code, max(name) as name, 
    CASE
      WHEN code = 32 THEN 'Equipment'
      WHEN code = 36 THEN 'Equipment'
      WHEN code = 27 THEN 'Equipment'
      WHEN code = 35 THEN 'Equipment'
      WHEN code = 25 THEN 'Equipment'
      WHEN code = 87 THEN 'Equipment'
      WHEN code = 88 THEN 'Equipment'
      WHEN code = 89 THEN 'Equipment'
      WHEN code = 90 THEN 'Equipment'
      WHEN code = 0 THEN 'Books/AV'
      WHEN code = 1 THEN 'Books/AV'
      WHEN code = 2 THEN 'Books/AV'
      WHEN code = 3 THEN 'Books/AV'
      WHEN code = 4 THEN 'Books/AV'
      WHEN code = 5 THEN 'Books/AV'
      WHEN code = 6 THEN 'Books/AV'
      WHEN code = 118 THEN 'Books/AVs'
      WHEN code = 10 THEN 'Course Reserves'
      WHEN code = 24 THEN 'Course Reserves'
      WHEN code = 11 THEN 'Course Reserves'
      WHEN code = 12 THEN 'Course Reserves'
      ELSE 'Other'
    END AS rec_type
  
  FROM sierra_view.itype_property_myuser

  GROUP BY code
  `
  return sierra.query(sql)
}

module.exports = {
  getITypes
}
