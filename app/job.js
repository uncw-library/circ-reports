const async = require('async')
const moment = require('moment')
const schedule = require('node-schedule')
const R = require('ramda')

const circPool = require('./dbs/circreport')
const jobLogPool = require('./dbs/joblog')

const circController = require('./controllers/circreport')
const sierraController = require('./controllers/sierra')

const development = (process.env.NODE_ENV !== 'production')

const rule = new schedule.RecurrenceRule()
if (development) {
  // run in 5 seconds
  rule.hour = new Date().getHours()
  rule.minute = new Date().getMinutes()
  rule.second = new Date().getSeconds() + 5
} else {
  // run at 5am every morning
  rule.hour = 5
  rule.minute = 0
}

schedule.scheduleJob(rule, async () => {
  try {
    console.log('---Job started---')

    if (development) {
      console.log('In development mode. No records will actually be inserted/manipulated.')
    }
    const circClient = await circPool.connect()

    const transactions = (await sierraController.getData()).rows
    console.log(`Found ${transactions.length} record(s) for yesterday`)

    // for each transaction that already exists in our circlog db,
    // we increment the 'transactions' by 1. Otherwise, we insert
    // a new record with 'transactions' being 1.
    let insertCount = 0
    let incrementedCount = 0
    async.forEachOf(transactions, async (transaction, key, callback) => {
      const bibRecordId = transaction.bib_record_id
      const itypeCodeNum = transaction.itype_code_num
      const itemRecordId = transaction.item_record_id
      const itemLocationCode = transaction.item_location_code
      const ptypeCode = transaction.ptype_code
      const { name } = transaction
      const theDate = moment(transaction.transaction_gmt).format('YYYY-MM-DD')
      const theHour = moment(transaction.transaction_gmt).hour()

      const newTransaction = {
        day: theDate,
        hour: theHour,
        bib_record_id: bibRecordId,
        itype_code_num: itypeCodeNum,
        item_record_id: itemRecordId,
        item_location_code: itemLocationCode,
        ptype_code: ptypeCode,
        name
      }

      const matchingTransaction = R.path(['rows', 0], (await circController.getMatchingTransaction(
        newTransaction,
        circClient
      )))

      if (matchingTransaction) {
        // we found a matching transaction.
        // increment the transaction amount by 1
        if (development) {
          console.log(`inserted ${matchingTransaction.id} ${matchingTransaction.transactions}`)
        }
        if (!development) {
          await circController.incrementTransaction(
            matchingTransaction.id,
            matchingTransaction.transactions,
            circClient
          )
        }

        incrementedCount += 1
      } else {
        // we couldn't find a matching transaction.
        // insert a new record
        if (development) {
          console.log(`inserted ${newTransaction}`)
        }
        if (!development) {
          await circController.insertTransaction(
            newTransaction,
            circClient
          )
        }

        insertCount += 1
      }
      if (typeof callback === 'function') callback()
    }, (err) => {
      if (err) console.log(err)

      console.log(`Inserted ${insertCount} record(s)`)
      console.log(`Incremented ${incrementedCount} record(s)`)

      console.log('Cleaning up...')

      // release our client to the pool
      circClient.release()

      console.log('---Job finished---')

      const jobLogQuery = `
        UPDATE daily_jobs
        SET last_ran = '${moment().format('YYYY-MM-DD')}'
        WHERE name = 'circ_job'
      `
      if (!development) {
        jobLogPool.query(jobLogQuery, (jobLogErr, _next) => {
          if (jobLogErr) {
            console.log(jobLogErr)
          } else {
            console.log('Updated JobLog with last_ran date')
          }
        })
      }
    })
  } catch (e) {
    console.log('There was an error...')
    console.log(e)
  }
})
