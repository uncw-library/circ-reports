const development = (process.env.NODE_ENV !== 'production');

const createError = require('http-errors');
const express = require('express');
const session = require('cookie-session');
const helmet = require('helmet');
const passport = require('passport');
const LdapStrategy = require('passport-ldapauth').Strategy;
const exphbs = require('express-handlebars');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const schedule = require('node-schedule');
const moment = require('moment');
const async = require('async');
const Chalk = require('chalk');
const R = require('ramda');

// routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

// controllers
const sierraController = require('./controllers/sierra');
const circController = require('./controllers/circreport');

// db pools
const circPool = require('./dbs/circreport');
const jobLogPool = require('./dbs/joblog');

// ldap config
const opts = require('./auth/ldap');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({ defaultLayout: 'layout' }));
app.set('view engine', 'handlebars');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// use cookies for our sessions
app.use(session({
  keys: ['cookie-session-tac', 'dockerisawesome-tac', 'webwizards-tac'],

  // cookie Options
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
}));

// use helmet for added security
app.use(helmet());

// configure passport to use LDAP for auth
passport.use(new LdapStrategy(opts));

app.use(passport.initialize());
app.use(passport.session());

// user object serialization
passport.serializeUser((user, done) => {
  done(null, user.dn);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});


app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// -----------------JOB-------------------
// in development, job runs 5 seconds after Node server starts
const rule = new schedule.RecurrenceRule();

if (development) {
  // run in 5 seconds
  rule.hour = new Date().getHours();
  rule.minute = new Date().getMinutes();
  rule.second = new Date().getSeconds() + 5;
} else {
  // run at 5am every morning
  rule.hour = 5;
  rule.minute = 0;
}

schedule.scheduleJob(rule, async () => {
  try {
    console.log(Chalk.green('---Job started---'));

    if (development) {
      console.log(Chalk.yellow('In development mode. No records will actually be inserted/manipulated. This is for testing only.'));
    }

    // let's go ahead and create clients for our connection pool
    // we will release them after the job is complete :)
    const circClient = await circPool.connect();

    // get the individual circ transactions
    const transactions = (await sierraController.getData()).rows;
    console.log(Chalk.cyan(`Found ${transactions.length} record(s) for yesterday`));
    console.log(' ');

    // keep a count of inserted/incremented records
    let insertCount = 0;
    let incrementedCount = 0;

    // for each transaction that already exists in our circlog db,
    // we increment the 'transactions' by 1. Otherwise, we insert
    // a new record with 'transactions' being 1.
    async.forEachOf(transactions, async (transaction, key, callback) => {
      const bibRecordId = transaction.bib_record_id;
      const itypeCodeNum = transaction.itype_code_num;
      const itemRecordId = transaction.item_record_id;
      const itemLocationCode = transaction.item_location_code;
      const ptypeCode = transaction.ptype_code;
      const { name } = transaction;
      const theDate = moment(transaction.transaction_gmt).format('YYYY-MM-DD');
      const theHour = moment(transaction.transaction_gmt).hour();

      const newTransaction = {
        day: theDate,
        hour: theHour,
        bib_record_id: bibRecordId,
        itype_code_num: itypeCodeNum,
        item_record_id: itemRecordId,
        item_location_code: itemLocationCode,
        ptype_code: ptypeCode,
        name,
      };

      const matchingTransaction = R.path(['rows', 0], (await circController.getMatchingTransaction(
        newTransaction,
        circClient,
      )));

      if (matchingTransaction) {
        // we found a matching transaction.
        // increment the transaction amount by 1
        if (!development) {
          await circController.incrementTransaction(
            matchingTransaction.id,
            matchingTransaction.transactions,
            circClient,
          );
        }

        incrementedCount += 1;
      } else {
        // we couldn't find a matching transaction.
        // insert a new record
        if (!development) {
          await circController.insertTransaction(
            newTransaction,
            circClient,
          );
        }

        insertCount += 1;
      }
      if (typeof callback === 'function') callback();
    }, (err) => {
      if (err) console.log(Chalk.red(err));

      console.log(Chalk.cyan(`Inserted ${insertCount} record(s)`));
      console.log(Chalk.cyan(`Incremented ${incrementedCount} record(s)`));

      console.log(Chalk.yellow('Cleaning up...'));

      // release our client to the pool
      circClient.release();

      console.log(Chalk.green('---Job finished---'));

      if (!development) {
        jobLogPool.query(`
        UPDATE daily_jobs
        SET last_ran='${moment().format('YYYY-MM-DD')}'
        WHERE name='circ_job'
        `, (jobLogErr, _next) => {
          if (jobLogErr) console.log(jobLogErr);
          else console.log('Updated JobLog with last_ran date');
        });
      }
    });
  } catch (e) {
    console.log(Chalk.red('There was an error...'));
    console.log(Chalk.red(e));
  }
});

module.exports = app;
