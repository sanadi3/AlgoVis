from collections import deque
def bfs(graph, start):
    visited = set()
    queue = deque([start]) # add start node to stack

    while queue:
        current = queue.popleft()
        if current in visited:
            continue # skip iteration
        visited.add(current)

        neighbors=[]
        for neighbor in graph.get(current, {}):
            if neighbor not in visited:
                neighbors.append(neighbor)
                queue.append(neighbor)
        yield {
            "current": current,
            "visited": visited.copy(),
            "queue": list(queue),
            "neighbors": neighbors
        }

    yield {
        "current": None,
        "visited": visited.copy(),
        "queue": [],
        "neighbors": []
    }