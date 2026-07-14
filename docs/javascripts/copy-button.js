document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".highlight").forEach(function (block) {
    var pre = block.querySelector("pre");
    if (!pre) return;

    var button = document.createElement("button");
    button.className = "copy-code-button";
    button.type = "button";
    button.innerText = "Copy";

    button.addEventListener("click", function () {
      var code = pre.innerText;
      navigator.clipboard.writeText(code).then(function () {
        button.innerText = "Copied!";
        setTimeout(function () {
          button.innerText = "Copy";
        }, 2000);
      });
    });

    block.style.position = "relative";
    block.appendChild(button);
  });
});