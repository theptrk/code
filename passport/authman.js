var express = require('express');
var router = express.Router();

const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// used to generate random bytes
const randomBytes = require('util').promisify(require('crypto').randomBytes);

// TODO factor out `createUser` and `findUser` functions
// This cannot be a seperate library until these features are abstracted
const User = require('../db/models').User;
const Op = require('sequelize').Op;

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
                // TODO flash
                return done(null, false, { message: "user does not exist"});
            }
            if (!bcrypt.compareSync(password, user.password)) {
                // TODO flash 'user and password combination is wrong'
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

// Step X: Check authentication middleware
const isAuthenticated = (req, res, next) => 
    (req.isAuthenticated() ? next(): res.redirect('/'))

// DELETE THIS or allow users to override this
router.get('/profile', isAuthenticated, (req, res) => {
    return res.render('auth/profile', { email: req.user.email })
})

// Step X: Forgot password
router.get('/forgotpassword', (req, res) => res.render('auth/forgotpassword'));
router.post('/forgotpassword', (req, res) => 
    User.find({ where: {email: req.body.email }})
    .then(user => user ? user: Promise.reject('no user'))
    .then(user => {
        return randomBytes(48).then(random => [user, random.toString('hex')])
    })
    .then(([user, resetPasswordToken]) => {
        user.resetPasswordExpiry = Date.now() + (60*60*1000); // 1 hour later
        user.resetPasswordToken = resetPasswordToken;
        user.save(); // we can ignore this promise
        res.redirect('/forgotpassword')
    })
    .catch(err => {
        // TODO flash message: error sending password reset
        return res.redirect('/forgotpassword')
    }))

router.get('/resetpassword/:token', (req, res) => {
    return User.find({ where: {
        resetPasswordToken: req.params.token,
        resetPasswordExpiry: {
            // the saved date should be greater than right now
            [Op.gte]: Date.now()
        },
    }})
    .then((user) => user ? user: Promise.reject('no user'))
    .then(user => res.render('auth/resetpassword'))
    .catch(err => {
        // TODO flash message: error sending password reset
        return res.redirect('/forgotpassword')
    })
})
router.post('/resetpassword/:token', (req, res) => {
    return User.find({ where: {
        resetPasswordToken: req.params.token,
        resetPasswordExpiry: {
            // the saved date should be greater than right now
            [Op.gte]: Date.now()
        }
    }})
    .then(user => user ? user: Promise.reject('no user'))
    .then(user => {
        user.password = req.body.password;
        user.resetPasswordToken = null;
        user.resetPasswordExpiry = null;
        user.save().then(() => {
            return res.redirect('/login');
        })
    })
    // TODO flash
    .catch(err => res.redirect('/forgotpassword'))
})

// we pass in app to be able to call `app.use`
const init = (app) => {
    app.use(passport.initialize());
    app.use(passport.session());
    app.use('/', router);
}

module.exports = init;

