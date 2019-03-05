const getMatchingTransaction = (transaction, client) => {
  const sql = `
  SELECT * FROM summary
  WHERE day = $1
  AND hour = $2
  AND bib_record_id = $3
  AND itype_code_num = $4
  AND item_record_id = $5
  AND item_location_code = $6
  AND ptype_code = $7
  AND name = $8
  `;

  const values = [
    transaction.day,
    transaction.hour,
    transaction.bib_record_id,
    transaction.itype_code_num,
    transaction.item_record_id,
    transaction.item_location_code,
    transaction.ptype_code,
    transaction.name,
  ];

  return client.query(sql, values);
};

const incrementTransaction = (transactionId, currentTransactions, client) => {
  const sql = `
  UPDATE summary
  SET transactions = $1
  WHERE id = $2
  `;

  const values = [currentTransactions + 1, transactionId];

  return client.query(sql, values);
};

const insertTransaction = (transaction, client) => {
  const sql = `
  INSERT INTO summary (day, hour, transactions, bib_record_id, itype_code_num, item_record_id, item_location_code, ptype_code, name)
  VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8)
  `;

  const values = [
    transaction.day,
    transaction.hour,
    transaction.bib_record_id,
    transaction.itype_code_num,
    transaction.item_record_id,
    transaction.item_location_code,
    transaction.ptype_code,
    transaction.name,
  ];

  return client.query(sql, values);
};

module.exports = {
  getMatchingTransaction,
  incrementTransaction,
  insertTransaction,
};
