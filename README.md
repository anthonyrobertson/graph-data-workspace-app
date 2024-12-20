# graph-data-workspace-app
Graph data visualization app structured around type dictionaries.

![early screenshot](demo.png)

JSON schema is used to define all the node and edge types ( there are meta-schemas nodeTypeSchema and edgeTypeSchema )


### Concepts
* Dictionary - defined as the contents of a directory beneath /dictionaries/ - contains Node and Edge type definitions. See the included examples
* Node - one or more types per dictionary
* Edge - one or more types per dictionary
* Graph - actual data , referencing a dictionary ( composed of Node and Edge types )
* Board - one instance or workspace for a graph



### Notes

Examples
Save the output of random graph generation as a file in the graphs directory, so it can be immediately loaded
`curl localhost:3000/graph/realistic/80/5/0.08 > ~/data/graphs/newgraph.json`

POST
curl -X POST -H "Content-Type: application/json" -d @test_update.json http://localhost:3000/graph/demo.json/update


Brainstorm:
* A timeline slider to filter any temporal edges in the graph

