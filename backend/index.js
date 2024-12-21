const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const Ajv = require('ajv');

const {getDictionaries} = require('./lib/DictionaryManager')

// const graphGeneration = require('./utils/graphGeneration.js')


let loadedDictionaries = {}
// a terrible name, but this stores all the compiled validation functions for EACH type in EACH loaded dictionary
let dictTypeSchemasMap = {}

const {BaseGraph} = require('./models/Graph');

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
    //  NOT WORKING
    res.json(await getDictionaries());
});
// app.get('/boards', async (req, res) => {
//     res.json(getBoardsList);
// });

app.get('/graph', async (req, res) => {
    const graphFilePath = path.join(__dirname, 'data/graphs');
    console.log('Loading graphs from directory', {graphFilePath})
    let graphFiles = await fs.readdir(graphFilePath)
    graphFiles = graphFiles.filter(f => path.extname(f) === '.json');
    res.json(graphFiles);
});

app.get('/graph/:filename', async(req, res) => {
    try {
        const graphInstance = new BaseGraph({filename: req.params.filename});
        await graphInstance.load();
        res.json(graphInstance.print());
    } catch (error) {
        console.log(error)
        // TODO: distinguish 404 from all other reasons for failing to load
        res.sendStatus(404).send(`Error loading graph, file not found: ${req.params.filename}`)
    }
});

/**
 * 
 *  curl -X POST -H "Content-Type: application/json" -d @test_update.json \
 *      http://localhost:3000/graph/test1.json/update
 */

app.post('/graph/:filename/update', async(req, res) => {
    // TODO: pre-validate the passed update
    console.log(req.body)

    try {
        const graphInstance = new BaseGraph({filename: req.params.filename});
        await graphInstance.load();
        await graphInstance.update(req.body);
        // WHAT IS THE RIGHT RESPOSNE HERE?
        res.json(graphInstance.print());
        return;
    } catch (error) {
        console.log(error)
        res.sendStatus(400).send(`Update failed ${error}`)
        return;
    }
});



// NEED TO BRING BACK ALL OF THE BELOW ROUTES ONCE REFACTOR COMPLETE

// app.get('/graph/:filename/edges/generate/condition', async(req, res) => {
//     const gData = await loadGraphJsonByFilename(req.params.filename);
//     if (!gData) {
//         res.sendStatus(400).send(`Malformed graph: ${appAjvContext.errorsText(graphSchema.errors)}`)
//     }

//     // const condition = (node) => node.state === 'California'
//     const condition = (node) => parseInt(node.rate) > 225 && 
//         node.name !== "Unintentional injuries" && 
//         node.name !== "All causes"
//     const qualifiedNodes = gData.nodes.filter(condition);
//     console.log(qualifiedNodes, qualifiedNodes.length)
//     // return

//     let edges = []
//     qualifiedNodes.forEach(node => {
//         qualifiedNodes.forEach(inode => {
//             edges.push({
//                 id: `${node.id}-${inode.id}`,
//                 source: node.id,  // Set the source node ID
//                 target: inode.id,  // Set the target node ID
//                 description: 'california link',
//                 type: "Link"
//             })
//         })
//     });
    
//     console.log(`generated ${edges.length} edges from ${qualifiedNodes.length} qualified nodes`)
//     res.json(edges);
// });

// app.get('/graph/random/:numNodes/:edgesPerNode', async(req, res) => {
//     const [numNodes, edgesPerNode] = [req.params.numNodes || 50, req.params.edgesPerNode || 2] ;
//     const thisDict = Object.values(loadedDictionaries)[0]
//     const gData = graphGeneration.generateRandomGraphFromDictionary(thisDict, numNodes, edgesPerNode)
//     if (!gData) {
//         res.sendStatus(400).send(`Malformed graph: ${appAjvContext.errorsText(graphSchema.errors)}`)
//     }
//     res.json(gData);
// });

// app.get('/graph/realistic/:numNodes/:numCommunities/:intraCommunityDensity?', async(req, res) => {
//     const {numNodes = 50, numCommunities = 3, intraCommunityDensity = 0.1} = req.params ;
//     const dictionary = Object.values(loadedDictionaries)[0]
//     const gData = graphGeneration.generateRealisticGraph({dictionary, numNodes, numCommunities, intraCommunityDensity});
//     const graphInstance = new BaseGraph(gData);
//     console.log(graphInstance.print())

//     if (!gData) {
//         res.sendStatus(400).send(`Malformed graph: ${appAjvContext.errorsText(graphSchema.errors)}`)
//     }
//     res.json(gData);
// });


app.get('/', async (req, res) => {
    res.sendFile(path.resolve('../frontend/dist/index.html'));
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
