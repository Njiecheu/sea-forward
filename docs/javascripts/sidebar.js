// docs/javascripts/sidebar.js

function initSidebar() {
    // 1. Groupes de navigation (Phases comme Setup)
    var captions = document.querySelectorAll(".wy-menu-vertical .caption");
    
    captions.forEach(function (caption) {
        var parentLi = caption.closest("li");
        if (!parentLi) return;
        
        var nextLi = parentLi.nextElementSibling;
        if (!nextLi || nextLi.tagName.toLowerCase() !== "li") return;
        
        nextLi.classList.add("nav-collapsible-container");
        caption.style.cursor = "pointer";
        caption.classList.add("is-collapsible");
        
        caption.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            
            var wasOpen = nextLi.classList.contains("js-open");
            
            // Fermer toutes les autres phases
            captions.forEach(function(c) {
                c.classList.remove("js-open");
                var p = c.closest("li");
                if (p && p.nextElementSibling) {
                    p.nextElementSibling.classList.remove("js-open");
                }
            });
            
            if (!wasOpen) {
                nextLi.classList.add("js-open");
                caption.classList.add("js-open");
            }
        });
        
        // Ouvrir UNIQUEMENT si la page active s'y trouve réellement (on exclut les ul.current du thème)
        var hasActivePage = false;
        if (nextLi.classList.contains("current")) hasActivePage = true;
        if (nextLi.querySelector("li.current, a.current")) hasActivePage = true;
        
        if (hasActivePage) {
            nextLi.classList.add("js-open");
            caption.classList.add("js-open");
        }
    });

    // 2. Sous-menus internes (with-children)
    var parents = document.querySelectorAll(".wy-menu-vertical li.with-children");
    parents.forEach(function (parentLi) {
        var link = parentLi.querySelector("a");
        var nextLi = parentLi.nextElementSibling;
        
        if (!nextLi || nextLi.tagName.toLowerCase() !== "li") return;
        
        nextLi.classList.add("nav-collapsible-container");
        
        var target = link ? link : parentLi;
        target.addEventListener("click", function(e) {
            if (link && (!link.getAttribute("href") || link.getAttribute("href") === "#" || link.getAttribute("href").startsWith("#"))) {
                e.preventDefault();
            }
            e.stopImmediatePropagation();
            
            var wasOpen = nextLi.classList.contains("js-open");
            
            if (wasOpen) {
                nextLi.classList.remove("js-open");
                parentLi.classList.remove("js-open");
            } else {
                nextLi.classList.add("js-open");
                parentLi.classList.add("js-open");
            }
        });
        
        // Ouvrir UNIQUEMENT si la page active s'y trouve réellement
        var hasActivePage = false;
        if (nextLi.classList.contains("current") || parentLi.classList.contains("current")) hasActivePage = true;
        if (nextLi.querySelector("li.current, a.current")) hasActivePage = true;
        
        if (hasActivePage) {
            nextLi.classList.add("js-open");
            parentLi.classList.add("js-open");
        }
    });
}

// Lancer dès que possible, et aussi au DOMContentLoaded pour être sûr
initSidebar();
document.addEventListener("DOMContentLoaded", initSidebar);
