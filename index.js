Dagoba = {};

Dagoba.error = function (error_message) {
  console.log(error_message);
  return false;
};

Dagoba.G = {}; // Prototype

Dagoba.Q = {}; // Query Prototype

Dagoba.graph = function (Vertices, Edges) {
  // Factory
  var graph = Object.create(Dagoba.G);

  graph.edges = [];
  graph.vertices = [];
  graph.vertexIndex = {};

  graph.autoid = 1;

  if (Array.isArray(Vertices)) graph.addVertices(Vertices);
  if (Array.isArray(Edges)) graph.addEdges(Edges);

  return graph;
};

Dagoba.query = function (grap) {
  // Factory
  var query = Object.create(Dagoba.Q);

  query.graph = graph;
  query.state = []; // state of each step
  query.program = []; // list of steps to take
  query.gremlins = []; // gremlins for each step

  return query;
};

// Graph manipulation

Dagoba.G.addVertices = function (vertices) {
  vertices.forEach(this.addVertex.bind(this));
};

Dagoba.G.addEdges = function (vertices) {
  vertices.forEach(this.addEdge.bind(this));
};

Dagoba.G.addVertex = function (vertex) {
  if (!vertex._id) vertex._id = this.autoid++;
  else if (this.findVertexById(vertex._id))
    return Dagoba.error("A vertex with that ID alredy exists");

  this.vertices.push(vertex);
  this.vertexIndex[vertex._id] = vertex;
  vertex._out = [];
  vertex._in = []; // Placeholders for edge pointers
  return vertex._id;
};

Dagoba.G.addEdge = function (edge) {
  edge._in = this.findVertexById(edge._in);
  edge._out = this.findVertexById(edge._out);

  if (!(edge._in && edge._out)) {
    return Dagoba.error(
      "That edge's" + (edge._in ? "out" : "in") + " vertex wasn't found"
    );
  }

  edge._out._out.push(edge);
  edge._in._in.push(edge);

  this.edges.push(edge);
};

// Query manipulation

Dagoba.Q.add = function (pipetype, args) {
  // add a new step to the query
  var step = [pipetype, args];
  this.program.push(step);
  return this;
};
