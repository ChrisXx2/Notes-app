// alternate universe... for now 👀
// this is just a draft place
//actual draft is the chaos in my notebook rn 🥲

// Right now I'll be trying to improve the note and list creation scripts

function createNote(title, text, visible) {
    const note = document.createElement("div");
     note.className = "note";

     attachDeleteButton(note);

     const noteTitle = document.createElement("textarea");
     noteTitle.className = "note-title";
     noteTitle.value = title;
     note.appendChild(noteTitle);

     const textZone = document.createElement("textarea");
     textZone.className = "text-zone";
     textZOne.value = text;
     note.appendChild(textZone);
     
if (visible == true) {
    attachResizeHandle(note);
    if (interactionMode === INTERACTION_MODE_DRAG) {
        enableDragForElement(note);
    }
    else {
        enableSwapForElement(note);
    }
}
else {
    note.style.width = 0;
    note.style.height = 0;
}

     board.appendChild(note);
     saveBoardToStorage();
}

function createChecklist() {
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
        attachResizeHandle(checklist);
    if (interactionMode === INTERACTION_MODE_DRAG) {
          enableDragForElement(checklist);
    } else {
          enableSwapForElement(checklist);
    }
    board.appendChild(checklist);
    saveBoardToStorage();
}