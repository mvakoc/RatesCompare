'use strict';

var fetch = require('node-fetch');
var country = require('countryjs');
var _ = require('lodash');
var json2csv = require('json2csv');
var restify = require('restify');

var server = restify.createServer();
server.listen(process.env.PORT || 3978, function() {
    console.log('server started');
});

server.get('/test', function(req, res) {
    res.send('Hello');
});

server.get('/rates', function(req, res) {
    var countries = country.all().map(function(x) {
        return x.ISO.alpha2;
    }).filter(function(x) {
        return !!x;
    }).map(function(x) {
        return fetch('https://account.viber.com/api/web/rates/' + x).then(function(f) {
            return f.json();
        }).catch(function() {
            return console.log("error");
        });
    });

    Promise.all(countries).then(function(x) {
        return x.filter(function(y) {
            return y.status === 'success';
        }).map(function(y) {
            return y.data.rates;
        }).map(function(y) {
            return y.map(function(f) {
                return {
                    'Country Code': f.country_code,
                    'Name': f.destination,
                    'Value': f.rate.real_value,
                    'Currency': f.rate.value.currency_name
                };
            });
        });
    }).then(function(x) {
        return _.flatten(x);
    }).then(function(x) {
        return json2csv({ data: x, fields: ['Country Code', 'Name', 'Value', 'Currency'] });
    }).then(function(x) {
        return res.send(x);
    });
});