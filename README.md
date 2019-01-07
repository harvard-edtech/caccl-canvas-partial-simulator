# canvas-partial-simulator
Partially simulates a Canvas instance, handling OAuth token exchanges and forwarding API requests

## Setup:

1. Initialize this Canvas simulation:

```js
const initCanvasSimulation = require('canvas-partial-simulator');

initCanvasSimulation({
  accessToken: /* real access token for a user in Canvas */,
  consumerKey: /* the consumer key for the LTI app */,
  consumerSecret: /* the consumer secret for the LTI app */,
  canvasHost: /* the hostname for the real Canvas instance */,
  launchURL: /* the launch URL of the app, defaults to localhost/launch */,
});
```

2. Set your app's client id to `client_id` and its client secret to `client_secret`. These are your app's developerCredentials, not installationCredentials.

3. Set your app's canvasHost to `localhost:8080`.

## Usage:

#### Simulated LTI launches

To simulate an LTI launch, visit: `https://localhost:8088/course/:courseid/launch`.
