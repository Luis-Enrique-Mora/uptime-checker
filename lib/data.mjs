/**
 * library fo storing and editing data
 */

//* Dependencies

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import helpers from './helpers.mjs'

//* container for modules (to be exported)
const lib = {};
// data path
const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
//* Base directory of the data folder
lib.baseDir = path.join( __dirname, '/../data/' );

//* write data to a file
lib.create = function( dir, file, data, callback ){
    fs.open( lib.baseDir+dir+'/'+file+'.json', 'wx', function( error, fileDescriptor ){
        if( !error && fileDescriptor ){
            //*convert data to string
            let stringData = JSON.stringify( data );

            //* write file and close it
            fs.writeFile( fileDescriptor, stringData, function( error ){
                if(!error){

                    fs.close( fileDescriptor, function( error ){

                        if( !error ) {
                            callback( false );
                        } else {
                            callback( 'Error closing file' );
                        }

                    } );

                } else {
                    callback( 'Error writing to new file' );
                }
            } );
        } else {
            callback( 'Could not open the new file, it may already exist.' );
        }
    } );
};

lib.read = function( dir, file, callback ){
    fs.readFile( lib.baseDir+dir+'/'+file+'.json', 'utf8', function( error, data ){
        if( !error && data ){
            try {
                let dataToObj = helpers.parseJsonToObject( data );
                callback( false, dataToObj );
            } catch (error) {
                console.error(error);
            }
        } else {
            callback( error, data );
        }
    } );
};

lib.update = function( dir, file, data, callback ){
    fs.open( lib.baseDir+dir+'/'+file+'.json', 'r+', function( error, fileDescriptor ){
        if( !error && fileDescriptor ) {
            let stringData = JSON.stringify( data );

            //* truncatr the file
            fs.ftruncate( fileDescriptor, function( error ){
                if( !error ){
                    fs.writeFile( fileDescriptor, stringData, function( error ){
                        if( !error ){
                            callback( false );
                        } else {
                            callback( 'Error writing file' );
                        }
                    } );
                } else {
                    callback( 'Error truncating file');
                }
            } );
        } else {
            callback( 'failing closing file' );
        }
    } );
};

lib.delete = function( dir, file, callback ){
    fs.unlink( lib.baseDir+dir+'/'+file+'.json', function( error ){
        if( !error ){
            callback(false);
        } else {
            callback( 'Error deleting file' );
        }
    } );
};
// list all files in a directory
lib.list = function( dir, callback ) {
    fs.readdir( lib.baseDir + dir + '/', function( error, data ) {
        if( !error && data && data.length > 0 ) {
            var trimmedFileNames = [];
            data.forEach( fileName => {
                trimmedFileNames.push( fileName.replace( '.json', '' ));
            } );
            callback( false, trimmedFileNames );
        } else {
            callback( error, data );
        }
    } );
}

export default lib;