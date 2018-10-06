var express = require('express');
var router = express.Router();

const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// TODO factor out `createUser` and `findUser` functions
// This cannot be a seperate library until these features are abstracted
const User = require('../db/models').User;

// user is req.user 
passport.serializeUser((user, done) => {
    // sets req.session.passport.user as our "breadcrumb"
    // note the whole `req.session` object is stringified and saved
    // in the designated `SessionStore` and by default this is in memory (bad)

    // note: the session could 
    return done(null, user.email)
})

// email is req.session.passport.user set in `serializeUser`
passport.deserializeUser((email, done) => {
    // this retrieves the user object and sets req.user
    // `email` was our "breadcrumb" that we left before

    // we could actually get the user from the database here
    return done(null, {
        email,
     })
})

// Step 1: Sign up
const localSignUpName = 'local-signup';
passport.use(
    localSignUpName,
    new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
    }, (email, rawPassword, done) => {
        return User.find({ where: { email } }).then(user => {

            if (user) {
                console.log('user already exists')
                return done(null, false);
            }

            const saltRounds = 12;
            const salt = bcrypt.genSaltSync(saltRounds);
            const password = bcrypt.hashSync(rawPassword, salt)

            return User.create({ email, password })
                .then(user => done(null, user))
                .catch(done)
        }).catch(done)
    })
);

router.get('/signup', (req, res) => res.render('auth/signup'));
router.post('/signup', passport.authenticate(localSignUpName, {
    successRedirect: '/profile',
    failureRedirect: '/signup'
}));

// Step 2: Log in
const localLoginStrategyName = 'local-login';
passport.use(
    localLoginStrategyName,
    new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
    }, (email, password, done) => {
        return User.find({ where: {email} }).then((user) => {
            if (!user) {
                console.log('user doesnt exist')
                return done(null, false, { message: "user does not exist"});
            }
            if (!bcrypt.compareSync(password, user.password)) {
                console.log('user and password combination is wrong')
                return done(null, false);
            }
            return done(null, user);
        }).catch(done)
    })
);
router.get('/login', (req, res) => res.render('auth/login'));
router.post('/login', passport.authenticate(localLoginStrategyName, {
    successRedirect: '/profile',
    failureRedirect: '/login'
}));

// Step 3: Log out
router.get('/logout', (req, res) => {
    req.logout();
    return res.redirect('/');
})

// Step 4: Check authentication middleware
const isAuthenticated = (req, res, next) => 
    (req.isAuthenticated() ? next(): res.redirect('/'))

// DELETE THIS or allow users to override this
router.get('/profile', isAuthenticated, (req, res) => {
    return res.render('auth/profile', { email: req.user.email })
})

// we pass in app to be able to call `app.use`
const init = (app) => {
    app.use(passport.initialize());
    app.use(passport.session());
    app.use('/', router);
}

module.exports = init;
