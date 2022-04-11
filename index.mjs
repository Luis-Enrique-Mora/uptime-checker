//* Dependencies
import server from './lib/server.mjs';
import workers from './lib/workers.mjs';

var app = {};

app.init = () => {
    server.init();
    workers.init();
};

app.init();

export default app;