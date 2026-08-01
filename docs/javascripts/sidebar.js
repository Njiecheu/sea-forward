document.addEventListener("DOMContentLoaded", function () {
    // 1. Groupes de navigation (Phases comme Setup)
    // Structure: <li><p class="caption">Setup</p></li> puis <li class="group"><ul>...</ul></li>
    var captions = document.querySelectorAll(".wy-menu-vertical .caption");
    
    captions.forEach(function (caption) {
        var parentLi = caption.closest("li");
        if (!parentLi) return;
        
        var nextLi = parentLi.nextElementSibling;
        if (!nextLi || nextLi.tagName.toLowerCase() !== "li") return;
        
        var ul = nextLi.querySelector("ul");
        if (!ul) return;

        // Ajouter nos classes
        nextLi.classList.add("nav-collapsible-container");
        caption.style.cursor = "pointer";
        caption.classList.add("is-collapsible");
        
        // Mode accordéon
        caption.addEventListener("click", function(e) {
            e.preventDefault();
            var wasOpen = nextLi.classList.contains("js-open");
            
            // Fermer les autres groupes (Phases)
            var allGroupContainers = document.querySelectorAll(".wy-menu-vertical li.nav-collapsible-container");
            var allCaptions = document.querySelectorAll(".wy-menu-vertical .caption");
            
            // On s'assure que seules les phases se referment entre elles
            allCaptions.forEach(function(c) {
                var pLi = c.closest("li");
                if (pLi && pLi.nextElementSibling) {
                    pLi.nextElementSibling.classList.remove("js-open");
                }
                c.classList.remove("js-open");
            });
            
            if (!wasOpen) {
                nextLi.classList.add("js-open");
                caption.classList.add("js-open");
            }
        });
        
        // Si c'est la page active, on ouvre
        if (nextLi.querySelector(".current") || nextLi.classList.contains("current")) {
            nextLi.classList.add("js-open");
            caption.classList.add("js-open");
        }
    });

    // 2. Sous-menus internes (with-children)
    // Structure: <li class="with-children"><a>...<span class="toctree-expand"></span></a></li> puis <li><ul>...</ul></li>
    var parents = document.querySelectorAll(".wy-menu-vertical li.with-children");
    parents.forEach(function (parentLi) {
        var link = parentLi.querySelector("a");
        var nextLi = parentLi.nextElementSibling;
        
        if (!nextLi || nextLi.tagName.toLowerCase() !== "li") return;
        var ul = nextLi.querySelector("ul");
        if (!ul) return;

        nextLi.classList.add("nav-collapsible-container");

        parentLi.addEventListener("click", function(e) {
            if (link && (!link.getAttribute("href") || link.getAttribute("href").startsWith("#"))) {
                e.preventDefault();
            }
            
            var wasOpen = nextLi.classList.contains("js-open");
            
            // Toggle
            if (wasOpen) {
                nextLi.classList.remove("js-open");
                parentLi.classList.remove("js-open");
            } else {
                nextLi.classList.add("js-open");
                parentLi.classList.add("js-open");
            }
        });
        
        if (nextLi.classList.contains("current") || parentLi.classList.contains("current") || nextLi.querySelector(".current")) {
            nextLi.classList.add("js-open");
            parentLi.classList.add("js-open");
        }
    });
});
