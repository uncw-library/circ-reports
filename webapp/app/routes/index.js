const express = require('express')
const passport = require('passport')
const request = require('request')
const R = require('ramda')
const moment = require('moment')
const { ensureAuthenticated } = require('../auth/ensureAuth')

// controllers
const sierraController = require('../controllers/sierra')
const circReportController = require('../controllers/circreport')

const router = express.Router()

const development = (process.env.NODE_ENV !== 'production')

/* GET home page. */
router.get('/', (req, res, next) => {
  res.redirect('/login')
})

/* GET and POST to login page */
router.get('/login', (req, res, _next) => {
  res.render('login', {
    layout: 'layout',
    title: '--- Login ---',
    failure: (req.query.failure) // failed login attempt
  })
})

router.post('/login', passport.authenticate('ldapauth', {
  failureRedirect: '/login?failure=true'
}), async (req, res) => {
  // let's log the new session!
  if (!development) {
    await request.post('https://track-login-api.libapps-staff.uncw.edu/api/v1/login', {
      form: {
        application: 'Circulation Reports',
        username: `${req.body.username.toLowerCase()}`,
        thePasswordIsWildWings: 'yagotthatright'
      }
    })
  }
  res.redirect('/report')
})

router.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/login')
})

// GET /report. This will be where the main report is generated
router.get('/report', ensureAuthenticated, async (req, res, _next) => {
  let { startDate, endDate } = req.query
  let errorMessage

  // if date info is invalid format, then give an error && clear the value
  if (!moment(startDate, 'MM/DD/YYYY', true).isValid()) {
    startDate = undefined
    errorMessage = 'dates need to be in MM/DD/YYYY'
  }
  if (!moment(endDate, 'MM/DD/YYYY', true).isValid()) {
    endDate = undefined
    errorMessage = 'dates need to be in MM/DD/YYYY'
  }

  // if no date info sent in request or was bad format, then default to today & yesterday
  startDate = startDate || moment().subtract(1, 'day').format('MM/DD/YYYY')
  endDate = endDate || moment().format('MM/DD/YYYY')

  const itypes = R.path(['rows'], await sierraController.getITypes())
  let transactions = R.path(['rows'], await circReportController.getTransactionsByDate(startDate, endDate))

  const totalTransactions = transactions.reduce(
    (num, transaction) => (Number(transaction.total) + num),
    0
  )

  transactions = transactions.map(transaction => ({
    ...transaction,
    iTypeName: R.path(['name'], itypes.find(type => type.itype_code_num === transaction.itype_code_num)),
    recType: R.path(['rec_type'], itypes.find(type => type.itype_code_num === transaction.itype_code_num)),
    percentage: (totalTransactions > 0)
      ? (transaction.total / totalTransactions * 100).toFixed(2)
      : 0
  }))

  const totalBooksAV = transactions.reduce(
    (num, transaction) => (transaction.recType === 'Books/AV' ? Number(transaction.total) + num : num), 0
  )

  const totalCourseReserves = transactions.reduce(
    (num, transaction) => (transaction.recType === 'Course Reserves' ? Number(transaction.total) + num : num), 0
  )

  const totalEquipment = transactions.reduce(
    (num, transaction) => (transaction.recType === 'Equipment' ? Number(transaction.total) + num : num), 0
  )

  const payload = {
    layout: 'layout',
    title: 'Checkouts by Type',
    startDate,
    endDate,
    transactions,
    totalTransactions,
    totalBooksAV,
    totalCourseReserves,
    totalEquipment,
    errorMessage
  }

  res.render('report', payload)
})

module.exports = router
