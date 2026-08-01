document.addEventListener("DOMContentLoaded", function () {
    // --- 1. Identifier et Cacher toutes les sections de force ---
    // Les thèmes génèrent souvent les titres de phase de différentes manières (p.caption, li.caption, etc.)
    var captions = document.querySelectorAll(".wy-menu-vertical .caption, .wy-menu-vertical p.caption, .wy-menu-vertical li.caption");
    var phaseUls = [];
    
    captions.forEach(function (caption) {
        var ul = caption.nextElementSibling;
        if (!ul || ul.tagName.toLowerCase() !== "ul") {
            ul = caption.querySelector("ul");
        }
        if (ul && ul.tagName.toLowerCase() === "ul") {
            phaseUls.push(ul);
            ul.classList.add("nav-collapsible");
        }
    });

    // Sous-sections
    var subUls = document.querySelectorAll(".wy-menu-vertical li.toctree-l1 > ul, .wy-menu-vertical li.toctree-l2 > ul");
    subUls.forEach(function(ul) { ul.classList.add("nav-collapsible"); });

    // === INITIALISATION ===
    var currentUl = document.querySelector(".wy-menu-vertical ul.current");
    if (currentUl) {
        currentUl.classList.add("js-open");
        if (currentUl.previousElementSibling && currentUl.previousElementSibling.classList.contains("caption")) {
            currentUl.previousElementSibling.classList.add("js-open");
        }
    }

    // --- 2. Gérer le Clic sur les Phases (Grands titres) ---
    captions.forEach(function (caption) {
        var ul = caption.nextElementSibling;
        if (!ul || ul.tagName.toLowerCase() !== "ul") {
            ul = caption.querySelector("ul");
        }
        
        if (ul && ul.tagName.toLowerCase() === "ul") {
            caption.style.cursor = "pointer";
            caption.classList.add("is-collapsible");
            
            caption.addEventListener("click", function (e) {
                // Si c'est un lien cliquable, on ne navigue pas si c'est vide
                var link = caption.tagName.toLowerCase() === "a" ? caption : caption.querySelector("a");
                if (link && (!link.getAttribute("href") || link.getAttribute("href") === "#")) {
                    e.preventDefault();
                }

                var wasOpen = caption.classList.contains("js-open");

                // Accordéon : on ferme toutes les autres phases
                captions.forEach(function(c) { c.classList.remove("js-open"); });
                phaseUls.forEach(function(u) { u.classList.remove("js-open"); });
                
                if (!wasOpen) {
                    caption.classList.add("js-open");
                    ul.classList.add("js-open");
                }
            });
        }
    });

    // --- 3. Gérer les sous-sections ---
    var topLevelItems = document.querySelectorAll(".wy-menu-vertical li.toctree-l1, .wy-menu-vertical li.toctree-l2");
    topLevelItems.forEach(function (li) {
        var subMenu = li.querySelector("ul");
        if (subMenu) {
            li.classList.add("has-children");
            var link = li.querySelector("a");
            if (link) {
                link.style.cursor = "pointer";
                
                if (li.classList.contains("current")) {
                    li.classList.add("js-open");
                    subMenu.classList.add("js-open");
                }

                link.addEventListener("click", function (e) {
                    if (!link.getAttribute("href") || link.getAttribute("href") === "#") {
                        e.preventDefault();
                    }
                    // Pour les sous-sections, on fait un toggle simple (sans fermer les autres)
                    li.classList.toggle("js-open");
                    subMenu.classList.toggle("js-open");
                });
            }
        }
    });
});
