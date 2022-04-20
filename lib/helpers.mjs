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

helpers.getTemplate = function( templateName, callback ) {
    templateName = typeof( templateName ) == 'string' && templateName.length > 0 ? templateName : false;
    if( templateName ) {
        fs.readFile( templateDir + templateName + '.html', 'utf8', function( error, str ) {
            if( !error && str && str.length > 0 ) {
                callback( false, str );
            } else {
                callback( 'No template found' );
            }
        } );
    } else {
        callback( 'A valid template name was not specifeid' );
    }
}

export default helpers;