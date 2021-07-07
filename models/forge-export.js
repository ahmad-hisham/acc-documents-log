const ForgeOAuth = require("../models/forge-oauth");
const ForgeDataManagement = require("../models/forge-dm");

const fs = require('fs/promises');
const Papa = require('papaparse');


class ForgeExport {
    constructor(session) {
        this._session = session;
        this._credentials = new ForgeOAuth(this._session);
        this._oauthClient = this._credentials.OAuthClient();

        // Set Headers
        this.exportHeaders = [
            "item urn", "project id", "hub id", "parent folder id",
            "href", "file name", "type", "item type", "create time",
            "create user id", "create user name", "hidden", "last modified time",
            "last modified user id", "last modified user name", " ", "full path"
        ];
      }
    
    async exportHub(hubId) {
        // Set filename
        const timeStamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replaceAll(':', '');
        const fileName = `download/export-hub_${hubId}_${timeStamp}.csv`;
        console.log(fileName);

        // Open file and write headers
        let csvHeaders = Papa.unparse([this.exportHeaders], {header: false});
        await fs.writeFile(fileName, "\ufeff" + csvHeaders + "\r\n", {encoding: "utf8"});

        // Get all projects in a hub
        const dm = new ForgeDataManagement(this._session);
        let projects = await dm.getProjects(hubId);
        console.log(projects);

        // Iterate on all projects
        for (const project of projects) {
            console.log(project);
            let projectId = project.project_id;

            // Reading the root of a project is a special case:
            //  1. the folderId is empty (to use getProjectTopFolders)
            //  2. thefolderName is empty (to use empty root string)
            //  3. The passed allItems array is empty
            let allItems = await this.getAllItemsInFolder(dm, hubId, projectId, "", "", []);

            // Convert objects data to CSV string
            let csvString = Papa.unparse(allItems, {header: false});

            // Write all data read from all folders
            await fs.appendFile(fileName, csvString + "\r\n");
        }

        return fileName;
    }

    async exportProject(hubId, projectId) {
        // Set filename
        const timeStamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replaceAll(':', '');
        const fileName = `download/export-hub_${hubId}_${projectId}_${timeStamp}.csv`;
        console.log(fileName);

        // Open file and write headers
        let csvHeaders = Papa.unparse([this.exportHeaders], {header: false});
        await fs.writeFile(fileName, "\ufeff" + csvHeaders + "\r\n", {encoding: "utf8"});

        const dm = new ForgeDataManagement(this._session);

        // Reading the root of a project is a special case:
        //  1. the folderId is empty (to use getProjectTopFolders)
        //  2. thefolderName is empty (to use empty root string)
        //  3. The passed allItems array is empty
        let allItems = await this.getAllItemsInFolder(dm, hubId, projectId, "", "", []);

        // Convert objects data to CSV string
        let csvString = Papa.unparse(allItems, {header: false});

        // Write all data read from all folders
        await fs.appendFile(fileName, csvString + "\r\n");

        return fileName;
    }

    async getAllItemsInFolder(forgeDM, hubId, projectId, folderId, fullPath, arrayOfItems) {
        //console.log(arrayOfItems);
    
        // Read folder items
        let items = await forgeDM.getFolders(hubId, projectId, folderId);
    
        // Iterate over items and go inside folders
        for (const item of items) {
            if (item.type == "folders") {
                console.log(item.name);
                arrayOfItems = await this.getAllItemsInFolder(forgeDM, hubId, projectId, item.folder_id, fullPath + "/" + item.name, arrayOfItems);
            } else {
                item.full_path = fullPath;
                arrayOfItems.push(item)
            }
        }
    
        return arrayOfItems;
    }
}

module.exports = ForgeExport;