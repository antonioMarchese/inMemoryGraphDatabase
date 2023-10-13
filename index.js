Dagoba = {};

Dagoba.error = function (error_message) {
  console.log(error_message);
  return false;
};

Dagoba.simpleTraversal = function (dir) {
  var find_method = dir == "out" ? "findOutEdges" : "findInEdges";
  var edge_list = dir == "out" ? "_in" : "_out";

  return function (graph, args, gremlin, state) {
    if (!gremlin && (!state.edges || !state.edges.length)) return "pull"; // query initialization

    if (!state.edges || !state.edges.length) {
      state.gremlin = gremlin;
      state.edges = graph[find_method](gremlin.vertex).filter(
        Dagoba.filterEdges(args[0])
      );
    }

    if (!state.edges.length) return "pull";

    var vertex = state.edges.pop()[edge_list];
    return Dagoba.gotoVertex(state.gremlin, vertex);
  };
};

Dagoba.G = {}; // Prototype

Dagoba.Q = {}; // Query Prototype

Dagoba.Pipetypes = {};

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

Dagoba.query = function (graph) {
  // Factory
  var query = Object.create(Dagoba.Q);

  query.graph = graph;
  query.state = []; // state of each step
  query.program = []; // list of steps to take
  query.gremlins = []; // gremlins for each step

  return query;
};

Dagoba.addPipetype("vertex", function (graph, args, gremlin, state) {
  if (!state.vertices) state.vertices = graph.findVertices(args); // state initialization

  if (!state.vertices.length) return "done"; // all done

  var vertex = state.vertices.pop();
  return Dagoba.makeGremlin(vertex, gremlin.state);
});

Dagoba.addPipetype("out", Dagoba.simpleTraversal("out"));
Dagoba.addPipetype("in", Dagoba.simpleTraversal("in"));

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

Dagoba.G.v = function () {
  var query = Dagoba.query(this);
  query.add("vertex", [].slice.call(arguments));
  return query;
};

// Query manipulation
Dagoba.Q.add = function (pipetype, args) {
  // add a new step to the query
  var step = [pipetype, args];
  this.program.push(step);
  return this;
};

// Pipetype manipulation
Dagoba.addPipetype = function (name, fun) {
  Dagoba.Pipetypes[name] = fun;
  Dagoba.Q[name] = function () {
    return this.add(name, [].slice.apply(arguments));
  };
};

Dagoba.fauxPipetype = function (_, _, maybe_gremlin) {
  // Pass the result upstream or send a pull downstream
  return maybe_gremlin || "pull";
};

Dagoba.getPipetype = function (name) {
  var pipetype = Dagoba.Pipetypes[name];

  if (!pipetype) Dagoba.error("Unrecognized pipetype: " + name);

  return pipetype || Dagoba.fauxPipetype;
};
