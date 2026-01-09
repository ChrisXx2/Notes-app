Sticky Board — Interactive Notes & Checklists

A browser-based interactive board that allows users to create, organize, and manage notes and checklists using drag-and-drop, resizing, filtering, and persistent storage.

This project focuses on UX-driven interaction, state persistence, and clean DOM architecture, built entirely with vanilla JavaScript, HTML, and CSS.

-- Features --
* Notes & Checklists

Create text notes and checklist cards

Editable titles and content

Add, check, and delete checklist items

Independent note and checklist components

* Interaction Modes

Drag mode

Free drag

Grid snapping

Snap-on-release

Swap mode

Reorder notes by swapping positions

Toggle between interaction modes at runtime

* Resizing

Resize notes using a drag handle

Optional resize toggle

Minimum and maximum size constraints

* Customization

Color coding per note

Last-selected note color editing

Visual distinction between notes

* Filtering & Search

Filter notes and checklists by:

Title

Content

Checklist items

Real-time search updates

* Persistence

Automatic saving using localStorage

Debounced saves for performance

Board state restored on reload

 Export / Import

Export board data as JSON

Import previously saved boards

Safe schema handling

* Technologies Used

HTML5

CSS3

Vanilla JavaScript (ES6+)

Browser APIs:

localStorage

DOM Events

Drag & mouse interaction handling

* Architecture Overview

Component-based DOM construction

createNote()

createChecklist()

Separation of concerns:

Rendering

Interaction logic

Persistence

Centralized board saving and loading

Debounced storage updates for performance

Mode-based interaction system

* Project Structure
/index.html
/style.css
/script.js


index.html — UI structure

style.css — Layout, interactions, resize handles, visuals

script.js — State management, logic, interactions

* How to Run

Clone the repository

Open index.html in your browser

Start creating notes — no build step required

* (What comes next) Possible Improvements

Undo / redo system

Tags and grouping

Touch & mobile support

Cloud sync

Multi-board support

* Author

Chris-Yvann Ouattara
Mechanical Engineering & Computer Science student
Focused on interactive web applications and UI logic