function sendJsonData(method, url, data, handler) {
    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        const READYSTATE_COMPLETED = 4;
        const HTTP_STATUS_OK = 200;

        if (this.readyState == READYSTATE_COMPLETED &&
            this.status == HTTP_STATUS_OK ) {
            if (handler) handler();
        }
    }
    req.open(method, url);
    if (data) {
        req.setRequestHeader('Content-Type', 'application/json');
        req.send(JSON.stringify(data));
    } else {
        req.send(null);
    }
}

function sendFormData(url,formData){
    return $.ajax({
      url: url,
      type: 'post',
      processData: false,
      contentType: false,
      data: formData,
    });
}