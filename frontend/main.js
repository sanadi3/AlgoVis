<script src="main.js"></script>

// main.js
async function run() {
    /* grab text area / input values exactly like before */

    const res = await fetch("/api/run", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ graph, start, algo }) // algo = "dijkstra"
    })
    /* render result */
}