const board = document.getElementById("board");       // Select the board container element
const addNoteButton = document.getElementById("add-note"); // Select the "Add Note" button
const addCheckListButton = document.getElementById("add-checklist");
const snappyButton = document.getElementById("toggle-snap");

let isDragging = false;   // If dragging is active or not
let draggedElement = null; // Which element is being dragged
let offsetX, offsetY;     // Mouse offset inside the element
let isSnappy = true;


function createDeleteButton(x) {
    const deleteButton = document.createElement('button');
    deleteButton.className = 'deleteButton';     // Assign class for styling
    deleteButton.textContent = "x";              // Set button text to "x"
    deleteButton.onclick = () => {
        x.remove();                           // Remove the note when delete button is clicked
    };
    x.appendChild(deleteButton);
};

function createItemDeleteButton(x) {
    const deleteButton = document.createElement('button');
    deleteButton.className = 'itemDeleteButton';     // Assign class for styling
    deleteButton.textContent = "x";              // Set button text to "x"
    deleteButton.onclick = () => {
        x.remove();                           // Remove the note when delete button is clicked
    };
    x.appendChild(deleteButton);
};

//  Make any element draggable
function makeDraggable(x) {
    x.style.cursor = "grab";       // Show grab cursor

    x.addEventListener('mousedown', (e) => {
        if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") {
            return;
        }
        x.style.position = "absolute"; // Important: allows free movement
        document.body.style.userSelect = "none";
        isDragging = true;
        draggedElement = x;

        // Calculate offset between mouse and element corner
        offsetX = e.clientX - x.offsetLeft;
        offsetY = e.clientY - x.offsetTop;

        x.style.cursor = "grabbing";
    });
}

document.addEventListener("mousemove", (e) => {
    if (isDragging && draggedElement) {
        const boardRect = board.getBoundingClientRect()
        const elemRect = draggedElement.getBoundingClientRect();
        // Calculate new position
        let newLeft = e.clientX - offsetX;
        let newTop = e.clientY - offsetY;

        // Restrict horizontally
        if (newLeft < 0) newLeft = 0;
        if (newLeft + elemRect.width > boardRect.width) {
            newLeft = boardRect.width - elemRect.width;
        }

        // Restrict vertically
        if (newTop < 0) newTop = 0;
        if (newTop + elemRect.height > boardRect.height) {
            newTop = boardRect.height - elemRect.height;
        }

        if (isSnappy == true) {
        //calculate the grid size using offsetHeight and offsetWidth
        const gridSizeHeight = board.offsetHeight / 10;
        //const gridSizeHeight = (Math.round((board.offsetHeight / 100) * 100) / 20);
        const gridSizeWidth = (Math.round((board.offsetWidth / 100) * 100) / 20);
        // Snap to board
        
        draggedElement.style.left = (Math.round((newLeft - boardRect.left) / gridSizeWidth) * gridSizeWidth) + "px";
        draggedElement.style.top  = (Math.round((newTop - boardRect.top) / gridSizeHeight) * gridSizeHeight) + "px";
    } else {
        draggedElement.style.left = newLeft + "px";
        draggedElement.style.top = newTop + "px";
    }

    }
});


// Stop dragging when mouse released
document.addEventListener("mouseup", () => {
    if (draggedElement) {
        draggedElement.style.cursor = "grab";


    };

    if (draggedElement) {
        draggedElement.style.position = "absolute";
    }
    document.body.style.userSelect = "auto";
    isDragging = false;

    draggedElement = null;
});

// Add a click event listener to the "Add Note" button

snappyButton.addEventListener('click', () => {
    if (isSnappy && isSnappy == true) {
        isSnappy = false;
    } else {
        isSnappy = true;
    }
})

addNoteButton.addEventListener('click', () => {
    const note = document.createElement('div');  // Create a new div for the note
    note.className = 'note';                     // Assign the 'note' class for styling
    note.textContent = "New Note";               // Set initial content (will later change to input)

    createDeleteButton(note);

    // Create a textarea for note content
    const textZone = document.createElement('textarea');
    textZone.className = "text-zone";            // Assign class for styling

    // Append the delete button and textarea to the note
    note.appendChild(textZone);

    // Add the note to the board
    makeDraggable(note);
    board.appendChild(note);                     
});

addCheckListButton.addEventListener('click', () => {
    const checkList = document.createElement('div');
    checkList.className = "note-list";
    checkList.textContent = "new list";

    createDeleteButton(checkList);

    const addItem = document.createElement('button');
    addItem.className = "add-item-button";
    addItem.textContent = "Add item";

    addItem.addEventListener('click', () => {
        const item = document.createElement('div');
        const addCheckBox = document.createElement('input');
        addCheckBox.className = "list-item-checkbox";
        addCheckBox.type = 'checkbox'
        const addInput = document.createElement('input');
        addInput.className = "list-item-input";
        addInput.value = "New item";
        createItemDeleteButton(item);

        item.appendChild(addCheckBox)
        item.appendChild(addInput)
        checkList.appendChild(item)
    })

    checkList.appendChild(addItem)
    makeDraggable(checkList);
    board.appendChild(checkList);
    
});