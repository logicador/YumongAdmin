var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
    if (!req.session.isAdmin) {
        res.redirect('/login');
        return;
    }

    res.render('index', { 
        menu: 'main',

        isAdmin: req.session.isAdmin
    });
});


router.get('/login', function(req, res) {
    if (req.session.isAdmin) {
        res.redirect('/');
        return;
    }

    res.render('index', {
        menu: 'login',
        
        isAdmin: req.session.isAdmin
    });
});


router.get('/crawler', function (req, res) {
    if (!req.session.isAdmin) {
        res.redirect('/login');
        return;
    }

    res.render('index', {
        menu: 'crawler',
        
        isAdmin: req.session.isAdmin
    });
});


router.get('/place', function (req, res) {
    if (!req.session.isAdmin) {
        res.redirect('/login');
        return;
    }

    res.render('index', {
        menu: 'place',
        
        isAdmin: req.session.isAdmin
    });
});


module.exports = router;
