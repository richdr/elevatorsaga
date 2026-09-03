import "@fontsource/oswald/300.css";
import "@fontsource/oswald/400.css";
import "@fontsource/oswald/700.css";
import "./styles/style.css";

import { DOCS_HTML } from "./ui/docs-content";
import { highlightWithin } from "./ui/highlight";

const root = document.getElementById("docs_root");
if (root) {
    root.innerHTML = DOCS_HTML;
    void highlightWithin(root);
}
