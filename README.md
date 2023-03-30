# caccl-canvas-partial-simulator

Partially simulates a Canvas instance, handling OAuth token exchanges and forwarding API requests.

As an LTI app developer, you want to be able to test your app, simulating the process of launching your app and running through the oauth2 handshake to approve your Canvas app and get a Canvas access token on behalf of the user. In many settings, Canvas is managed by central IT and is surrounded by protocol and policy. This often makes it slow or difficult to add _test apps_ to the list of approved Canvas integrations. Usually, you'll need to get every single development instance of your app approved to interact with Canvas. Finally, when developing on `localhost`, for your app to go through the oauth2 handshake, Canvas would need to have `localhost` set as an approved integration. This is obviously a terrible idea.

To remedy this situation, we've created this partial Canvas simulator. It simulates the oauth endpoints and makes it easy to simulate LTI course navigation launches. For all other Canvas requests (API, for example), we just forward those requests to your actual Canvas instance. In this way, you can test your LTI app on a real Canvas instance, without needing credentials and approval for your app.

All you need to get started is an `accessToken` (that will be returned from the oauth2 handshake) and a real `canvasHost` (the real Canvas instance we will forward non-oauth requests to).

## 1. Set up `/config/devEnvironment.js`

Create a file `/config/devEnvironment.js` and add it to your `.gitignore`. The `/config` folder should be placed in the root directory of your project.

#### Required: add basic parameters

```js
module.exports = {
    canvasHost: 'canvas.harvard.edu', // The hostname for your Canvas instance
    courseId: 473829, // The Canvas courseId for your sandbox course
    instructorAccessToken: '1589~30ma90294...', // An access token for an instructor in the sandbox
}
```

#### Optional: add students and/or TAs

With just the basic parameters, you can only simulate LTI launches as an instructor. To launch as students or TAs, add additional parameters:

```js
module.exports = {
    ...
    taAccessTokens: [
        '1589~n85029kr83...', // An access token for a TA in the sandbox
        '1589~66735hjs08...', // An access token for a TA in the sandbox
        '1589~pbhsd8tha0...', // An access token for a TA in the sandbox
    ],
    studentAccessTokens: [
        '1589~0bn485039x...', // An access token for a student in the sandbox
        '1589~phha0527nd...', // An access token for a student in the sandbox
        '1589~mxaq28df9s...', // An access token for a student in the sandbox
    ],
};
```

You can include `tas`, `students`, or both. Each list can have as many access tokens in it as you want.

#### Optional: add the app title

To make everything work, we add a test LTI app to your sandbox course. This app won't visibly show up anywhere in your sandbox. Usually, we call that "CACCL Simulated App," but if you want the test app to have a different name in the Canvas app list, add it as a parameter:

```js
module.exports = {
    ...
    appName: 'My App Name',
};
```

#### Optional: add custom launch parameters

To include specific launch parameters in every LTI launch request, include a `customParams` map in your devEnvironment.json file:

```js
module.exports = {
    ...
    customParams: {
        "name": "value",
        "anotherName": "anotherValue"
    },
};
```

#### Optional: add custom launch paths

Some apps don't get launched via the `/` path. This is an unusual case, but nevertheless, it is supported by `caccl`. To include custom launch paths, simply include them in a list:

```js
module.exports = {
    ...
    customLaunchPaths: [
        {
            "name": "Cat Video Player",
            "path": "/videos/cats"
        },
        {
            "name": "Desserts Video Player",
            "path": "/videos/desserts"
        }
    ],
};
```

## 2. Start the Simulated Canvas Instance

### If your app was created using `npm init caccl`...

From the root folder of your project, just run:

`npm run dev:canvas`

Follow instructions in terminal.

### Otherwise...

1. Set your app's client id to `client_id` and its client secret to `client_secret`. These are your app's developerCredentials, not installationCredentials.

2. Set your app's consumer key to `consumer_key` and its consumer secret to `consumer_secret`. These are your app's installationCredentials.

3. Set your app's canvasHost to `localhost:8088`.

4. Write a script to start the simulator, then run your script:

    ```js
    require('caccl-canvas-partial-simulator');
    ```

5. Follow instructions in terminal.
