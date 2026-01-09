// Find me on Discord : chris.y.l.o
// === Constants for Modes ===
const DRAG_MODE_FREE = 1;
const DRAG_MODE_GRID = 2;
const DRAG_MODE_SNAP_ON_RELEASE = 3;

const INTERACTION_MODE_DRAG = 1;
const INTERACTION_MODE_SWAP = 2;

// === DOM Elements ===
const board = document.getElementById("board");
const addNoteButton = document.getElementById("add-note");
const addChecklistButton = document.getElementById("add-checklist");
const toggleDragModeButton = document.getElementById("toggle-snap");
const toggleInteractionModeButton = document.getElementById("card-swap-mode");
const toggleResizeButton = document.getElementById("toggle-resize");
const colorInput = document.getElementById("color-picker-input");
const confirmColorButton = document.getElementById("confirm-color");
const searchInput = document.getElementById("search-bar");
const confirmSearchInput = document.getElementById("search-button");

// === State Variables ===
let allowDragWhileEditing = true;
let isDragging = false;
let activeDraggedElement = null;
let activeSwappedElement = null;

let lastDraggedElement = null;
let mouseOffsetX = 0;
let mouseOffsetY = 0;

let dragMode = DRAG_MODE_FREE;
let interactionMode = INTERACTION_MODE_DRAG;

// let settingsOpen = false;
let resizeEnabled = true;

const minWidth = 120;
const minHeight = 80;
const maxWidth = 600;
const maxHeight = 500;

// === Debounce Variables ===

let saveTimeout;

// === Search mode ===

let currentSearchTerm = "";

// === Local Storage ===

function saveBoardToStorage() {
     const notes = Array.from(board.querySelectorAll('.note')).map(note => ({
          type: "note",
          title: note.querySelector('.note-title')?.value || "Untitled",
          content: note.querySelector('.text-zone')?.value || "",
          position: { left: note.style.left, top: note.style.top },
          width: note.style.width,
          height: note.style.height,
          color: note.style.background || "#fffdf5",
          tag: note.querySelector('.tag')?.value || "none",
     }));

     const lists = Array.from(board.querySelectorAll('.note-list')).map(list => ({
          type: "note-list",
          title: list.querySelector('.list-title')?.value || "Untitled",
          items: Array.from(list.querySelectorAll(".checklist-item")).map(item => ({
                    text: item.querySelector(".list-item-input")?.value || "",
                    checked: item.querySelector(".list-item-checkbox")?.checked || false
               })),
          position: { left: list.style.left, top: list.style.top },
          width: list.style.width,
          height: list.style.height,
          color: list.style.background || "#fffdf5",
          tag: list.querySelector('.tag')?.value || "none"
     }));

     const allItems = [...notes, ...lists];
     localStorage.setItem("currentBoard", JSON.stringify(allItems));
 console.log("saved")
}

function debounceSave() {

     clearTimeout(saveTimeout)

     saveTimeout = setTimeout (() => {

          saveBoardToStorage();
     }, 500);
}

function loadBoardFromStorage() {
     const savedNotes = localStorage.getItem("currentBoard");
     if (!savedNotes) return;

     const allItems = JSON.parse(savedNotes);
     board.innerHTML = "";

     allItems.forEach(backedItem => {
          if (backedItem.type === 'note') {
               createNote(backedItem, backedItem.title, backedItem.content, false);
          } else
               if (backedItem.type === 'note-list') {
                    createChecklist(backedItem, backedItem.title, {items: backedItem.items}, false);
               }
          })

}
window.addEventListener("DOMContentLoaded", loadBoardFromStorage);

// === Complexe Buttons for the Notes ===

function attachDeleteButton(element) {
     const deleteButton = document.createElement("button");
     deleteButton.className = "deleteButton";
     deleteButton.textContent = "x";
     deleteButton.onclick = () => {
          element.remove();
          saveBoardToStorage();
     };
     element.appendChild(deleteButton);
}

function attachItemDeleteButton(element) {
     const deleteButton = document.createElement("button");
     deleteButton.className = "itemDeleteButton";
     deleteButton.textContent = "x";
     deleteButton.onclick = () => {
          element.remove();
          saveBoardToStorage();
     };
     element.appendChild(deleteButton);
}

// resizing logic
function attachResizeHandle(element) {
     const resizeHandle = document.createElement("div");
     resizeHandle.className = "resize-handle";

     let x1;
     let y1; 
     let originalWidth;
     let originalHeight;

     resizeHandle.addEventListener("mousedown", e => {

          x1 = e.clientX;
          y1 = e.clientY;
          originalWidth = parseInt(window.getComputedStyle(element).width, 10);
          originalHeight = parseInt(window.getComputedStyle(element).height, 10);
          e.stopPropagation();
          e.preventDefault();
          document.addEventListener("mousemove", resizeElement);
          document.addEventListener("mouseup", stopResize);
     })

     function resizeElement(e) {
          const newWidth = originalWidth + (e.clientX - x1);
          const newHeight = originalHeight + (e.clientY - y1);
          if (newWidth >= minWidth && newWidth <= maxWidth && resizeEnabled === true) {
               element.style.width = newWidth + "px";
          }
          if (newHeight >= minHeight && newHeight <= maxHeight && resizeEnabled === true && element.className !== "note-list") {
               element.style.height = newHeight + "px";
          }

     }
     function stopResize(e){
          document.removeEventListener("mousemove", resizeElement);
          document.removeEventListener("mouseup", stopResize);
          saveBoardToStorage();
     }

     element.appendChild(resizeHandle);
}
// === Note builders ===

//creates note
function createNote(backedItem, title, text, isNew) {
     let visible = false;
     const note = document.createElement("div");
     note.className = "note";

     attachDeleteButton(note);

     const noteTitle = document.createElement("textarea");
     noteTitle.className = "note-title";
     noteTitle.value = title;
     note.appendChild(noteTitle);

     const textZone = document.createElement("textarea");
     textZone.className = "text-zone";
     textZone.value = text;
     note.appendChild(textZone);

if (textZone.value.includes(currentSearchTerm) || noteTitle.value.includes(currentSearchTerm) || currentSearchTerm == "") { visible = true;} else { visible = false;}

if (!isNew || isNew !== true) {
     note.style.left = backedItem.position.left;
     note.style.top = backedItem.position.top;
     note.style.position = "absolute";

     if (backedItem.width) note.style.width = backedItem.width;
     if (backedItem.height) note.style.height = backedItem.height;
     if (backedItem.color) note.style.background = backedItem.color;
}

if (visible === true) {
     console.log("note visible")
    attachResizeHandle(note);
    if (interactionMode === INTERACTION_MODE_DRAG) {
        enableDragForElement(note);
    }
    else {
        enableSwapForElement(note);
    }
}
else {
     console.log("note hidden")
    note.style.display = "none";
}

     board.appendChild(note);
//     if (isNew && isNew === true) saveBoardToStorage();
}

//creates checklist
function createChecklist(backedItem, title, itemsArray, isNew) {

     let visible = false;
     if (title.includes(currentSearchTerm) || currentSearchTerm === ""){
               visible = true;
     }

     const checklist = document.createElement("div");
     checklist.className = "note-list";

    attachDeleteButton(checklist);

    const listTitle = document.createElement("textarea");
    listTitle.className = "list-title";
    listTitle.value = title;
    checklist.appendChild(listTitle);

    const addItemButton = document.createElement("button");
    addItemButton.className = "add-item-button";
    addItemButton.textContent = "Add item";

    addItemButton.addEventListener("click", () => {
               const item = document.createElement("div");
               item.className = "checklist-item";
               const checkBox = document.createElement("input");
               checkBox.className = "list-item-checkbox";
               checkBox.type = "checkbox";

               const input = document.createElement("input");
               input.className = "list-item-input";
               input.value = "New item";

               attachItemDeleteButton(item);

               item.appendChild(checkBox);
               item.appendChild(input);
               checklist.appendChild(item);
               saveBoardToStorage();
    });

    checklist.appendChild(addItemButton);

    if (typeof itemsArray === "undefined" || !itemsArray.items) {
          console.log("no items found in checklist")

     } else {
          itemsArray.items.forEach(backedInput => {
          if (backedInput.text.includes(currentSearchTerm)){
               visible = true;
          }
          const item = document.createElement("div");
          const checkBox = document.createElement("input");
          checkBox.className = "list-item-checkbox";
          checkBox.type = "checkbox";
          checkBox.checked = backedInput.checked;
                                             
          const input = document.createElement("input");
          input.className = "list-item-input";
          input.value = backedInput.text;

          attachItemDeleteButton(item);
          item.appendChild(checkBox);
          item.appendChild(input);
          checklist.appendChild(item);
    });

}

if (!isNew || isNew !== true) {
     checklist.style.left = backedItem.position.left;
     checklist.style.top = backedItem.position.top;
     checklist.style.position = "absolute";

     if (backedItem.width) checklist.style.width = backedItem.width;
     if (backedItem.height) checklist.style.height = backedItem.height;
     if (backedItem.color) checklist.style.background = backedItem.color;
}

if (visible === true) {
     console.log("checklist visible")
    attachResizeHandle(checklist);
    if (interactionMode === INTERACTION_MODE_DRAG) {
        enableDragForElement(checklist);
    }
    else {
        enableSwapForElement(checklist);
    }
}
else {
     console.log("checklist hidden")
     checklist.style.display = "none";
}
    board.appendChild(checklist);
//    if (isNew && isNew === true) saveBoardToStorage();
}
// === Drag and Drop Logic ===

// === Dragging Logic ===
function enableDragForElement(element) {
     element.style.cursor = "grab";
     
     
     element.addEventListener("mousedown", e => {
          if ((e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") && allowDragWhileEditing) {
               return;
          }
          e.preventDefault();

          element.style.position = "absolute";
          document.body.style.userSelect = "none";

          isDragging = true;
          activeDraggedElement = element;

          // Raise z-index so dragged item stays on top
          activeDraggedElement.style.zIndex = (parseInt(element.style.zIndex, 10) || 0) + 1000;

          mouseOffsetX = e.clientX - element.offsetLeft;
          mouseOffsetY = e.clientY - element.offsetTop;
          element.style.cursor = "grabbing";

          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
     });

     function onMouseMove(e) {
          if (isDragging && activeDraggedElement) {
               const boardRect = board.getBoundingClientRect();
               const elemRect = activeDraggedElement.getBoundingClientRect();

               let newLeft = e.clientX - mouseOffsetX;
               let newTop = e.clientY - mouseOffsetY;

               // Keep inside board horizontally
               if (newLeft < 0) newLeft = 0;
               if (newLeft + elemRect.width > boardRect.width) {
                    newLeft = boardRect.width - elemRect.width;
               }
               // Keep inside board vertically
               if (newTop < 0) newTop = 0;
               if (newTop + elemRect.height > boardRect.height) {
                    newTop = boardRect.height - elemRect.height;
               }

               // snappy drag vs free drag
               if (dragMode === DRAG_MODE_GRID) {
                    const gridSizeHeight = board.offsetHeight / 40;
                    const gridSizeWidth = board.offsetWidth / 20;
                    activeDraggedElement.style.left =
                         Math.round((newLeft) / gridSizeWidth) * gridSizeWidth + "px";
                    activeDraggedElement.style.top =
                         Math.round((newTop) / gridSizeHeight) * gridSizeHeight + "px";
               } else {
                    activeDraggedElement.style.left = newLeft + "px";
                    activeDraggedElement.style.top = newTop + "px";
               }
          }
     }

     function onMouseUp() {
          if (activeDraggedElement && dragMode === DRAG_MODE_SNAP_ON_RELEASE) {
               const gridSize = 50;
               const boardRect = board.getBoundingClientRect();

               let absLeft = parseInt(activeDraggedElement.style.left, 10);
               let absTop = parseInt(activeDraggedElement.style.top, 10);

               let relLeft = absLeft - boardRect.left;
               let relTop = absTop - boardRect.top;

               relLeft = Math.round(relLeft / gridSize) * gridSize;
               relTop = Math.round(relTop / gridSize) * gridSize;

               relLeft = Math.max(0, Math.min(relLeft, boardRect.width - activeDraggedElement.offsetWidth));
               relTop = Math.max(0, Math.min(relTop, boardRect.height - activeDraggedElement.offsetHeight));

               activeDraggedElement.style.left = boardRect.left + relLeft + "px";
               activeDraggedElement.style.top = boardRect.top + relTop + "px";
               activeDraggedElement.style.cursor = "grab";
          }

          document.body.style.userSelect = "auto";
          isDragging = false;
          lastDraggedElement = activeDraggedElement;
          activeDraggedElement = null;

          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);

          saveBoardToStorage();
     }
}

// === Swapping Logic ===
function enableSwapForElement(element) {
     element.style.cursor = "grab";

     element.addEventListener("mousedown", e => {
          if ((e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") && allowDragWhileEditing) {
               return;
          }
          e.preventDefault();
          activeSwappedElement = element;
          element.style.opacity = "0.5";
          document.body.style.userSelect = "none";

          function onMouseMove(e) {
               const overElement = document.elementFromPoint(e.clientX, e.clientY);
               if (!overElement) return;

               const overNote = overElement.closest(".note");
               const overList = overElement.closest(".note-list");
               const overTarget = overNote || overList;

               if (overTarget && overTarget !== activeSwappedElement) {
                    const draggedIndex = Array.from(board.children).indexOf(activeSwappedElement);
                    const overIndex = Array.from(board.children).indexOf(overTarget);

                    if (draggedIndex < overIndex) {
                         board.insertBefore(activeSwappedElement, overTarget.nextSibling);
                    } else {
                         board.insertBefore(activeSwappedElement, overTarget);
                    }
               }
          }

          function onMouseUp() {
               activeSwappedElement.style.opacity = "1";
               activeSwappedElement = null;
               document.body.style.userSelect = "auto";
               document.removeEventListener("mousemove", onMouseMove);
               document.removeEventListener("mouseup", onMouseUp);
               saveBoardToStorage();
          }

          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
     });
}

// === Action Buttons ===
toggleDragModeButton.addEventListener("click", () => {
     if (dragMode === DRAG_MODE_SNAP_ON_RELEASE) {
          dragMode = DRAG_MODE_FREE;
          toggleDragModeButton.textContent = "Drag mode: free drag, no snap";
     } else if (dragMode === DRAG_MODE_FREE) {
          dragMode = DRAG_MODE_GRID;
          toggleDragModeButton.textContent = "Drag mode: drag across grid";
     } else if (dragMode === DRAG_MODE_GRID) {
          dragMode = DRAG_MODE_SNAP_ON_RELEASE;
          toggleDragModeButton.textContent = "Drag mode: free drag, snap on release";
     }
});

// Add Note Button
addNoteButton.addEventListener("click", () => {
     createNote(null, "Untitled", "New note", true);
     saveBoardToStorage();
});

// Add Checklist Button
addChecklistButton.addEventListener("click", () => {
     createChecklist(null, "Untitled", [], true);
     saveBoardToStorage();
});
toggleResizeButton.addEventListener("click", () => {
     if (resizeEnabled === true){
          resizeEnabled = false;
          toggleResizeButton.textContent = "resize notes: off";
          saveBoardToStorage();
     } else {
          resizeEnabled = true;
          toggleResizeButton.textContent = "resize notes: on";
          saveBoardToStorage();
     }
})

confirmColorButton.addEventListener("click", () => {

     if (lastDraggedElement) {
          console.log("note found")
          lastDraggedElement.style.background = colorInput.value;
          saveBoardToStorage();
     } else {
          console.log("No note previously selected");
     }

})

// Saves after the user types or checks a box

document.addEventListener("input", e => {
     if (e.target.matches(".note-title, .list-title, .text-zone, .list-item-input")) {
          debounceSave();
     }
});
document.addEventListener("change", e => {
     if (e.target.matches(".list-item-checkbox")) {
          debounceSave();
     }
});

// Swap Mode Button
toggleInteractionModeButton.addEventListener("click", () => {
     saveBoardToStorage();
     board.innerHTML = "";
     if (interactionMode === INTERACTION_MODE_DRAG) {
          interactionMode = INTERACTION_MODE_SWAP;
          toggleInteractionModeButton.textContent = "Mode: swap";
          loadBoardFromStorage();
     } else {
          interactionMode = INTERACTION_MODE_DRAG;
          toggleInteractionModeButton.textContent = "Mode: drag";
          loadBoardFromStorage();
     }
});

confirmSearchInput.addEventListener("click", () => {
     currentSearchTerm = searchInput.value;
     loadBoardFromStorage();
})

searchInput.addEventListener("input", () => {
     currentSearchTerm = searchInput.value;
     loadBoardFromStorage();
});