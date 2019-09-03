window.onerror = function (message, source, lineno, colno, error) {

  const modalElem = document.getElementById('error_modal')
  const modalContentElem = document.getElementById('error_modal_content')
  const backdropElem = document.getElementById('error_modal_bg')
  modalContentElem.textContent = message
  modalElem.style.display = 'block'
  backdropElem.style.display = 'block'

}