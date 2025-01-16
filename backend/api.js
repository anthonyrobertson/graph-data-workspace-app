const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { getValidator } = require('./lib/SchemaManager');
const { getDictionaries } = require('./lib/DictionaryManager');
const { BaseGraph } = require('./models/Graph');

const router = express.Router();

router.get('/schemas', async (req, res) => {
    res.json({ nodeTypeSchemaJson, edgeTypeSchemaJson, metadataSchemaJson });
});

router.get('/dictionaries', async (req, res) => {
    res.json(await getDictionaries());
});

router.get('/graph', async (req, res) => {
    const graphFilePath = path.join(__dirname, 'data/graphs');
    console.log('Loading graphs from directory', { graphFilePath });
    let graphFiles = await fs.readdir(graphFilePath);
    graphFiles = graphFiles.filter(f => path.extname(f) === '.json');
    res.json(graphFiles);
});

router.get('/graph/:filename', async (req, res) => {
    try {
        const graphInstance = new BaseGraph({ filename: req.params.filename });
        await graphInstance.load();
        res.json(graphInstance.print());
    } catch (error) {
        console.log(error);
        res.sendStatus(404).send(`Error loading graph, file not found: ${req.params.filename}`);
    }
});

router.post('/graph/:filename/update', async (req, res) => {
    const validate = await getValidator('updateSchema');
    const valid = validate(req.body);

    if (!valid) {
        return res.status(400).json({ errors: validate.errors });
    }

    try {
        const graphInstance = new BaseGraph({ filename: req.params.filename });
        await graphInstance.load();
        await graphInstance.update(req.body);
        res.status(200).json(graphInstance.print());
    } catch (error) {
        console.log(error);
        if (error.message.includes('not found')) {
            res.status(404).send(`Error loading graph, file not found: ${req.params.filename}`);
        } else {
            res.status(500).send(`Update failed: ${error.message}`);
        }
    }
});

// Uncomment and move the following routes once refactor is complete

// router.get('/graph/:filename/edges/generate/condition', async (req, res) => {
//     const gData = await loadGraphJsonByFilename(req.params.filename);
//     if (!gData) {
//         res.sendStatus(400).send(`Malformed graph: ${appAjvContext.errorsText(graphSchema.errors)}`)
//     }

//     const condition = (node) => parseInt(node.rate) > 225 && 
//         node.name !== "Unintentional injuries" && 
//         node.name !== "All causes";
//     const qualifiedNodes = gData.nodes.filter(condition);
//     console.log(qualifiedNodes, qualifiedNodes.length);

//     let edges = [];
//     qualifiedNodes.forEach(node => {
//         qualifiedNodes.forEach(inode => {
//             edges.push({
//                 id: `${node.id}-${inode.id}`,
//                 source: node.id,
//                 target: inode.id,
//                 description: 'california link',
//                 type: "Link"
//             });
//         });
//     });
    
//     console.log(`generated ${edges.length} edges from ${qualifiedNodes.length} qualified nodes`);
//     res.json(edges);
// });

// router.get('/graph/random/:numNodes/:edgesPerNode', async (req, res) => {
//     const [numNodes, edgesPerNode] = [req.params.numNodes || 50, req.params.edgesPerNode || 2];
//     const thisDict = Object.values(loadedDictionaries)[0];
//     const gData = graphGeneration.generateRandomGraphFromDictionary(thisDict, numNodes, edgesPerNode);
//     if (!gData) {
//         res.sendStatus(400).send(`Malformed graph: ${appAjvContext.errorsText(graphSchema.errors)}`);
//     }
//     res.json(gData);
// });

// router.get('/graph/realistic/:numNodes/:numCommunities/:intraCommunityDensity?', async (req, res) => {
//     const { numNodes = 50, numCommunities = 3, intraCommunityDensity = 0.1 } = req.params;
//     const dictionary = Object.values(loadedDictionaries)[0];
//     const gData = graphGeneration.generateRealisticGraph({ dictionary, numNodes, numCommunities, intraCommunityDensity });
//     const graphInstance = new BaseGraph(gData);
//     console.log(graphInstance.print());

//     if (!gData) {
//         res.sendStatus(400).send(`Malformed graph: ${appAjvContext.errorsText(graphSchema.errors)}`);
//     }
//     res.json(gData);
// });

module.exports = router;
