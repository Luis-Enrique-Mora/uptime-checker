/**
 * *Create and export configuration variables
 */
import secretToken from '../data/secretToken.mjs';

//* container for all the environment

const environment = {};

// * Staging (default) environment
environment.staging = {
    'port' : 3000,
    'envName' : 'staging',
    'hashingSecret' : 'secretHashigString',
    'maxChecks' : 5,
    'twilio' : {
        'fromPhone' : '+15405163615',
        'accountSid' : 'ACed9da0ff3867d8014a7002891d74e84d',
        'authToken' : secretToken
    }
}

//* Production environment
environment.production = {
    'port' : 5000,
    'envName' : 'production',
    'hashingSecret' : 'secretHashigString',
    'maxChecks' : 5
}

//* Determine which environment was passed as a command-line argument
let currentEnvironment = typeof( process.env.NODE_ENV ) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
var environmentToExport = '';
//* Check that the current environment is one of the environments above, if not, default to staging
export default environmentToExport = typeof( environment[ currentEnvironment ] ) == 'object' ? environment[ currentEnvironment ] : environment.staging;

