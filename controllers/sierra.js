const moment = require('moment');
const sierra = require('../dbs/sierra');

const getData = () => {
  const today = moment().format('YYYYMMDD');
  const yesterday = moment().subtract(1, 'day').format('YYYYMMDD');

  const sql = `
    SELECT transaction_gmt, item_record_id, bib_record_id, sierra_view.circ_trans.itype_code_num, item_location_code,  ptype_code,sierra_view.circ_trans.itype_code_num,name
    FROM sierra_view.circ_trans

    LEFT JOIN sierra_view.itype_property_myuser
    ON sierra_view.itype_property_myuser.code=sierra_view.circ_trans.itype_code_num
    WHERE op_code='o'
    AND to_char(transaction_gmt, 'YYYYMMDD')>=$1
    AND to_char(transaction_gmt, 'YYYYMMDD')<$2

    and substr(item_location_code,1,1)='w'
    and substr(item_location_code,1,2)!='wc'
    order by sierra_view.circ_trans.itype_code_num
  `;

  const values = [yesterday, today];

  return sierra.query(sql, values);
};

const getITypes = () => {
  const sql = `
  SELECT itype_code_num, max(name) as name,

  CASE
    WHEN itype_code_num = 32 THEN 'Equipment'
    WHEN itype_code_num = 36 THEN 'Equipment'
    WHEN itype_code_num = 27 THEN 'Equipment'
    WHEN itype_code_num = 35 THEN 'Equipment'
    WHEN itype_code_num = 0 THEN 'Books/AV'
    WHEN itype_code_num = 1 THEN 'Books/AV'
    WHEN itype_code_num = 2 THEN 'Books/AV'
    WHEN itype_code_num = 3 THEN 'Books/AV'
    WHEN itype_code_num = 5 THEN 'Books/AV'
    WHEN itype_code_num = 6 THEN 'Books/AV'
    WHEN itype_code_num = 10 THEN 'Course Reserves'
    WHEN itype_code_num = 24 THEN 'Course Reserves'
    WHEN itype_code_num = 11 THEN 'Course Reserves'
    WHEN itype_code_num = 105 THEN 'Course Reserves'
    ELSE 'Special'
  END AS rec_type

  FROM sierra_view.circ_trans
  LEFT JOIN sierra_view.itype_property_myuser
  ON sierra_view.itype_property_myuser.code=sierra_view.circ_trans.itype_code_num

  where substr(item_location_code,1,1)='w' and substr(item_location_code,1,2)!='wc'

  GROUP BY itype_code_num
  `;

  return sierra.query(sql);
};

module.exports = {
  getData,
  getITypes,
};
