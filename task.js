function addTask() {
    const newTaskInput = document.getElementById('new-task');
    const tasksContainer = document.getElementById('tasks-container');
    const taskText = newTaskInput.value.trim();

    if (taskText !== '') {
        // Create a new task container
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';

        // Create "Edit" button with class 'edit-button'
        const editButton = createButton('Edit', function () {
            editTask(taskTextElement);
        });
        editButton.classList.add('edit-button');  // Add the class 'edit-button'

        // Create "Remove" button with class 'remove-button'
        const removeButton = createButton('Remove', function () {
            tasksContainer.removeChild(taskItem);
        });
        removeButton.classList.add('remove-button');  // Add the class 'remove-button'

        // Create a container for the task text
        const taskTextContainer = document.createElement('div');
        taskTextContainer.className = 'task-text-container';

        // Create a span for the task text
        const taskTextElement = document.createElement('span');
        taskTextElement.textContent = taskText;

        // Append elements to the task item
        taskTextContainer.appendChild(taskTextElement);
        taskItem.appendChild(editButton);
        taskItem.appendChild(removeButton);
        taskItem.appendChild(taskTextContainer);

        // Append the task container to the tasks div
        tasksContainer.appendChild(taskItem);
        newTaskInput.value = '';
    }
}


function randomizeTask() {
    const tasksContainer = document.getElementById('tasks-container');
    const taskItems = Array.from(tasksContainer.children);

    const taskTexts = taskItems.map(item => item.lastElementChild.textContent);

    if (taskTexts.length > 0) {
        const randomIndex = Math.floor(Math.random() * taskTexts.length);

        // Highlight the randomly chosen task
        taskItems.forEach(item => item.classList.remove('highlighted'));
        taskItems[randomIndex].classList.add('highlighted');

        // Output the random task within the result log area
        const resultLog = document.getElementById('result-log');
        resultLog.textContent = 'Random Task: ' + taskTexts[randomIndex];
    } else {
        alert('No tasks to randomize. Add some tasks first!');
    }
}

function editTask(taskTextElement) {
    const newTaskText = prompt('Edit Task:', taskTextElement.textContent);
    if (newTaskText !== null) {
        taskTextElement.textContent = newTaskText;
    }
}

function clearAllTasks() {
    const tasksContainer = document.getElementById('tasks-container');
    tasksContainer.innerHTML = '';

    // Clear the file input
    const fileInput = document.getElementById('file-input');
    fileInput.value = '';
}

function createTaskItem(taskText) {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';

    // Create "Edit" button with class 'edit-button'
    const editButton = createButton('Edit', function () {
        editTask(taskTextElement);
    });
    editButton.classList.add('edit-button');  // Add the class 'edit-button'

    // Create "Remove" button with class 'remove-button'
    const removeButton = createButton('Remove', function () {
        tasksContainer.removeChild(taskItem);
    });
    removeButton.classList.add('remove-button');  // Add the class 'remove-button'

    // Create a container for the task text
    const taskTextContainer = document.createElement('div');
    taskTextContainer.className = 'task-text-container';

    // Create a span for the task text
    const taskTextElement = document.createElement('span');
    taskTextElement.textContent = taskText;

    // Append elements to the task item
    taskTextContainer.appendChild(taskTextElement);
    taskItem.appendChild(editButton);
    taskItem.appendChild(removeButton);
    taskItem.appendChild(taskTextContainer);

    return taskItem;
}

function saveTasks() {
    const tasksContainer = document.getElementById('tasks-container');
    const taskItems = Array.from(tasksContainer.children);
    const taskTexts = taskItems.map(item => item.lastElementChild.textContent);

    const blob = new Blob([taskTexts.join(', ')], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'tasks.txt';
    link.click();
}

// Function to create buttons dynamically
function createButton(text, clickHandler) {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', clickHandler);
    return button;
}

let tasksContainer = document.getElementById('tasks-container');

function uploadTasks() {
    const fileInput = document.getElementById('file-input');

    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const tasks = e.target.result.split(',').map(task => task.trim());

            // Clear existing tasks
            clearAllTasks();

            // Add uploaded tasks to the task container
            tasks.forEach(task => {
                const taskItem = createTaskItem(task);
                tasksContainer.appendChild(taskItem);
            });

            // Reset the file input to allow uploading the same file multiple times
            fileInput.value = '';
        };
        reader.readAsText(file);
    }
}

