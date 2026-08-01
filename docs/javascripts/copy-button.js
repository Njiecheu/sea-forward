document.addEventListener("DOMContentLoaded", function () {
  var copyIcon = `
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="8" y="8" width="12" height="12" rx="2"></rect>
    <path d="M4 16V4a2 2 0 0 1 2-2h10"></path>
  </svg>`;

  var checkIcon = `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`;

  document.querySelectorAll(".highlight").forEach(function (block) {
    var pre = block.querySelector("pre");
    if (!pre) return;

    var button = document.createElement("button");
    button.className = "copy-code-button";
    button.type = "button";
    button.setAttribute("aria-label", "Copier le code");
    button.title = "Copier le code";
    button.innerHTML = copyIcon;

    button.addEventListener("click", function () {
      navigator.clipboard.writeText(pre.innerText).then(function () {
        button.innerHTML = checkIcon;
        button.classList.add("copied");
        setTimeout(function () {
          button.innerHTML = copyIcon;
          button.classList.remove("copied");
        }, 2000);
      });
    });

    var filenameBar = block.querySelector(".filename");
    if (filenameBar) {
      filenameBar.style.position = "relative";
      filenameBar.appendChild(button);
    } else {
      block.style.position = "relative";
      block.appendChild(button);
    }
  });
});