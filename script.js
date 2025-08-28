const board = document.getElementById("board");       // Select the board container element
const addButton = document.getElementById("add-note"); // Select the "Add Note" button
const addCheckList = document.getElementById("add-checklist")

function createDeleteButton(x, y) {
    const deleteButton = document.createElement('button');
    deleteButton.className = 'deleteButton';     // Assign class for styling
    deleteButton.textContent = "x";              // Set button text to "x"
    deleteButton.onclick = () => {
        x.remove();                           // Remove the note when delete button is clicked
    };
    y.appendChild(deleteButton);
};

// Add a click event listener to the "Add Note" button
addButton.addEventListener('click', () => {
    const note = document.createElement('div');  // Create a new div for the note
    note.className = 'note';                     // Assign the 'note' class for styling
    note.textContent = "New Note";               // Set initial content (will later change to input)

    createDeleteButton(note, note);

    // Create a textarea for note content
    const textZone = document.createElement('textarea');
    textZone.className = "text-zone";            // Assign class for styling

    // Append the delete button and textarea to the note
    note.appendChild(textZone);

    // Add the note to the board
    board.appendChild(note);                     
});

addCheckList.addEventListener('click', () => {
    const checkList = document.createElement('div')
    checkList.className = "note";
    checkList.textContent = "new list";

    createDeleteButton(checkList, checkList);

    const addItem = document.createElement('button')
    addItem.className = "add-item-button"
    addItem.textContent = "Add item";

    addItem.addEventListener('click', () => {
        const item = document.createElement('div')
        const addInput = document.createElement('input');
        addInput.className = "list-item-input";
        addInput.textContent = "New item";
        createDeleteButton(item, item);

        item.appendChild(addInput)
        checkList.appendChild(item)
    })

    checkList.appendChild(addItem)
    board.appendChild(checkList);
    
});