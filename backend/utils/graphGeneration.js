const { faker } = require('@faker-js/faker');

// Utility function to generate random strings and numbers
function getRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to generate random data for properties based on schema type
function generateRandomValue(propertySchema) {
    // if (propertySchema.const) return propertySchema.const;
    if (propertySchema.$ref && propertySchema.$ref === 'metadataSchema') return {author: '', created: 0}
        
    switch (propertySchema.type) {
        case 'string':
            if (propertySchema.enum) {
                // If it's an enum, pick a random value from the enum
                return propertySchema.enum[Math.floor(Math.random() * propertySchema.enum.length)];
            }
            return getRandomString(8);  // Example random string
        case 'integer':
            return getRandomNumber(1, 100);  // Example random integer
        case 'boolean':
            return Math.random() > 0.5;  // Random boolean
        case 'array':
            return [generateRandomValue(propertySchema.items)];  // Generate a random array of one item for simplicity
        case 'object':
            return generateRandomObject(propertySchema);  // Recursively generate object
        default:
            return null;
    }
}

// Function to generate a random object based on the schema
function generateRandomObject(schema) {
    const obj = {};
    Object.keys(schema.properties).forEach((key) => {
        const propertySchema = schema.properties[key];
        obj[key] = propertySchema.const || generateRandomValue(propertySchema);
    });
    return obj;
}

// Function to generate a Node object based on a schema
function generateNode(schema) {
    let randomButValid = generateRandomObject(schema);
    if (schema.$id === "Person") { // THIS REALLY SHOULD NOT BE HERE - NOT DATA_DRIVEN
        randomButValid.name = faker.person.firstName();
    }
    return randomButValid;
}

// Function to generate an Edge object based on a schema and a pair of nodes
function generateEdge(schema, sourceNode, targetNode, description = '') {
    const edge = generateRandomObject(schema);
    edge.source = sourceNode.id;  // Set the source node ID
    edge.target = targetNode.id;  // Set the target node ID
    edge.description = description;
    return edge;
}

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getEdgeTypeMatchingSourceNode (edgeTypes, sourceNode) {
    // console.log({edgea: edgeTypes.map(e => e.properties.validSourceTypes && e.properties.validSourceTypes.const), sourceNode})
    return edgeTypes.filter(e => e.properties.validSourceTypes && e.properties.validSourceTypes.const.includes(sourceNode.type))
}
function getEdgeTypeMatchingTargetNode (edgeTypes, targetNode) {
    // console.log({edgea: edgeTypes.map(e => e.properties.validSTargetypes && e.properties.validTargetTypes.const), targetNode})
    return edgeTypes.filter(e => e.properties.validTargetTypes && e.properties.validTargetTypes.const.includes(targetNode.type))
}
function getNodesMatchingEdgeTargetType (nodes, edgeType) {
    return nodes.filter(n => edgeType.properties.validTargetTypes && edgeType.properties.validTargetTypes.const.includes(n.type))
}

function getRandomNodes (nodeSchemas, numNodes) {
    let nodes = []
    for (let i = 0; i < numNodes; i++) {
        const nodeSchema = getRandomElement(nodeSchemas);  // Randomly select a node schema
        const node = generateNode(nodeSchema);
        node.id = getRandomString(8);
        nodes.push(node);
    }
    return nodes;
}

exports.generateRandomGraphFromDictionary = function (dictionary, numNodes = 5, couplingFactor = 2) {
    const [nodeSchemas, edgeSchemas] = [Object.values(dictionary.nodeTypes),Object.values(dictionary.edgeTypes)]
    const nodes = [];
    const edges = [];
    nodes.push(...getRandomNodes(nodeSchemas, numNodes))
    
    // Generate edges based on the coupling factor
    for (let i = 0; i < nodes.length; i++) {
        const howMany = Math.round(Math.random()*couplingFactor) // coupling factor as max

        
        for (let j = 0; j < howMany; j++) {
            const edgeOptions = getEdgeTypeMatchingSourceNode(edgeSchemas, nodes[i]);  // Randomly select an edge schema
            console.log({node: nodes[i], edgeOptions})
            if (!edgeOptions.length) {
                console.log(`skipping edge generation since no compatilbe edge types found for source node type ${nodes[i].type}`)
                continue;
            }
            const edgeSchema = getRandomElement(edgeOptions);  // Randomly select of the valid edge types
            // const edgeSchema = getRandomElement(edgeSchemas);  // Randomly select of the valid edge types
            // Randomly connect nodes
            const nodeOptions = getNodesMatchingEdgeTargetType(nodes, edgeSchema)
            const targetIndex = getRandomNumber(0, nodeOptions.length - 1);
            if (!nodeOptions.length) continue;
            if (i !== targetIndex) {  // Prevent self-loops for simplicity
                const edge = generateEdge(edgeSchema, nodes[i], nodeOptions[targetIndex]);
                edges.push(edge);
            }
        }
    }
    
    return { 
        uuid: generateRandomValue({type: 'string'}), // cheap UUID
        name: generateRandomValue({type: 'string'}), // cheap name
        dictionaryID: dictionary.dictionaryID,
        nodes, edges 
    };
}

// Example usage
// const testData = generateTestData(personSchema, edgeSchema, 10, 3);  // Generate 10 nodes, with a coupling factor of 3
// console.log(JSON.stringify(testData, null, 2));





function createCommunities(nodes, edges, numCommunities = 3, edgeSchemas, intraCommunityDensity = 0.6) {
    const communities = [];
    const communitySize = Math.floor(nodes.length / numCommunities);

    for (let i = 0; i < numCommunities; i++) {
        const community = nodes.slice(i * communitySize, (i + 1) * communitySize);
        const communityEdges = []
        
        // Create intra-community edges based on the specified density
        community.forEach((nodeA, i) => {
            nodeA.community = i // ?
            const edgeOptions = getEdgeTypeMatchingSourceNode(edgeSchemas, nodeA);  // Randomly select an edge schema
            const edgeSchema = getRandomElement(edgeOptions);  // Randomly select of the valid edge types
            if (!edgeSchema) return; // nothing valid to do so bail

            const targetNodeOptions = getNodesMatchingEdgeTargetType(community, edgeSchema)

            targetNodeOptions.forEach(nodeB => {
                const nodeBDegree = edges.filter(e => e.source === nodeB.id || e.target === nodeB.id).length
                const degreeRatio = edges.length ? nodeBDegree / edges.length : 0 ; // avoid dividing by zero!
                // this is how i'm trying to bake-in prefferential attachment
                const combinedComparator = parseFloat(intraCommunityDensity) + (parseFloat(degreeRatio * 2))

                if (nodeA !== nodeB && Math.random() < combinedComparator) {
                    const edge = generateEdge(edgeSchema, nodeA, nodeB); // Assuming addEdge adds an edge to your graph
                    edges.push(edge) // adds edges directly
                    communityEdges.push(edge)
                }
            });
        });
        communities.push({nodes: community, edges: communityEdges}); // this is just for reference I guess
    }
    return communities;
}

function addMotif(motifType, LinkSchema, nodes) {
    switch (motifType) {
        case "triad": // Create a triangle connection
            if (nodes.length >= 3) {
                generateEdge(LinkSchema, nodes[0], nodes[1], "Triad");
                generateEdge(LinkSchema, nodes[1], nodes[2], "Triad");
                generateEdge(LinkSchema, nodes[2], nodes[0], "Triad");
            }
            break;
        case "star": // One node connected to multiple others
            const [center, ...others] = nodes;
            others.forEach(node => addEdge(center, node, "Star"));
            break;
        case "line": // Sequentially link all nodes
            for (let i = 0; i < nodes.length - 1; i++) {
                addEdge(nodes[i], nodes[i + 1], "Line");
            }
            break;
        /// Add more cases as needed for other motifs
    }
}

function addBridge(communityA, communityB, edges, LinkEdgeSchema) {
    const [aLen, bLen] = [communityA.nodes.length, communityB.nodes.length]
    const nodeA = communityA.nodes[Math.floor(Math.random() * aLen)];
    const nodeB = communityB.nodes[Math.floor(Math.random() * bLen)];
    // console.log({nodeA, nodeB})
    
    // THESE need to respect validType connections
    /// CONSIDER MAKING BRIDGES INTO MOTIFS - 

    const bridgeLink = generateEdge(LinkEdgeSchema, nodeA, nodeB , 'bridge');  // Connects two nodes between communities
    edges.push(bridgeLink)
}

function preferentialAttachment(nodes, edges, probability = 0.1, LinkEdgeSchema) {
    nodes.forEach(nodeA => {
        nodes.forEach(nodeB => {
            const nodeBDegree = edges.filter(e => e.source === nodeB.id || e.target === nodeB.id).length
            console.log(nodeBDegree)
            // SOMETHING IS WRONG WITH THIS - TOO MANY CONNECTIONS!!!!!!!!!!!!!!!!!!!!!!!!
            if (nodeA !== nodeB && Math.random() < probability * (nodeBDegree/10)) {
                const prefEdge = generateEdge(LinkEdgeSchema, nodeA, nodeB, "Preferred");
                edges.push(prefEdge);
            }
        });
    });
}

exports.generateRealisticGraph = function (config = {}) {
    const { dictionary, numNodes = 50, numCommunities = 3, intraCommunityDensity = 0.5, bridgeProbability = 0.7, attachmentProbability = 0.2 } = config;

    const [nodeSchemas, edgeSchemas] = [Object.values(dictionary.nodeTypes), Object.values(dictionary.edgeTypes)]
    const nodes = [];
    const edges = [];
    nodes.push(...getRandomNodes(nodeSchemas, numNodes))

    // Step 1: Create communities
    const communities = createCommunities(nodes, edges, numCommunities, edgeSchemas, intraCommunityDensity);

    // Step 2: Add motifs within each community
    // SKIPPED THIS FOR NOW
    const motifTypes = []
    communities.forEach(community => {
        // const subset = community.slice(0, Math.min(community.length, 4)); // Choose a subset for motif
        // addMotif('triad', subset);

        // motifTypes.forEach(motifType => {
        //     const subset = community.slice(0, Math.min(community.length, 4)); // Choose a subset for motif
        //     addMotif(graph, motifType, subset);
        // });
    });

    // Step 3: Add bridges between communities
    for (let b = 0; b < 4; b++) { // bridging rounds
        for (let i = 0; i < communities.length - 1; i++) {
            if (Math.random() < bridgeProbability) {
                addBridge(communities[i], communities[i + 1], edges, dictionary.edgeTypes.Link);
            }
        }
    }

    // Step 4: Apply preferential attachment to form hubs
    // preferentialAttachment(nodes, edges, attachmentProbability, dictionary.edgeTypes.Link);
    
    return { 
        uuid: generateRandomValue({type: 'string'}), // cheap UUID
        name: generateRandomValue({type: 'string'}), // cheap name
        dictionaryID: dictionary.dictionaryID,
        nodes,
        edges
    };
}
