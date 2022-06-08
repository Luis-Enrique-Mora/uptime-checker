/**
 * CLI-Related Tasks
 */

 // Dependencies
import readline from 'readline';
import util from 'util';
var debug = util.debuglog( 'cli' );
import events from 'events';
import os from 'os';
import v8 from 'v8';
import _data from './data.mjs'

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
    var commands = {
        'exit' : 'Kill the cli and the rest of the application',
        'man' : ' Show this help page',
        'help' : 'Alias of the "man" command',
        'stats' : 'Get statistics on the underlying operating system and resourse utilization',
        'list users' : ' Show a list of all the registered (undeleted) users in the system',
        'more user info --{userId}' : 'Show details of a specific user',
        'list checks --up --down' : 'Show a list of all the active checks in the system, including their state. The "--up" and the "--down" flags are both optional',
        'more check info --{checkId}' : 'Show details of a specified check',
        'list logs' : 'Show a list of all the log files available to be read (compressed and uncompressed)',
        'more log info --{filename}' : 'Show details of a specified log file'
    };

    //Show header for the help page that is as wide as the screen
    cli.horizontalLine();
    cli.centered( 'UPTIME CLI MANUAL');
    cli.horizontalLine();
    cli.verticalSpace( 2 );

    // Show each command followed by its explanation, in white and yellow respectively
    for ( let key in commands ) {
        if( commands.hasOwnProperty( key ) ) {
            var value = commands[ key ];
            var line = '\x1b[33m' + key +'\x1b[0m';
            var padding = 60 - line.length;

            for (let i = 0; i < padding; i++) {
                line+= ' '
            }
            line += value;
            console.log( line );
            cli.verticalSpace();
        }
        
    }

    cli.verticalSpace( 1 );
    // End with another horizontalLine
    cli.horizontalLine();
};

// Create a vertical space
cli.verticalSpace = function( lines ) {
    lines = typeof( lines ) == 'number' && lines > 0 ? lines : 1;
    for (let i = 0; i < lines; i++) {
        console.log( '' );
    }
};

// Create a horizontal line across the screen
cli.horizontalLine = () => {
    // Get the available screen size
    var width = process.stdout.columns;
    var line = '';
    for (let i = 0; i < width; i++) {
        line += '-';
    }

    console.log( line );
};

// Create centered text on the screen
cli.centered = str => {
    str = typeof( str ) == 'string' && str.trim().length > 0 ? str.trim() : '';
    // Getting the screen size
    var width = process.stdout.columns;

    // Calculate the left padding there should be
    var leftPadding = Math.floor( ( width - str.length ) / 2 );

    // Put in the left padded spaces before the string itself
    var line = '';
    for (let i = 0; i < leftPadding; i++) {
        line += ' ';
    }

    line += str;
    console.log( line );

};

cli.responders.exit = () => {
    console.log( 'You have exit from uptime cli' );
    process.exit( 0 );
};

cli.responders.stats = () => {
    // Compile an object of stats
    var stats = {
        'Load Average' : os.loadavg().join( ' ' ),
        'CPU Count' : os.cpus().length,
        'Free Memmory' : os.freemem(),
        'Current Malloced Memory' : v8.getHeapStatistics().malloced_memory,
        'Peak Mallocted Memory' : v8.getHeapStatistics().peak_malloced_memory,
        'Allocated Heap Used (%)' : Math.round( (v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
        'Available Heap Allocated (%)' : Math.round( (v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
        'Uptime' : os.uptime() + ' seconds'
    };

    // Create a header for the stats
    cli.horizontalLine();
    cli.centered( 'SYSTEM STATISTICS' );
    cli.horizontalLine();
    cli.verticalSpace( 2 );

    // log out each stat
    for ( let key in stats ) {
        if( stats.hasOwnProperty( key ) ) {
            var value = stats[ key ];
            var line = '\x1b[33m' + key +'\x1b[0m';
            var padding = 60 - line.length;

            for (let i = 0; i < padding; i++) {
                line+= ' '
            }
            line += value;
            console.log( line );
            cli.verticalSpace();
        } 
    }

    cli.verticalSpace( 1 );
    // End with another horizontalLine
    cli.horizontalLine();
};

cli.responders.listUsers = () => {
    _data.list( 'users', function( error, UserIds ) {
        if( !error && UserIds && UserIds.length > 0 ) {
            cli.verticalSpace();
            UserIds.forEach( userId => {
                _data.read( 'users', userId, function( error, userData ) {
                    var line = 'Name: ' +userData.firstName + ' Phone: ' + userData.phone + ' Checks: ';
                    var numberOfChecks = typeof( userData.checks ) == 'object' && userData.checks instanceof Array && userData.checks.length > 0 ? userData.checks.length : 0;

                    line += numberOfChecks;
                    console.log( line );
                    cli.verticalSpace();
                } );
            });
        }
    } );
};

cli.responders.moreUserInfo = ( str ) => {
    // get the ID from the string 
    var arr = str.split( '--' );
    var userId = typeof( arr[ 1 ] ) == 'string' && arr[ 1 ].trim().length > 0 ? arr[ 1 ].trim() : false;

    if( userId ) {

        _data.read( 'users', userId, function( error, userData ) {
            if( !error && userData ) {
                delete userData.hashedPassword;
                cli.verticalSpace();
                console.dir( userData, { 'colors' : true } );
                cli.verticalSpace();
            }
        } );
    }
};

cli.responders.listChecks = ( str ) => {
    var arr = str.split( '--' );
    var option = typeof( arr[ 1 ] ) == 'string' && [ 'up', 'down' ].indexOf( arr[ 1 ].trim() ) > -1 ? arr[ 1 ].trim() : false;

    _data.list( 'checks', function( error, checksId ) {
        if( !error && checksId && checksId.length > 0 ) {
            cli.verticalSpace();
            checksId.forEach( checkId => {
                _data.read( 'checks', checkId, function( error, checkData ) {

                    if( !error && checkData ) {

                        if( !option ) {
                            console.dir( checkData, { 'colors' : true } );
                            cli.verticalSpace();
                        } else {
                            if( option === 'up' ) {
                                if( checkData.state == 'up') {
                                    console.dir( checkData, { 'colors' : true } );
                                    cli.verticalSpace();
                                }
                            } else {
                                if( checkData.state == 'down') {
                                    console.dir( checkData, { 'colors' : true } );
                                    cli.verticalSpace();
                                }
                                cli.verticalSpace();
                            }
                        }
                        
                    }
                } );
            } );
        }
    } );
};

// * Shows detailed info of a specific check using the check id as parameter to look for it
cli.responders.moreCheckInfo = ( str ) => {
    // Splits the string when it finds the characters --, so we can take the value that we need
    var arr = str.split( '--' );
    // Takes the second value after the -- characters
    var value = arr[ 1 ].trim();
    // validates that the value have the check id format, 20 characters and be a string
    value = typeof( value ) == 'string' && value.length == 20 ? value : false;

    if( value ) {
        // read the check in the file system
        _data.read( 'checks', value, function( error, checkData ) {
            // if everything goes right shows the check data on console
            if( !error && checkData ) {
                cli.verticalSpace();
                console.dir( checkData, { 'color' : true } );
                cli.verticalSpace();
            }
        } );
    }
};

cli.responders.listLogs = ( ) => {
    console.log( 'You asked for list logs' );
};

cli.responders.moreLogInfo = ( str ) => {
    console.log( 'You asked for more log info', str );
};


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