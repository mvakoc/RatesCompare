var fetch = require('node-fetch')
var country = require('countryjs')
var _ = require('lodash')
var json2csv = require('json2csv');
var fs = require('fs');

var countries = country
    .all()
    .map(x => x.ISO.alpha2)
    .filter(x => !!x)
    .map(x => fetch(`https://account.viber.com/api/web/rates/${x}`).then(f => f.json()).catch(() => console.log("error")))

Promise.all(countries).then(x =>
        x.filter(y => y.status === 'success')
        .map(y => y.data.rates)
        .map(y => y.map(f => {
            return {
                'Country Code': f.country_code,
                'Name': f.destination,
                'Value': f.rate.real_value,
                'Currency': f.rate.value.currency_name
            }
        }))
    ).then(x => _.flatten(x))
    .then(x => json2csv({ data: x, fields: ['Country Code', 'Name', 'Value', 'Currency'] }))
    .then(x =>
        fs.writeFile("test.csv", x, function(err) {
            if (err) {
                return console.log(err);
            }

            console.log("The file was saved!");
        }));