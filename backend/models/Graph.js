const path = require('path');
const fs = require('fs').promises;

const { getValidator, ajv } = require('../lib/SchemaManager');

const {getDictionary} = require('../lib/DictionaryManager');
const {getRandomString, loadJson} = require('../utils/utils');

const appAjvContext = ajv;


class BaseGraph {

    constructor(options = {}) {
        this.options = options;
        if (options.filename) {
            this.filename = options.filename
            this.filePath = this.getGraphPath(this.filename)
        }
    }
    
    async load () {
        const fromFile = await this.loadGraphJsonFromFile(this.filePath);
    
        // FIGURE OUT WHAT GETS LOADED TO MEMORY - PROBABLY EVERYTHING?
        // HAVING DEFAULTS MIGHT BE A BAD IDEA HERE - SHOULD BE VALIDATED AT UPDATE/SAVE TIME INSTEAD

        this.uuid = fromFile.uuid || getRandomString(13);
        this.name = fromFile.name || getRandomString(13);
        this.dictionaryID = fromFile.dictionaryID;
        this.description = fromFile.description || '';
        this.created = fromFile.created || Date.now();
        this.updated = fromFile.updated || Date.now();
        this.nodes = fromFile.nodes || [];
        this.edges = fromFile.edges || [];
    }

    async loadGraphJsonFromFile(graphFilePath) {
        console.log('loading', graphFilePath)

        const graphSchemaValidator = await getValidator('graphSchema');
        // const metadataSchemaValidator = getValidator('metadataSchema');

        const graphJson = await loadJson(graphFilePath);

        // we validate the basic structure of the graph first, but not actually validating each node or edge as its type
        const valid = graphSchemaValidator(graphJson);
        console.log(`graph ${graphFilePath} itself is valid?`, valid);
        if (!valid) {
            console.log(appAjvContext.errorsText(graphSchemaValidator.errors));
            throw appAjvContext.errorsText(graphSchemaValidator.errors);
        }

        // TODO figure out where this should come from??? directory path seems janky
        const dictionaryID = graphJson.dictionaryID; 
        // const dictionarySchemas = dictTypeSchemasMap[dictionaryID]
        const dictionarySchemas = await getDictionary(dictionaryID);

        // TODO : !!! decide what to do about invalid data instances?
        graphJson.nodes.forEach(node => {
            if (!dictionarySchemas[node.type]) throw new Error(`Node type ${node.type} not found in dictionary ${dictionaryID}`)
            const isValidInstance = dictionarySchemas[node.type](node)
            if (!isValidInstance) {
                // console.log("NOT VALID:", node, dictionarySchemas[node.type].errors)
            }
        });
        graphJson.edges.forEach(edge => {
            if (!dictionarySchemas[edge.type]) throw new Error(`Edge type ${edge.type} not found in dictionary ${dictionaryID}`) 
            const isValidInstance = dictionarySchemas[edge.type](edge)
            if (!isValidInstance) {
                // console.log("NOT VALID:", edge, dictionarySchemas[edge.type].errors)
            }
        });

        return graphJson;
    }

    async update (update) {
        this.updated = Date.now();

        // merge operation
        if (update.name && this.name) this.name = update.name;
        if (update.nodes) {
            this.nodes.push(...update.nodes);
        }

        await this.saveToDisk();

        // return updatedGraph

        // return anything?
    }

    async saveToDisk() {
        try {
            // file shuffling
            const backupPath = this.filePath+'.BU'
            await fs.rename(this.filePath, backupPath); // save a backup, overwrite last backup
            const jsonData = JSON.stringify(this.print(), null, 2);
            await fs.writeFile(this.filePath, jsonData, {encoding: 'utf-8'});
        } catch (error) {
            console.log('Error saving graph file to disk:', error);
        }
    }

    print () {
        // TODO: decide if this is proper/necessary?
        // this is like for a "working" copy of the graph - just the functional parts
        // maybe not worth making this distiction? why just return `this` ?
        // is there internal stuff not intended for the client?

        // const {uuid, name, dictionaryID, nodes, edges} = this;
        // return {uuid, name, dictionaryID, nodes, edges}
        let exportable = Object.assign({}, this)
        delete exportable.options;
        return exportable // for now, until there is reason to be more concise
    }

    getGraphPath (filename) {
        return path.join(__dirname, '../data/graphs', filename)
    }



}

module.exports = { BaseGraph }