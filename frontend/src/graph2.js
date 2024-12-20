// Function to update links and nodes based on new data
function updateGraph(newNodes, newLinks) {
    // Update the simulation with the new nodes and links
    simulation.nodes(newNodes);
    simulation.force("link").links(newLinks);

    // Handle links (edges) using the enter-update-exit pattern
    const link = svg.selectAll(".link")
        .data(newLinks, d => d.source.id + "-" + d.target.id);  // Unique key for each link

    // Exit: Remove old links that no longer exist in the data
    link.exit().remove();

    // Enter: Create new links for new data
    link.enter().append("line")
        .attr("class", "link")
        .attr("stroke-width", 2)
        .merge(link);  // Merge with existing links

    // Handle nodes (circles)
    const node = svg.selectAll(".node")
        .data(newNodes, d => d.id);  // Use 'id' as the key for nodes

    // Exit: Remove old nodes
    node.exit().remove();

    // Enter: Add new nodes
    node.enter().append("circle")
        .attr("class", "node")
        .attr("r", 10)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .merge(node);  // Merge with existing nodes

    // Update labels too
    const label = svg.selectAll(".label")
        .data(newNodes, d => d.id);

    label.exit().remove();

    label.enter().append("text")
        .attr("class", "label")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text(d => d.id)
        .merge(label);

    // Restart the simulation with the updated data
    simulation.alpha(1).restart();
}

// Example new data
const newNodes = [
    { id: 'Anthony' },
    { id: 'Linden' },
    { id: 'Roberta' },
    { id: 'Frank' },
    { id: 'Angela' },
    { id: 'Sam' },
    { id: 'Maya' },
    { id: 'Ella' },
    { id: 'Nichole' },
    { id: 'Patti' },
    { id: 'Jim' }
];

const newLinks = [
    { source: 'Anthony', target: 'Nichole' },
    { source: 'Anthony', target: 'Linden' },
    { source: 'Anthony', target: 'Roberta' },
    { source: 'Anthony', target: 'Frank' },
    { source: 'Anthony', target: 'Angela' },

    { source: 'Angela', target: 'Sam' },
    { source: 'Angela', target: 'Maya' },
    { source: 'Angela', target: 'Ella' },
    { source: 'Sam', target: 'Maya' },
    { source: 'Sam', target: 'Ella' },
    { source: 'Maya', target: 'Ella' },

    { source: 'Nichole', target: 'Patti' },
    { source: 'Nichole', target: 'Linden' },
    { source: 'Nichole', target: 'Jim' }
];

// Call updateGraph when you want to update the graph (e.g., after data changes)
// updateGraph(newNodes, newLinks);


winddow.links = newLinks
winddow.nodes = newNodes
window.update = updateGraph