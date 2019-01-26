const forgeSDK = require("forge-apis");
const config = require("../config/config");

class ForgeOAuth {
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
    const now = new Date();
    const expiresAt = new Date(this._session.expiresAt);
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
    let forgeOAuthInternal = this.OAuthClient(config.scopes.internal);
    let forgeOAuthPublic = this.OAuthClient(config.scopes.public);
    let credentialsInternal = await forgeOAuthInternal.refreshToken({ refresh_token: this._session.refreshToken });
    let credentialsPublic = await forgeOAuthPublic.refreshToken(credentialsInternal);

    this.setSession(credentialsInternal, credentialsPublic);
  }

  // Store internal and public tokens on the session
  setSession(credentialsInternal, credentialsPublic) {
    this._session.tokenInternal = credentialsInternal.access_token;
    this._session.tokenPublic = credentialsPublic.access_token;
    this._session.refreshToken = credentialsPublic.refresh_token;
    const now = new Date();
    this._session.expiresAt = (now.setSeconds(now.getSeconds() + credentialsPublic.expires_in));
  }

  OAuthClient() {
    let client_id = config.credentials.client_id;
    let client_secret = config.credentials.client_secret;
    let callback_url = config.credentials.callback_url;
    let scopes = config.scopes.internal;

    return new forgeSDK.AuthClientThreeLegged(client_id, client_secret, callback_url, scopes);
  }
}

module.exports = ForgeOAuth;