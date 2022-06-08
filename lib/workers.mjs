/**
 * Worker-related tasks
 */

//* Dependencies
import path from 'path';
import fs from 'fs';
import _data from './data.mjs';
import https from 'https';
import http from 'http';
import helpers from './helpers.mjs';
import url from 'url';
import handlers from './handlers.mjs';
import _logs from './logs.mjs';
import util from 'util';
// To see this messages in the console execute NODE_DEBUG=workers node index.mjs
var debug =  util.debuglog( 'workers' );

// Instantiate the worker object
const workers = {};

workers.gatherAllChecks = function() {
    // Get all the checks
    _data.list( 'checks', function( error, checks ) {
        if( !error && checks && checks.length > 0 ) {
            checks.forEach( check => {
                // read the check data
                _data.read( 'checks', check, function( error, originalCheckData ) {
                    if( !error && originalCheckData ) {
                        workers.validateCheckData( originalCheckData );
                    } else {
                        console.error( 'Error : Could not read ' + originalCheckData + 'check' );
                    }
                } );
            } );
        } else {
            console.error( 'Error : could not find any check to process' );
        }
    } );
}

workers.validateCheckData = function( originalCheckData ) {
    originalCheckData = typeof( originalCheckData ) == 'object' && originalCheckData !== null ? originalCheckData : {};

    originalCheckData.id = typeof( originalCheckData.id ) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id : false;

    originalCheckData.userPhone = typeof( originalCheckData.userPhone ) == 'string' && originalCheckData.userPhone.trim().length >= 8 && originalCheckData.userPhone.trim().length <= 11 ? originalCheckData.userPhone : false;

    originalCheckData.protocol = typeof( originalCheckData.protocol ) == 'string' && [ 'https', 'http' ].indexOf( originalCheckData.protocol ) > -1 ? originalCheckData.protocol : false;

    originalCheckData.url = typeof( originalCheckData.url ) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;

    originalCheckData.method = typeof( originalCheckData.method ) == 'string' && [ 'get', 'post', 'put', 'delete' ].indexOf( originalCheckData.method ) > -1 ? originalCheckData.method : false;

    originalCheckData.successCodes = typeof( originalCheckData.successCodes ) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;

    originalCheckData.timeoutSeconds = typeof( originalCheckData.timeoutSeconds ) == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds < 5 ? originalCheckData.timeoutSeconds : false;

    //if all the checks pass the data along to the next step in the process
    if(
        originalCheckData.id &&
        originalCheckData.userPhone &&
        originalCheckData.protocol &&
        originalCheckData.url &&
        originalCheckData.method &&
        originalCheckData.successCodes
    ) {
        workers.performCheck( originalCheckData );
    } else {
        console.error( 'Error : One of the checks did not pass validation.' );
    }
}

workers.performCheck = function( originalCheckData ) {
    // Perpare the initial check outcome
    var checkOutcome = {
        'error' : false,
        'responseCode' : false
    };

    // Mark that the outcome has not been sent yet 
    var outcomeSent = false;

    // Parse the hostname and the path out of the original check data
    let parsedUrl = url.parse( originalCheckData.protocol + '://' + originalCheckData.url, true );
    let hostName = parsedUrl.hostname;
    let path = parsedUrl.path; // Using path and not "pathname" because we want the query string

    //Construct the request
    const requestDetails = {
        'protocol' : originalCheckData.protocol + ':',
        'hostname' : hostName,
        'method' : originalCheckData.method.toUpperCase(),
        'path' : path,
        'timeout' : originalCheckData.timeoutSeconds * 1000
    };

    // Instantiate the request object (using either the http or https module)
    var _moduleToUse = originalCheckData.protocol == 'http' ? http : https;

    var req = _moduleToUse.request( requestDetails, function( response ) {
        // grab the status of the sent request
        let status = response.statusCode;

        // Update the checkOutcome and pass the data along
        checkOutcome.responseCode = status;
        if( !outcomeSent ) {
            workers.procesCheckOutcome( originalCheckData, checkOutcome );
            outcomeSent = true;
        }
    } );

    // Bind to the error event so it doesn't get thrown
    req.on( 'error', function( error ) {
        // Update the checkOutcome and pass the data along
        checkOutcome.error = {
            'error' : true,
            'value' : error
        }
        if( !outcomeSent ) {
            workers.procesCheckOutcome( originalCheckData, checkOutcome );
            outcomeSent = true;
        }
    } );

    req.on( 'timeout', function( error ) {
        // Update the checkOutcome and pass the data along
        checkOutcome.error = {
            'error' : true,
            'value' : 'timeout'
        };

        if( !outcomeSent ) {
            workers.procesCheckOutcome( originalCheckData, checkOutcome );
            outcomeSent = true;
        }
    } );

    req.end();
}

workers.procesCheckOutcome = function( originalCheckData, checkOutcome ) {
    // Decide if the check is considered up or down
    let state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf( checkOutcome.responseCode ) > -1 ? 'up' : 'down';
    // Decide if an alert is warranted
    let alertWarrented = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;
    let timeOfCheck = Date.now();
    workers.log( originalCheckData, checkOutcome, state, alertWarrented, timeOfCheck );
    // Update the check data
    let newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = timeOfCheck;

    _data.update( 'checks', newCheckData.id, newCheckData, function( error ) {
        if( !error ) {
            if( alertWarrented ) {
                workers.alertUserToStatusChange( newCheckData );
            } else {
                debug( 'Check outcome has not changed, not alert needed' );
            }
        } else {
            debug( 'Error trying to save updates to one of the checks' );
        }
    } );
}

workers.alertUserToStatusChange = function( newCheckData ) {
    let msg = 'Alert: Your check for ' + newCheckData.method.toUpperCase() + ' ' + newCheckData.protocol + '://' + newCheckData.url + ' is currently ' + newCheckData.state;

    handlers.sendTwilioSms( newCheckData.userPhone, msg, function( error ) {
        if( !error ) {
            console.info( 'Success: User was alerted to a status change in their check, via sms.', msg );
        } else {
            console.error( 'Error: Could not send sms alert to the user during a changing check.' );
        }
    } );
}

workers.log = function( originalCheckData, checkOutcome, state, alertWarrented, timeOfCheck ) {
    // form log data
    const logData = {
        'check' : originalCheckData,
        'outCome' : checkOutcome,
        'state' : state,
        'alert' : alertWarrented,
        'time' : timeOfCheck
    };

    // convert data to string
    let logString = JSON.stringify( logData );

    // Determine the name of the log file
    let logFileName = originalCheckData.id;

    // Append the log to the string file
    _logs.append( logFileName, logString, function( error ) {
        if( !error ) {
            debug( 'Logging to file succeeded' );
        } else {
            debug( 'Logging to file failed' );
        }
    } );
}

workers.loop = function() {
    setInterval( function() {
        workers.gatherAllChecks();
    }, 1000 * 60 * 5 );
}
// timer to execute the log-rotation process once per day
workers.logRotationLoop = function() {
    setInterval( function(){
        workers.rotateLogs();
    }, 1000 * 60 * 60 * 24 );
}

workers.rotateLogs = function() {
    // List all the (non compressed) log files
    _logs.list( false, function( error, logs ){
        if( !error && logs && logs.length > 0 ) {
            // compress data to a different file
            logs.forEach( logName => {
                let logId = logName.replace( '.log', '' );
                let newFileId = logId + '-' + Date.now();
                _logs.compress( logId, newFileId, function( error ) {
                    if( !error ) {
                        // truncate the log
                        _logs.truncate( logId, function( error ) {
                            if( !error ) {
                                debug( 'Success truncating the file' );
                            } else {
                                debug( 'Error truncating logfile' );
                            }
                        } );
                    } else {
                        debug( 'Error compressing one of the log files', error );
                    }
                } );
            } );
        } else {
            debug( 'Error : could not find any logs to rotate' );
        }
    } );
}

// Init workers
workers.init = function() {
    // Send to console, in yelow that background workers are runnig
    console.log('\x1b[33m%s\x1b[0m', 'Background workers are running');
    //Execute all the checks inmediately
    workers.gatherAllChecks();

    // Call loop so the checks will execute later on
    workers.loop();

    // Compress all the logs inmediately
    workers.rotateLogs();

    // Call the compression loop so will be compressed later on
    workers.logRotationLoop();
}

export default workers;