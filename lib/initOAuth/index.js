"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import shared helpers
var currentUser_1 = __importDefault(require("../currentUser"));
// Constants
var CLIENT_ID = 'client_id';
var CLIENT_SECRET = 'client_secret';
/*------------------------------------------------------------------------*/
/*                                 Helpers                                */
/*------------------------------------------------------------------------*/
/**
 * Generate an oauth code
 * @author Gabe Abrams
 * @param id userId
 * @returns oauth code
 */
var genCode = function (id) {
    return "simulated-oauth-code-for-".concat(id);
};
/**
 * Generate a refresh token
 * @author Gabe Abrams
 * @param id userId
 * @returns refresh token
 */
var genRefreshToken = function (id) {
    return "simulated-refresh-token-for-".concat(id);
};
/**
 * Parse a refresh token to get the user's id
 * @author Gabe Abrams
 * @param code refresh token
 * @returns user's id
 */
var refreshTokenToId = function (code) {
    var parts = code.split('-');
    if (parts.length !== 5) {
        return null;
    }
    return Number.parseInt(parts[4]);
};
/*------------------------------------------------------------------------*/
/*                              Global Logic                              */
/*------------------------------------------------------------------------*/
// Keep track of token expiry
var tokenExpiry = new Map(); // token => ms expiry timestamp
/**
 * Reset an access token's expiry time
 * @author Gabe Abrams
 * @param token user's token
 */
var resetTokenExpiry = function (token) {
    tokenExpiry.set(token, Date.now() + 3600000);
};
/**
 * Check if an access token is valid
 * @author Gabe Abrams
 * @param token access token
 * @returns true if the token is valid
 */
var tokenIsValid = function (token) {
    var expiry = tokenExpiry.get(token);
    return (expiry
        && (expiry > Date.now()));
};
/*------------------------------------------------------------------------*/
/*                                 Routes                                 */
/*------------------------------------------------------------------------*/
/**
 * Initializes simulated LTI launch functionality
 * @param app the express app to add routes to
 */
var initOAuth = function (app) {
    /**
     * Replace Canvas's default oauth endpoint
     * @author Gabe Abrams
     */
    app.get('/login/oauth2/auth', function (req, res) {
        var state = req.query.state;
        var redirectURI = String(req.query.redirect_uri);
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
            return res.redirect("".concat(redirectURI, "?error=unsupported_response_type&error_description=Only+response_type%3Dcode+is+permitted"));
        }
        // Get the current user
        var user = currentUser_1.default.get();
        if (!user) {
            return res.send('while(1);{"error":"invalid_client","error_description":"unknown client"}');
        }
        var id = user.id;
        // Generate a code
        var code = genCode(id);
        // Show authorize page
        res.render("".concat(__dirname, "/authorizePage"), {
            name: ((user && user.profile && user.profile.name)
                ? user.profile.name
                : 'a test user'),
            cancelURL: "".concat(redirectURI, "?error=access_denied"),
            approveURL: "".concat(redirectURI, "?code=").concat(code, "&state=").concat(state),
        });
    });
    /**
     * Replace Canvas's default token swap endpoint
     * @author Gabe Abrams
     */
    app.post('/login/oauth2/token', function (req, res) {
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
            var user = currentUser_1.default.get();
            if (!user) {
                return res.status(401).json({
                    error: 'invalid_client',
                    error_description: 'unknown client',
                });
            }
            var id = user.id, token = user.token, profile = user.profile;
            if (genCode(id) !== req.body.code) {
                return res.status(400).json({
                    error: 'invalid_grant',
                    error_description: 'authorization_code not found',
                });
            }
            // Reset the expiry time
            resetTokenExpiry(token);
            // Generate a refresh token
            var refreshToken = genRefreshToken(id);
            // Respond to the request
            return res.json({
                access_token: token,
                refresh_token: refreshToken,
                expires_in: 3600,
                token_type: 'Bearer',
                user: {
                    id: id,
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
            var id = refreshTokenToId(req.body.refresh_token);
            if (!id) {
                return res.status(400).json({
                    error: 'invalid_grant',
                    error_description: 'authorization_code not found',
                });
            }
            // Get the access token
            var user = currentUser_1.default.get(id);
            if (!user) {
                return res.status(401).json({
                    error: 'invalid_client',
                    error_description: 'invalid client',
                });
            }
            var token = user.token, profile = user.profile;
            // Reset expiry
            resetTokenExpiry(token);
            // Respond to request
            return res.json({
                access_token: token,
                expires_in: 3600,
                token_type: 'Bearer',
                user: {
                    id: id,
                    name: profile.name,
                    global_id: null,
                    effective_locale: 'en',
                },
            });
        }
        // Must be an invalid grant type
        return res.status(500).send('Invalid grant type');
    });
    /**
     * Middleware to simulate expiration of token
     * @author Gabe Abrams
     */
    app.all('*', function (req, res, next) {
        if (req.body.access_token && !tokenIsValid(req.body.access_token)) {
            req.body.access_token = 'invalid_access_token';
        }
        next();
    });
};
exports.default = initOAuth;
//# sourceMappingURL=index.js.map