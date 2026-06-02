import { createRoot } from "react-dom/client";
import { CanvasSidebar } from "./CanvasSidebar";
import canvasTheme from "./canvas-theme.css?inline";

const HOST_ID = "k12-planner-canvas-root";

function mountSidebar() {
  const host = document.getElementById(HOST_ID);
  if (!host?.shadowRoot) return;

  const shadow = host.shadowRoot;
  if (shadow.getElementById("k12-sidebar-mounted")) return;

  const style = document.createElement("style");
  style.textContent = canvasTheme;
  shadow.appendChild(style);

  const app = document.createElement("div");
  app.id = "k12-sidebar-mounted";
  app.className = "k12-canvas-app";
  shadow.appendChild(app);

  let open = host.dataset.k12Open === "true";

  const root = createRoot(app);
  const render = () => {
    root.render(
      <CanvasSidebar
        open={open}
        onClose={() => {
          open = false;
          host.dataset.k12Open = "false";
          render();
          chrome.storage.local.set({ canvasSidebarOpen: false }).catch(() => {});
        }}
      />,
    );
  };

  host.k12SetOpen = (next) => {
    open = next;
    host.dataset.k12Open = next ? "true" : "false";
    render();
  };

  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountSidebar);
} else {
  mountSidebar();
}
