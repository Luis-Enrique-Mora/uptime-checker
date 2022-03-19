/* 
* Primary file for the API
*/
// *Dependencies
import http from 'http';

// * The server should respond to all request with a string
const server = http.createServer( function( req, res ){
    res.end('Hello World\n' );
}); // TODO: creating a server object, which recieves a callback with 2 parameters request and response

// * Start server, and have in listenig on port 3000
server.listen( 3000, () => {
    console.log( 'server listening on port 3000' );
});
