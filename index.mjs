//* Dependencies
import server from './lib/server.mjs';
// TODO import workers from './lib/workers.mjs';

var app = {};

app.init = () => {
    server.init();
};

app.init();

export default app;