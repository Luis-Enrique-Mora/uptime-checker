//* Dependencies
import _data from './data.mjs';
import helpers from './helpers.mjs';

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

    if( phone ) {
        _data.read( 'users', phone, function( error, data ) {
            if( !error ){
                delete data.hashedPassWord;
                callback( 200, data );
            } else {
                callback( 404, { 'Error' : 'Seems like we could not find a person associated with this phone number' } );
            }
        } );
    } else {
        callback( 400, { 'Error' : 'Missing fields' } );
    }
}

//* Users - put
handlers._users.put = function( data, callback ) {
    var user = data.payload;
    let phone = data.queryStringObject.phone;
    //* validation
    let firstName = typeof( user.firstName ) == 'string' && user.firstName.length > 0 ? user.firstName : false;
    let lastName = typeof( user.lastName ) == 'string' && user.lastName.length > 0 ? user.lastName : false;
    phone = typeof( phone ) == 'string' && phone >= 10 ? phone : false;
    let password = typeof( user.password ) == 'string' && user.password.length > 0 ? user.password : false;

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
}

//* Users - delete
handlers._users.delete = function( data, callback ) {
    // check than the phone number is valid
    let phone = data.queryStringObject.phone;
    phone = typeof( phone ) == 'string' && phone.length >= 10 ? phone : false;

    if( phone ) {
        _data.read( 'users', phone, function( error, data ) {
            if( !error && data ){
                _data.delete( 'users', phone, function( error ) {
                    if( !error ) {
                        callback( 200, { 'Success' : 'Deleted successfully' } );
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
                var hashedPassWord = helpers.hash( password );
                if( hashedPassWord == userData.hashedPassword ) {
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


//* ping handler
handlers.ping = function( data, callback ) {
    //* callback a http status code
    callback( 200 );
}

handlers.notFound = function( data, callback ) {
    callback( 404, { 'Error' : 'Route does not exists' } );
}

export default handlers;