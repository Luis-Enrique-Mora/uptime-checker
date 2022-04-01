/**
 * Helpers for 
 * -hashing password
 */

//* Dependencies
import crypto from 'crypto';
import environment from '../config.mjs';

const helpers = {};

// * create a hash SHA256 hash

helpers.hash = function( str ) {
    if( typeof( str ) == 'string' && str.length > 0 ) {
        var hash = crypto.createHmac( 'sha256', environment.hashingSecret ).update( str ).digest( 'hex' );

        return hash;
    } else {
        return false;
    }
};

helpers.parseJsonToObject = function ( str ){
    try{
        var obj = JSON.parse( str );
        return obj;
    } catch( e ){
        return {};
    }
};

export default helpers;