/**
 * @fileoverview SchemaManager.js - This file is responsible for loading and compiling and caching
 *  the application-level JSON schemas for validation
 *  ( Dictionary-related schemas are loaded by DictionaryManager.js )
 */
const Ajv = require('ajv');
const path = require('path');
const fs = require('fs').promises;

const ajv = new Ajv();
const schemaCache = {};
const schemaDir = path.join(__dirname, '../schemas');

async function loadSchema(schemaPath) {
    const schemaData = await fs.readFile(schemaPath, 'utf8');
    return JSON.parse(schemaData);
}

async function compileSchema(schemaPath) {
    const schema = await loadSchema(schemaPath);
    return ajv.compile(schema);
}

async function getValidator(schemaId) {
    // console.log('request to get validator', schemaId)
    if (!schemaCache[schemaId]) {
        const schemaPath = path.join(schemaDir, `${schemaId}.json`);
        schemaCache[schemaId] = await compileSchema(schemaPath);
    }
    // console.log('this one', schemaCache[schemaId])
    return schemaCache[schemaId];
}

async function preloadSchemas() {
    console.log('preloading schemas...')
    const files = await fs.readdir(schemaDir);
    // 'metadataSchema' needs to go first
    const metaDataFileIndex = files.indexOf('metadataSchema.json');
    if (metaDataFileIndex > -1) {
        files.splice(metaDataFileIndex, 1);
        files.unshift('metadataSchema.json');
    }
    const loadPromises = files.map(async (file) => {
        const schemaId = path.basename(file, '.json');
        console.log('preloading', schemaId, file)
        const schemaPath = path.join(schemaDir, file);
        schemaCache[schemaId] = await compileSchema(schemaPath);
    });
    await Promise.all(loadPromises);
    console.log({schemaCache})
}

module.exports = {
    loadSchema,
    compileSchema,
    getValidator,
    preloadSchemas,
    ajv
};
