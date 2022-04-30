/* 
* Primary file for the API
*/
// * Dependencies
import http from 'http';
import url from 'url';
import { StringDecoder } from 'string_decoder';
import config from './config.mjs';
import _data from './data.mjs';
import handlers from './handlers.mjs';
import helpers from './helpers.mjs';
import util from 'util';
var debug =  util.debuglog( 'server' );

// * The server should respond to all request with a string
const server = http.createServer( function( req, res ) {

    // * Get the URL and parse it
    const parsedUrl = url.parse( req.url, true );
    
    // * Get the path
    const path = parsedUrl.pathname; // ? Get pathname from the object URL

    const trimmedPath = path.replace( /^\/+|\/+$/g, '' ); // * it removes slash and simbols so when I recieve the request the path is normally like this /index but with this line will be index without the slash, if I send localhost:3000/foo/bar/ it'll display foo/bar

    // * Get queryString as an object, query strings are the parameters that we send with the URL
    const queryStringObject = parsedUrl.query;

    // * Get HTTP method /GET/POST/DELETE/
    const method = req.method.toLowerCase();

    // * Get headers as objects
    const headers = req.headers;

    // * Get payload, if any
    const decoder = new StringDecoder( 'utf-8' );
    var buffer = '';

    //* Choose the handler this request should go to, if one is not found, go to notFound
    var choosenHandler = typeof( server.router[ trimmedPath ] ) !== 'undefined' ? server.router[ trimmedPath ] : handlers.notFound;

    // if the request is within the public directory, use the public handlers instead
    choosenHandler = trimmedPath.indexOf( 'public/' ) > -1 ? handlers.public : choosenHandler;

    req.on( 'data', function( data ){
        buffer += decoder.write( data );
    } );

    req.on( 'end', function(){
        buffer += decoder.end();

        //* construct the data object to send to the handler
        var data = {
            'path' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject( buffer )
        };

        //* route the request to the handler specified in the router
        choosenHandler( data, function( statusCode, payload, contentType ){
            // Determine the type of response ( fallback to JSON )
            contentType = typeof( contentType ) == 'string' ? contentType : 'json';
            //* Use the status code called back by the handler, or default
            statusCode = typeof( statusCode ) == 'number' ? statusCode : 200;

            // return the response-parts that are content-specific
            var payloadString = '';
            if( contentType == 'json') {
                res.setHeader( 'Content-Type', 'application/json' );
                payload = typeof( payload ) == 'object' ? payload : {};
                payloadString = JSON.stringify( payload );
            }
            if( contentType == 'html' ) {
                res.setHeader( 'Content-Type', 'text/html' );
                payloadString = typeof( payload ) == 'string' ? payload : '';
            }
            if( contentType == 'css' ) {
                res.setHeader( 'Content-Type', 'text/css' );
                payloadString = typeof( payload ) !== 'undefined' ? payload : '';
            }
            if( contentType == 'favicon' ) {
                res.setHeader( 'Content-Type', 'image/x-icon' );
                payloadString = typeof( payload ) !== 'undefined' ? payload : '';
            }
            if( contentType == 'png' ) {
                res.setHeader( 'Content-Type', 'image/png' );
                payloadString = typeof( payload ) !== 'undefined' ? payload : '';
            }
            if( contentType == 'jpg' ) {
                res.setHeader( 'Content-Type', 'image/jpg' );
                payloadString = typeof( payload ) !== 'undefined' ? payload : '';
            }
            if( contentType == 'jpeg' ) {
                res.setHeader( 'Content-Type', 'image/jpeg' );
                payloadString = typeof( payload ) !== 'undefined' ? payload : '';
            }
            if( contentType == 'svg' ) {
                res.setHeader( 'Content-Type', 'image/svg+xml' );
                payloadString = typeof( payload ) !== 'undefined' ? payload : '';
            }
            if( contentType == 'mjs' ) {
                res.setHeader( 'Content-Type', 'text/javascript' );
                payloadString = typeof( payload ) !== 'undefined' ? payload : '';
            }
            if( contentType == 'plain' ) {
                res.setHeader( 'Content-Type', 'text/plain' );
                payloadString = typeof( payload ) !== 'undefined' ? payload : '';
            }
            // return the respose-parts that are common to all content-types
            res.writeHead( statusCode )
            res.end( payloadString );
            
            // To see this message in the console execute NODE_DEBUG=server node index.mjs
            if( statusCode == 200 || statusCode == 201 ) {
                debug( '\x1b[32m%s\x1b[0m', 
                        `**request Log**
            
                Headers: ${JSON.stringify( headers, ' ', 5 )}
                Path: ${trimmedPath} 
                Method: ${method}
                Payload: ${buffer}
                QueryString:`, queryStringObject );
            } else {
                debug( '\x1b[31m%s\x1b[0m', 
                        `**request Log**
            
                Headers: ${JSON.stringify( headers, ' ', 5 )}
                Path: ${trimmedPath} 
                Method: ${method}
                Payload: ${buffer}
                QueryString:`, queryStringObject );
            }
        });
    } );

} ); // creating a server object, which recieves a callback with 2 parameters: request and response

server.init = () => {
    // * Start server, and have in listenig on port 3000
    server.listen( config.port, () => {
        console.log( '\x1b[36m%s\x1b[0m' ,`server listening on port ${config.port}` );
    } );
};

server.router = {
    '' : handlers.index,
    'account/create' : handlers.accountCreate,
    'account/edit' : handlers.accountEdit,
    'account/delete' : handlers.accountDelete,
    'session/create' : handlers.sessionCreate,
    'session/deleted' : handlers.sessionDeleted,
    'checks/all' : handlers.checkList,
    'checks/create': handlers.cheCreate,
    'checks/edit' : handlers.checksEdit,
    'api/users' : handlers.users,
    'ping' : handlers.ping,
    'api/tokens' : handlers.tokens,
    'api/checks' : handlers.checks,
    'public' : handlers.public
}

export default server;