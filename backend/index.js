const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const Ajv = require('ajv');

const graphGeneration = require('./utils/graphGeneration.js')

// const Note = require('./models/Note'); // Path to your Note class file
const metadataSchemaJson = require('./schemas/metadataSchema.json'); 
const nodeTypeSchemaJson = require('./schemas/nodeTypeSchema.json'); 
const edgeTypeSchemaJson = require('./schemas/edgeTypeSchema.json'); 
const graphSchemaJson = require('./schemas/graphSchema.json'); 

const {BaseNode, BaseEdge} = require('./models/BaseModels');
let nodeClasses = [], edgeClasses = []
const utils = require('./utils/utils');

const appAjvContext = new Ajv();
const metadataSchema = appAjvContext.compile(metadataSchemaJson);
const nodeTypeSchema = appAjvContext.compile(nodeTypeSchemaJson);
const edgeTypeSchema = appAjvContext.compile(edgeTypeSchemaJson);
const graphSchema = appAjvContext.compile(graphSchemaJson);

let loadedDictionaries = {}
// a terrible name, but this stores all the compiled validation functions for EACH type in EACH loaded dictionary
let dictTypeSchemasMap = {}


const app = express();
// app.use(express.json());
app.use(express.static('../frontend/dist'))
app.use(express.json({limit: '200mb'}));
app.use(express.urlencoded({limit: '200mb', extended: true, parameterLimit: 50000}));
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
}))


app.get('/schemas', async (req, res) => {
    res.json({nodeTypeSchemaJson, edgeTypeSchemaJson, metadataSchemaJson});
});
app.get('/dictionaries', async (req, res) => {
    res.json(loadedDictionaries);
});

app.get('/models', async (req, res) => {
    // TODO: decide what to do here
    const nodes = nodeClasses.map(nodeType => {
        const nr = {}
        nr[nodeType.definition.type] = nodeType.definition.attributes.map(a => a.name) // kinda boring..
        return nr
    });
    const edges = edgeClasses.map(edgeType => {
        const ner = {}
        ner[edgeType.definition.type] = edgeType.definition // kinda boring..
        return ner
    });
    res.json({nodes, edges});
});

app.get('/graph', async (req, res) => {
    const graphFilePath = path.join(__dirname, 'data/graphs');
    console.log({graphFilePath})
    const graphFiles = await fs.readdir(graphFilePath)
    res.json(graphFiles);
});

app.get('/graph/:filename', async(req, res) => {
    const gData = await loadGraphJsonByFilename(req.params.filename);
    if (!gData) {
        res.sendStatus(400).send(`Malformed graph: ${appAjvContext.errorsText(graphSchema.errors)}`)
    }
    res.json(gData);
});

app.get('/graph/random/:numNodes/:edgesPerNode', async(req, res) => {
    const [numNodes, edgesPerNode] = [req.params.numNodes || 50, req.params.edgesPerNode || 2] ;
    const thisDict = Object.values(loadedDictionaries)[0]
    const gData = graphGeneration.generateRandomGraphFromDictionary(thisDict, numNodes, edgesPerNode)
    if (!gData) {
        res.sendStatus(400).send(`Malformed graph: ${appAjvContext.errorsText(graphSchema.errors)}`)
    }
    res.json(gData);
});

app.get('/graph/realistic/:numNodes/:numCommunities/:intraCommunityDensity?', async(req, res) => {
    const {numNodes = 50, numCommunities = 3, intraCommunityDensity = 0.1} = req.params ;
    const dictionary = Object.values(loadedDictionaries)[0]
    const gData = graphGeneration.generateRealisticGraph({dictionary, numNodes, numCommunities, intraCommunityDensity});
    if (!gData) {
        res.sendStatus(400).send(`Malformed graph: ${appAjvContext.errorsText(graphSchema.errors)}`)
    }
    res.json(gData);
});

app.get('/', async (req, res) => {
    res.sendFile(path.resolve('../frontend/dist/index.html'));
});


async function loadDictionaryFromDirectory (dictionaryDir) {
    // load dictionary's schemas from disk and validate them
    const nodesDir = path.join(dictionaryDir, 'nodes');
    const edgesDir = path.join(dictionaryDir, 'edges');
    const nodeFiles = await fs.readdir(nodesDir);
    const edgeFiles = await fs.readdir(edgesDir);
    const nodeTypes = {}
    const edgeTypes = {}

    const dictInstanceAjv = new Ajv();
    dictInstanceAjv.addSchema(metadataSchemaJson);

    dictTypeSchemasMap[dictionaryDir] = {};

    const addToDictTypeSchemasMap = function (it) {
        // dictTypeSchemasMap[dictionaryDir][it.properties.type.const] = dictInstanceAjv.compile(it);
        dictTypeSchemasMap[dictionaryDir][it.$id] = dictInstanceAjv.compile(it);
    }

    nodeFiles.forEach(async (f) => {
        const nodeType = require(path.resolve(path.join(nodesDir,f))); // seems to work the same?
        const isValid = nodeTypeSchema(nodeType);
        if (!isValid) {
            console.log({node: nodeType, isValid})
            console.log(appAjvContext.errorsText(nodeTypeSchema.errors))
            throw new Error(`Invalid properties for node: ${nodeType.$id}`);
        }
        // first pass is collecting all the schemas which might reference each other...
        dictInstanceAjv.addSchema(nodeType);
        nodeTypes[nodeType.$id] = nodeType;
        nodeClasses.push(utils.createClass(nodeType, BaseNode));
    })
    Object.values(nodeTypes).forEach(addToDictTypeSchemasMap);

    edgeFiles.forEach(async (f) => {
        const edgeType = require(path.resolve(path.join(edgesDir,f)));
        const isValid = edgeTypeSchema(edgeType);
        if (!isValid) {
            console.log({edge: edgeType, valid: isValid})
            console.log(appAjvContext.errorsText(edgeTypeSchema.errors))
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


async function loadGraphJsonById(id) {
    return await loadGraphJsonFromFile(path.join(__dirname, 'data/graphs', `${id}.json`))
}
async function loadGraphJsonByFilename(filename) {
    return await loadGraphJsonFromFile(path.join(__dirname, 'data/graphs', filename))
}
async function loadGraphJsonFromFile(graphFilePath) {
    console.log('loading', graphFilePath)
    const graphJson = await loadJson(graphFilePath);

    // we validate the basic structure of the graph first, but not actually validating each node or edge as its type
    const valid = graphSchema(graphJson);
    console.log(`graph ${graphFilePath} itself is valid?`, valid)
    if (!valid) {
        console.log(appAjvContext.errorsText(graphSchema.errors))
        return false;
    }

    // TODO figure out where this should come from??? directory path seems janky
    const dictionaryID = graphJson.dictionaryID; 
    const dim = dictTypeSchemasMap[dictionaryID]

    // TODO : decide what to do about invalid data instances?
    graphJson.nodes.forEach(node => {
        if (!dim[node.type]) throw new Error(`Node type ${node.type} not found in dictionary ${dictionaryID}`)
        const isValidInstance = dim[node.type](node)
        if (!isValidInstance) {
            console.log("NOT VALID:", node, dim[node.type].errors)
        }
    });
    graphJson.edges.forEach(edge => {
        if (!dim[edge.type]) throw new Error(`Edge type ${edge.type} not found in dictionary ${dictionaryID}`) 
        const isValidInstance = dim[edge.type](edge)
        if (!isValidInstance) {
            console.log("NOT VALID:", edge, dim[edge.type].errors)
        }
    });

    return graphJson;
}

async function loadJson (filepath) {
    try {
      await fs.access(filepath);
      const graphData = await fs.readFile(filepath, 'utf8');
      return JSON.parse(graphData);
    } catch (error) {
      console.log(error)
      return false;
    }
}



// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

(async () => {

    // doing it once for example, but server should support multiple simeltaneously - if used on server side
    await loadDictionaryFromDirectory('./dictionaries/forensic');

    console.log({nodeClasses, edgeClasses})

})();
