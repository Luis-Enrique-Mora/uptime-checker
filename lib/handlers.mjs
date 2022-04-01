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
                            callback( 201 );
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
                callback( 404, { 'Error' : 'Seems like we could not find a person associated with this phone' } );
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

//* ping handler
handlers.ping = function( data, callback ) {
    //* callback a http status code, and a Payload object
    callback( 200 );
}

handlers.notFound = function( data, callback ) {
    callback( 404, { 'Error' : 'Route does not exists' } );
}

export default handlers;