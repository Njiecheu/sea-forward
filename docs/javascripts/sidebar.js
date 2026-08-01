document.addEventListener("DOMContentLoaded", function () {
    // Sélectionner tous les éléments de niveau 1 qui ont un sous-menu (ul)
    var topLevelItems = document.querySelectorAll(".wy-menu-vertical li.toctree-l1");

    topLevelItems.forEach(function (li) {
        var subMenu = li.querySelector("ul");
        if (subMenu) {
            // Ajouter une classe pour identifier qu'il a des enfants
            li.classList.add("has-children");

            // Trouver le lien ou le label cliquable
            var link = li.querySelector("a") || li.querySelector(".caption");
            
            if (link) {
                link.style.cursor = "pointer";
                
                link.addEventListener("click", function (e) {
                    // Si c'est juste un label ou si on veut forcer l'ouverture sans changer de page
                    // On bascule l'état ouvert/fermé
                    li.classList.toggle("js-open");
                    
                    // Si le lien a un href "#" ou s'il s'agit d'un label sans lien réel, empêcher la navigation
                    if (!link.getAttribute("href") || link.getAttribute("href") === "#") {
                        e.preventDefault();
                    }
                });
            }
        }
    });
});
