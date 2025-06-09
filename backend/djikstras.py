import heapq

def dijkstras(graph, start): # start is given index of starting node
    distances = {node: float('inf') for node in graph} # set each node distance as infinity
    distances[start] = 0
    visited_order = [] # keep track of visited nodes
    queue = [(0, start)] # queue contains 1 current distance 2 node

    while (queue):
        current_dist, current_node = heapq.heappop(queue)
        if (current_dist > distances[current_node]):
            continue

        visited_order.append((current_node, current_dist))

        for neighbor, weight in graph[current_node]:
            distance = current_dist + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(queue, (distance, neighbor))

    return {
        "distances": distances,
        "visited_order": visited_order
    }


