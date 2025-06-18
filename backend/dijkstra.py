import heapq
def dijkstra(graph, start):
    if start not in graph:
        raise ValueError(f"Start node '{start}' not found in the graph.")

    # Include neighbor-only nodes
    all_nodes = set(graph.keys())
    for edges in graph.values():
        all_nodes.update(edges.keys())

    distances = {node: float('inf') for node in all_nodes}
    distances[start] = 0
    visited_order = []
    queue = [(0, start)]

    while queue:
        current_dist, current_node = heapq.heappop(queue)
        if current_dist > distances[current_node]:
            continue

        visited_order.append((current_node, current_dist))

        for neighbor, weight in graph.get(current_node, {}).items():
            if neighbor not in distances:
                continue  # skip unknown nodes
            distance = current_dist + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(queue, (distance, neighbor))

    return {
        "distances": distances,
        "visited_order": visited_order
    }



