import heapq

def dijkstra(graph, start):
    all_nodes = set(graph.keys())
    for edges in graph.values():
        all_nodes.update(edges.keys())

    distances = {node: float('inf') for node in all_nodes}
    prev = {node: None for node in all_nodes}
    distances[start] = 0

    visited = set()
    queue = [(0, start)]

    while queue:
        current_dist, current_node = heapq.heappop(queue)

        if current_node in visited:
            continue
        visited.add(current_node)

        neighbors = []
        for neighbor, weight in graph.get(current_node, {}).items():
            if neighbor in visited:
                continue
            neighbors.append(neighbor)
            new_distance = current_dist + weight
            if new_distance < distances[neighbor]:
                distances[neighbor] = new_distance
                prev[neighbor] = current_node
                heapq.heappush(queue, (new_distance, neighbor))

        yield {
            "current": current_node,
            "distances": distances.copy(),
            "visited": visited.copy(),
            "prev": prev.copy(),
            "queue": [n for (_, n) in queue],  # just the nodes
            "neighbors": neighbors
        }

    yield {
        "current": None,
        "distances": distances.copy(),
        "visited": visited.copy(),
        "prev": prev.copy(),
        "queue": [],
        "neighbors": []
    }




