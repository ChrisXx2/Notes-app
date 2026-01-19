// Find me on Discord : Chris.y.l.o
// === Constants for Modes ===
const DRAG_MODE_FREE = 1;
const DRAG_MODE_GRID = 2;
const DRAG_MODE_SNAP_ON_RELEASE = 3;

const INTERACTION_MODE_DRAG = 1;
const INTERACTION_MODE_SWAP = 2;

// Grid and Snap Settings
const GRID_ROWS = 40;
const GRID_COLS = 20;
const SNAP_GRID_SIZE = 50;

// Size Constraints
const MIN_NOTE_WIDTH = 120;
const MIN_NOTE_HEIGHT = 80;
const MAX_NOTE_WIDTH = 600;
const MAX_NOTE_HEIGHT = 500;

// Debounce Timing
const SAVE_DEBOUNCE_MS = 500;

// Z-Index Management
const DRAGGING_Z_INDEX_BOOST = 1000;

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
const appState = {
  // Drag state
  isDragging: false,
  activeDraggedElement: null,
  lastDraggedElement: null,
  mouseOffsetX: 0,
  mouseOffsetY: 0,
  
  // Swap state
  activeSwappedElement: null,
  
  // Settings
  dragMode: DRAG_MODE_FREE,
  interactionMode: INTERACTION_MODE_DRAG,
  resizeEnabled: true,
  allowDragWhileEditing: true,
  
  // Search
  currentSearchTerm: "",
  
  // Debounce
  saveTimeout: null
};

// === Local Storage ===

function saveBoardToStorage() {
  try {
    const notes = Array.from(board.querySelectorAll('.note')).map((note, index) => ({
      type: "note",
      title: note.querySelector('.note-title')?.value || "Untitled",
      content: note.querySelector('.text-zone')?.value || "",
      position: appState.interactionMode === INTERACTION_MODE_DRAG ? { left: note.style.left, top: note.style.top } : { left: "0px", top: "0px" },
      width: note.style.width,
      height: note.style.height,
      color: note.style.background || "#fffdf5",
      tag: note.querySelector('.tag')?.value || "none",
      order: index // Save order for swap mode
    }));

    const lists = Array.from(board.querySelectorAll('.note-list')).map((list, index) => ({
      type: "note-list",
      title: list.querySelector('.list-title')?.value || "Untitled",
      items: Array.from(list.querySelectorAll(".checklist-item")).map(item => ({
        text: item.querySelector(".list-item-input")?.value || "",
        checked: item.querySelector(".list-item-checkbox")?.checked || false
      })),
      position: appState.interactionMode === INTERACTION_MODE_DRAG ? { left: list.style.left, top: list.style.top } : { left: "0px", top: "0px" },
      width: list.style.width,
      height: list.style.height,
      color: list.style.background || "#fffdf5",
      tag: list.querySelector('.tag')?.value || "none",
      order: notes.length + index // Save order for swap mode
    }));

    const allItems = [...notes, ...lists];
    
    // Sort by order to maintain swap mode arrangement
    allItems.sort((a, b) => a.order - b.order);
    
    localStorage.setItem("currentBoard", JSON.stringify(allItems));
    console.log("Board saved successfully");
  } catch (error) {
    console.error("Failed to save board:", error);
    alert("Failed to save your changes. Check console for details.");
  }
}

function debounceSave() {
  clearTimeout(appState.saveTimeout);
  
  appState.saveTimeout = setTimeout(() => {
    saveBoardToStorage();
  }, SAVE_DEBOUNCE_MS);
}

function loadBoardFromStorage() {
  try {
    const savedNotes = localStorage.getItem("currentBoard");
    if (!savedNotes) return;
    
    const allItems = JSON.parse(savedNotes);
    board.innerHTML = "";

    allItems.forEach(backedItem => {
      if (backedItem.type === 'note') {
        createNote(backedItem, backedItem.title, backedItem.content, false);
      } else if (backedItem.type === 'note-list') {
        createChecklist(backedItem, backedItem.title, {items: backedItem.items}, false);
      }
    });
  } catch (error) {
    console.error("Failed to load board from storage:", error);
    alert("Failed to load saved notes. Starting with a clean board.");
    localStorage.removeItem("currentBoard");
  }
}

window.addEventListener("DOMContentLoaded", loadBoardFromStorage);

// === Helper Functions for Element Setup ===

function shouldBeVisible(searchableContent) {
  if (appState.currentSearchTerm === "") return true;
  
  return searchableContent.some(content => 
    content && content.toLowerCase().includes(appState.currentSearchTerm.toLowerCase())
  );
}

function applyStoredStyles(element, backedItem, isNew) {
  // Only apply saved styles if this is a loaded item (not new)
  if (isNew || !backedItem) {
    return;
  }
  
  // Only apply positioning in drag mode
  if (appState.interactionMode === INTERACTION_MODE_DRAG) {
    element.style.position = "absolute";
    element.style.left = backedItem.position.left;
    element.style.top = backedItem.position.top;
  }

  if (backedItem.width) element.style.width = backedItem.width;
  if (backedItem.height) element.style.height = backedItem.height;
  if (backedItem.color) element.style.background = backedItem.color;
}

function finalizeElement(element, isVisible) {
  if (isVisible) {
    console.log(element.className + " visible");
    attachResizeHandle(element);
    
    if (appState.interactionMode === INTERACTION_MODE_DRAG) {
      enableDragForElement(element);
    } else {
      enableSwapForElement(element);
    }
  } else {
    console.log(element.className + " hidden");
    element.style.display = "none";
  }
  
  board.appendChild(element);
}

// === Complex Buttons for the Notes ===

function attachDeleteButton(element) {
  const deleteButton = document.createElement("button");
  deleteButton.className = "deleteButton";
  deleteButton.textContent = "x";
  deleteButton.setAttribute("aria-label", "Delete this note");
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
  deleteButton.setAttribute("aria-label", "Delete this item");
  deleteButton.onclick = () => {
    element.remove();
    saveBoardToStorage();
  };
  element.appendChild(deleteButton);
}

// === Resizing Logic ===
function attachResizeHandle(element) {
  const resizeHandle = document.createElement("div");
  resizeHandle.className = "resize-handle";
  resizeHandle.setAttribute("aria-label", "Resize handle");

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
  });

  function resizeElement(e) {
    const newWidth = originalWidth + (e.clientX - x1);
    const newHeight = originalHeight + (e.clientY - y1);
    
    if (newWidth >= MIN_NOTE_WIDTH && newWidth <= MAX_NOTE_WIDTH && appState.resizeEnabled) {
      element.style.width = newWidth + "px";
    }
    if (newHeight >= MIN_NOTE_HEIGHT && newHeight <= MAX_NOTE_HEIGHT && appState.resizeEnabled && element.className !== "note-list") {
      element.style.height = newHeight + "px";
    }
  }
  
  function stopResize() {
    document.removeEventListener("mousemove", resizeElement);
    document.removeEventListener("mouseup", stopResize);
    saveBoardToStorage();
  }

  element.appendChild(resizeHandle);
}

// === Note Builders ===

function createNote(backedItem, title, text, isNew) {
  const note = document.createElement("div");
  note.className = "note";

  attachDeleteButton(note);

  const noteTitle = document.createElement("textarea");
  noteTitle.className = "note-title";
  noteTitle.value = title;
  noteTitle.setAttribute("aria-label", "Note title");
  note.appendChild(noteTitle);

  const textZone = document.createElement("textarea");
  textZone.className = "text-zone";
  textZone.value = text;
  textZone.setAttribute("aria-label", "Note content");
  note.appendChild(textZone);

  // Check visibility based on search
  const searchableContent = [title, text];
  const visible = shouldBeVisible(searchableContent);

  // Apply saved styles if loading from storage
  applyStoredStyles(note, backedItem, isNew);

  // Finalize and add to board
  finalizeElement(note, visible);
  
  // Auto-focus and select title for new notes
  if (isNew) {
    noteTitle.focus();
    noteTitle.select();
  }
}

function createChecklist(backedItem, title, itemsArray, isNew) {
  const checklist = document.createElement("div");
  checklist.className = "note-list";

  attachDeleteButton(checklist);

  const listTitle = document.createElement("textarea");
  listTitle.className = "list-title";
  listTitle.value = title;
  listTitle.setAttribute("aria-label", "Checklist title");
  checklist.appendChild(listTitle);

  const addItemButton = document.createElement("button");
  addItemButton.className = "add-item-button";
  addItemButton.textContent = "Add item";
  addItemButton.setAttribute("aria-label", "Add new checklist item");

  addItemButton.addEventListener("click", () => {
    const item = document.createElement("div");
    item.className = "checklist-item";
    
    const checkBox = document.createElement("input");
    checkBox.className = "list-item-checkbox";
    checkBox.type = "checkbox";
    checkBox.setAttribute("aria-label", "Mark item as complete");

    const input = document.createElement("input");
    input.className = "list-item-input";
    input.value = "New item";
    input.setAttribute("aria-label", "Checklist item text");

    attachItemDeleteButton(item);

    item.appendChild(checkBox);
    item.appendChild(input);
    checklist.appendChild(item);
    saveBoardToStorage();
  });

  checklist.appendChild(addItemButton);

  // Build searchable content array
  let searchableContent = [title];

  // Add existing items if they exist
  if (itemsArray && itemsArray.items) {
    itemsArray.items.forEach(backedInput => {
      searchableContent.push(backedInput.text);
      
      const item = document.createElement("div");
      item.className = "checklist-item";
      
      const checkBox = document.createElement("input");
      checkBox.className = "list-item-checkbox";
      checkBox.type = "checkbox";
      checkBox.checked = backedInput.checked;
      checkBox.setAttribute("aria-label", "Mark item as complete");

      const input = document.createElement("input");
      input.className = "list-item-input";
      input.value = backedInput.text;
      input.setAttribute("aria-label", "Checklist item text");

      attachItemDeleteButton(item);
      item.appendChild(checkBox);
      item.appendChild(input);
      checklist.appendChild(item);
    });
  }

  // Check visibility
  const visible = shouldBeVisible(searchableContent);

  // Apply saved styles if loading from storage
  applyStoredStyles(checklist, backedItem, isNew);

  // Finalize and add to board
  finalizeElement(checklist, visible);
  
  // Auto-focus and select title for new checklists
  if (isNew) {
    listTitle.focus();
    listTitle.select();
  }
}

// === Drag and Drop Logic ===

function enableDragForElement(element) {
  element.style.cursor = "grab";
  
  element.addEventListener("mousedown", e => {
    if ((e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") && appState.allowDragWhileEditing) {
      return;
    }
    e.preventDefault();

    element.style.position = "absolute";
    document.body.style.userSelect = "none";

    appState.isDragging = true;
    appState.activeDraggedElement = element;

    // Raise z-index so dragged item stays on top
    appState.activeDraggedElement.style.zIndex = (parseInt(element.style.zIndex, 10) || 0) + DRAGGING_Z_INDEX_BOOST;

    appState.mouseOffsetX = e.clientX - element.offsetLeft;
    appState.mouseOffsetY = e.clientY - element.offsetTop;
    element.style.cursor = "grabbing";

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  function onMouseMove(e) {
    if (appState.isDragging && appState.activeDraggedElement) {
      const boardRect = board.getBoundingClientRect();
      const elemRect = appState.activeDraggedElement.getBoundingClientRect();

      let newLeft = e.clientX - appState.mouseOffsetX;
      let newTop = e.clientY - appState.mouseOffsetY;

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

      // Snappy drag vs free drag
      if (appState.dragMode === DRAG_MODE_GRID) {
        const gridSizeHeight = board.offsetHeight / GRID_ROWS;
        const gridSizeWidth = board.offsetWidth / GRID_COLS;
        appState.activeDraggedElement.style.left =
          Math.round(newLeft / gridSizeWidth) * gridSizeWidth + "px";
        appState.activeDraggedElement.style.top =
          Math.round(newTop / gridSizeHeight) * gridSizeHeight + "px";
      } else {
        appState.activeDraggedElement.style.left = newLeft + "px";
        appState.activeDraggedElement.style.top = newTop + "px";
      }
    }
  }

  function onMouseUp() {
    if (appState.activeDraggedElement && appState.dragMode === DRAG_MODE_SNAP_ON_RELEASE) {
      const boardRect = board.getBoundingClientRect();

      let absLeft = parseInt(appState.activeDraggedElement.style.left, 10);
      let absTop = parseInt(appState.activeDraggedElement.style.top, 10);

      let relLeft = absLeft - boardRect.left;
      let relTop = absTop - boardRect.top;

      relLeft = Math.round(relLeft / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
      relTop = Math.round(relTop / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;

      relLeft = Math.max(0, Math.min(relLeft, boardRect.width - appState.activeDraggedElement.offsetWidth));
      relTop = Math.max(0, Math.min(relTop, boardRect.height - appState.activeDraggedElement.offsetHeight));

      appState.activeDraggedElement.style.left = boardRect.left + relLeft + "px";
      appState.activeDraggedElement.style.top = boardRect.top + relTop + "px";
      appState.activeDraggedElement.style.cursor = "grab";
    }

    document.body.style.userSelect = "auto";
    appState.isDragging = false;
    appState.lastDraggedElement = appState.activeDraggedElement;
    appState.activeDraggedElement = null;

    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);

    saveBoardToStorage();
  }
}

// === Swapping Logic ===
function enableSwapForElement(element) {
  element.style.cursor = "grab";

  element.addEventListener("mousedown", e => {
    if ((e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") && appState.allowDragWhileEditing) {
      return;
    }
    e.preventDefault();
    appState.activeSwappedElement = element;
    element.style.opacity = "0.5";
    document.body.style.userSelect = "none";

    function onMouseMove(e) {
      const overElement = document.elementFromPoint(e.clientX, e.clientY);
      if (!overElement) return;

      const overNote = overElement.closest(".note");
      const overList = overElement.closest(".note-list");
      const overTarget = overNote || overList;

      if (overTarget && overTarget !== appState.activeSwappedElement) {
        const draggedIndex = Array.from(board.children).indexOf(appState.activeSwappedElement);
        const overIndex = Array.from(board.children).indexOf(overTarget);

        if (draggedIndex < overIndex) {
          board.insertBefore(appState.activeSwappedElement, overTarget.nextSibling);
        } else {
          board.insertBefore(appState.activeSwappedElement, overTarget);
        }
      }
    }

    function onMouseUp() {
      appState.activeSwappedElement.style.opacity = "1";
      appState.lastDraggedElement = appState.activeSwappedElement;
      appState.activeSwappedElement = null;
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
  if (appState.dragMode === DRAG_MODE_SNAP_ON_RELEASE) {
    appState.dragMode = DRAG_MODE_FREE;
    toggleDragModeButton.textContent = "Drag mode: free drag, no snap";
  } else if (appState.dragMode === DRAG_MODE_FREE) {
    appState.dragMode = DRAG_MODE_GRID;
    toggleDragModeButton.textContent = "Drag mode: drag across grid";
  } else if (appState.dragMode === DRAG_MODE_GRID) {
    appState.dragMode = DRAG_MODE_SNAP_ON_RELEASE;
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
  appState.resizeEnabled = !appState.resizeEnabled;
  toggleResizeButton.textContent = `resize notes: ${appState.resizeEnabled ? 'on' : 'off'}`;
  saveBoardToStorage();
});

confirmColorButton.addEventListener("click", () => {
  if (appState.lastDraggedElement) {
    console.log("note found");
    appState.lastDraggedElement.style.background = colorInput.value;
    saveBoardToStorage();
  } else {
    console.log("No note previously selected");
  }
});

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
  if (appState.interactionMode === INTERACTION_MODE_DRAG) {
    appState.interactionMode = INTERACTION_MODE_SWAP;
    toggleInteractionModeButton.textContent = "Mode: swap";
  } else {
    appState.interactionMode = INTERACTION_MODE_DRAG;
    toggleInteractionModeButton.textContent = "Mode: drag";
  }
  loadBoardFromStorage();
});

confirmSearchInput.addEventListener("click", () => {
  appState.currentSearchTerm = searchInput.value;
  loadBoardFromStorage();
});

searchInput.addEventListener("input", () => {
  appState.currentSearchTerm = searchInput.value;
  loadBoardFromStorage();
});

const clearBoardButton = document.getElementById("clear-board");
if (clearBoardButton) {
  clearBoardButton.addEventListener("click", () => {
    const confirmDelete = confirm(
      "Are you sure you want to delete all notes and checklists? This cannot be undone."
    );
    
    if (confirmDelete) {
      board.innerHTML = "";
      localStorage.removeItem("currentBoard");
      appState.lastDraggedElement = null;
      console.log("All notes deleted successfully");
    }
  });
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ignore if user is typing in an input/textarea
  if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") {
    return;
  }
  
  // Ctrl/Cmd + N = New Note
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    createNote(null, "Untitled", "New note", true);
    saveBoardToStorage();
  }
  
  // Ctrl/Cmd + L = New Checklist
  if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
    e.preventDefault();
    createChecklist(null, "Untitled", [], true);
    saveBoardToStorage();
  }
});