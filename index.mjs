/* 
* Primary file for the API
*/
// * Dependencies
import http from 'http';
import url from 'url';
import { StringDecoder } from 'string_decoder';

// * The server should respond to all request with a string
const server = http.createServer( function( req, res ){

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

    req.on( 'data', function( data ){
        buffer += decoder.write(data);
    } );

    req.on( 'end', function(){
        buffer += decoder.end();
        //* Choose the handler this request should go to, if one is not found, go to notFound
        var choosenHandler = typeof(router[trimmedPath]) !== 'undefine' ? router[trimmedPath] : handlers.notFound;

        //* construct the data object to send to the handler
        var data = {
            'path' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : buffer
        };

        //* route the request to the handler specified in the router
        choosenHandler( data, function( statusCode, payload ){
            //* Use the status code called back by the handler, or default
            statusCode = typeof( statusCode ) == 'number' ? statusCode : 200;

            //* Use the payload called back by the handler, or default
            payload = typeof( payload ) == 'object' ? payload : {};

            //* combert the payload to a string
            var payloadString = JSON.stringify( payload );

            res.setHeader( 'Content-type', 'application/json' );
            res.writeHead( statusCode )
            res.end( payloadString );
        });
        console.log( 
        `**request Log**
    
        Headers: ${JSON.stringify( headers, ' ', 5 )}
        Path: ${trimmedPath} 
        Method: ${method}
        Payload: ${buffer}
        QueryString:`, queryStringObject );
    } );

}); // TODO: creating a server object, which recieves a callback with 2 parameters: request and response

// * Start server, and have in listenig on port 3000
server.listen( 3000, () => {
    console.log( 'server listening on port 3000' );
});

//* Define a request router
const handlers = {};

//* Sample handler
handlers.sample = function( data, callback ){
    //* callback a http status code, and a payload object
    callback( 406, { 'name' : 'sample handler' } );
}

handlers.notFound = function( data, callback ){
    callback(404);
}
var router = {
    'sample' : handlers.sample
}