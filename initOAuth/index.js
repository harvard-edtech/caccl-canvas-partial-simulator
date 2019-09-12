const path = require('path');

const currentUser = require('../currentUser');

const CLIENT_ID = 'client_id';
const CLIENT_SECRET = 'client_secret';

// Code Generation
const genCode = (group, index) => {
  return `simulated-oauth-code-${group}-${index}`;
};

// Refresh Token Generation
const genRefreshToken = (group, index) => {
  return `simulated-refresh-token-${group}-${index}`;
};
const parseRefreshToken = (code) => {
  const parts = code.split('-');
  if (parts.length !== 5) {
    return null;
  }
  return {
    group: parts[3],
    index: parseInt(parts[4]),
  };
};

// Keep track of token expiry
const tokenExpiry = {}; // token => ms expiry timestamp
const resetTokenExpiry = (token) => {
  tokenExpiry[token] = Date.now() + 3600000;
};
const tokenIsValid = (token) => {
  if (!tokenExpiry[token]) {
    return false;
  }
  return (tokenExpiry[token] > Date.now());
};

/**
 * Initializes simulated LTI launch functionality
 * @param {object} app - the express app to add routes to
 */
module.exports = (config) => {
  const { app } = config;

  app.get('/login/oauth2/auth', (req, res) => {
    const { state } = req.query;
    const redirectURI = req.query.redirect_uri;

    // Detect and complain about unknown clients
    if (CLIENT_ID !== req.query.client_id) {
      return res.send('while(1);{"error":"invalid_client","error_description":"unknown client"}');
    }

    // Detect and complain about invalid redirectURI
    if (!redirectURI || !redirectURI.startsWith('https://localhost')) {
      return res.send('while(1);{"error":"invalid_request","error_description":"redirect_uri does not match client settings"}');
    }

    // Detect and complain about invalid code
    if (req.query.response_type !== 'code') {
      return res.redirect(`${redirectURI}?error=unsupported_response_type&error_description=Only+response_type%3Dcode+is+permitted`);
    }

    // Get the current user
    const user = currentUser.get();
    if (!user) {
      return res.send('while(1);{"error":"invalid_client","error_description":"unknown client"}');
    }
    const { group, index } = user;

    // Generate a code
    const code = genCode(group, index);

    // Show authorize page
    res.render(path.join(__dirname, 'authorizePage'), {
      name: (
        (user && user.profile && user.profile.name)
          ? user.profile.name
          : 'a test user'
      ),
      cancelURL: `${redirectURI}?error=access_denied`,
      approveURL: `${redirectURI}?code=${code}&state=${state}`,
    });
  });

  app.post('/login/oauth2/token', (req, res) => {
    // Handle code-based authorization request
    if (req.body.grant_type === 'authorization_code') {
      if (CLIENT_ID !== req.body.client_id) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'unknown client',
        });
      }
      if (CLIENT_SECRET !== req.body.client_secret) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'invalid client',
        });
      }

      // Make sure the code is valid
      const user = currentUser.get();
      if (!user) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'unknown client',
        });
      }
      const {
        group,
        index,
        token,
        profile,
      } = user;
      if (genCode(group, index) !== req.body.code) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'authorization_code not found',
        });
      }

      // Reset the expiry time
      resetTokenExpiry(token);

      // Generate a refresh token
      const refreshToken = genRefreshToken(group, index);

      // Respond to the request
      return res.json({
        access_token: token,
        refresh_token: refreshToken,
        expires_in: 3600,
        token_type: 'Bearer',
        user:
          {
            id: profile.id,
            name: profile.name,
            global_id: null,
            effective_locale: 'en',
          },
      });
    }

    // Handle refresh token request
    if (req.body.grant_type === 'refresh_token') {
      // Make sure the credentials are valid
      if (CLIENT_ID !== req.body.client_id) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'unknown client',
        });
      }
      if (CLIENT_SECRET !== req.body.client_secret) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'invalid client',
        });
      }

      // Parse the refresh token
      const data = parseRefreshToken(req.body.refresh_token);
      if (!data || !data.group) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'authorization_code not found',
        });
      }
      const { group, index } = data;

      // Get the access token
      const user = currentUser.get(group, index);
      if (!user) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'invalid client',
        });
      }
      const { token, profile } = user;

      // Reset expiry
      resetTokenExpiry(token);

      // Respond to request
      return res.json({
        access_token: token,
        expires_in: 3600,
        token_type: 'Bearer',
        user:
          {
            id: profile.id,
            name: profile.name,
            global_id: null,
            effective_locale: 'en',
          },
      });
    }

    // Must be an invalid grant type
    return res.status(500).send('Invalid grant type');
  });

  // Simulate process of token expiring
  app.all('*', (req, res, next) => {
    if (req.body.access_token && !tokenIsValid(req.body.access_token)) {
      req.body.access_token = 'invalid_access_token';
    }
    next();
  });
};
