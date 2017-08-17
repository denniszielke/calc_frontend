var config = {}

config.endpoint = process.env.ENDPOINT;
config.instrumentationKey = process.env.INSTRUMENTATIONKEY;
config.subscriptionKey = process.env.SUBSCRIPTIONKEY;
config.tenant = process.env.TENANT;
config.clientId = process.env.CLIENTID;
config.resource = process.env.RESOURCE;
config.clientSecret = process.env.CLIENTSECRET;

module.exports = config;
