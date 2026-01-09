// alternate universe... for now (o)_(0)
// this is just a draft place
//actual draft is the chaos in my notebook rn ;-v(

// Right now I'll be trying to improve the note and list creation scripts

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

if ((!isNew || isNew !== true) && interactionMode === INTERACTION_MODE_DRAG) {
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

    applyStoredStyles(isNew, interactionMode, checklist, backedItem, visible, currentSearchTerm);

}
    board.appendChild(checklist);
//    if (isNew && isNew === true) saveBoardToStorage();
}

//standardize styles for notes and checklists

function applyStoredStyles(isNew, interactionMode, element, backedItem, visible, currentSearchTerm) {

   if ((!isNew || isNew !== true) && interactionMode === INTERACTION_MODE_DRAG) {
     element.style.left = backedItem.position.left;
     element.style.top = backedItem.position.top;
     element.style.position = "absolute";

     if (backedItem.width) element.style.width = backedItem.width;
     if (backedItem.height) element.style.height = backedItem.height;
     if (backedItem.color) element.style.background = backedItem.color;
}
if (currentSearchTerm === ""){
               visible = true;
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

}