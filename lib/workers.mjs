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

    originalCheckData.timeOutSeconds = typeof( originalCheckData.timeOutSeconds ) == 'number' && originalCheckData.timeOutSeconds % 1 === 0 && originalCheckData.timeOutSeconds >= 1 && originalCheckData.timeOutSeconds < 5 ? originalCheckData.timeOutSeconds : false;

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
        'timeout' : originalCheckData.timeOutSeconds * 1000
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
    // Update the check data
    let newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    _data.update( 'checks', newCheckData.id, newCheckData, function( error ) {
        if( !error ) {
            if( alertWarrented ) {
                workers.alertUserToStatusChange( newCheckData );
            } else {
                console.log( 'Check outcome has not changed, not alert needed' );
            }
        } else {
            console.log( 'Error trying to save updates to one of the checks' );
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

workers.loop = function() {
    setInterval( function() {
        workers.gatherAllChecks();
    }, 1000 * 60 * 5 );
}

// Init workers
workers.init = function() {
    //Execute all the checks inmediately
    workers.gatherAllChecks();

    // Call loop so the checks will execute later on
    workers.loop();
}

export default workers;