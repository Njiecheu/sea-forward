document.addEventListener("DOMContentLoaded", function () {
    // 1. Gérer les grands titres (Phases) qui sont des <p class="caption">
    var captions = document.querySelectorAll(".wy-menu-vertical p.caption");
    captions.forEach(function (caption) {
        caption.style.cursor = "pointer";
        caption.classList.add("is-collapsible");
        
        var nextUl = caption.nextElementSibling;
        if (nextUl && nextUl.tagName.toLowerCase() === "ul") {
            caption.addEventListener("click", function () {
                // Fermer/ouvrir uniquement cette section
                caption.classList.toggle("js-open");
                nextUl.classList.toggle("js-open");
            });
        }
    });

    // 2. Gérer les sous-sections (liens avec enfants) de type toctree-l1 ou l2
    var topLevelItems = document.querySelectorAll(".wy-menu-vertical li.toctree-l1, .wy-menu-vertical li.toctree-l2");
    topLevelItems.forEach(function (li) {
        var subMenu = li.querySelector("ul");
        if (subMenu) {
            li.classList.add("has-children");
            var link = li.querySelector("a");
            if (link) {
                link.style.cursor = "pointer";
                link.addEventListener("click", function (e) {
                    // Empêcher la navigation si c'est juste un lien vide (#)
                    if (!link.getAttribute("href") || link.getAttribute("href") === "#") {
                        e.preventDefault();
                        li.classList.toggle("js-open");
                    } else {
                        // Si c'est un vrai lien, on peut l'ouvrir visuellement aussi
                        li.classList.toggle("js-open");
                    }
                });
            }
        }
    });
});
