function httpGet(filePath) {
  return new Promise(function (resolve) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", filePath);
    xhr.send();
    xhr.onload = function () {
      resolve(xhr.responseText);
    };
  });
}

httpGet('index.html').then(function (html) {
  console.log(html);
});
