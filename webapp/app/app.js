const express = require('express')
const exphbs = require('express-handlebars')
const cookieParser = require('cookie-parser')
const createError = require('http-errors')
const helmet = require('helmet')
const LdapStrategy = require('passport-ldapauth').Strategy
const logger = require('morgan')
const passport = require('passport')
const path = require('path')
const session = require('cookie-session')

const indexRouter = require('./routes/index')
const ldapConfigs = require('./auth/ldap')

const app = express()

app.set('views', path.join(__dirname, 'views'))
app.engine('handlebars', exphbs({ defaultLayout: 'layout' }))
app.set('view engine', 'handlebars')

app.use(logger('dev'))
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(session({
  keys: ['cookie-session-tac', 'dockerisawesome-tac', 'webwizards-tac'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

passport.use(new LdapStrategy(ldapConfigs))
app.use(passport.initialize())
app.use(passport.session())
passport.serializeUser((user, done) => {
  done(null, user.dn)
})
passport.deserializeUser((user, done) => {
  done(null, user)
})

app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404))
})

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
