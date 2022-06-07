//* Dependencies
import server from './lib/server.mjs';
import workers from './lib/workers.mjs';
import cli from './lib/cli.mjs';

var app = {};

app.init = () => {
    server.init();
    workers.init();
    //* Start the CLI, and make sure it starts last
    setTimeout( () => cli.init(), 20 );
};

app.init();

export default app;