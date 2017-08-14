var config = {}

config.endpoint = process.env.ENDPOINT;
config.instrumentationKey = process.env.INSTRUMENTATIONKEY;
config.insights = process.env.INSIGHTS || false;

module.exports = config;
