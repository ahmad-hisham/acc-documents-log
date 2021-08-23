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
            "version_id", "hub_id", "project_id", "folder_id", "item_id", "name",
            "version_number", "type", "file_type"," file_extension", "size", "create_time",
            "create_user_id", "create_user_name", "last_modified_time", "last_modified_user_id",
            "last_modified_user_name", "web_view", "full_path"
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

        const dm = new ForgeDataManagement(this._session);

        // Reading the root of a project is a special case:
        //  1. the folderId is empty (to use getProjectTopFolders)
        //  2. thefolderName is empty (to use empty root string)
        //  3. The passed allItems array is empty
        let allItems = await this.getAllItemsInFolder(dm, hubId, projectId, "", "", []);

        // Convert objects data to CSV string
        let csvString = Papa.unparse(allItems, {header: true});

        // Write all data read from all folders
        await fs.writeFile(fileName, "\ufeff" + csvString + "\r\n", {encoding: "utf8"});

        return fileName;
    }

    async exportFolder(hubId, projectId, folderId) {
        // Set filename
        const timeStamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replaceAll(':', '');
        const fileName = `download/export-hub_${hubId}_${projectId}_${folderId}_${timeStamp}.csv`;
        console.log(fileName);

        const dm = new ForgeDataManagement(this._session);

        // Reading the folder items
        // ToDo: get fullPath first
        let allItems = await this.getAllItemsInFolder(dm, hubId, projectId, folderId, "", []);

        // Convert objects data to CSV string
        let csvString = Papa.unparse(allItems, {header: true});

        // Write all data read from all folders
        await fs.writeFile(fileName, "\ufeff" + csvString + "\r\n", {encoding: "utf8"});

        return fileName;
    }

    async getAllItemsInFolder(forgeDM, hubId, projectId, folderId, fullPath, arrayOfItems) {
        // Read folder items
        let items = await forgeDM.getFolders(hubId, projectId, folderId);

        // Iterate over items and go inside folders
        for (const item of items) {
            if (item.type == "folders") {
                console.log(item.name);
                arrayOfItems = await this.getAllItemsInFolder(forgeDM, hubId, projectId, item.folder_id, fullPath + "/" + item.name, arrayOfItems);
            } else {
                item.full_path = fullPath;
                // Get all versions of an item
                const versions = await forgeDM.getVersionsForExport(hubId, projectId, folderId, item.folder_id, item.full_path);
                arrayOfItems.push(...versions)
            }
        }

        return arrayOfItems;
    }
}

module.exports = ForgeExport;