/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./web/frontend/js/common.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./web/frontend/js/common.js":
/*!***********************************!*\
  !*** ./web/frontend/js/common.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nwindow.onerror = function (message, source, lineno, colno, error) {\n\n  var modalElem = document.getElementById('error_modal');\n  var modalContentElem = document.getElementById('error_modal_content');\n  var backdropElem = document.getElementById('error_modal_bg');\n  modalContentElem.textContent = message;\n  modalElem.style.display = 'block';\n  backdropElem.style.display = 'block';\n};//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi93ZWIvZnJvbnRlbmQvanMvY29tbW9uLmpzLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vL3dlYi9mcm9udGVuZC9qcy9jb21tb24uanM/OTBiZiJdLCJzb3VyY2VzQ29udGVudCI6WyJ3aW5kb3cub25lcnJvciA9IGZ1bmN0aW9uIChtZXNzYWdlLCBzb3VyY2UsIGxpbmVubywgY29sbm8sIGVycm9yKSB7XG5cbiAgY29uc3QgbW9kYWxFbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Vycm9yX21vZGFsJylcbiAgY29uc3QgbW9kYWxDb250ZW50RWxlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlcnJvcl9tb2RhbF9jb250ZW50JylcbiAgY29uc3QgYmFja2Ryb3BFbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Vycm9yX21vZGFsX2JnJylcbiAgbW9kYWxDb250ZW50RWxlbS50ZXh0Q29udGVudCA9IG1lc3NhZ2VcbiAgbW9kYWxFbGVtLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG4gIGJhY2tkcm9wRWxlbS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuXG59Il0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./web/frontend/js/common.js\n");

/***/ })

/******/ });