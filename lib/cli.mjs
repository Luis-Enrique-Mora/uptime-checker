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

// Input handlers
e.on( 'man', str => {
    cli.responders.help();
} );

e.on( 'help', str => {
    cli.responders.help();
} );

e.on( 'exit', str => {
    cli.responders.exit();
} );

e.on( 'stats', str => {
    cli.responders.stats();
} );

e.on( 'list users', str => {
    cli.responders.listUsers();
} );

e.on( 'more user info', str => {
    cli.responders.moreUserInfo( str );
} );

e.on( 'list checks', str => {
    cli.responders.listChecks( str );
} );

e.on( 'more check info', str => {
    cli.responders.moreCheckInfo( str );
} );

e.on( 'list logs', str => {
    cli.responders.listLogs();
} );

e.on( 'more log info', str => {
    cli.responders.moreLogInfo( str );
} );
// Responders object
cli.responders = {};

// Help / man
cli.responders.help = () => {
    console.log( 'You asked for help' );
};

cli.responders.exit = () => {
    console.log( 'You asked for exit' );
}

cli.responders.stats = () => {
    console.log( 'You asked for stats' );
}

cli.responders.listUsers = () => {
    console.log( 'You asked for listing users' );
}

cli.responders.moreUserInfo = ( str ) => {
    console.log( 'You asked for more user info', str );
}

cli.responders.listChecks = () => {
    console.log( 'You asked for list of checks' );
}

cli.responders.moreCheckInfo = ( str ) => {
    console.log( 'You asked for more check info', str );
}

cli.responders.listLogs = ( ) => {
    console.log( 'You asked for list logs' );
}

cli.responders.moreLogInfo = ( str ) => {
    console.log( 'You asked for more log info', str );
}


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
        prompt : '>'
    } );

    // Create an initial prompt
    _interface.prompt();

    // Handle each line on input separately
    _interface.on( 'line', str => {
        // Send to the input processor
        cli.processInput( str );

        // Re-initialize the prompt afterwards
        _interface.prompt();

    } );

    // If the user stops the CLI, kill the associated process
    _interface.on( 'close', () => process.exit( 0 ) );
};

export default cli;