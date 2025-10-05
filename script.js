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
  localStorage.setItem("currentBoard", board.innerHTML);
}

function loadBoardFromStorage() {
  const saved = localStorage.getItem("currentBoard");
  if (saved) {
    board.innerHTML = saved;
    // Reattach behaviour to saved elements
    board.querySelectorAll(".note, .note-list").forEach(el => {
      if (interactionMode === INTERACTION_MODE_DRAG) {
        enableDragForElement(el);
      } else {
        enableSwapForElement(el);
      }
    });
  }
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
          Math.round((newLeft - boardRect.left) / gridSizeWidth) * gridSizeWidth + "px";
        activeDraggedElement.style.top =
          Math.round((newTop - boardRect.top) / gridSizeHeight) * gridSizeHeight + "px";
      } else {
        activeDraggedElement.style.left = newLeft + "px";
        activeDraggedElement.style.top = newTop + "px";
      }
    }
  }

  function onMouseUp() {
    if (activeDraggedElement && dragMode === DRAG_MODE_SNAP_ON_RELEASE) {
      const gridSize = 50; // px per cell
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

// === UI Buttons ===
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
  const note = document.createElement("div");
  note.className = "note";
  note.textContent = "New Note";

  attachDeleteButton(note);

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
  checklist.textContent = "New list";

  attachDeleteButton(checklist);

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
  Array.from(board.children).forEach(x => x.remove());
  if (interactionMode === INTERACTION_MODE_DRAG) {
    interactionMode = INTERACTION_MODE_SWAP;
    toggleInteractionModeButton.textContent = "Mode: swap";
  } else {
    interactionMode = INTERACTION_MODE_DRAG;
    toggleInteractionModeButton.textContent = "Mode: drag";
  }
});
