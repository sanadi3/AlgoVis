import pygame, sys, math
from collections import defaultdict
from dijkstra import dijkstra  # Ensure this file has the correct implementation
from DFS import dfs
from BFS import bfs

pygame.init() # initialization

# ── window ──────────────────────────────────────────────────────────────────
WIDTH, HEIGHT = 800, 600 # screen dimensions
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Graph Visualizer")

# ── colour presets, rgb values as tuple ─────────────────────────────────────────────────────────────────
WHITE   = (255, 255, 255)
BLACK   = (  0,   0,   0)
BLUE    = (  0, 120, 215)
YELLOW  = (255, 255,   0)
RED     = (200,   0,   0)
GREEN   = (0  , 255,   0)

# ── fonts ───────────────────────────────────────────────────────────────────
FONT = pygame.font.SysFont(None, 24)
CARD_FONT = pygame.font.SysFont(None, 40) # font of card titles

# ── graph data ──────────────────────────────────────────────────────────────
nodes = []  # each node contains position name and color { "x","y","name","color" }
edges = defaultdict(dict) # store edges as a dictionary
NODE_R = 20
node_counter = 0 # num of nodes

# ── edge-weight input state ────────────────────────────────────────────────
inputting_weight = False
weight_text = ""
pending_edge = None # which edge is getting added

# ── page and UI state ───────────────────────────────────────────────────────
pages = ["Dijkstras Shortest Path", "Depth First Search", "Breadth First Search"]
scroll_y = 0
SCROLL_SPEED = 40
selected_page = None
screen_mode = "home"  # or "graph"
waiting_for_dijkstra = False
waiting_for_BFS = False
waiting_for_DFS = False
placing_edges = False
selected_node = None

# ── helper fns ──────────────────────────────────────────────────────────────
def dist(p1, p2):
    return math.hypot(p1[0]-p2[0], p1[1]-p2[1]) # distance to calculate the edge

# takes position from mouse click
def node_at(pos):
    for n in nodes:
        if dist((n["x"], n["y"]), pos) <= NODE_R: # less than or equal to node radius
            return n
    return None

def draw_arrow(surface, start, end, color, width=2, arrow_size=8):
    pygame.draw.line(surface, color, start, end, width)

    dx = end[0] - start[0]
    dy = end[1] - start[1]
    angle = math.atan2(dy, dx)

    arrow_tip = end
    left = (
        end[0] - arrow_size * math.cos(angle - math.pi/6),
        end[1] - arrow_size * math.sin(angle - math.pi/6)
    )

    right = (
        end[0] - arrow_size * math.cos(angle + math.pi/6),
        end[1] - arrow_size * math.sin(angle + math.pi/6)
    )
    pygame.draw.polygon(surface, color, [arrow_tip, left, right])

def draw():
    screen.fill(WHITE)

    edge_text = FONT.render("Toggle edge placing using E", True, BLACK)
    screen.blit(edge_text, (WIDTH -20 - edge_text.get_width(), HEIGHT -20 - edge_text.get_height()))

    # iterate over all nodes and check their state
    for n in nodes:
        name = n["name"]

        # ➊ Highlight the first endpoint while placing an edge
        if placing_edges and selected_node and name == selected_node["name"]:
            n["color"] = YELLOW

        # ➋ Existing colouring for algorithm visualisers
        elif visualizing_dijkstra and current_step:
            if name == current_step["current"]:
                n["color"] = YELLOW
            elif name in current_step["visited"]:
                n["color"] = GREEN
            elif name in current_step["neighbors"]:
                n["color"] = (100, 180, 255)
            elif name in current_step["queue"]:
                n["color"] = RED
            else:
                n["color"] = BLUE

        elif visualizing_dfs and current_step:
            if name == current_step["current"]:
                n["color"] = YELLOW
            elif name in current_step["visited"]:
                n["color"] = GREEN
            elif name in current_step["neighbors"]:
                n["color"] = (100, 180, 255)
            elif name in current_step["stack"]:
                n["color"] = RED
            else:
                n["color"] = BLUE
        elif visualizing_bfs and current_step:
            if name == current_step["current"]:
                n["color"] = YELLOW
            elif name in current_step["visited"]:
                n["color"] = GREEN
            elif name in current_step["neighbors"]:
                n["color"] = (100, 180, 255)
            elif name in current_step["queue"]:
                n["color"] = RED
            else:
                n["color"] = BLUE

        else:
            # don’t overwrite the yellow highlight while placing_edges
            if not (placing_edges and selected_node and name == selected_node["name"]):
                n["color"] = BLUE

        # draw the circle & label
        pygame.draw.circle(screen, n["color"], (n["x"], n["y"]), NODE_R)
        txt = FONT.render(name, True, WHITE)
        screen.blit(txt, (n["x"] - 8, n["y"] - 8))



    for u in edges:
        for v, w in edges[u].items():
            ux, uy = next((n["x"], n["y"]) for n in nodes if n["name"] == u)
            vx, vy = next((n["x"], n["y"]) for n in nodes if n["name"] == v)

            length = dist((ux, uy), (vx, vy))
            offset_ratio = (NODE_R + 4) / length  # adjust the 4 for spacing
            vx_adj = ux + (vx - ux) * (1 - offset_ratio)
            vy_adj = uy + (vy - uy) * (1 - offset_ratio)

            #draw_arrow(screen, (ux, uy), (vx - 4, vy 4), color=BLACK, width=2)
            draw_arrow(screen, (ux+3, uy+3), (vx-3, vy-3), color=BLACK, width=2)

            mx, my = (ux + vx) // 2, (uy + vy) // 2
            screen.blit(FONT.render(str(w), True, RED), (mx, my))


    if inputting_weight:
        msg = f"Weight {pending_edge[0]} -> {pending_edge[1]}: {weight_text}"
        screen.blit(FONT.render(msg, True, BLACK), (200, HEIGHT-40))

    if waiting_for_dijkstra or waiting_for_DFS or waiting_for_BFS:
        text = FONT.render("Pick a starting node", True, BLACK)
        screen.blit(text, (250, HEIGHT - 40))


    pygame.display.flip()

def draw_card(y, text):
    card_rect = pygame.Rect(WIDTH//2 - 150, y, 300, 80)
    pygame.draw.rect(screen, BLUE, card_rect, border_radius=12)
    label = CARD_FONT.render(text, True, WHITE)
    label_rect = label.get_rect(center=card_rect.center)
    screen.blit(label, label_rect)
    return card_rect

def draw_back_button():
    back_rect = pygame.Rect(20, 20, 100, 40)
    pygame.draw.rect(screen, RED, back_rect, border_radius =8)
    label = FONT.render("Back", True, WHITE)
    label_rect = label.get_rect(center=back_rect.center)
    screen.blit(label, label_rect)
    return back_rect

def draw_run_dijkstra():
    run_rect = pygame.Rect(20, HEIGHT - 40, 100, 40)
    pygame.draw.rect(screen, GREEN, run_rect, border_radius = 8)
    label = FONT.render("Run Dijkstras", True, WHITE)
    label_rect = label.get_rect(center=run_rect.center)
    screen.blit(label, label_rect)
    return run_rect
def draw_run_BFS():
    run_rect = pygame.Rect(20, HEIGHT - 40, 100, 40)
    pygame.draw.rect(screen, GREEN, run_rect, border_radius = 8)
    label = FONT.render("Run BFS", True, WHITE)
    label_rect = label.get_rect(center=run_rect.center)
    screen.blit(label, label_rect)
    return run_rect

def draw_run_DFS():
    run_rect = pygame.Rect(20, HEIGHT - 40, 100, 40)
    pygame.draw.rect(screen, GREEN, run_rect, border_radius = 8)
    label = FONT.render("Run DFS", True, WHITE)
    label_rect = label.get_rect(center=run_rect.center)
    screen.blit(label, label_rect)
    return run_rect
def load_preset_graph(page_name):
    global nodes, edges, node_counter
    nodes.clear()
    edges.clear()
    node_counter = 0

    if page_name == "Dijkstras Shortest Path":
        positions = {
            "A": (200, 100),
            "B": (400, 100),
            "C": (600, 100),
            "D": (300, 300),
            "E": (500, 300),
        }

        for name, (x, y) in positions.items():
            nodes.append({"x": x, "y": y, "name": name, "color": BLUE})
            node_counter += 1

        base_edges = [
            ("A", "B", 2), ("A", "D", 4),
            ("B", "C", 1), ("B", "D", 3),
            ("C", "E", 5), ("D", "E", 1),
        ]

        for u, v, w in base_edges:
            edges[u][v] = w
    elif page_name == "Depth First Search":
        positions = {
            "A": (400, 70),
            "B": (300, 180),
            "C": (500, 180),
            "D": (200, 300),
            "E": (600, 300),
        }

        for name, (x, y) in positions.items():
            nodes.append({"x": x, "y": y, "name": name, "color": BLUE})
            node_counter += 1
        base_edges = [
            ("A", "B", 2), ("A", "C", 4),
            ("B", "D", 1), ("B", "E", 3),
            ("C", "E", 5),
        ]

        for u, v, w in base_edges:
            edges[u][v] = w

    elif page_name == "Breadth First Search":
        positions = {
            "A": (400, 300),
            "B": (300, 200),
            "C": (500, 200),
            "D": (300, 400),
            "E": (500, 400),
            "F": (250, 300),
            "G": (550, 300)
        }
        for name, (x, y) in positions.items():
            nodes.append({"x": x, "y": y, "name": name, "color": BLUE})
            node_counter += 1

        base_edges = [
            ("A", "B", 1), ("A", "C", 1), ("A", "D", 1),
            ("A", "E", 1), ("B", "F", 1), ("C", "G", 1),
        ]
        for u, v, w in base_edges:
            edges[u][v] = w

# ── main loop (clean, DFS + Dijkstra) ─────────────────────────
# ── main loop (Dijkstra + DFS + BFS) ─────────────────────────
clock = pygame.time.Clock()
running = True

# Generators
dijkstra_generator = None
dfs_generator      = None
bfs_generator      = None

# Visual‑state flags
current_step          = None
visualizing_dijkstra  = False
visualizing_dfs       = False
visualizing_bfs       = False

# Waiting flags
waiting_for_dijkstra  = False
waiting_for_DFS       = False
waiting_for_BFS       = False

while running:
    # ─────────────── HOME SCREEN ───────────────
    if screen_mode == "home":
        screen.fill(WHITE)
        card_rects = []
        start_y = 150
        for i, page in enumerate(pages):
            rect = draw_card(start_y + i * 120 + scroll_y, page)
            card_rects.append(rect)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 4:
                    scroll_y = min(scroll_y + SCROLL_SPEED, 0)
                elif event.button == 5:
                    scroll_y -= SCROLL_SPEED
                elif event.button == 1:
                    mx, my = event.pos
                    for i, card in enumerate(card_rects):
                        if card.move(0, scroll_y).collidepoint(mx, my):
                            selected_page = pages[i]
                            load_preset_graph(selected_page)
                            screen_mode = "graph"; scroll_y = 0
                            break
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_DOWN:
                    scroll_y -= SCROLL_SPEED
                elif event.key == pygame.K_UP:
                    scroll_y = min(scroll_y + SCROLL_SPEED, 0)

        title = FONT.render("Algorithm Visualizer", True, BLACK)
        screen.blit(title, (WIDTH//2 - title.get_width()//2, 50 + scroll_y))
        pygame.display.flip()

    # ─────────────── GRAPH SCREEN ───────────────
    elif screen_mode == "graph":
        # Draw first so rects exist
        draw()
        back_rect = draw_back_button()
        if selected_page == "Dijkstras Shortest Path":
            run_rect = draw_run_dijkstra()
        elif selected_page == "Depth First Search":
            run_rect = draw_run_DFS()
        elif selected_page == "Breadth First Search":
            run_rect = draw_run_BFS()
        else:
            run_rect = draw_run_BFS()
        pygame.display.flip()

        # Event loop
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            # ───── Mouse ─────
            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                # Back
                if back_rect.collidepoint(event.pos):
                    screen_mode = "home"; selected_page = None
                    nodes.clear(); edges.clear(); node_counter = 0
                    dijkstra_generator = dfs_generator = bfs_generator = None
                    current_step = None
                    visualizing_dijkstra = visualizing_dfs = visualizing_bfs = False
                    waiting_for_dijkstra = waiting_for_DFS = waiting_for_BFS = False
                    continue

                # Run‑button click
                if run_rect.collidepoint(event.pos):
                    waiting_for_dijkstra = waiting_for_DFS = waiting_for_BFS = False
                    if selected_page == "Dijkstras Shortest Path":
                        waiting_for_dijkstra = True
                    elif selected_page == "Depth First Search":
                        waiting_for_DFS = True
                    elif selected_page == "Breadth First Search":
                        waiting_for_BFS = True
                    continue

                pos = pygame.mouse.get_pos(); clicked = node_at(pos)

                # Start‑node selection
                if clicked and (waiting_for_dijkstra or waiting_for_DFS or waiting_for_BFS):
                    start = clicked["name"]
                    if waiting_for_dijkstra:
                        dijkstra_generator = dijkstra(edges, start)
                        visualizing_dijkstra = True; visualizing_dfs = visualizing_bfs = False
                        waiting_for_dijkstra = False
                    elif waiting_for_DFS:
                        dfs_generator = dfs(edges, start)
                        visualizing_dfs = True; visualizing_dijkstra = visualizing_bfs = False
                        waiting_for_DFS = False
                    elif waiting_for_BFS:
                        bfs_generator = bfs(edges, start)
                        visualizing_bfs = True; visualizing_dijkstra = visualizing_dfs = False
                        waiting_for_BFS = False
                    current_step = None
                    for n in nodes: n["color"] = BLUE
                    continue

                # ----- Graph editing -----
                if not inputting_weight:
                    if placing_edges:
                        if clicked:
                            if selected_node is None:
                                selected_node = clicked; clicked["color"] = YELLOW
                            elif clicked != selected_node:
                                inputting_weight = True; weight_text = ""
                                pending_edge = (selected_node["name"], clicked["name"])
                                selected_node = None
                    else:
                        if clicked is None:
                            name = chr(65 + node_counter)
                            nodes.append({"x": pos[0], "y": pos[1], "name": name, "color": BLUE})
                            node_counter += 1

            # ───── Keyboard ─────
            elif event.type == pygame.KEYDOWN:
                if inputting_weight:
                    if event.key == pygame.K_RETURN and weight_text:
                        u, v = pending_edge; edges[u][v] = int(weight_text)
                        inputting_weight = False; weight_text = ""; pending_edge = None
                        for n in nodes:
                            if n["name"] in (u, v): n["color"] = BLUE
                    elif event.key == pygame.K_BACKSPACE:
                        weight_text = weight_text[:-1]
                    elif pygame.K_0 <= event.key <= pygame.K_9:
                        weight_text += chr(event.key)
                else:
                    if event.key == pygame.K_e:
                        placing_edges = not placing_edges; selected_node = None
                        for n in nodes: n["color"] = BLUE

                    # Hot‑keys to open waiting state directly
                    if event.key == pygame.K_d and selected_page == "Dijkstras Shortest Path":
                        waiting_for_dijkstra = True; waiting_for_DFS = waiting_for_BFS = False
                    if event.key == pygame.K_f and selected_page == "Depth First Search":
                        waiting_for_DFS = True; waiting_for_dijkstra = waiting_for_BFS = False
                    if event.key == pygame.K_b and selected_page == "Breadth First Search":
                        waiting_for_BFS = True; waiting_for_dijkstra = waiting_for_DFS = False

                    # Step algorithms
                    if event.key == pygame.K_SPACE:
                        if visualizing_bfs:
                            try:
                                current_step = next(bfs_generator)
                            except StopIteration:
                                visualizing_bfs = False
                        elif visualizing_dfs:
                            try:
                                current_step = next(dfs_generator)
                            except StopIteration:
                                visualizing_dfs = False
                        elif visualizing_dijkstra:
                            try:
                                current_step = next(dijkstra_generator)
                            except StopIteration:
                                visualizing_dijkstra = False

    clock.tick(60)

pygame.quit(); sys.exit()

