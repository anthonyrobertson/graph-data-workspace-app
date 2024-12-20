let width = 1000, height = 900;
const _ = require('underscore');
const {JSONEditor} = require('@json-editor/json-editor');

const exampleGraph = require('./exampleGraph.json'); // a generated example

let nodes = exampleGraph.nodes;
let links = exampleGraph.edges;
window.graph = exampleGraph

/**
 * The bare-minimum frontend
 *  Still lacking: load another graph from server
 */

const svg = d3.select("svg")
    .on("click", function (event) {
        simulation.stop()
        const target = d3.select(event.target);
    
        node.attr("r", 7)
        if (target.classed("node")) {
            target.attr("r", 14) // selected
            console.log("Node clicked:", target.datum());
        } else if (target.classed("link")) {
            console.log("Edge clicked:", target.datum());
        }
        simulation.restart();
    });

const tickFn = () => {
    requestAnimationFrame(() => {    
        node.attr("cx", d => d.x).attr("cy", d => d.y);
        label.attr("x", d => d.x).attr("y", d => d.y);
        link // remember this is a different datum, d - a link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
    })
}
// 50ms throttle seems to be a good roughly, tune more 
const throttledTick = _.throttle(tickFn, 50);

function boundingBoxForce() {
    return function() {
        nodes.forEach(d => {
            const padding = 20; // from svg edge
            d.x = Math.max(padding, Math.min(width - padding, d.x));
            d.y = Math.max(padding, Math.min(height - padding, d.y));
        });
    };
}


// Initialize simulation with forces
const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(150))  // Link force with distance
    // .force("boundingBox", boundingBoxForce())
    .force("charge", d3.forceManyBody().strength(-100))  // Repel nodes
    // .force("center", d3.forceCenter(width / 2, height / 2))  // Centering force
    // .force("x", d3.forceX(width / 2).strength(0.01))  // Pulls nodes toward the center horizontally
    // .force("y", d3.forceY(height / 2).strength(0.04))
    .on("tick", throttledTick)
    .alphaDecay(0.05); // in combination with throttledTick = nice

// Render links (edges)
let link = svg.selectAll(".link")
    .data(links, d => d.source.id + "-" + d.target.id)
    .enter().append("line")
    .attr("class", "link")
    .attr("data-type", d => d.type)
    .attr("stroke-width", 4)

// Render nodes (circles)
let node = svg.selectAll(".node")
    .data(nodes)
    .enter().append("circle")
    .attr("class", "node")
    .attr("fill", d => d.color)
    .attr("r", 7)
    .attr("data-type", d => d.type)
    .call(d3.drag()  // Enable drag behavior
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))

// Add labels to the nodes
let label = svg.selectAll(".label")
    .data(nodes)
    .enter().append("text")
    .attr("class", "label")
    .attr("dx", 12)
    .attr("dy", ".35em")
    .text(d => d.name);


// "in simulation" Drag functions
function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    
    node.attr("r", 7)
    d3.select(this).attr("r", 14) // selected

    d.fx = d.x;
    d.fy = d.y;
}
function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}
function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

// Static drag handlers (no force simulation)
function dragStartedStatic(event, d) {
    d3.select(this).raise().attr("stroke", "black");
}
function draggedStatic(event, d) {
    d.x = event.x;
    d.y = event.y;

    // Update node and links manually
    d3.select(this).attr("cx", d.x).attr("cy", d.y);

    link
        .attr("x1", l => l.source.x)
        .attr("y1", l => l.source.y)
        .attr("x2", l => l.target.x)
        .attr("y2", l => l.target.y);

    label
        .filter(l => l.id === d.id)
        .attr("x", d.x + 12)
        .attr("y", d.y + 3);
}
function dragEndedStatic(event, d) {
    d3.select(this).attr("stroke", null);
}

// Update the simulation with the new nodes and links
function updateGraph() {
    simulation.nodes(nodes);
    // simulation.force("link").links(links);
    const baseDistance = 20 + (width / Math.sqrt(nodes.length + 1)) // attempting to use available space more effectively
    const dynamicDistance = d => d.type === 'Person' ? 5 : baseDistance ;
    simulation.force("link", d3.forceLink(links).id(d => d.id).distance(dynamicDistance))

    link = svg.selectAll(".link").data(links, d => d.source.id + "-" + d.target.id);  // Unique key for each link

    // Exit: Remove old links that no longer exist in the data
    link.exit().remove();

    // Enter: Create new links for new data
    link = link.enter().append("line")
        .attr("class", "link newlink")
        .attr("data-type", d => d.type)
        .attr("stroke-width", 4)
        .merge(link);  // Merge with existing links

    // Handle nodes (circles)
    node = svg.selectAll(".node")
        .data(nodes, d => d.id);  // Use 'id' as the key for nodes

    // Exit: Remove old nodes
    node.exit().remove();


    // Enter: Add new nodes
    node.enter().append("circle")
        .attr("class", "node")
        .attr("fill", d => d.color)
        .attr("r", 7)
        .attr("data-type", d => d.type)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .merge(node) // Merge with existing nodes
        .raise();  

    // Update labels too
    label = svg.selectAll(".label")
        .data(nodes, d => d.id);

    label.exit().remove();

    label.enter().append("text")
        .attr("class", "label")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text(d => d.name)
        .merge(label)
        .raise();

    // Restart the simulation with the updated data
    simulation.alpha(1).restart();
}

function renderJsonEditor (wholeDictionary) {
    const customer = wholeDictionary["./dictionaries/supplyChain"].nodeTypes.Customer

    const je = new JSONEditor(document.getElementById('testform'), {
        schema: customer
    });
}

async function fetchDictionary () {
    const dictionaryResponse = await fetch('http://localhost:3000/dictionaries')
    const dictionary = await dictionaryResponse.json();
    console.log(dictionary)
    return dictionary;
}

function loadAGraph (graphFilenameOnly) {
    fetch(`http://localhost:3000/graph/${graphFilenameOnly}`)
        .then((response) => response.json())
        .then((d) => {
            nodes = d.nodes
            updateGraph();
            links = d.edges
            updateGraph();
        });
}

function pauseForce () {
    simulation.stop();
    node.on('.drag', null);
    node.call(d3.drag()
        .on("start", dragStartedStatic)
        .on("drag", draggedStatic)
        .on("end", dragEndedStatic));
}

function resumeForce () {
    simulation.alpha(1).restart()
    node.on('.drag', null);
    node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
}

Array.from(document.querySelectorAll('.action')).forEach(button => {
    button.addEventListener('click', async function (e) {
        switch (e.target.getAttribute('data-action')) {
            case "pause" :
                pauseForce();
                break;
            case "resume" :
                resumeForce();
                break;
            case "dictionary" :
                const d = await fetchDictionary();
                renderJsonEditor(d)
                break;     
            case "edges" :
                generateEdges();
                break;
            default :
        }
    })
});

fetch('graph').then(response => response.json()).then(graphs => {
    const listNode = document.getElementById('graphList');
    graphs.forEach((g) => {
        const glink = document.createElement("a");
        glink.innerHTML = g;
        glink.addEventListener('click', () => loadAGraph(g));
        listNode.appendChild(glink);
    })
})


function generateEdges () {
    fetch('graph/causes_graph.json/edges/generate/condition').then(response => response.json()).then(data => {
        console.log(data);
        links.push(...data);
        updateGraph();
    })
}


function sizeToWindow () {
    const newWidth = document.getElementById('right').offsetWidth
    width = newWidth
    simulation
        .force("center", d3.forceCenter(width / 2, height / 2))  // Centering force
        .force("x", d3.forceX(width / 2).strength(0.05))  // Pulls nodes toward the center horizontally
        .force("y", d3.forceY(height / 2).strength(0.05))
    updateGraph();
}
window.onresize = sizeToWindow;
sizeToWindow(); // initial kick


window.loadAGraph = loadAGraph
window.fetchDictionary = fetchDictionary
