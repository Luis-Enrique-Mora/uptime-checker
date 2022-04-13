//* Dependencies
import _data from './data.mjs';
import helpers from './helpers.mjs';
import config from './config.mjs';
import querystring from "querystring";
import https from "https";

//* Resquest handlers

//* Define a request router
const handlers = {};

handlers.users = function( data, callback ) {
    var acceptableMethods = [ 'post', 'get', 'put', 'delete' ];

    if( acceptableMethods.indexOf( data.method ) > -1 ) {
        handlers._users[ data.method ]( data, callback );
    } else {
        callback( 405 );
    }
}

//* container for users subMethods
handlers._users = {};

//* _user methods

//* Users - post
handlers._users.post = function( data, callback ) {
    var user = data.payload;
    //* validation
    let firstName = typeof( user.firstName ) == 'string' && user.firstName.length > 0 ? user.firstName : false;
    let lastName = typeof( user.lastName ) == 'string' && user.lastName.length > 0 ? user.lastName : false;
    let phone = typeof( user.phone ) == 'string' && user.phone.length > 0 ? user.phone : false;
    let password = typeof( user.password ) == 'string' && user.password.length > 0 ? user.password : false;
    let tosAgreement = typeof( user.tosAgreement ) == 'string' && user.tosAgreement.length > 0 ? user.tosAgreement : false;

    if( firstName && lastName && phone && password && tosAgreement ) {
        _data.read( 'users', phone, function( error, data ) {
            // check if user with same phone already exists
            if( error ){
                let hashedPassword = helpers.hash( password );
                // create the user object 
                if( hashedPassword ){
                    let userObject = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'hashedPassword' : hashedPassword,
                        'tosAgreement' : true
                    };

                    _data.create( 'users', phone, userObject, function( error ) {
                        if( !error ){
                            callback( 201 , { 'Success' : 'User created' } );
                        } else {
                            callback( 500, { 'Error' : 'Could not crete the new user' } );
                        }
                    } );
                } else {
                    callback( 500, { 'Error' : 'Could hash the password' } );
                }

            } else {
                callback( 400 , { 'Error' : 'User with that phone number already exists' } );
            }
        } );
    } else {
        callback( 400, { 'Error' : 'Missing values' } );
    }
}

//* Users - get
handlers._users.get = function( data, callback ) {
    // check than the phone number is valid
    let phone = data.queryStringObject.phone;
    phone = typeof( phone ) == 'string' && phone.length >= 10 ? phone : false;
    // get token from headers
    let token = data.headers.token;
    token = typeof( token ) == 'string' && token.length == 20 ? token : false;

    // verify token valididy
    handlers._tokens.verifyToken( token, phone, function( tokenIsValid ){
        if( tokenIsValid ) {
            if( phone ) {
                _data.read( 'users', phone, function( error, userData ) {
                    if( !error ){
                        delete userData.hashedPassword;
                        callback( 200, userData );
                    } else {
                        callback( 404, { 'Error' : 'Seems like we could not find a person associated with this phone number' } );
                    }
                } );
            } else {
                callback( 400, { 'Error' : 'Missing fields' } );
            }
        } else {
            callback( 401 );
        }
    } );
}

//* Users - put
handlers._users.put = function( data, callback ) {
    // get token from headers
    let token = data.headers.token;
    var user = data.payload;
    let phone = data.queryStringObject.phone;
    //* validation
    let firstName = typeof( user.firstName ) == 'string' && user.firstName.length > 0 ? user.firstName : false;
    let lastName = typeof( user.lastName ) == 'string' && user.lastName.length > 0 ? user.lastName : false;
    phone = typeof( phone ) == 'string' && phone >= 10 ? phone : false;
    let password = typeof( user.password ) == 'string' && user.password.length > 0 ? user.password : false;

    token = typeof( token ) == 'string' && token.length == 20 ? token : false;

    // verify token valididy
    handlers._tokens.verifyToken( token, phone, function( tokenIsValid ){
        if( tokenIsValid ) {
            if( phone ) {
                // checking if nothing is sent to update
                if( firstName || lastName || password ) {
                    _data.read( 'users', phone, function( error, userData) {
                        if( !error && userData ) {
                            if( firstName ) {
                                userData.firstName = firstName;
                            } else if( lastName ) {
                                userData.lastName = lastName;
                            } else if( password ) {
                                userData.hashedPassword = helpers.hash( password );
                            }
                            
                            _data.update( 'users', phone, userData, function( error ) {
                                if( !error ) {
                                    callback( 200, { 'Success' : 'User updated successfully' } );
                                } else {
                                    callback( 400, { 'Error' : 'could not update the user' } );
                                }
                            } );
                        } else {
                            callback(404, { 'Error': 'Specified user does not exists' } );
                        }
                    });
                } else {
                    callback( 400, { 'Error' : 'You did not send values to update' } );
                }
            } else {
                callback( 400, { 'Error' : 'Missing required field' } );
            }
            
        } else {
            callback( 401 );
        }
    } );

}

//* Users - delete
handlers._users.delete = function( data, callback ) {
    // check than the phone number is valid
    let phone = data.queryStringObject.phone;
    phone = typeof( phone ) == 'string' && phone.length >= 10 ? phone : false;
    // get token from headers
    let token = data.headers.token;
    token = typeof( token ) == 'string' && token.length == 20 ? token : false;

    // verify token valididy
    handlers._tokens.verifyToken( token, phone, function( tokenIsValid ){
        if( tokenIsValid ) {
            if( phone ) {
                _data.read( 'users', phone, function( error, userData ) {
                    if( !error && userData ){
                        _data.delete( 'users', phone, function( error ) {
                            if( !error ) {
                                let userChecks = typeof( userData.checks ) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                let checksToDelete = userChecks.length;
                                let checksDeleted = 0;
                                let deletionErrors = false;

                                if( checksToDelete > 0 ) {
                                    userChecks.forEach( checkId => {
                                        // delete check
                                        _data.delete( 'checks', checkId, function( error ) {
                                            if( error ) {
                                                deletionErrors = true;
                                            }
                                            checksDeleted ++;
                                            if( checksDeleted == checksToDelete ) {
                                                if( !deletionErrors ) {
                                                    callback( 200, {' Success' : 'User deleted with his respectively checks' } );
                                                }
                                                else {
                                                    callback( 500, { 'Error' : 'There were errors while attempting to delete user checks' } );
                                                }
                                            }

                                        } );
                                    } );
                                } else {
                                    callback( 200, { 'Success' : 'Deleted successfully' } );
                                }
                            } else {
                                callback( 400, { 'Error' : 'Could not delete this user' } );
                            }
                        });
                    } else {
                        callback( 404, { 'Error' : 'Seems like we could not find a person associated with this phone' } );
                    }
                } );
            } else {
                callback( 400, { 'Error' : 'Missing fields' } );
            }
        } else {
            callback( 401 );
        }
    } );
}

handlers.tokens = function( data, callback ) {
    var acceptableMethods = [ 'post', 'get', 'put', 'delete' ];

    if( acceptableMethods.indexOf( data.method ) > -1 ) {
        handlers._tokens[ data.method ]( data, callback );
    } else {
        callback( 405 );
    }
}

// *Container for all the tokens methods
handlers._tokens = {};

// token - post
handlers._tokens.post = function( data, callback ) {
    var user = data.payload;
    let phone = typeof( user.phone ) == 'string' && user.phone >= 10 ? user.phone : false;
    let password = typeof( user.password ) == 'string' && user.password.length > 0 ? user.password : false;

    if( phone && password ) {
        //Lookup the user who matches that phone number
        _data.read( 'users', phone, function( error, userData ) {
            if( !error && userData ) {
                var hashedPassword = helpers.hash( password );
                if( hashedPassword == userData.hashedPassword ) {
                    // if valid, create new token with random name. set expiration date 1 hour in the future
                    let tokenID = helpers.createRandomString( 20 );
                    let expires = Date.now() + 1000 * 60 * 60;

                    const tokenObject = {
                        'phone' : phone,
                        'id' : tokenID,
                        'expires' : expires
                    };
                    //store the token
                    _data.create( 'tokens', tokenID, tokenObject, function( error ) {
                        if( !error ) {
                            callback( 201, tokenObject );
                        } else {
                            callback( 500, {'Error' : 'Failed to create token' } );
                        }
                    } );
                } else {
                    callback( 401, { 'Error' : 'Unauthorized, password didn\'t match' } );
                }
            } else {
                callback( 404, { 'Error' : 'Could not find specified user' } );
            }
        } );
    } else {
        callback( 400, { 'Error' : 'Missing required field(s)' } );
    }

}

handlers._tokens.get = function( data, callback ) {
    // check than the id number is valid
    let id = data.queryStringObject.id;
    id = typeof( id ) == 'string' && id.length == 20 ? id : false;

    if( id ) {
        _data.read( 'tokens', id, function( error, tokenData ) {
            if( !error && tokenData ){
                callback( 200, tokenData );
            } else {
                callback( 404 );
            }
        } );
    } else {
        callback( 400, { 'Error' : 'Missing field(s)' } );
    }
}

handlers._tokens.put = function( data, callback ) {
    let tokenData = data.payload;
    let id = typeof( tokenData.id ) == 'string' && tokenData.id.length == 20 ? tokenData.id : false;
    let extend = typeof( tokenData.extend ) == 'boolean' && tokenData.extend == true ? true : false;

    if( id && extend ) {
        _data.read( 'tokens', id, function( error, token ) {
            if( !error && token ) {
                if( token.expires > Date.now() ) {
                    token.expires = Date.now() + 1000 * 60 * 60;
                    _data.update( 'tokens', id, token, function( error ) {
                        if( !error ) {
                            callback( 200, { 'Success' : 'Token updated, your session have one hour left' } );
                        } else {
                            callback( 500, { 'Error' : 'Could not update the token expiration'})
                        }
                    } );
                } else {
                    callback( 400, { 'Error' : 'Couldn\'t update the token, token already expired' } );
                }
            } else {
                callback( 500, { 'Error' : 'Could read token to update the token expiration' } );
            }
        } );
    } else {
        callback( 400, { 'Error' : 'Missing field(s) required' } );
    }
}

handlers._tokens.delete = function( data, callback ) {
    // check than the id is valid
    let id = data.queryStringObject.id;
    id = typeof( id ) == 'string' && id.length == 20 ? id : false;

    if( id ) {
        _data.read( 'tokens', id, function( error, data ) {
            if( !error && data ){
                _data.delete( 'tokens', id, function( error ) {
                    if( !error ) {
                        callback( 200, { 'Success' : 'Deleted successfully' } );
                    } else {
                        callback( 400, { 'Error' : 'Could not delete this token' } );
                    }
                });
            } else {
                callback( 404, { 'Error' : 'Seems like we could not find a token associated with this id' } );
            }
        } );
    } else {
        callback( 400, { 'Error' : 'Missing fields' } );
    }
}

handlers._tokens.verifyToken = function( id, phone, callback ) {
    _data.read( 'tokens', id, function( error, tokenData ) {
        if( !error && tokenData ) {
            if( tokenData.phone == phone && tokenData.expires > Date.now() ) {
                callback( true );
            } else {
                callback( false );
            }
        } else {
            callback( false );
        }
    } );
}

handlers.checks = function( data, callback ) {
    var acceptableMethods = [ 'post', 'get', 'put', 'delete' ];

    if( acceptableMethods.indexOf( data.method ) > -1 ) {
        handlers._checks[ data.method ]( data, callback );
    } else {
        callback( 405, { 'Error' : 'Method not allowed' } );
    }
}

handlers._checks = {};
/**
 * @param { object } data containing req properties
 * @param callback function( statusCode, Message )
 */
handlers._checks.post = function( data, callback ) {
    let check = data.payload;
    // * validate inputs
    let protocol = typeof( check.protocol ) == 'string' && [ 'https', 'http' ].indexOf( check.protocol ) > -1 ? check.protocol : false;
    let url = typeof( check.url ) == 'string' && check.url.trim().length > 0 ? check.url.trim() : false;
    let method = typeof( check.method ) == 'string' && [ 'get', 'post', 'put', 'delete' ].indexOf( check.method ) > -1 ? check.method : false;
    let successCodes = typeof( check.successCodes ) == 'object' && check.successCodes instanceof Array && check.successCodes.length > 0 ? check.successCodes : false;
    let timeOutSeconds = typeof( check.timeOutSeconds ) == 'number' && check.timeOutSeconds % 1 === 0 && check.timeOutSeconds > 1 && check.timeOutSeconds < 5 ? check.timeOutSeconds : false;

    // get token from headers
    let token = data.headers.token;
    token = typeof( token ) == 'string' && token.length == 20 ? token : false;

    if( protocol && url && method && successCodes && timeOutSeconds ) {
        _data.read( 'tokens', token, function( error, tokenData ) {
            if( !error && tokenData ) {
                let userPhone = tokenData.phone;

                // lookup the user data
                _data.read( 'users', userPhone, function( error, userData ) {
                    if( !error && userData ) {
                        let userChecks = typeof( userData.checks ) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                        // verify that the user has less than the number of max-checks allowed per user
                        if( userChecks.length < config.maxChecks ) {
                            // create random id for the new check
                            let checkId = helpers.createRandomString( 20 );

                            // Create the check object, and include the user's phone
                            let checkObject = {
                                'id' : checkId,
                                'userPhone' : userPhone,
                                'protocol' : protocol,
                                'url' : url,
                                'method' : method,
                                'successCodes' : successCodes,
                                'timeOutSeconds' : timeOutSeconds
                            };

                            // Save object
                            _data.create( 'checks', checkId, checkObject, function( error ) {
                                if( !error ) {
                                    //Add the check id to the user's object
                                    userData.checks = userChecks;
                                    userData.checks.push( checkId );

                                    // Save the new user data
                                    _data.update( 'users', userPhone, userData, function( error ) {
                                        if( !error ) {
                                            callback( 201, checkObject );
                                        } else {
                                            callback( 500, { 'Error' : 'failed trying to add the new check id to the user' } );
                                        }
                                    } );
                                } else {
                                    callback( 500, { 'Error' : 'Could not create the new check'} );
                                }
                            } );
                        } else {
                            callback( 400, { 'Error' : 'User has exceed the number of checks allowed, max-check = 5'} );
                        }
                    } else {
                        callback( 403, { 'Error' : 'failed to authenticate token' } );
                    }
                } );
            } else {
                callback( 500, { 'Error' : 'failed to authenticate token' } );
            }
        } );
    } else {
        callback( 400, { 'Error' : 'Missing required input values, or inputs are not valid' } );
    }
}

handlers._checks.get = function( data, callback ) {
    // check than the chech-id is valid
    let checkId = data.queryStringObject.id;
    checkId = typeof( checkId ) == 'string' && checkId.length == 20 ? checkId : false;
    // get token from headers
    let token = data.headers.token;
    token = typeof( token ) == 'string' && token.length == 20 ? token : false;

    _data.read( 'checks', checkId, function( error, checkData ) {
        if( !error && checkData ) {
            // verify token validity
            handlers._tokens.verifyToken( token, checkData.userPhone, function( tokenIsValid ) {
                if( tokenIsValid ) {
                    callback( 200, checkData );
                } else {
                    callback( 401, { 'Error' : 'You are not allowed to check this data' } );
                }
            } );
        } else {
            callback( 404 );
        }
    } );
}

handlers._checks.put = function( data, callback ) {
    // check than the check-id is valid
    let checkId = data.queryStringObject.id;
    let check = data.payload;
    let token = data.headers.token;

    // * validate inputs
    token = typeof( token ) == 'string' && token.length == 20 ? token : false;
    checkId = typeof( checkId ) == 'string' && checkId.length == 20 ? checkId : false;
    let protocol = typeof( check.protocol ) == 'string' && [ 'https', 'http' ].indexOf( check.protocol ) > -1 ? check.protocol : false;
    let url = typeof( check.url ) == 'string' && check.url.trim().length > 0 ? check.url.trim() : false;
    let method = typeof( check.method ) == 'string' && [ 'get', 'post', 'put', 'delete' ].indexOf( check.method ) > -1 ? check.method : false;
    let successCodes = typeof( check.successCodes ) == 'object' && check.successCodes instanceof Array && check.successCodes.length > 0 ? check.successCodes : false;
    let timeOutSeconds = typeof( check.timeOutSeconds ) == 'number' && check.timeOutSeconds % 1 === 0 && check.timeOutSeconds > 1 && check.timeOutSeconds < 5 ? check.timeOutSeconds : false;

    if( checkId ) {
        if( protocol || url || method || successCodes || timeOutSeconds ) {
            _data.read( 'checks', checkId, function( error, checkData ) {
                if( !error && checkData ) {
                    handlers._tokens.verifyToken( token, checkData.userPhone, function( tokenIsValid ) {
                        if( tokenIsValid ) {
                            if( protocol ) {
                                checkData.protocol = protocol;
                            }
                            if( url ) {
                                checkData.url = url;
                            }
                            if( method ) {
                                checkData.method = method;
                            } 
                            if( successCodes ) {
                                checkData.successCodes = successCodes
                            }
                            if( timeOutSeconds ) {
                                checkData.timeOutSeconds = timeOutSeconds;
                            }

                            // store the new updates
                            _data.update( 'checks', checkId, checkData, function( error ) {
                                if( !error ) {
                                    callback( 200, checkData );
                                } else {
                                    callback( 500, { 'Error' : 'Error updating check' } );
                                }
                            } );
                        } else {
                            callback( 401, { 'Error' : 'You are not allowed to update this data, send a valid token' } );
                        }
                    } );
                } else {
                    callback( 400, { 'Error' : 'Check id do not exists' } );
                }
            } );
        } else {
            callback( 400, { 'Error' : 'Empty payload, you did not send values to update' } );
        }
    } else {
        callback( 400, { 'Error' : 'Missing required field or is invalid, id MOST be a string of 20 characters' } );
    }

}

handlers._checks.delete = function( data, callback ) {
    // check than the id number is valid
    let checkId = data.queryStringObject.id;
    checkId = typeof( checkId ) == 'string' && checkId.length == 20 ? checkId : false;
    // get token from headers
    let token = data.headers.token;
    token = typeof( token ) == 'string' && token.length == 20 ? token : false;

    //lookup the check
    _data.read( 'checks', checkId, function( error, checkData ) {
        if( !error && checkData ) {
            // verify token valididy
            handlers._tokens.verifyToken( token, checkData.userPhone, function( tokenIsValid ){
                if( tokenIsValid ) {
                    // delete check data
                    _data.delete( 'checks', checkId, function( error ) {
                        if( !error ) {
                            _data.read( 'users', checkData.userPhone, function( error, userData ) {
                                if( !error && userData ) {
                                    let userChecks = typeof( userData.checks ) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                                    let checkPosition = userChecks.indexOf( checkId );
                                    if( checkPosition > -1 ) {
                                        userChecks.splice( checkPosition, 1 );
                                        // re-save the user data
                                        _data.update( 'users', userData.phone, userData, function( error ) {
                                            if( !error ) {
                                                callback( 200, { 'Success' : 'Check deleted successfully' } );
                                            } else {
                                                callback( 500, { 'Error' : 'Could not remove check from user object' } );
                                            }
                                        } );
                                    } else {
                                        callback( 500, { 'Error' : 'could not find check on the user object, so it was not remove from user object' } );
                                    }
                                } else {
                                    callback( 500, { 'Error' : 'Could not find user who created this check, so could not remove check from the user object'} );
                                }
                            } );
                        } else {
                            callback( 500, { 'Error' : 'Could not delete the check data' } );
                        }
                    } );
                } else {
                    callback( 401 );
                }
            } );
        } else {
            callback( 404, { 'Error' : 'Check does not exits' } );
        }
    } );
}

handlers.sendTwilioSms = function( phone, msg, callback ) {
    phone = typeof( phone ) == 'string' && phone.trim().length >= 8 && phone.trim().length <= 11 ? phone.trim() : false;
    msg = typeof( msg ) == 'string' && msg.trim().length > 0 && msg.trim().length < 1600 ? msg : false;

    if( phone && msg ) {
        // configure the request payload
        let payload = {
            'From' : config.twilio.fromPhone,
            'To' : '+' + phone,
            'Body' : msg,
        };

        let stringPayload = querystring.stringify( payload );

        let requestDetails = {
            'protocol' : 'https:',
            'hostname' :'api.twilio.com',
            'method' : 'POST',
            'path' : '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
            'auth' : config.twilio.accountSid + ':' + config.twilio.authToken,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-length' : Buffer.byteLength( stringPayload )
            }
        };

        let req = https.request( requestDetails, function( response ){
            // Grab the status of the sent request
            var status = response.statusCode;

            // Callback successfully if the request went through
            if( status == 200 || status == 201 ) {
                callback( false );
            } else {
                callback( 'Status code : ' + status );
            }
        } );
        req.on( 'error', function(e) {
            callback(e);
        } );

        req.write( stringPayload );
        req.end();

    } else {
        callback( 'Invalid inputs, phone or msg values are not valid' );
    }
}

//* ping handler
handlers.ping = function( data, callback ) {
    //* callback a http status code
    callback( 200 );
}

handlers.notFound = function( data, callback ) {
    callback( 404, { 'Error' : 'Route does not exists' } );
}

export default handlers;
