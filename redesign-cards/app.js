document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Elements
  const themeToggleBtn = document.getElementById('btn-toggle-theme');
  
  // State Toggle Elements
  const stateToggleBtn = document.getElementById('btn-toggle-state');
  
  // Dialog Elements
  const taskDialog = document.getElementById('add-task-dialog');
  const noteDialog = document.getElementById('add-note-dialog');
  
  // Open Dialog Buttons
  const addTaskBtn = document.getElementById('add-task-btn');
  const addNoteBtn = document.getElementById('add-note-btn');
  
  // Cancel Buttons
  const cancelTaskBtn = document.getElementById('cancel-task-btn');
  const cancelNoteBtn = document.getElementById('cancel-note-btn');
  
  // Form Submission Elements
  const taskForm = document.getElementById('task-form');
  const noteForm = document.getElementById('note-form');
  
  // Container States
  const tasksEmptyState = document.getElementById('tasks-empty-state');
  const tasksListState = document.getElementById('tasks-list-state');
  const notesEmptyState = document.getElementById('notes-empty-state');
  const notesListState = document.getElementById('notes-list-state');

  // Local State
  let isDarkMode = false;
  let showDataState = false; // false = empty, true = showing items

  /* --- Theme Handler --- */
  themeToggleBtn.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      themeToggleBtn.textContent = '☀️ สลับ Light Mode';
    } else {
      document.body.classList.remove('dark-theme');
      themeToggleBtn.textContent = '🌓 สลับ Dark Mode';
    }
  });

  /* --- State Toggle Handler (Empty vs populated list state) --- */
  stateToggleBtn.addEventListener('click', () => {
    showDataState = !showDataState;
    updateUIStates();
  });

  function updateUIStates() {
    if (showDataState) {
      // Show Lists
      tasksEmptyState.hidden = true;
      tasksListState.hidden = false;
      notesEmptyState.hidden = true;
      notesListState.hidden = false;
    } else {
      // Show Empty States
      tasksEmptyState.hidden = false;
      tasksListState.hidden = true;
      notesEmptyState.hidden = false;
      notesListState.hidden = true;
    }
  }

  /* --- Dialog Event Handlers --- */
  // Open Task Dialog
  addTaskBtn.addEventListener('click', () => {
    taskDialog.showModal();
  });
  
  // Close Task Dialog
  cancelTaskBtn.addEventListener('click', () => {
    taskDialog.close();
  });

  // Open Note Dialog
  addNoteBtn.addEventListener('click', () => {
    noteDialog.showModal();
  });
  
  // Close Note Dialog
  cancelNoteBtn.addEventListener('click', () => {
    noteDialog.close();
  });

  /* --- Form Submissions --- */
  // Add Task
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskInput = document.getElementById('task-input');
    const taskText = taskInput.value.trim();
    
    if (taskText) {
      addTaskItem(taskText);
      taskInput.value = '';
      taskDialog.close();
      
      // Ensure we switch view state to show tasks list
      showDataState = true;
      updateUIStates();
      
      showToast('เพิ่มงานสำเร็จแล้ว! 🎉');
    }
  });

  // Add Note
  noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('note-title-input');
    const tagInput = document.getElementById('note-tag-input');
    const contentInput = document.getElementById('note-content-input');
    
    const title = titleInput.value.trim();
    const tag = tagInput.value;
    const content = contentInput.value.trim();
    
    if (title && content) {
      addNoteCard(title, tag, content);
      
      // Reset form fields
      titleInput.value = '';
      contentInput.value = '';
      noteDialog.close();
      
      // Ensure we switch view state to show notes list
      showDataState = true;
      updateUIStates();
      
      showToast('บันทึกข้อมูลเรียบร้อยแล้ว! 📝');
    }
  });

  /* --- List DOM Mutators --- */
  function addTaskItem(text) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'list-item';
    
    itemDiv.innerHTML = `
      <label class="checkbox-container">
        <input type="checkbox">
        <span class="checkmark"></span>
        <span class="item-text">${escapeHtml(text)}</span>
      </label>
      <button class="delete-btn" type="button" aria-label="ลบ">&times;</button>
    `;
    
    // Add delete event
    itemDiv.querySelector('.delete-btn').addEventListener('click', () => {
      itemDiv.remove();
      checkIfListsEmpty();
    });
    
    // Append to tasks container
    tasksListState.appendChild(itemDiv);
  }

  function addNoteCard(title, tag, content) {
    const noteCard = document.createElement('div');
    noteCard.className = 'note-card';
    
    const currentDateString = getFormattedDate();
    const tagClassSuffix = tag === 'การเติบโต' ? ' note-card__tag--growth' : '';
    
    noteCard.innerHTML = `
      <div class="note-card__meta">
        <span class="note-card__tag${tagClassSuffix}">${escapeHtml(tag)}</span>
        <span class="note-card__date">${currentDateString}</span>
      </div>
      <h3 class="note-card__title">${escapeHtml(title)}</h3>
      <p class="note-card__snippet">${escapeHtml(content)}</p>
    `;
    
    // Insert at beginning of notes list
    notesListState.insertBefore(noteCard, notesListState.firstChild);
  }

  function checkIfListsEmpty() {
    if (tasksListState.children.length === 0) {
      tasksEmptyState.hidden = false;
      tasksListState.hidden = true;
    }
  }

  /* --- Helper Functions --- */
  function escapeHtml(string) {
    return String(string).replace(/[&<>"']/g, function (s) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[s];
    });
  }

  function getFormattedDate() {
    const today = new Date();
    const day = today.getDate();
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const month = months[today.getMonth()];
    const year = today.getFullYear() + 543; // Buddhist Era Conversion
    return `${day} ${month} ${year}`;
  }

  // Beautiful simple toast function for actions confirmation
  function showToast(message) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    toast.style.backgroundColor = 'var(--primary)';
    toast.style.color = 'var(--text-on-primary)';
    toast.style.padding = '0.8rem 1.5rem';
    toast.style.borderRadius = '30px';
    toast.style.fontSize = '0.95rem';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 10px 25px rgba(5, 104, 57, 0.2)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
    toast.style.zIndex = '9999';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Force reflow
    toast.offsetHeight;
    
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
    
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // Set up event listeners for delete buttons in the initial HTML structure
  document.querySelectorAll('.items-list .delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      btn.closest('.list-item').remove();
      checkIfListsEmpty();
    });
  });
});
