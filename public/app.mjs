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
        console.log( 'Entra a setear token');
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
                    console.log( statusCode, resposeReturned );
                } catch {
                    callback( statusCode, false );
                }
            }
        }
    }

    // send the payload as JSON
    var payloadtring = JSON.stringify( payload );
    xhr.send( payloadtring );
};

app.bindForms = function() {
    if( document.querySelector( 'form' ) ) {
        var allForms = document.querySelectorAll( 'form' );

        for( let i = 0; i < allForms.length; i++ ) {
            allForms[ i ].addEventListener( 'submit', function( e ) {
                // Stop it from submitting
                e.preventDefault();
                let formId = this.id;
                let path = this.action;
                let method = this.method.toUpperCase();

                // Hide the error message ( if it's currently shown due to a previous error )
                document.querySelector( '#' + formId + ' .formError').style.display = 'none';

                // Hide the success message ( if its currently shown due to a previous error)
                if( document.querySelector( '#' + formId + ' .formSuccess') ) {
                    document.querySelector( '#' + formId + ' .formSuccess' ).style.display = 'none';
                }

                // Turn the inputs into a payload
                var payload = {};
                var elements = this.elements;

                for ( let i = 0; i < elements.length; i++ ) {
                    if( elements[ i ].type !== 'submit' ) {
                        // Determine class of element and value accordingly
                        let classOfElement = typeof( elements[ i ].classList.value ) == 'string' && elements[ i ].classList.value.length > 0 ? elements[ i ].classList.value : '';
                        let valueOfElement = elements[ i ].type == 'checkbox' && classOfElement.indexOf( 'multiselect') == -1 ? elements[ i ].checked : classOfElement.indexOf( 'intval' ) == -1 ? elements[ i ].value : parseInt( elements[ i ].value );
                        let elementIsChecked = elements[ i ].checked;

                        // Override the method of the form if the input's name in method
                        let nameOfElement = elements[ i ].name;

                        if( nameOfElement == '_method' ) {
                            method = valueOfElement;
                        } else {
                            // Create an payload field named 'method' if the elements name is actually httpmethod
                            if( nameOfElement == 'httpmethod' ) {
                                nameOfElement = 'method';
                            }
                            // Create a paylolad field "id" if the elements name is actually uid
                            if( nameOfElement == 'uid' ) {
                                nameOfElement = 'id';
                            }
                            // if the element has the class "multiselect" add its value(s) as array elements
                            if( classOfElement.lastIndexOf( 'multiselect') > -1 ) {
                                if( elementIsChecked ) {
                                    payload[ nameOfElement ] = typeof( payload[ nameOfElement ] ) == 'object' && payload[ nameOfElement ] instanceof Array ? payload[ nameOfElement ] : [];
                                    payload[ nameOfElement ].push( valueOfElement );
                                }
                            } else {
                                if( nameOfElement == 'tosAgreement') {
                                    payload[ nameOfElement ] = JSON.stringify( valueOfElement );
                                } else {
                                    payload[ nameOfElement ] = valueOfElement;
                                }
                            }
                        }
                    }
                }

                // if method is delete, the payload should be a queryStringObject instead
                let queryStringObject =  method == 'DELETE' ? payload : {};

                // Call the API
                app.client.request( undefined, path, method, queryStringObject, payload, function( statusCode, responsePayload ) {
                    //Display an error on the form if needed
                    if( statusCode > 399 ) {
                        console.log( 'entra al error');
                        if( statusCode == 403 || statusCode == 401 ) {
                            // log the user out
                            app.logUserOut();
                        } else {
                            // Try to get the error from the api, or set a default error message
                            let error = JSON.parse( responsePayload );
                            error = typeof( error.Error ) == 'string' ? error.Error : 'An error has ocurred, please try again';
                            // Set the formError field with the error text
                            document.querySelector("#"+formId+" .formError").innerHTML = error;

                            // Set the form fiel with the error text
                            document.querySelector( '#' + formId + ' .formError' ).style.display = 'block';
                        }
                    } else {
                        console.log('entra a redirigir');
                        // If successful, send to form response processor
                        app.formResponseProcessor( formId, payload, responsePayload );
                    }
                } );
            } );
        }
    }
};

app.bindLogOutButton = function() {
    document.getElementById( 'logoutButton' ).addEventListener( 'click', function(e) {
        // Stop it from default redirecting anywhere
        e.preventDefault();
        // Log the user out
        app.logUserOut();
    } );
};

app.logUserOut = function( redirectUser ) {
    // set redirectUser to default to true
    redirectUser =  typeof( redirectUser ) == 'boolean' ? redirectUser : true;

    // Get the current tken id
    let tokenId = typeof( app.config.sessionToken.id ) == 'string' ? app.config.sessionToken.id : false;

    // Send the current token to the tokens endpoint to delete it
    let queryStringObject = {
        'id' : tokenId
    };

    app.client.request( undefined, 'api/tokens', 'DELETE', queryStringObject, undefined, function( statusCode, responsePayload ) {
        // Set the app.config token as false
        app.setSessionToken( false );

        // Send the user to the logged out page
        if( redirectUser ){
            window.location = '/session/deleted';
        }

    } );
};

// form resposse processor
app.formResponseProcessor = function( formId, requestPayload, responsePayload ) {
    let functionToCall = false;

    // if account creation was successful, try to immediately log the user in
    if( formId == 'accountCreate' ) {
        // Take the phone and password, and use it to log the user in
        var newPayload = {
            'phone' : requestPayload.phone,
            'password' : requestPayload.password
        };

        app.client.request( undefined, 'api/tokens', 'POST', undefined, newPayload, function( newStatusCode, newResponsePayload ) {
            // Display an error on the form if needed
            if( newStatusCode > 299 ) {
                //set the formError field with the error text
                document.querySelector( '#' + formId + ' .formError' ).innerHTML = 'Sorry, an error has ocurred, please try again';

                // Show (unhide) the form error on the form
                document.querySelector( '#' + formId + ' .formError' ).style.display = 'block';
            } else {
                //If successful, set the token and redirect the user
                app.setSessionToken( newResponsePayload );
                window.location = '/checks/all';
            }
        } );
    }

    // If login was successful, set the token in the localStorage and redirect the user
    if( formId == 'sessionCreate' ) {
        app.setSessionToken( responsePayload );
        window.location = '/checks/all';
    }

    //if forms saved successfully and they have success message, show them
    var formsWithSuccessMessage = [ 'accountEdit1', 'accountEdit2', 'checksEdit1' ];
    if ( formsWithSuccessMessage.indexOf( formId ) > -1 ) {
        document.querySelector( '#' + formId + ' .formSuccess' ).style.display = 'block';
    }

    // If the user just deleted their account, redirect them to the account-delete page
    if(formId == 'accountEdit3'){
        app.logUserOut(false);
        window.location = '/account/deleted';
    }

    // If the user just created a new check successfully, redirect back to the dashboard
    if(formId == 'checksCreate'){
        window.location = '/checks/all';
    }

    // If the user just deleted a check, redirect them to the dashboard
    if(formId == 'checksEdit2'){
        window.location = '/checks/all';
    }
};

// Get the session token from localstorage and set it in the top.config object
app.getSessionToken = function() {
    var tokenString = localStorage.getItem( 'token' );
    if( typeof( tokenString ) == 'string' ) {
        try {
            var token = JSON.parse( tokenString );
            app.config.sessionToken = token;
            if( typeof( token ) == 'object' ) {
                app.setLoggedInClass( true );
            } else {
                app.config.sessionToken = false;
            }
        } catch (e) {
            app.config.sessionToken = false;
            app.setLoggedInClass( false );
        }
    }
};

app.setLoggedInClass = function( add ) {
    let target = document.querySelector( "body" );
    if( add ) {
        target.classList.add( 'loggedIn' );
    } else {
        target.classList.remove( 'loggedIn' );
    }
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = function( token ) {
    app.config.sessionToken = JSON.parse( token );
    let jsonToken = JSON.parse( token );
    localStorage.setItem( 'token', token );

    if( typeof( jsonToken ) == 'object' ) {
        app.setLoggedInClass( true );
    } else {
        app.setLoggedInClass( false );
    }
};

app.renewToken = function( callback ) {
    var currentToken = typeof( app.config.sessionToken ) == 'object' ? app.config.sessionToken : false;
    if( currentToken ) {
        // Update the token with a new experation date
        var payload = {
            'id' : currentToken.id,
            'extend' : true
        };
        app.client.request( undefined, 'api/tokens', 'PUT', undefined, payload, function( statusCode, responsePayload ) {
            // Display an error on the form if need
            if( statusCode == 200 ) {
                // Get the new token details
                var queryStringObject = { 'id' : currentToken.id };
                app.client.request( undefined, 'api/tokens', 'GET', queryStringObject, undefined, function( statusCode, responsePayload ) {
                    // Display an error on the form if needed
                    if( statusCode == 200 ) {
                        app.setSessionToken( responsePayload );
                        callback( false );
                    } else {

                        app.setSessionToken( false );
                        callback( true );
                    }
                });
            } else {
                app.setSessionToken( false );
                callback( true );
            }
        } );
    } else {
        app.setSessionToken( false );
        callback( true );
    }
};

// Load data on the page
app.loadDataOnPage = function() {
    // Get the current page from the body class
    let bodyClasses = document.querySelector( 'body' ).classList;
    let primaryClass = typeof( bodyClasses[ 0 ] ) == 'string' ? bodyClasses[ 0 ] : false;

    // Logic for account settings page
    if( primaryClass == 'accountEdit' ) {
        app.loadAccountEditPage();
    }

    // logic for dashboard page
    if( primaryClass == 'checksList' ) {
        app.loadChecksListPage();
    }

    // Logic for check details page
    if( primaryClass == 'checksEdit' ) {
        app.loadChecksEditPage();
    }
};

app.loadAccountEditPage = function() {
    // Get the phone number from the current token, or log the user out if none is there
    let phone =  typeof( app.config.sessionToken.phone ) == 'string' ? app.config.sessionToken.phone : false;

    if( phone ) {
        // Fetch the user data

        var queryStringObject = {
            'phone' : phone
        };

        app.client.request( undefined, 'api/users', 'GET', queryStringObject, undefined, function( statusCode, responsePayload ) {
            let responseToJSON = JSON.parse( responsePayload );
            if( statusCode == 200 ) {
                // Put data into the forms as values where needed
                document.querySelector( '#accountEdit1 .firstNameInput' ).value = responseToJSON.firstName;
                document.querySelector( '#accountEdit1 .lastNameInput').value = responseToJSON.lastName
                document.querySelector( '#accountEdit1 .displayPhoneInput' ).value = responseToJSON.phone;

                // Put hidden phone field into both forms
                let hiddenPhoneInputs = document.querySelectorAll( 'input.hiddenPhoneNumberInput' );
                for( let i = 0; i < hiddenPhoneInputs.length; i++ ) {
                    hiddenPhoneInputs[ i ].value = responseToJSON.phone;
                }
            } else {
                // If the request comes back as something other than 200, log the user our ( on the assumption that the api in temporarily down or the token user is bad )
                console.log( 'StatusCode', statusCode);
                app.logUserOut();
            }
        } );

    } else {
        console.log('No phone');
        app.logUserOut();
    }
};

app.tokenRenewalToken = function() {
    setInterval( () => {
        app.renewToken( function( error ) {
            if( error ) {
                console.log( 'Token renewed successfully @' + Date.now() );
            }
        } );
    }, 1000 * 60 * 60 );
};

// Init the bootstrapping
app.init =  function() {
    // Bind all form submissions
    app.bindForms();

    // Bind logout button
    app.bindLogOutButton();

    // Get the token from localStorage
    app.getSessionToken();

    // Renew token
    app.tokenRenewalToken();

    app.loadDataOnPage();
};

// Call the init processes after the window loads
window.onload = function() {
    app.init();
}
