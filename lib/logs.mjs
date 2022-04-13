/**
 * Library for storing and rotating logs
 */

// * Dependencies
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
//* Module container
const lib = {};

//* Base directory of the data folder
lib.baseDir = path.join( __dirname, '/../logs/' );

// append a string to a file, create the file if it does not exists
lib.append = function( file, str, callback ) {
    fs.open( lib.baseDir + file + '.log', 'a', function( error, fileDescriptor ) {
        if( !error && fileDescriptor ) {
            fs.appendFile( fileDescriptor, str + '\n', function( error ) {
                if( !error ) {
                    fs.close( fileDescriptor, function( error ) {
                        if( !error ) {
                            callback( false );
                        } else {
                            callback( 'Error closing file' );
                        }
                    } );
                } else {
                    callback( 'Error closing file that was being appended' );
                }
            } );
        } else {
            callback( 'Could not open file for appending' );
        }
    } );
}

// list all the logs, and optionally include the compressed logs
lib.list = function( includeCompressedLogs, callback ) {
    fs.readdir( lib.baseDir, function( error, data ) {
        if( !error && data && data.length > 0 ) {
            let trimmedFileNames = [];
            data.forEach( fileName => {
                // Add the .log files
                if( fileName.indexOf( '.log' ) > -1 ) {
                    trimmedFileNames.push( fileName.replace( '.log', '' ) );
                }

                // Add on the .gz files
                if( fileName.indexOf( '.gz.b64' ) > -1 && includeCompressedLogs ) {
                    trimmedFileNames.push( fileName.replace( '.gz.b64'), '' );
                }

            } );
            callback( false, trimmedFileNames );
        } else {
            callback( error, data );
        }
    } );
}

// compress the contents of one .log file into a .gz.b64 file within the same directory
lib.compress = function( logId, newFileId, callback ) {
    let sourceFile = logId + '.log';
    let destFile = newFileId + '.gz.b64';

    // Read the source file
    fs.readFile( lib.baseDir + sourceFile, 'utf8', function( error, inputString ) {

        if( !error && inputString ) {
            // Compress the data using gzip
            zlib.gzip( inputString, function( error, buffer ) {
                if( !error && buffer ) {
                    // Send the data to the destintion file
                    fs.open( lib.baseDir + destFile, 'wx', function( error, fileDescriptor ) {
                        if( !error && fileDescriptor ) {
                            // write file to the destination file
                            fs.writeFile( fileDescriptor, buffer.toString( 'base64' ), function( error ) {
                                if( !error ) {
                                    fs.close( fileDescriptor, function( error ) {
                                        if( !error ) {
                                            callback( false );
                                        } else {
                                            callback( error );
                                        }
                                    } );
                                } else {
                                    callback( error );
                                }
                            } );
                        } else {
                            callback( error );
                        }
                    } );
                } else {
                    callback( error );
                }
            } );
        } else {
            callback( error );
        }
    } );
}

lib.decompress = function( fileId, callback ) {
    let fileName = fileId + '.gz.b64';

    fs.readFile( lib.baseDir + fileName, 'utf8', function( error, str ) {
        if( !error && str ) {
            let inputBuffer = Buffer.from( str, 'base64');
            zlib.unzip( inputBuffer, function( error, outputBuffer ) {
                if( !error && outputBuffer ) {
                    let str = outputBuffer.toString();
                    callback( false, str );
                } else {
                    callback( error );
                }
            } );
        } else {
            callback( error );
        }
    } );
}

lib.truncate = function( logId, callback ) {
    fs.truncate( lib.baseDir + logId + '.log', 0, function( error ) {
        if( !error ) {
            callback( false );
        } else {
            callback( error );
        }
    } );
}

export default lib;