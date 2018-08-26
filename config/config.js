module.exports = {
  // Forge Config parameters
  credentials: {
    client_id: "FORGE_CLIENT_ID",
    client_secret: "FORGE_CLIENT_SECRET",
    callback_url: "http://localhost:3000/oauth/callback"
  },

  scopes: {
    // Required scopes for your application on server-side
    internal: ["bucket:create", "bucket:read", "data:read", "data:create", "data:write"],
    // Required scope of the token sent to the client
    public: ["viewables:read"]
  }
};
