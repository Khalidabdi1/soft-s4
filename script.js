// DOM elements 
const sidebarInput = document.querySelectorAll("#icon-e");
const searchOutput = document.querySelector(".search-output");
const searchWelcome = document.querySelector(".search-welcome");
const textInput = document.querySelector(".text-input");
const sendBtn = document.querySelector(".sand");
const resultMessage = document.querySelector(".result-message");
const cardsContainer = document.querySelector(".cards-container");
const searchTypeButtons = document.querySelectorAll(".search-type-btn");
const modalBody = document.getElementById("modalBody");
const favoritesList = document.querySelector(".favorites-list");
const noFavoritesMessage = document.querySelector(".no-favorites-message");

// Bootstrap modal
let professorModal;
document.addEventListener('DOMContentLoaded', function() {
  professorModal = new bootstrap.Modal(document.getElementById('professorModal'));
});

// Current search type (default: by name)
let currentSearchType = "name";

// Favorites array - will be stored in localStorage
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Handle sidebar navigation
sidebarInput[0].addEventListener("click", () => {
  document.querySelector(".Favorite-page").style.display = "none";
  document.querySelector(".Search-page").style.display = "block";
});

sidebarInput[1].addEventListener("click", () => {
  document.querySelector(".Favorite-page").style.display = "block";
  document.querySelector(".Search-page").style.display = "none";
  loadFavorites();
});

// Handle search type button selection
searchTypeButtons.forEach(button => {
  button.addEventListener("click", () => {
    // Remove active class from all buttons
    searchTypeButtons.forEach(btn => btn.classList.remove("active"));
    
    // Add active class to clicked button
    button.classList.add("active");
    
    // Update current search type
    currentSearchType = button.dataset.type;
    
    // Update placeholder based on search type
    if (currentSearchType === "name") {
      textInput.placeholder = "Search by professor name...";
    } else if (currentSearchType === "courseName") {
      textInput.placeholder = "Search by course name...";
    } else if (currentSearchType === "courseCode") {
      textInput.placeholder = "Search by course code (e.g., CS101)...";
    }
  });
});

// Search function
function performSearch(searchQuery) {
  if (!searchQuery.trim()) {
    showNoResultsMessage("Please enter a search term.");
    return;
  }
  
  // Show loading indicator
  cardsContainer.innerHTML = `
    <div class="search-loading">
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>Searching professors database...</p>
    </div>
  `;
  searchOutput.style.display = "block";
  searchWelcome.style.display = "none";
  resultMessage.textContent = "Searching...";
  
  fetch("data.json")
    .then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(data => {
      // Small delay to show the loading indicator (for demonstration)
      setTimeout(() => {
        // Filter data based on search type and query
        const searchQueryLower = searchQuery.toLowerCase();
        const results = data.filter(professor => {
          if (currentSearchType === "name") {
            return professor.name.toLowerCase().includes(searchQueryLower);
          } else if (currentSearchType === "courseName") {
            return professor.courseName.toLowerCase().includes(searchQueryLower);
          } else if (currentSearchType === "courseCode") {
            return professor.courseCode.toLowerCase().includes(searchQueryLower);
          }
          return false;
        });
        
        // Display results
        displayResults(results, searchQuery);
      }, 500); // Short delay for better UX
    })
    .catch(error => {
      console.error("Error fetching data:", error);
      showNoResultsMessage("An error occurred while searching. Please try again.");
    });
}

// Display search results
function displayResults(results, searchQuery) {
  // Clear previous results
  cardsContainer.innerHTML = "";
  
  // Show search output container
  searchOutput.style.display = "block";
  searchWelcome.style.display = "none";
  
  // Update result message
  if (results.length === 0) {
    showNoResultsMessage(`No results found for "${searchQuery}" in the selected category.`);
    return;
  }
  
  // Show success message
  resultMessage.textContent = `Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${searchQuery}"`;
  
  // Create cards for each result
  results.forEach(professor => {
    const card = createProfessorCard(professor);
    cardsContainer.appendChild(card);
  });
}

// Create professor card
function createProfessorCard(professor, isFavorite = false) {
  const card = document.createElement("div");
  card.className = "professor-card";
  card.dataset.id = professor.email; // Use email as unique identifier
  
  // Check if this professor is in favorites
  const isInFavorites = favorites.some(fav => fav.email === professor.email);
  
  card.innerHTML = `
    <button class="favorite-btn ${isInFavorites ? 'active' : ''}">
      ${isInFavorites ? '★' : '☆'}
    </button>
    <h3>${professor.name}</h3>
    <p><strong>Role:</strong> ${professor.role}</p>
    <p><strong>Department:</strong> ${professor.department}</p>
    <p><strong>Office:</strong> ${professor.office}</p>
    <button class="view-details-btn">View Details</button>
    ${isFavorite ? '<button class="remove-favorite-btn">Remove from Favorites</button>' : ''}
  `;
  
  // Add event listener to view details button
  const viewDetailsBtn = card.querySelector(".view-details-btn");
  viewDetailsBtn.addEventListener("click", () => {
    showProfessorDetails(professor);
  });
  
  // Add event listener to favorite button
  const favoriteBtn = card.querySelector(".favorite-btn");
  favoriteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(professor, favoriteBtn);
  });
  
  // Add event listener to remove button if it exists
  if (isFavorite) {
    const removeBtn = card.querySelector(".remove-favorite-btn");
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFavorite(professor.email);
    });
  }
  
  return card;
}

// Show professor details in modal
function showProfessorDetails(professor) {
  // Create availability HTML
  let availabilityHTML = '';
  professor.availability.forEach(slot => {
    availabilityHTML += `
      <div class="availability-item">
        <div><strong>${slot.day}</strong></div>
        <div>${slot.hours}</div>
      </div>
    `;
  });
  
  // Update modal content
  modalBody.innerHTML = `
    <div class="row">
      <div class="col-md-12 mb-3">
        <h4>${professor.name}</h4>
        <p class="text-muted">${professor.role} - ${professor.department}</p>
      </div>
    </div>
    
    <div class="row mb-3">
      <div class="col-md-6">
        <h5>Contact Information</h5>
        <p><strong>Office:</strong> ${professor.office}</p>
        <p><strong>Email:</strong> <span class="professor-email">${professor.email}</span></p>
      </div>
      <div class="col-md-6">
        <h5>Courses</h5>
        <p><strong>Course Name:</strong> ${professor.courseName}</p>
        <p><strong>Course Code:</strong> ${professor.courseCode}</p>
      </div>
    </div>
    
    <div class="row mb-3">
      <div class="col-md-12">
        <h5>Bio</h5>
        <p>${professor.bio}</p>
      </div>
    </div>
    
    <div class="row">
      <div class="col-md-12">
        <h5>Office Hours</h5>
        <div class="availability-container">
          ${availabilityHTML}
        </div>
      </div>
    </div>
  `;
  
  // Update modal title
  document.getElementById("professorModalLabel").textContent = `${professor.name} Details`;
  
  // Show modal
  professorModal.show();
}

// Show no results message
function showNoResultsMessage(message) {
  resultMessage.textContent = message;
  cardsContainer.innerHTML = "";
}

// Handle search submission
sendBtn.addEventListener("click", () => {
  const searchQuery = textInput.value.trim();
  performSearch(searchQuery);
});

// Handle Enter key press in search input
textInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    const searchQuery = textInput.value.trim();
    performSearch(searchQuery);
  }
});

// Toggle favorite status
function toggleFavorite(professor, button) {
  const index = favorites.findIndex(fav => fav.email === professor.email);
  
  if (index === -1) {
    // Add to favorites
    favorites.push(professor);
    button.textContent = '★';
    button.classList.add('active');
    showToast(`${professor.name} added to favorites!`);
  } else {
    // Remove from favorites
    favorites.splice(index, 1);
    button.textContent = '☆';
    button.classList.remove('active');
    showToast(`${professor.name} removed from favorites!`);
  }
  
  // Save to localStorage
  localStorage.setItem('favorites', JSON.stringify(favorites));
  
  // If we're on the favorites page, refresh it
  if (document.querySelector(".Favorite-page").style.display === "block") {
    loadFavorites();
  }
}

// Remove favorite item
function removeFavorite(email) {
  const index = favorites.findIndex(fav => fav.email === email);
  if (index !== -1) {
    const professorName = favorites[index].name;
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    loadFavorites();
    showToast(`${professorName} removed from favorites!`);
  }
}

// Load favorites into the favorites page
function loadFavorites() {
  // Clear current favorites list
  favoritesList.innerHTML = '';
  
  if (favorites.length === 0) {
    // Show no favorites message
    favoritesList.appendChild(noFavoritesMessage);
    return;
  }
  
  // Hide no favorites message
  if (noFavoritesMessage.parentNode === favoritesList) {
    favoritesList.removeChild(noFavoritesMessage);
  }
  
  // Create cards for each favorite
  favorites.forEach(professor => {
    const card = createProfessorCard(professor, true);
    favoritesList.appendChild(card);
  });
}

// Show a toast notification
function showToast(message) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  
  // Add toast to body
  document.body.appendChild(toast);
  
  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Initialize the first search type button as active
searchTypeButtons[0].classList.add("active");

// Add toast style to the document
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  .toast-notification {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 1000;
    transition: transform 0.3s ease;
    font-size: 16px;
  }
  
  .toast-notification.show {
    transform: translateX(-50%) translateY(0);
  }
`;
document.head.appendChild(toastStyle);
