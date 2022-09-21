const async = require('async')
const moment = require('moment')
const R = require('ramda')
const schedule = require('node-schedule')

const circController = require('./controllers/circreport')
const sierraController = require('./controllers/sierra')
const jobLogController = require('./controllers/jobLog')

const development = (process.env.NODE_ENV !== 'production')

const rule = new schedule.RecurrenceRule()
if (development) {
  run in 5 seconds
  rule.hour = new Date().getHours()
  rule.minute = new Date().getMinutes()
  rule.second = new Date().getSeconds() + 5
} else {
  // run at 5am every morning
  rule.hour = 5
  rule.minute = 0
}

schedule.scheduleJob(rule, async () => {
  console.log('---Job started---')

  if (development) {
    console.log('In development mode. No records will actually be inserted/manipulated.')
  }

  const transactions = await sierraController.getData()
    .then(values => values.rows)
    .catch(err => console.log(err))

  console.log(`Found ${transactions.length} record(s) for yesterday`)

  // for each transaction that already exists in our circlog db,
  // we increment the 'transactions' by 1. Otherwise, we insert
  // a new record with 'transactions' being 1.
  let insertCount = 0
  let incrementedCount = 0

  async.forEachOf(transactions, async (transaction, key, callback) => {
    const { name } = transaction

    const newTransaction = {
      day: moment(transaction.transaction_gmt).format('YYYY-MM-DD'),
      hour: moment(transaction.transaction_gmt).hour(),
      bib_record_id: transaction.bib_record_id,
      itype_code_num: transaction.itype_code_num,
      item_record_id: transaction.item_record_id,
      item_location_code: transaction.item_location_code,
      ptype_code: transaction.ptype_code,
      name,
      application_name: transaction.application_name
    }

    const matchingTransaction = R.path(['rows', 0], (await circController.getMatchingTransaction(newTransaction)))

    if (matchingTransaction) {
      // we found a matching transaction.
      // increment the transaction amount by 1
      if (development) {
        console.log(`would have incremented transaction: ${matchingTransaction.id} ${matchingTransaction.transactions}`)
      }
      if (!development) {
        circController.incrementTransaction(matchingTransaction.id, matchingTransaction.transactions)
          .catch(err => console.log(err))
      }
      incrementedCount += 1
    } else {
      // we couldn't find a matching transaction.
      // insert a new record
      if (development) {
        console.log(`would have inserted into circ-reports: ${JSON.stringify(newTransaction)}`)
      }
      if (!development) {
        circController.insertTransaction(newTransaction)
          .catch(err => console.log(err))
      }
      insertCount += 1
    }
    if (typeof callback === 'function') callback()
  }, (err) => {
    if (err) console.log(err)

    console.log(`Inserted ${insertCount} record(s)`)
    console.log(`Incremented ${incrementedCount} record(s)`)
    console.log('---Job finished---')

    if (!development) {
      jobLogController.writeEvent()
        .then(console.log('Updated JobLog with last_ran date'))
        .catch(err => console.log(err))
    }
  })
})
