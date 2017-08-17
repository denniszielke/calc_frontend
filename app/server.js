require('dotenv-extended').load();

var express = require('express');
var app = express();
var morgan = require('morgan');
var request = require('request');

var config = require('./config');

if (config.instrumentationKey){ 
    var appInsights = require('applicationinsights');
    appInsights.setup(config.instrumentationKey).setAutoCollectRequests(true).start();
}

var port = process.env.PORT || 3000;
var publicDir = require('path').join(__dirname, '/public');

// add logging middleware
app.use(morgan('dev'));
app.use(express.static(publicDir));

// Routes
app.get('/ping', function(req, res) {
    console.log('received ping');
    res.send('Pong');
});

app.post('/api/square' , function(req, res) {

    console.log("received client request:");
    console.log(req.headers);
    if (config.instrumentationKey){ 
        var startDate = new Date();
        insightsClient.trackEvent("square-client-call", { value: req.headers.number });
    }

    console.log("requesting bearer token");
    var authOptions = { 
        'url': 'https://login.microsoftonline.com/' + config.tenant + '/oauth2/token',
        'form': 'client_id=' + config.clientId + '&resource='+  config.resource +'&client_secret=' + config.clientSecret + '&grant_type=client_credentials',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };    
    console.log(authOptions);
    console.log("posting oauth2 token endpoint");
    request.post(authOptions, function(autherr, authres, authbody) {
        console.log("received auth error:");
        console.log(autherr);
        // console.log("received auth res");
        // console.log(authres);
        console.log("received auth body:");
        var authToken = JSON.parse(authbody);
        console.log(authToken.expires_in);
        console.log(authToken.access_token);

        var formData = {
            received: new Date().toLocaleString(), 
            number: req.headers.number
        };
        var options = { 
            'url': config.endpoint + '/square/' + req.headers.number,
            'form': formData,
            'headers': req.headers
        };    
        if (config.subscriptionKey){
            options.headers = {
                'Ocp-Apim-Subscription-Key': config.subscriptionKey,
                'Cache-Control': 'no-cache',
                'Authorization': 'Bearer ' + authToken.access_token
            };
        }
        console.log("posting");
        console.log(options);
        request.post(options, function(innererr, innerres, body) {
            var endDate = new Date();
            var duration = endDate - startDate;
            if (innererr){
                console.log("error:");
                console.log(innererr);
                if (config.instrumentationKey){ 
                    insightsClient.trackException(innererr);
                }
            }
            console.log("received response:");
            console.log(body);
            var jresponse = JSON.parse(body);
            console.log(jresponse.value);
            if (config.instrumentationKey){ 
                insightsClient.trackEvent("calculation-client-call-received", { value: jresponse.value });
                insightsClient.trackMetric("calculation-client-call-duration", duration);
            }        
            res.send(body);
        });
    });
       
});

app.post('/api/dummy', function(req, res) {
    console.log("received dummy request:");
    console.log(req.headers);
    if (config.instrumentationKey){ 
        insightsClient.trackEvent("dummy-data-call");
    }
    res.send('42');
});

// Listen
if (config.instrumentationKey){ 
    var insightsClient = appInsights.getClient(config.instrumentationKey);
    insightsClient.trackEvent('app-initializing');
}
app.listen(port);
console.log('Listening on localhost:'+ port);