/**
 * Frontend logic 
 */

var app = {};

app.config = {
    'sessionToken' : false
};

// AJAX client for restfull api
app.client = {};

// Interface for making API calls
app.client.request = function( headers, path, method, queryStringObject, payload, callback ) {
    // Setting validation for incoming paramethers
    headers = typeof( headers ) == 'object' && headers !== null ? headers : {};
    path = typeof( path ) == 'string' && path.length > 0 ? path : '/';
    method = typeof( method ) == 'string' && [ 'GET', 'POST', 'PUT', 'DELETE' ].indexOf( method ) > -1 ? method : 'GET';
    queryStringObject = typeof( queryStringObject ) == 'object' && queryStringObject !== null ? queryStringObject : {};
    payload = typeof( payload ) == 'object' && payload !== null ? payload : {};
    callback = typeof( callback ) == 'function' ? callback : false;

    // for each query string paramether sent, add it to the path
    var requestUrl = path + '?';
    var counter = 0;

    for( let queryKey in queryStringObject ) {
        if( queryStringObject.hasOwnProperty( queryKey ) ) {
            counter ++;
            // If there is at least one parameter, prepend a new one with an ampersand
            if( counter > 1 ) {
                requestUrl += '&';
            }
            requestUrl += queryKey + '=' + queryStringObject[ queryKey ];
        }
    }

    // Form the http request as JSON type
    var xhr = new XMLHttpRequest();
    xhr.open( method, requestUrl, true );
    xhr.setRequestHeader( 'Content-Type', 'application/json' );

    // For each header sent, add it to the request
    for( let headerKey in headers ) {
        if( headers.hasOwnProperty( headerKey ) ) {
            xhr.setRequestHeader( headerKey, headers[ headerKey ] );
        }
    }

    // If there is a current session token set, add that as a header
    if( app.config.sessionToken ) {
        xhr.setRequestHeader( 'token', app.config.sessionToken.id );
    }

    // when the request comes back, handle the response
    xhr.onreadystatechange = () => {
        if( xhr.readyState == XMLHttpRequest.DONE ) {
            var statusCode = xhr.status;
            var resposeReturned = xhr.responseText;

            // Callback if requested
            if( callback ) {
                try{
                    var parsedResponse = JSON.parse( resposeReturned );
                    callback( statusCode, resposeReturned );
                } catch {
                    callback( statusCode, false );
                }
            }
        }
    }

    // send the payload as JSON
    var payloadtring = JSON.stringify( payload );
    xhr.send( payloadtring );
}


