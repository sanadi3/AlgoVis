import pygame, sys, math
from collections import defaultdict
from dijkstra import dijkstra  # Ensure this file has the correct implementation

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

    for n in nodes:
        pygame.draw.circle(screen, n["color"], (n["x"], n["y"]), NODE_R)
        txt = FONT.render(n["name"], True, WHITE)
        screen.blit(txt, (n["x"]-8, n["y"]-8))

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
        screen.blit(FONT.render(msg, True, BLACK), (20, HEIGHT-40))

    if waiting_for_dijkstra:
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

# ── main loop ───────────────────────────────────────────────────────────────
clock = pygame.time.Clock()
running = True

while running:
    if screen_mode == "home":
        screen.fill(WHITE)
        card_rects = []
        start_y = 150
        for i, page in enumerate(pages):
            rect = draw_card(start_y + i * 120 + scroll_y, page)
            card_rects.append(rect)

# THEN handle input
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
                            has_run_dijkstra = False
                            screen_mode = "graph"

            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_DOWN:
                    scroll_y -= SCROLL_SPEED
                elif event.key == pygame.K_UP:
                    scroll_y = min(scroll_y + SCROLL_SPEED, 0)

        title = FONT.render("Algorithm Visualizer", True, BLACK)
        screen.blit(title, (WIDTH // 2 - title.get_width() // 2, 50 + scroll_y))

        start_y = 150
        for i, page in enumerate(pages):
            rect = draw_card(start_y + i * 120 + scroll_y, page)
            card_rects.append(rect)

        pygame.display.flip()

    elif screen_mode == "graph":
        draw()
        back_rect = draw_back_button()
        dijkstra_rect = draw_run_dijkstra()

        # if not has_run_dijkstra and selected_page == "Dijkstras Shortest Path":
        #     result = dijkstra(edges, "A")
        #     print(result["distances"])
        #     has_run_dijkstra = True

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            elif event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:
                    if back_rect.collidepoint(event.pos):
                        screen_mode = "home"
                        selected_page = None
                        nodes.clear()
                        edges.clear()
                        node_counter = 0
                        continue  # skip rest of logic this frame

                    if dijkstra_rect.collidepoint(event.pos):
                        waiting_for_dijkstra = True
                        continue

                    if waiting_for_dijkstra:
                        pos = pygame.mouse.get_pos()
                        clicked = node_at(pos)
                        if clicked:
                            start = clicked["name"]
                            result = dijkstra(edges, start)
                            print(f"Start node: {start}")
                            print(result["distances"])
                            has_run_dijkstra = True
                            waiting_for_dijkstra = False
                            continue

                    # Normal graph interaction
                    if not inputting_weight:
                        pos = pygame.mouse.get_pos()
                        clicked = node_at(pos)

                        if placing_edges:
                            if clicked:
                                clicked["color"] = YELLOW
                                if not selected_node:
                                    selected_node = clicked
                                else:
                                    inputting_weight = True
                                    weight_text = ""
                                    pending_edge = (selected_node["name"], clicked["name"])
                                    selected_node = None
                        else:
                            if not clicked:
                                name = chr(65 + node_counter)
                                nodes.append({
                                "x": pos[0],
                                "y": pos[1],
                                "name": name,
                                "color": BLUE
                            })
                            node_counter += 1


            elif event.type == pygame.KEYDOWN:
                if inputting_weight:
                    if event.key == pygame.K_RETURN and weight_text:
                        w = int(weight_text)
                        u, v = pending_edge
                        edges[u][v] = w

                        for n in nodes:
                            if n["name"] in (u, v):
                                n["color"] = BLUE

                        inputting_weight = False
                        weight_text = ""
                        pending_edge = None

                    elif event.key == pygame.K_BACKSPACE:
                        weight_text = weight_text[:-1]
                    elif pygame.K_0 <= event.key <= pygame.K_9:
                        weight_text += chr(event.key)
                else:
                    if event.key == pygame.K_e:
                        placing_edges = not placing_edges
                        selected_node = None
                        for n in nodes:
                            n["color"] = BLUE

        pygame.display.flip()

    clock.tick(60)

pygame.quit()
sys.exit()
