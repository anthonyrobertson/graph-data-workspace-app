const fs = require('fs').promises;
const path = require('path');
const Ajv = require('ajv');

const { getValidator, loadSchema, ajv } = require('./SchemaManager');

const {BaseNode, BaseEdge} = require('../models/BaseModels');
let nodeClasses = [], edgeClasses = []
const utils = require('../utils/utils');

let loadedDictionaries = {}
let dictTypeSchemasMap = {}

exports.getDictionary = async function (dictionaryID) {
    if (!dictTypeSchemasMap[dictionaryID]) {
        await loadDictionaryFromDirectory(dictionaryID);
    }
    return dictTypeSchemasMap[dictionaryID];
}
exports.getDictionaries = async function () {
    return dictTypeSchemasMap;
}

async function loadDictionaryFromDirectory (dictionaryDir) {
    // load dictionary's schemas from disk and validate them
    const nodesDir = path.join(dictionaryDir, 'nodes');
    const edgesDir = path.join(dictionaryDir, 'edges');
    const nodeFiles = await fs.readdir(nodesDir);
    const edgeFiles = await fs.readdir(edgesDir);
    const nodeTypes = {}
    const edgeTypes = {}

    // NOTE: this is a different instance of Ajv than the one in SchemaManager, this one is dictionary-specific
    const dictInstanceAjv = new Ajv();
    const metadataSchemaJson = await loadSchema(path.join(__dirname, '../schemas/metadataSchema.json'));
    dictInstanceAjv.addSchema(metadataSchemaJson); // registers the metadata schema for use by other schemas

    dictTypeSchemasMap[dictionaryDir] = {};

    const addToDictTypeSchemasMap = function (it) {
        // validation functions are pre-compiled and cached for use later
        dictTypeSchemasMap[dictionaryDir][it.$id] = dictInstanceAjv.compile(it);
    }

    const nodeTypeSchemaValidator = await getValidator('nodeTypeSchema');
    nodeFiles.forEach(async (f) => {
        const nodeType = require(path.resolve(path.join(nodesDir,f)));
        const isValid = nodeTypeSchemaValidator(nodeType);
        if (!isValid) {
            console.log({node: nodeType, isValid})
            console.log(appAjvContext.errorsText(nodeTypeSchemaValidator.errors))
            throw new Error(`Invalid properties for node: ${nodeType.$id}`);
        }
        // first pass is collecting all the schemas which might reference each other...
        dictInstanceAjv.addSchema(nodeType);
        nodeTypes[nodeType.$id] = nodeType;
        nodeClasses.push(utils.createClass(nodeType, BaseNode));
    })
    Object.values(nodeTypes).forEach(addToDictTypeSchemasMap);

    const edgeTypeSchemaValidator = await getValidator('edgeTypeSchema');
    edgeFiles.forEach(async (f) => {
        const edgeType = require(path.resolve(path.join(edgesDir,f)));
        const isValid = edgeTypeSchemaValidator(edgeType);
        if (!isValid) {
            console.log({edge: edgeType, valid: isValid})
            console.log(appAjvContext.errorsText(edgeTypeSchemaValidator.errors))
            throw new Error(`Invalid properties for edge: ${edgeType.name}`);
        }
        dictInstanceAjv.addSchema(edgeType);
        edgeTypes[edgeType.$id] = edgeType;
        edgeClasses.push(utils.createClass(edgeType, BaseEdge));
    })
    Object.values(edgeTypes).forEach(addToDictTypeSchemasMap);

    console.log(dictTypeSchemasMap)
    // this in-memory dictionary is an exception - everything else is validated as JSONschema , why not this?
    loadedDictionaries[dictionaryDir] = { // combine into a 'dictionary' in-memory
        dictionaryID: dictionaryDir, // ??? solve this issue of dictionary IDs
        nodeTypes, edgeTypes
    }

}
