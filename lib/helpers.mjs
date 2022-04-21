/**
 * Helpers for 
 * -hashing password
 */

//* Dependencies
import crypto from 'crypto';
import environment from './config.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.mjs';


const helpers = {};
// data path
const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
//* Base directory of the data folder
const templateDir = path.join( __dirname, '/../templates/' );

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

helpers.getTemplate = function( templateName, data, callback ) {
    templateName = typeof( templateName ) == 'string' && templateName.length > 0 ? templateName : false;
    if( templateName ) {
        
        fs.readFile( templateDir + templateName + '.html', 'utf8', function( error, str ) {
            if( !error && str && str.length > 0 ) {
                data = typeof( data ) == 'object' && data !== null ? data : {};
                // Do interpolation on text/html
                var finalStrInterpolation = helpers.interpolate( str, data );
                callback( false, finalStrInterpolation );
            } else {
                callback( 'No template found' );
            }
        } );
    } else {
        callback( 'A valid template name was not specifeid' );
    }
}

// Add the universal headers and footer to a string, and pass provided data object to header and footer for interpolation
helpers.addUniversalTemplates = function( str, data, callback ) {
    str = typeof( str ) == 'string' && str.length > 0 ? str : '';
    data = typeof( data ) == 'object' && data !== null ? data : {};

    // Get header
    helpers.getTemplate( '_header', data, function( error, headerString ) {
        if( !error && headerString ) {
            // get footer
            helpers.getTemplate( '_footer', data, function( error, footerString ) {
                if( !error && footerString ) {
                    var fullStrTemplate = headerString + str + footerString;
                    callback( false, fullStrTemplate );
                } else {
                    callback( 'Could not find the footer template' );
                }
            } );
        } else {
            callback( 'Could not find the header template' );
        }
    } );
}

// Take a given string and a data object and find/replace all the keys within it
helpers.interpolate = function( str, data ) {
    str = typeof( str ) == 'string' && str.length > 0 ? str : '';
    data = typeof( data ) == 'object' && data !== null ? data : {};

    // Add the templateGlobals do the same object prepending their key name with "global"
    for( let keyName in config.templateGlobals ) {
        if( config.templateGlobals.hasOwnProperty( keyName ) ) {
            data[ 'global.' + keyName ] = config.templateGlobals[ keyName ];
        }
    }

    for( let keyName in data ) {
        if( data.hasOwnProperty( keyName ) && typeof( data[ keyName ] ) == 'string' ) {
            let replace = data[ keyName ];
            let find = '{' + keyName + '}';

            str = str.replace( find, replace );
        }
    }

    return str;
}

export default helpers;