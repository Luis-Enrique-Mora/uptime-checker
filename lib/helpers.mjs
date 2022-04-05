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

// create a string of alphanumeric characters, of a given length
helpers.createRandomString = function( strLength ) {
    strLength =  typeof( strLength ) == 'number' && strLength > 0 ? strLength : false;
    
    if( strLength ) {
        let posibleChrarcters = '0123456789qwertyuiopasdfghjklzxcvbnm';
        let str = '';
        for( let i = 1; i <= strLength; i++ ) {
            let randomCharacter = posibleChrarcters.charAt( Math.random() * posibleChrarcters.length );
            str += randomCharacter;
        }
        return str;
    } else {
        return false;
    }
}

export default helpers;