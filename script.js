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

// === Local Storage ===
function saveBoardToStorage() {
  const notes = Array.from(board.querySelectorAll('.note')).map(note => ({
    type: note.className,
    title: note.querySelector('.note-title')?.value || "Untitled",
    content: note.querySelector('.text-zone')?.value || "",
    position: { left: note.style.left, top: note.style.top },
    color: note.style.background || "#fffdf5"
  }));

  const lists = Array.from(board.querySelectorAll('.note-list')).map(list => ({
    type: list.className,
    title: list.querySelector('.list-title')?.value || "Untitled",
    items: Array.from(list.querySelectorAll("div")).map(item => ({
        text: item.querySelector(".list-item-input")?.value || "",
        checked: item.querySelector(".list-item-checkbox")?.checked || false
      })),
    position: { left: list.style.left, top: list.style.top },
    color: list.style.background || "#fffdf5"
  }));

  const allItems = [...notes, ...lists];
  localStorage.setItem("currentBoard", JSON.stringify(allItems));

}

function loadBoardFromStorage() {
  const savedNotes = localStorage.getItem("currentBoard");
  if (!savedNotes) return;

  const allItems = JSON.parse(savedNotes);
  board.innerHTML = "";

  allItems.forEach(backedItem => {
    if (backedItem.type == 'note') {
      const note = document.createElement("div");
      note.className = "note";

      attachDeleteButton(note);

      const noteTitle = document.createElement("textarea");
      noteTitle.className = "note-title";
      noteTitle.value = backedItem.title;
      note.appendChild(noteTitle);

      const textZone = document.createElement("textarea");
      textZone.className = "text-zone";
      textZone.value = backedItem.content
      note.appendChild(textZone);

      if (interactionMode === INTERACTION_MODE_DRAG) {
          note.style.left = backedItem.position.left;
          note.style.top = backedItem.position.top;
          enableDragForElement(checklist);
      }

     if (interactionMode === INTERACTION_MODE_DRAG) {
          enableDragForElement(note);
        } else {
          enableSwapForElement(note);
        }
  board.appendChild(note);

    } else 
      if (backedItem.type == 'note-list') {
                const checklist = document.createElement("div");
                checklist.className = "note-list";

               attachDeleteButton(checklist);

                const listTitle = document.createElement("textarea");
                listTitle.className = "list-title";
                listTitle.value = backedItem.title
                checklist.appendChild(listTitle);

                const addItemButton = document.createElement("button");
                addItemButton.className = "add-item-button";
                addItemButton.textContent = "Add item";

                addItemButton.addEventListener("click", () => {
                    const item = document.createElement("div");
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
                });

                checklist.appendChild(addItemButton);

                backedItem.items.forEach(backedInput => {
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
                })

                if (interactionMode === INTERACTION_MODE_DRAG) {
                  checklist.style.left = backedItem.position.left;
                  checklist.style.top = backedItem.position.top;
                  enableDragForElement(checklist);
                } else {
                  enableSwapForElement(checklist);
                }
                board.appendChild(checklist);
                  }
                })

}
window.addEventListener("DOMContentLoaded", loadBoardFromStorage);

// === Helper Buttons ===
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

// === Dragging Logic ===
function enableDragForElement(element) {
  element.style.cursor = "grab";

  element.addEventListener("mousedown", e => {
    if ((e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") && allowDragWhileEditing) {
      return;
    }

    element.style.position = "absolute";
    document.body.style.userSelect = "none";

    isDragging = true;
    lastDraggedElement = activeDraggedElement;
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

    activeSwappedElement = element;
    element.style.opacity = "0.5";

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
    saveBoardToStorage();
    dragMode = DRAG_MODE_FREE;
    loadBoardFromStorage();
    toggleDragModeButton.textContent = "Drag mode: free drag, no snap";
  } else if (dragMode === DRAG_MODE_FREE) {
    saveBoardToStorage();
    dragMode = DRAG_MODE_GRID;
    loadBoardFromStorage();
    toggleDragModeButton.textContent = "Drag mode: drag across grid";
  } else if (dragMode === DRAG_MODE_GRID) {
    saveBoardToStorage();
    dragMode = DRAG_MODE_SNAP_ON_RELEASE;
    loadBoardFromStorage();
    toggleDragModeButton.textContent = "Drag mode: free drag, snap on release";
  }
});

// Add Note Button
addNoteButton.addEventListener("click", () => {
  const note = document.createElement("div");
  note.className = "note";

  attachDeleteButton(note);

  const noteTitle = document.createElement("textarea");
  noteTitle.className = "note-title";
  note.appendChild(noteTitle);

  const textZone = document.createElement("textarea");
  textZone.className = "text-zone";
  note.appendChild(textZone);

  if (interactionMode === INTERACTION_MODE_DRAG) {
    enableDragForElement(note);
  } else {
    enableSwapForElement(note);
  }
  board.appendChild(note);
  saveBoardToStorage();
});

// Add Checklist Button
addChecklistButton.addEventListener("click", () => {
  const checklist = document.createElement("div");
  checklist.className = "note-list";

  attachDeleteButton(checklist);

  const listTitle = document.createElement("textarea");
  listTitle.className = "list-title";
  checklist.appendChild(listTitle);

  const addItemButton = document.createElement("button");
  addItemButton.className = "add-item-button";
  addItemButton.textContent = "Add item";

  addItemButton.addEventListener("click", () => {
      const item = document.createElement("div");
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
  if (interactionMode === INTERACTION_MODE_DRAG) {
    enableDragForElement(checklist);
  } else {
    enableSwapForElement(checklist);
  }
  board.appendChild(checklist);
  saveBoardToStorage();
});

// Swap Mode Button
toggleInteractionModeButton.addEventListener("click", () => {
  saveBoardToStorage();
  Array.from(board.children).forEach(x => x.remove());
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