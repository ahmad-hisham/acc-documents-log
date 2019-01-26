const forgeSDK = require("forge-apis");
const ForgeOAuth = require("../models/forge-oauth");

class ForgeDataManagement {
  constructor(session) {
    this._session = session;
    this._credentials = new ForgeOAuth(this._session);
    this._oauthClient = this._credentials.OAuthClient();
  }

  async getHubs() {
    try {
      let tokenInternal = await this._credentials.getTokenInternal();

      const hubsApi = new forgeSDK.HubsApi();
      let data = await hubsApi.getHubs({}, this._oauthClient, tokenInternal);
      console.log(data.body.data);

      let hubs = data.body.data.map(hub => ({
        hub_id: hub.id,
        href: hub.links.self.href,
        name: hub.attributes.name,
        type: hub.attributes.extension.type
      }));
      return hubs;

    } catch (error) {
      console.log(error);
    }
  }

  async getProjects(hubId) {
    try {
      let tokenInternal = await this._credentials.getTokenInternal();

      const projectsApi = new forgeSDK.ProjectsApi();
      let data = await projectsApi.getHubProjects(hubId, {}, this._oauthClient, tokenInternal);
      console.log(data.body.data);

      let projects = data.body.data.map(project => ({
        project_id: project.id,
        hub_id: hubId,
        href: project.links.self.href,
        name: project.attributes.name,
        type: project.attributes.extension.type
      }));
      return projects;

    } catch (error) {
      console.log(error);
    }
  }

  async getFolders(hubId, projectId, folderId = "") {
    try {
      let tokenInternal = await this._credentials.getTokenInternal();

      const projectsApi = new forgeSDK.ProjectsApi();
      const foldersApi = new forgeSDK.FoldersApi();
      let data;
      if (folderId == "") 
        data = await projectsApi.getProjectTopFolders(hubId, projectId, this._oauthClient, tokenInternal);
      else
        data = await foldersApi.getFolderContents(projectId, folderId, {}, this._oauthClient, tokenInternal);

      console.log(data.body.data);
      let items = data.body.data.map(item => ({
        folder_id: item.id,
        project_id: projectId,
        hub_id: hubId,
        parent_id: folderId,
        href: item.links.self.href,
        name: (item.attributes.displayName != null) ? item.attributes.displayName : item.attributes.name,
        type: item.type,
        folder_type: item.attributes.extension.type,
        create_time: item.attributes.createTime,
        create_user_id: item.attributes.createUserId,
        create_user_name: item.attributes.createUserName,
        hidden: item.attributes.hidden,
        last_modified_time: item.attributes.lastModifiedTime,
        last_modified_user_id: item.attributes.lastModifiedUserId,
        last_modified_user_name: item.attributes.lastModifiedUserName,
        object_count: item.attributes.objectCount
      }));
      return items;

    } catch (error) {
      console.log(error);
    }
  }

  async getVersions(hubId, projectId, folderId, itemId) {
    try {
      let tokenInternal = await this._credentials.getTokenInternal();

      const itemsApi = new forgeSDK.ItemsApi();
      let data = await itemsApi.getItemVersions(projectId, itemId, {}, this._oauthClient, tokenInternal);

      const foldersApi = new forgeSDK.FoldersApi();
      let parentData = await foldersApi.getFolderContents(projectId, folderId, {}, this._oauthClient, tokenInternal);

      console.log(data.body.data);
      let versions = data.body.data.map(version => {
        // The result object used in map function needs more processing
        // So we will use a function to return the object in versions array
        // with additional processing after the lateral object is created 
        let newVersion = {
          version_id: version.id,
          hub_id: hubId,
          project_id: projectId,
          folder_id: folderId,
          item_id: itemId,
          name: (version.attributes.displayName == null) ? version.attributes.name : version.attributes.displayName,
          version_number: version.attributes.versionNumber,
          type: version.type,
          file_type: version.attributes.extension.type,
          file_extension: version.attributes.fileType,
          mime_type: version.attributes.mimeType,
          size: version.attributes.storageSize,
          create_time: version.attributes.createTime, // new Date(version.attributes.createTime).toLocaleString(),
          create_user_id: version.attributes.createUserId,
          create_user_name: version.attributes.createUserName,
          last_modified_time: version.attributes.lastModifiedTime,
          last_modified_user_id: version.attributes.lastModifiedUserId,
          last_modified_user_name: version.attributes.lastModifiedUserName,
          viewer_urn: (typeof version.relationships.derivatives  != "undefined") ? version.relationships.derivatives.data.id : null, //Base64 encoded URN
          viewer_viewable_id: (typeof version.attributes.extension.data  != "undefined") ? version.attributes.extension.data.viewableId : null, // viewableID
          ref_derivatives: (typeof version.relationships.derivatives != "undefined") ? version.relationships.derivatives.meta.link.href : null, //Manifest for derivatives
          ref_download_formats: (typeof version.relationships.downloadFormats != "undefined") ? version.relationships.downloadFormats.links.related.href : null, //Download format
          ref_thumbnails: (typeof version.relationships.thumbnails != "undefined") ? version.relationships.thumbnails.meta.link.href : null, //Thumbnail
          ref_item: (typeof version.relationships.item != "undefined") ? version.relationships.item.data.id : null, //Item lineage
          ref_storage: (typeof version.relationships.storage != "undefined") ? version.relationships.storage.data.id : null //source file
        };

        // Version name need additional processing 
        newVersion.name +=  " v" + newVersion.version_number.toString(); // or version.id.match(/^(.*)\?version=(\d+)$/)[2]

        // Sheets from BIM360 Document from Plans folder
        if (newVersion.file_type == "versions:autodesk.bim360:Document") {
          let parentSourceItem = parentData.body.data.find(parentFolderItem => {
            return (parentFolderItem.attributes.extension.data.sourceFileName == version.attributes.extension.data.sourceFileName);
          });
          // We have a match, get the parent Item urn as viewer_urn
          let parentURN = parentSourceItem.relationships.tip.data.id;
          newVersion.viewer_urn = this.encodeBase64Url(parentURN);
        }

        return newVersion;
      });
      return versions;

    } catch (error) {
      console.log(error);
    }
  }

  async getViewerLink(versionUrn, viewableId = "", internalToken = false) {
    try {
      let token = (internalToken) ? await this._credentials.getTokenInternal() : await this._credentials.getTokenPublic();

      let url = "/viewer.html?token=" + token.access_token + "&urn=" + versionUrn;
      if (viewableId != "")
        url += "&viewable=" + viewableId;
  
      console.log(url);
      return url;

    } catch (error) {
      console.log(error);
    }
  }

  encodeBase64Url(str) {
    return Buffer.from(str, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }
}

module.exports = ForgeDataManagement;