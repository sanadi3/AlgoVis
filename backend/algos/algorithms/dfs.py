
def dfs(graph, start):
    visited = set()
    stack = [start] # add start node to stack

    while stack:
        current = stack.pop()
        if current in visited:
            continue # skip iteration
        visited.add(current)

        neighbors=[]
        for neighbor in graph.get(current, {}):
            if neighbor not in visited:
                neighbors.append(neighbor)
                stack.append(neighbor)
        yield {
            "current": current,
            "visited": visited.copy(),
            "stack": stack.copy(),
            "neighbors": neighbors
        }

    yield {
        "current": None,
        "visited": visited.copy(),
        "stack": [],
        "neighbors": []
    }



