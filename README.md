# caccl-canvas-partial-simulator
Partially simulates a Canvas instance, handling OAuth token exchanges and forwarding API requests.

As an LTI app developer, you want to be able to test your app, simulating the process of launching your app and running through the oauth2 handshake to approve your Canvas app and get a Canvas access token on behalf of the user. In many settings, Canvas is managed by central IT and is surrounded by protocol and policy. This often makes it slow or difficult to add _test apps_ to the list of approved Canvas integrations. Usually, you'll need to get every single development instance of your app approved to interact with Canvas. Finally, when developing on `localhost`, for your app to go through the oauth2 handshake, Canvas would need to have `localhost` set as an approved integration. This is obviously a terrible idea.

To remedy this situation, we've created this partial Canvas simulator. It simulates the `login/oauth2/token` and `login/oauth2/auth` endpoints and makes it easy to simulate LTI course navigation launches. For all other Canvas requests (API, for example), we just forward those requests to your actual Canvas instance. In this way, you can test your LTI app on a real Canvas instance, without needing credentials and approval for your app.

All you need to get started is an `accessToken` (that will be returned from the oauth2 handshake) and a real `canvasHost` (the real Canvas instance we will forward non-oauth requests to).

## Setup:

1. Initialize this Canvas simulation:

```js
const initCanvasSimulation = require('canvas-partial-simulator');

initCanvasSimulation({
  accessToken: /* real access token for a user in Canvas */,
  canvasHost: /* the hostname for the real Canvas instance */,
  launchURL: /* optional launch URL of the app, defaults to localhost/launch */,
});
```

2. Set your app's client id to `client_id` and its client secret to `client_secret`. These are your app's developerCredentials, not installationCredentials.

3. Set your app's consumer key to `consumer_key` and its consumer secret to `consumer_secret`. These are your app's installationCredentials.

4. Set your app's canvasHost to `localhost:8088`.

## Usage:

#### Simulated LTI launches

To simulate an LTI launch, visit: `https://localhost:8088/course/:courseid`.
