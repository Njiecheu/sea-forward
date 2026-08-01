document.addEventListener("DOMContentLoaded", function () {
    // === INITIALISATION ===
    // MkDocs met "current" sur le ul actif. On transfère cet état en "js-open" pour que JS gère tout.
    var currentUl = document.querySelector(".wy-menu-vertical p.caption + ul.current");
    if (currentUl) {
        currentUl.classList.add("js-open");
        if (currentUl.previousElementSibling && currentUl.previousElementSibling.tagName.toLowerCase() === "p") {
            currentUl.previousElementSibling.classList.add("js-open");
        }
    }

    // 1. Gérer les grands titres (Phases) qui sont des <p class="caption">
    var captions = document.querySelectorAll(".wy-menu-vertical p.caption");
    var allPhaseUls = document.querySelectorAll(".wy-menu-vertical p.caption + ul");

    captions.forEach(function (caption) {
        caption.style.cursor = "pointer";
        caption.classList.add("is-collapsible");
        
        var nextUl = caption.nextElementSibling;
        if (nextUl && nextUl.tagName.toLowerCase() === "ul") {
            caption.addEventListener("click", function () {
                var wasOpen = caption.classList.contains("js-open");

                // Mode Accordéon : on ferme toutes les phases avant d'ouvrir la cible
                captions.forEach(function(c) { c.classList.remove("js-open"); });
                allPhaseUls.forEach(function(u) { u.classList.remove("js-open"); });
                
                // Si la phase cliquée n'était pas déjà ouverte, on l'ouvre
                // (Si elle était ouverte, le fait d'avoir tout fermé agit comme un "toggle" fermé)
                if (!wasOpen) {
                    caption.classList.add("js-open");
                    nextUl.classList.add("js-open");
                }
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
                
                // Initialisation : si le li a la classe "current" (page active), on l'ouvre par défaut
                if (li.classList.contains("current")) {
                    li.classList.add("js-open");
                }

                link.addEventListener("click", function (e) {
                    // Si c'est juste un lien vide (#), on toggle sans naviguer
                    if (!link.getAttribute("href") || link.getAttribute("href") === "#") {
                        e.preventDefault();
                    }
                    // Pour les sous-sections, un simple toggle (on ne ferme pas les autres sous-sections)
                    li.classList.toggle("js-open");
                });
            }
        }
    });
});
