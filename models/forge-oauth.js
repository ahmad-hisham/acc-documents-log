let forgeSDK = require("forge-apis");
let config = require("../config/config");

class OAuth {
  constructor(session) {
    this._session = session;
  }
  // returns the Public scope token (Viewer)
  async getTokenPublic() {
    if (this.isExpired())
      await this.refreshToken();
    return { access_token: this._session.tokenPublic, expires_in: this.getExpiresIn() };
  }
  // returns the Internal scope token (data management)
  async getTokenInternal() {
    if (this.isExpired())
      await this.refreshToken();
    return { access_token: this._session.tokenInternal, expires_in: this.getExpiresIn() };
  }
  getExpiresIn() {
    var now = new Date();
    var expiresAt = new Date(this._session.expiresAt);
    return Math.round((expiresAt.getTime() - now.getTime()) / 1000);
  }
  isExpired() {
    return (new Date() > new Date(this._session.expiresAt));
  }
  isAuthorized() {
    return (!!this._session.tokenPublic);
  }

  // On callback, pass the CODE to get the internal and public tokens
  async setCode(code) {
    let forgeOAuthInternal = this.OAuthClient(config.scopes.internal);
    let forgeOAuthPublic = this.OAuthClient(config.scopes.public);
    let credentialsInternal = await forgeOAuthInternal.getToken(code);
    let credentialsPublic = await forgeOAuthPublic.refreshToken(credentialsInternal);

    this.setSession(credentialsInternal, credentialsPublic);
  }

  // Refresh both internal and public tokens, keep new refresh token
  async refreshToken() {
    var forgeOAuthInternal = this.OAuthClient(config.scopes.internal);
    var forgeOAuthPublic = this.OAuthClient(config.scopes.public);
    let credentialsInternal = await forgeOAuthInternal.refreshToken({ refresh_token: this._session.refreshToken });
    let credentialsPublic = await forgeOAuthPublic.refreshToken(credentialsInternal);

    this.setSession(credentialsInternal, credentialsPublic);
  }

  // Store internal and public tokens on the session
  setSession(credentialsInternal, credentialsPublic) {
    this._session.tokenInternal = credentialsInternal.access_token;
    this._session.tokenPublic = credentialsPublic.access_token;
    this._session.refreshToken = credentialsPublic.refresh_token;
    var now = new Date();
    this._session.expiresAt = (now.setSeconds(now.getSeconds() + credentialsPublic.expires_in));
  }

  OAuthClient() {
    var client_id = config.credentials.client_id;
    var client_secret = config.credentials.client_secret;
    var callback_url = config.credentials.callback_url;
    var scopes = config.scopes.internal;

    return new forgeSDK.AuthClientThreeLegged(client_id, client_secret, callback_url, scopes);
  }
}

module.exports = OAuth;