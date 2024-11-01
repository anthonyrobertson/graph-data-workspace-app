# graph-data-workspace-app
Abstract data visualization app structured around graphs

JSON schema is used to define all the node and edge types ( there are meta-schemas nodeTypeSchema and edgeTypeSchema )

* Node
* Edge
* Dictionary - defined as the contents of a directory beneath /dictionaries/ - contains Node and Edge type definitions
* Graph - actual data , referencing a dictionary ( composed of Node and Edge types )
* Board - one instance or workspace for a graph


Brainstorm:
* A timeline slider to filter any temporal edges in the graph

