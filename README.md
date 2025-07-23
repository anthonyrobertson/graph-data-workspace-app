# graph-data-workspace-app
A graph data visualization and editing tool allowing users to create, update, and visualize graph data structures. The application uses JSON schema to define node and edge types, which are organized into dictionaries. These dictionaries provide a structured way to define the types and properties of nodes and edges in a graph.

### Key Features:
1. **Graph Visualization**: The frontend uses D3.js to visualize graph data, allowing users to interact with nodes and edges.
2. **Graph Editing**: Users can load, update, and save graphs. The backend provides APIs to handle these operations.
3. **Schema Validation**: The application uses JSON schema to validate the structure of graphs, nodes, and edges.
4. **Dictionaries**: Dictionaries define the types and properties of nodes and edges, ensuring consistency and validation across graphs.


![early screenshot](demo.png)

JSON schema is used to define all the node and edge types ( there are meta-schemas nodeTypeSchema and edgeTypeSchema )

### How to run:
Nothing elaborate, it's an express app:
```
$> cd backend/
$> node index.js
```
The UI will be up on port 3000

### Concepts
* Dictionary - defined as the contents of a directory beneath /dictionaries/ - contains Node and Edge type definitions. See the included examples
* Node - one or more types per dictionary
* Edge - one or more types per dictionary
* Graph - actual data , referencing a dictionary ( composed of Node and Edge types )
* Board - one instance or workspace for a graph

### Examples
There are examples of Dictionaries and Graphs that use them included here as an example. Each dictionary's *nodes* and *edges* directories contain JSON schema according to `schemas/nodeTypeSchema` and `schemas/edgeTypeSchema` respectively.

The example graphs validate against `schemas/graphSchema` and are a combination of randomly generated data and plundered from other sources. 

### API Support
This is mostly not built yet - beyond directly supporting the frontend, but there is a really simple update API:

```
POST
curl -X POST -H "Content-Type: application/json" -d @test_update.json http://localhost:3000/graph/demo.json/update
```

### TODO & other directions
* load graphs into memory, enabling collaborative multi-user cases
* Better example graphs
* OpenAPI spec
* improve the update API /graph/:filename/update
* deveolop 'boards' - instances of a graph that may include annotations, updates, and 'state' data
* develop temporal edges including support in visualization ( filter edges by time windows )

Brainstorm:
* A timeline slider to filter any temporal edges in the graph

### Notes

Part of the motivation for this was to learn about JSONSchema and in reality was an exercise in impelmenting meta-types. Doing it with JSONSchema makes for some challenging syntax.

