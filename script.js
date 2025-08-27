const board = document.getElementById("board");       // Select the board container element
const addButton = document.getElementById("add-note"); // Select the "Add Note" button

// Add a click event listener to the "Add Note" button
addButton.addEventListener('click', () => {
    const note = document.createElement('div');  // Create a new div for the note
    note.className = 'note';                     // Assign the 'note' class for styling
    note.textContent = "New Note";               // Set initial content (can be removed if textarea is used)

    // Create a delete button for the note
    const deleteButton = document.createElement('button');
    deleteButton.className = 'deleteButton';     // Assign class for styling
    deleteButton.textContent = "x";              // Set button text to "x"
    deleteButton.onclick = () => {
        note.remove();                           // Remove the note when delete button is clicked
    };

    // Create a textarea for note content
    const textZone = document.createElement('textarea');
    textZone.className = "text-zone";            // Assign class for styling

    // Append the delete button and textarea to the note
    note.appendChild(deleteButton);
    note.appendChild(textZone);

    // Add the note to the board
    board.appendChild(note);                     
});
