const axios = require('axios');

const buildAuthURL = (config = {}) => {
  return `https://localhost:8088/login/oauth2/auth?redirect_uri=${config.redirectURI || 'https://localhost:8089/launch'}&client_id=${config.clientId || 'client_id'}&response_type=${config.responseType || 'code'}${config.state ? '&state=' + config.state : ''}`;
};

describe('Partial Simulator', function () {
  describe('Preparation', function () {
    it('App certificates are accepted', function () {
      cy.visit('https://localhost:8089/verifycert');
    });

    it('Canvas partial simulator certificates are accepted', function () {
      cy.visit('https://localhost:8088/verifycert');
    });
  });

  describe('LTI', function () {
    it('Sends a valid LTI launch request', function () {
      // Visit launch simulator page
      cy.visit('https://localhost:8089/simlaunch');
      // Click launch button
      cy.get('#launch-button').click();
      cy.contains('td', 'Fail!').should('not.exist');
      cy.log('Paused so you can view launch results');
      cy.pause();
    });
  });

  describe('Authorization', function () {
    it('Simulates authorization screen', function () {
      cy.visit(buildAuthURL());
      cy.contains('a', 'Authorize');
      cy.contains('a', 'Cancel');
    });

    it('Gives error with invalid redirect URI', function () {
      cy.visit(buildAuthURL({
        redirectURI: 'https://google.com',
      }));
      cy.contains('body', '{"error":"invalid_request","error_description":"redirect_uri does not match client settings"}');
    });

    it('Gives error with invalid client id', function () {
      cy.visit(buildAuthURL({
        clientId: 'somethingelse',
      }));
      cy.contains('body', '{"error":"invalid_client","error_description":"unknown client"}');
    });

    it('Gives error with invalid response type', function () {
      cy.visit(buildAuthURL({
        responseType: 'somethingelse',
      }));
      cy.url().should('eq', 'https://localhost:8089/launch?error=unsupported_response_type&error_description=Only+response_type%3Dcode+is+permitted');
      cy.contains('body', 'unsupported_response_type');
    });

    it('Gives code to LTI app', function () {
      cy.visit(buildAuthURL());
      cy.contains('a', 'Authorize').click();
      cy.get('body').invoke('text')
        .then((bodyStr) => {
          const body = JSON.parse(bodyStr);
          if (!body || !body.code || body.code.trim().length === 0) {
            throw new Error('No code found!');
          }
        });
    });

    it('Passes state back to app', function () {
      cy.visit(buildAuthURL({ state: '12345' }));
      cy.contains('a', 'Authorize').click();
      cy.get('body').invoke('text')
        .then((bodyStr) => {
          const body = JSON.parse(bodyStr);
          if (!body || !body.state) {
            throw new Error('No state found!');
          }
          if (body.state !== '12345') {
            throw new Error(`Incorrect state passed back! should be "12345", but found "${body.state}"`);
          }
        });
    });

    it('Exchanges code for access token and refresh token', function () {
      cy.visit(buildAuthURL());
      cy.contains('a', 'Authorize').click();

      cy.get('body').invoke('text')
        .then((bodyStr) => {
          const body = JSON.parse(bodyStr);
          const { code } = body;
          return axios.post('https://localhost:8088/login/oauth2/token', {
            code,
            grant_type: 'authorization_code',
            client_id: 'client_id',
            client_secret: 'client_secret',
            redirect_uri: 'https://localhost:8089/launch',
          })
            .then((response) => {
              // Make sure values exist
              if (!response.data.access_token) {
                throw new Error('no acccess token');
              }
              if (!response.data.refresh_token) {
                throw new Error('no refresh token');
              }
              if (!response.data.expires_in) {
                throw new Error('no expires_in time');
              }
              // Make sure values are valid
              if (parseInt(response.data.expires_in, 10) !== 3600) {
                throw new Error('expires_in is not 1hr');
              }
              if (!response.data.token_type || response.data.token_type !== 'Bearer') {
                throw new Error(`Invalid token_type returned: ${response.data.token_type}`);
              }
              if (
                !response.data.user
                || !response.data.user.name
                || !response.data.user.id
              ) {
                throw new Error(`Invalid user returned: ${JSON.stringify(response.data.user)}`);
              }
            });
        });
    });

    it('Forwards API request to Canvas', function () {
      cy.visit(buildAuthURL());
      cy.contains('a', 'Authorize').click();

      cy.get('body').invoke('text')
        .then((bodyStr) => {
          const body = JSON.parse(bodyStr);
          const { code } = body;
          return axios.post('https://localhost:8088/login/oauth2/token', {
            code,
            grant_type: 'authorization_code',
            client_id: 'client_id',
            client_secret: 'client_secret',
            redirect_uri: 'https://localhost:8089/launch',
          })
            .then((response) => {
              // Make sure we have an access token
              if (!response.data.access_token) {
                throw new Error('no acccess token');
              }

              // Make sure we get profile info
              return axios.get(`https://localhost:8088/api/v1/users/self/profile?access_token=${response.data.access_token}`)
                .then((res) => {
                  const { data } = res;
                  cy.log(JSON.stringify(data));
                  if (!data.name || !data.id) {
                    throw new Error('Could not fetch profile using access token');
                  }
                })
                .catch((err) => {
                  throw new Error(JSON.stringify(err.response.data));
                });
            });
        });
    });

    it('Refreshes tokens', function () {
      cy.visit(buildAuthURL());
      cy.contains('a', 'Authorize').click();

      cy.get('body').invoke('text')
        .then((bodyStr) => {
          const body = JSON.parse(bodyStr);
          const { code } = body;
          return axios.post('https://localhost:8088/login/oauth2/token', {
            code,
            grant_type: 'authorization_code',
            client_id: 'client_id',
            client_secret: 'client_secret',
            redirect_uri: 'https://localhost:8089/launch',
          })
            .then((response) => {
              // Make sure we have an access token
              const refreshToken = response.data.refresh_token;
              if (!refreshToken) {
                throw new Error('no refresh token');
              }

              // Swap out refresh token
              return axios.post('https://localhost:8088/login/oauth2/token', {
                grant_type: 'refresh_token',
                client_id: 'client_id',
                client_secret: 'client_secret',
                refresh_token: refreshToken,
              })
                .then((res) => {
                  const { data } = res;
                  cy.log(JSON.stringify(data));
                  if (!data.access_token) {
                    throw new Error('no access token returned from swap');
                  }
                  if (!data.expires_in || data.expires_in !== 3600) {
                    throw new Error(`Invalid expires_in returned from swap: ${data.expires_in}`);
                  }
                  if (!data.token_type || data.token_type !== 'Bearer') {
                    throw new Error(`Invalid token_type returned from swap: ${data.token_type}`);
                  }
                  if (!data.user || !data.user.name || !data.user.id) {
                    throw new Error(`Invalid user returned from swap: ${JSON.stringify(data.user)}`);
                  }
                });
            });
        });
    });
  });
});
