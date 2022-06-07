/**
 * CLI-Related Tasks
 */

 // Dependencies
import readline from 'readline';
import util from 'util';
var debug = util.debuglog( 'cli' );
import events from 'events';

class _events extends events {};

var e = new _events();

// Intantiate the CLI module object
var cli = {};

cli.processInput = ( str ) => {
    str = typeof( str ) == 'string' && str.trim().length > 0 ? str.trim() : false;

    if( str ) {
        // Codify the unique strings that indentify the unique questions allowed to be asked
        var uniqueInputs = [
            'man',
            'help',
            'exit',
            'stats',
            'list users',
            'more user info',
            'list checks',
            'more check info',
            'list logs',
            'more log info'
        ];

        // Go to the possible inputs, emit an event when a match in found
        var matchFound = false;
        uniqueInputs.some( input => {
            if( str.toLowerCase().indexOf( input ) > -1 ) {
                e.emit( input, str );
                matchFound = true;
                return true;
            }
        } );

        // If no match found, tell the user to try again
        if( !matchFound ) {
            console.log( 'Sorry try again' );
        }
    }
};

cli.init = () => {
    // * Send the start CLI message to the console
    console.log( '\x1b[34m%s\x1b[0m' ,`Uptime CLI is runnig` );

    // Start the interface
    var _interface = readline.createInterface( {
        input : process.stdin,
        output : process.stdout,
        prompt : ''
    } );

    // Create an initial prompt
    _interface.prompt();

    // Handle each line on input separately
    _interface.on( 'line', (str) => {
        // Send to the input processor
        cli.processInput( str );

        // Re-initialize the prompt afterwards
        _interface.prompt();

    } );

    // If the user stops the CLI, kill the associated process
    _interface.on( 'close', () => process.exit( 0 ) );
};

export default cli;