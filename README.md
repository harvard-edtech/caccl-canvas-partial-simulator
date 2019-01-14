# canvas-partial-simulator
Partially simulates a Canvas instance, handling OAuth token exchanges and forwarding API requests

## Setup:

1. Initialize this Canvas simulation:

```js
const initCanvasSimulation = require('canvas-partial-simulator');

initCanvasSimulation({
  accessToken: /* real access token for a user in Canvas */,
  canvasHost: /* the hostname for the real Canvas instance */,
  launchURL: /* the launch URL of the app, defaults to localhost/launch */,
});
```

2. Set your app's client id to `client_id` and its client secret to `client_secret`. These are your app's developerCredentials, not installationCredentials.

3. Set your app's consumer key to `consumer_key` and its consumer secret to `consumer_secret`. These are your app's installationCredentials.

4. Set your app's canvasHost to `localhost:8088`.

## Usage:

#### Simulated LTI launches

To simulate an LTI launch, visit: `https://localhost:8088/course/:courseid`.
