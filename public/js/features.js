// GitHub Repository Analyzer - Additional Features

// Initialize features
document.addEventListener('DOMContentLoaded', () => {
  // Initialize compare repo functionality
  const compareForm = document.getElementById('compareForm');
  if (compareForm) {
    compareForm.addEventListener('submit', handleCompareFormSubmit);
  }
  
  // Initialize add repo button
  const addRepoBtn = document.getElementById('addRepoBtn');
  if (addRepoBtn) {
    addRepoBtn.addEventListener('click', addRepoInput);
  }
  
  // Initialize my repos button
  const myReposBtn = document.getElementById('myReposBtn');
  if (myReposBtn) {
    myReposBtn.addEventListener('click', loadUserRepos);
  }
  
  // Initialize benchmarks
  initializeBenchmarks();
});

// Initialize benchmark gauges
function initializeBenchmarks() {
  const benchmarkSection = document.getElementById('benchmarkSection');
  if (benchmarkSection) {
    // Initialize empty benchmark charts (they'll be populated later)
    createBenchmarkBarChart('starsBenchmark', 'Stars Percentile', 0);
    createBenchmarkBarChart('issueResolutionBenchmark', 'Issue Resolution', 0);
    createBenchmarkBarChart('commitFrequencyBenchmark', 'Commit Frequency', 0);
    createBenchmarkBarChart('popularityBenchmark', 'Overall Popularity', 0);
  }
}

// Create a benchmark bar chart
function createBenchmarkBarChart(elementId, label, value) {
  const canvas = document.getElementById(elementId);
  if (!canvas) return null;
  
  // Destroy existing chart if it exists
  if (window[elementId] && typeof window[elementId].destroy === 'function') {
    window[elementId].destroy();
  } else if (Chart.getChart(canvas)) {
    Chart.getChart(canvas).destroy();
  }
  
  // Ensure value is between 0 and 100
  const safeValue = Math.max(0, Math.min(100, value));
  
  // Determine color based on value
  let barColor;
  if (safeValue < 30) {
    barColor = '#da3633'; // Red for low values
  } else if (safeValue < 70) {
    barColor = '#d29922'; // Yellow for medium values
  } else {
    barColor = '#238636'; // Green for high values
  }
  
  // Create horizontal bar chart
  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: [label],
      datasets: [{
        label: '',
        data: [safeValue],
        backgroundColor: barColor,
        borderColor: adjustColor(barColor, -20),
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 20
      }]
    },
    options: {
      indexAxis: 'y', // Horizontal bar
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.raw}%`;
            }
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: {
            color: '#30363d',
            drawTicks: false
          },
          ticks: {
            color: '#8b949e',
            callback: function(value) {
              return value + '%';
            }
          }
        },
        y: {
          display: false
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeOutQuart'
      }
    }
  });
  
  // Add score display to parent container
  const wrapper = canvas.closest('.benchmark-bar-wrapper');
  if (wrapper) {
    const scoreClass = safeValue < 30 ? 'score-low' : safeValue < 70 ? 'score-medium' : 'score-high';
    
    // Remove existing score display if any
    const existingScore = wrapper.querySelector('.score-display');
    if (existingScore) {
      existingScore.remove();
    }
    
    // Add new score display
    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = `score-display ${scoreClass}`;
    scoreDisplay.textContent = `${Math.round(safeValue)}%`;
    wrapper.appendChild(scoreDisplay);
  }
  
  // Store chart reference in window object
  window[elementId] = chart;
  
  return chart;
}

// Add new repository input field
function addRepoInput() {
  const repoInputs = document.querySelector('.repo-inputs');
  const inputCount = repoInputs.children.length;
  
  // Maximum of 5 repositories
  if (inputCount >= 5) {
    return;
  }
  
  const newInput = document.createElement('div');
  newInput.className = 'input-group mb-2';
  newInput.innerHTML = `
    <span class="input-group-text"><i class="fab fa-github"></i></span>
    <input type="text" class="form-control repo-url" placeholder="https://github.com/username/repository${inputCount + 1}" required>
    <button type="button" class="btn btn-outline-danger remove-repo">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add delete functionality
  newInput.querySelector('.remove-repo').addEventListener('click', function() {
    repoInputs.removeChild(newInput);
  });
  
  repoInputs.appendChild(newInput);
}

// Load user's GitHub repositories
async function loadUserRepos() {
  // Show modal
  const userReposModal = document.getElementById('userReposModal');
  const userReposLoading = document.getElementById('userReposLoading');
  const userReposError = document.getElementById('userReposError');
  const userReposList = document.getElementById('userReposList');
  
  const modal = new bootstrap.Modal(userReposModal);
  modal.show();
  
  // Show loading state
  userReposLoading.classList.remove('d-none');
  userReposError.classList.add('d-none');
  userReposList.classList.add('d-none');
  userReposList.innerHTML = '';
  
  try {
    const response = await fetch('/my-repos');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch repositories');
    }
    
    // Handle empty repositories
    if (!data.repos || data.repos.length === 0) {
      throw new Error('No repositories found');
    }
    
    // Display repositories
    data.repos.forEach(repo => {
      const repoItem = document.createElement('a');
      repoItem.href = '#';
      repoItem.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
      repoItem.innerHTML = `
        <div>
          <h6 class="mb-1">${repo.name}</h6>
          <small class="text-muted">${repo.description || 'No description'}</small>
        </div>
        <span class="badge bg-primary rounded-pill">★ ${repo.stars}</span>
      `;
      
      // Add click event to select repo
      repoItem.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Check active tab
        const activeTab = document.querySelector('#analyzerTabs .nav-link.active');
        if (activeTab.id === 'single-tab') {
          // Set value in single repo form
          document.getElementById('repoUrl').value = repo.url;
        } else {
          // Set value in the first empty input in comparison form
          const emptyInputs = Array.from(document.querySelectorAll('.repo-url:not([value])'));
          if (emptyInputs.length > 0) {
            emptyInputs[0].value = repo.url;
          } else {
            // If all inputs have values, add a new one if possible
            if (document.querySelectorAll('.repo-url').length < 5) {
              addRepoInput();
              document.querySelector('.repo-url:last-child').value = repo.url;
            }
          }
        }
        
        // Close modal
        modal.hide();
      });
      
      userReposList.appendChild(repoItem);
    });
    
    // Show repos list
    userReposList.classList.remove('d-none');
    
  } catch (error) {
    // Show error
    userReposError.textContent = error.message || 'Failed to load repositories';
    userReposError.classList.remove('d-none');
    console.error('Error loading user repos:', error);
  } finally {
    // Hide loading indicator
    userReposLoading.classList.add('d-none');
  }
}

// Handle repository comparison form submission
async function handleCompareFormSubmit(event) {
  event.preventDefault();
  
  // Get repository URLs from inputs
  const repoUrls = Array.from(document.querySelectorAll('.repo-url'))
    .map(input => input.value.trim())
    .filter(url => url !== '');
  
  // Validate inputs
  if (repoUrls.length < 2) {
    showError('Please enter at least 2 GitHub repository URLs for comparison');
    return;
  }
  
  // Validate URL format
  const invalidUrls = repoUrls.filter(url => !validateRepoUrl(url));
  if (invalidUrls.length > 0) {
    showError(`Invalid GitHub repository URL format: ${invalidUrls.join(', ')}`);
    return;
  }
  
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMessage = document.getElementById('errorMessage');
  const resultsContainer = document.getElementById('results');
  const comparisonResultsContainer = document.getElementById('comparisonResults');
  
  // Show loading and hide results
  loadingIndicator.classList.remove('d-none');
  errorMessage.classList.add('d-none');
  resultsContainer.classList.add('d-none');
  comparisonResultsContainer.classList.add('d-none');
  
  try {
    const response = await fetch('/compare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ repos: repoUrls }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to compare repositories');
    }
    
    displayComparisonResults(data);
  } catch (error) {
    // Show error
    errorMessage.textContent = error.message || 'An error occurred while comparing repositories';
    errorMessage.classList.remove('d-none');
    console.error('Error details:', error);
  } finally {
    // Hide loading indicator
    loadingIndicator.classList.add('d-none');
  }
}

// Validate GitHub repository URL format
function validateRepoUrl(url) {
  const githubUrlPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/?$/;
  return githubUrlPattern.test(url);
}

// Display repository comparison results
function displayComparisonResults(data) {
  const { repos, benchmarks } = data;
  const comparisonResultsContainer = document.getElementById('comparisonResults');
  
  // Populate comparison table
  populateComparisonTable(repos);
  
  // Create comparison charts
  createComparisonCharts(repos);
  
  // Create language distribution charts
  createLanguageComparisonCharts(repos);
  
  // Generate findings and recommendations
  generateFindings(repos, benchmarks);
  
  // Show comparison results
  comparisonResultsContainer.classList.remove('d-none');
  comparisonResultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Populate comparison table with repo data
function populateComparisonTable(repos) {
  const tableBody = document.querySelector('#comparisonTable tbody');
  tableBody.innerHTML = '';
  
  repos.forEach(repo => {
    const row = document.createElement('tr');
    
    const scoreClass = repo.healthScore >= 70 ? 'text-success' : 
                     repo.healthScore >= 50 ? 'text-warning' : 'text-danger';
    
    row.innerHTML = `
      <td><strong>${repo.fullName}</strong></td>
      <td>${formatNumber(repo.stars)}</td>
      <td>${formatNumber(repo.forks)}</td>
      <td>${formatNumber(repo.issues)}</td>
      <td><span class="badge bg-secondary">${repo.language || 'N/A'}</span></td>
      <td class="${scoreClass} fw-bold">${repo.healthScore}%</td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Create comparison charts
function createComparisonCharts(repos) {
  // Stars comparison chart
  createComparisonChart('starsComparisonChart', 'Stars', repos, 'stars', 'star');
  
  // Forks comparison chart
  createComparisonChart('forksComparisonChart', 'Forks', repos, 'forks', 'git-branch');
  
  // Issues comparison chart
  createComparisonChart('issuesComparisonChart', 'Open Issues', repos, 'issues', 'exclamation-circle');
  
  // Health score comparison chart
  createComparisonChart('healthComparisonChart', 'Health Score', repos, 'healthScore', 'heartbeat');
}

// Create a comparison bar chart
function createComparisonChart(canvasId, label, repos, dataKey, icon) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  // Destroy existing chart properly
  if (window[canvasId] && typeof window[canvasId].destroy === 'function') {
    window[canvasId].destroy();
  } else if (Chart.getChart(canvas)) {
    Chart.getChart(canvas).destroy();
  }
  
  const repoNames = repos.map(repo => repo.name);
  const repoValues = repos.map(repo => repo[dataKey]);
  
  // Create color array based on values
  const colors = repos.map(repo => {
    const value = repo[dataKey];
    
    // For health score, use green-yellow-red gradient
    if (dataKey === 'healthScore') {
      return value >= 70 ? '#238636' : value >= 50 ? '#d29922' : '#da3633';
    }
    
    // For other metrics, use a blue gradient
    return '#1f6feb';
  });
  
  window[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: repoNames,
      datasets: [{
        label,
        data: repoValues,
        backgroundColor: colors,
        borderColor: colors.map(color => adjustColor(color, -20)),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: label,
          color: '#c9d1d9',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#30363d'
          },
          ticks: {
            color: '#8b949e'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#8b949e'
          }
        }
      }
    }
  });
}

// Create language distribution comparison charts
function createLanguageComparisonCharts(repos) {
  const container = document.getElementById('languageComparisonCharts');
  if (!container) return;
  
  // Clear existing charts
  container.innerHTML = '';
  
  // Create a chart for each repo
  repos.forEach((repo, index) => {
    const colDiv = document.createElement('div');
    colDiv.className = 'col-md-6 mb-4';
    
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card repo-comparison-card';
    
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    cardHeader.innerHTML = `
      <i class="fas fa-code repo-icon"></i>
      <span>${repo.name}</span>
    `;
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    const canvas = document.createElement('canvas');
    canvas.id = `languageChart${index}`;
    
    cardBody.appendChild(canvas);
    cardDiv.appendChild(cardHeader);
    cardDiv.appendChild(cardBody);
    colDiv.appendChild(cardDiv);
    container.appendChild(colDiv);
    
    // Create language chart
    createLanguageChart(canvas.id, repo);
  });
}

// Create language chart for a repo
function createLanguageChart(canvasId, repo) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !repo.languageStats) return;
  
  // Destroy existing chart properly
  if (window[canvasId] && typeof window[canvasId].destroy === 'function') {
    window[canvasId].destroy();
  } else if (Chart.getChart(canvas)) {
    Chart.getChart(canvas).destroy();
  }
  
  const languages = Object.keys(repo.languageStats);
  const percentages = Object.values(repo.languageStats);
  
  // Generate colors
  const colors = languages.map((language, index) => {
    return getLanguageColor(language) || getRandomColor();
  });
  
  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: languages,
      datasets: [{
        data: percentages,
        backgroundColor: colors,
        borderColor: '#161b22',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#c9d1d9',
            font: {
              size: 12
            }
          }
        }
      }
    }
  });
  
  // Store chart instance in window for later reference
  window[canvasId] = chart;
}

// Generate findings and recommendations based on comparison
function generateFindings(repos, benchmarks) {
  const findingsContainer = document.getElementById('findingsList');
  if (!findingsContainer) return;
  
  findingsContainer.innerHTML = '';
  
  // Find the best repo (highest health score)
  const bestRepo = repos.sort((a, b) => b.healthScore - a.healthScore)[0];
  
  // Find the most popular repo (most stars)
  const mostPopular = repos.sort((a, b) => b.stars - a.stars)[0];
  
  // Find the most actively maintained repo (newest update)
  const mostActive = repos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
  
  // Add findings
  addFinding(
    findingsContainer,
    'good',
    'Best Overall Repository',
    `${bestRepo.fullName} has the highest health score (${bestRepo.healthScore}%) among the compared repositories.`
  );
  
  addFinding(
    findingsContainer,
    'good',
    'Most Popular Repository',
    `${mostPopular.fullName} is the most popular with ${formatNumber(mostPopular.stars)} stars.`
  );
  
  addFinding(
    findingsContainer,
    'good',
    'Most Recently Updated',
    `${mostActive.fullName} was most recently updated on ${new Date(mostActive.updatedAt).toLocaleDateString()}.`
  );
  
  // Add recommendation for improvement
  const lowestHealth = repos.sort((a, b) => a.healthScore - b.healthScore)[0];
  if (lowestHealth.healthScore < 50) {
    addFinding(
      findingsContainer,
      'warning',
      'Needs Improvement',
      `${lowestHealth.fullName} has a low health score (${lowestHealth.healthScore}%). Consider adding documentation, resolving issues, and maintaining regular updates.`
    );
  }
  
  // Add industry benchmark comparison
  addFinding(
    findingsContainer,
    benchmarks.averageStars > 100 ? 'good' : 'warning',
    'Popularity Benchmark',
    `The average star count across these repositories (${Math.round(benchmarks.averageStars)}) is ${benchmarks.averageStars > 100 ? 'above' : 'below'} typical projects in this domain.`
  );
}

// Add a finding to the findings list
function addFinding(container, type, title, description) {
  const item = document.createElement('div');
  item.className = `list-group-item finding-${type}`;
  
  item.innerHTML = `
    <div class="finding-title">
      <i class="fas fa-${type === 'good' ? 'check-circle text-success' : type === 'warning' ? 'exclamation-triangle text-warning' : 'times-circle text-danger'}"></i>
      ${title}
    </div>
    <p class="mb-0">${description}</p>
  `;
  
  container.appendChild(item);
}

// Function to show error message
function showError(message) {
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.textContent = message;
  errorMessage.classList.remove('d-none');
}

// Update benchmark charts with repo data
function updateBenchmarks(repoData, insights) {
  if (!repoData || typeof repoData !== 'object') {
    console.warn('Invalid repo data for benchmarks');
    return;
  }
  
  // Stars benchmark: logarithmic scale up to 10k stars = 100%
  const stars = Math.min(1000000, Math.max(0, repoData.stars || 0));
  const starScore = Math.min(100, Math.log10(stars + 1) * 33);
  
  // Issue resolution time benchmark: <2 days = 100%, 30+ days = 0%
  const resolutionTime = Math.max(0, insights.avgResolutionTime || 15); 
  const resolutionScore = Math.min(100, Math.max(0, 100 - (resolutionTime / 30) * 100));
  
  // Commit frequency benchmark: >100 per month = 100%
  let commitFreq = 30; // Default value
  if (insights.commitActivity && insights.commitActivity.length > 0) {
    commitFreq = Math.max(0, insights.commitActivity[insights.commitActivity.length - 1].count || 30);
  }
  const commitScore = Math.min(100, Math.max(0, (commitFreq / 100) * 100));
  
  // Overall popularity: combination of stars, forks and watchers
  const forks = Math.max(0, repoData.forks || 0);
  const watchers = Math.max(0, repoData.watchers || 0);
  
  const popularityScore = Math.min(100,
    ((Math.log10(stars + 1) * 0.6) +
     (Math.log10(forks + 1) * 0.3) +
     (Math.log10(watchers + 1) * 0.1)) * 15);
  
  // Update benchmark charts with a slight staggered delay
  setTimeout(() => createBenchmarkBarChart('starsBenchmark', 'Stars Percentile', Math.min(95, starScore)), 0);
  setTimeout(() => createBenchmarkBarChart('issueResolutionBenchmark', 'Issue Resolution', Math.min(95, resolutionScore)), 300);
  setTimeout(() => createBenchmarkBarChart('commitFrequencyBenchmark', 'Commit Frequency', Math.min(95, commitScore)), 600);
  setTimeout(() => createBenchmarkBarChart('popularityBenchmark', 'Overall Popularity', Math.min(95, popularityScore)), 900);
  
  // Log benchmark values for debugging
  console.log('Benchmarks:', {
    stars: Math.round(starScore),
    resolution: Math.round(resolutionScore),
    commits: Math.round(commitScore),
    popularity: Math.round(popularityScore)
  });
}

// Get color for a programming language
function getLanguageColor(language) {
  const colors = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#2b7489',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Python': '#3572A5',
    'Java': '#b07219',
    'Ruby': '#701516',
    'PHP': '#4F5D95',
    'C#': '#178600',
    'C++': '#f34b7d',
    'C': '#555555',
    'Go': '#00ADD8',
    'Swift': '#ffac45',
    'Kotlin': '#F18E33',
    'Rust': '#dea584'
  };
  
  return colors[language];
}

// Adjust color brightness
function adjustColor(color, amount) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => 
    ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2)
  );
}

// Helper function to format numbers (reused from app.js)
function formatNumber(num) {
  return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num;
}

// Helper function to get random color (reused from app.js)
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
} 