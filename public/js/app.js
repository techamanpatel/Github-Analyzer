// GitHub Repository Analyzer - Main Application JavaScript

// DOM Elements
const repoForm = document.getElementById('repoForm');
const compareForm = document.getElementById('compareForm');
const repoUrlInput = document.getElementById('repoUrl');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const resultsContainer = document.getElementById('results');
const comparisonResultsContainer = document.getElementById('comparisonResults');
const addRepoBtn = document.getElementById('addRepoBtn');
const myReposBtn = document.getElementById('myReposBtn');
const userReposModal = document.getElementById('userReposModal');
const userReposLoading = document.getElementById('userReposLoading');
const userReposError = document.getElementById('userReposError');
const userReposList = document.getElementById('userReposList');

// Chart instances
let contributorsChart = null;
let issuesChart = null;
let pullRequestsChart = null;
let commitFrequencyChart = null;
let languageDistributionChart = null;
let issueCategoryChart = null;
let starsComparisonChart = null;
let forksComparisonChart = null;
let issuesComparisonChart = null;
let healthComparisonChart = null;
let languageComparisonCharts = [];

// Benchmark gauge instances
let starsBenchmark = null;
let issueResolutionBenchmark = null;
let commitFrequencyBenchmark = null;
let popularityBenchmark = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  repoForm.addEventListener('submit', handleFormSubmit);
  
  // Initialize compare repo functionality
  if (compareForm) {
    compareForm.addEventListener('submit', handleCompareFormSubmit);
  }
  
  // Initialize add repo button
  if (addRepoBtn) {
    addRepoBtn.addEventListener('click', addRepoInput);
  }
  
  // Initialize my repos button
  if (myReposBtn) {
    myReposBtn.addEventListener('click', loadUserRepos);
  }
  
  // Initialize benchmarks if elements exist
  initializeBenchmarks();
});

// Initialize benchmark gauges
function initializeBenchmarks() {
  const benchmarkSection = document.getElementById('benchmarkSection');
  if (benchmarkSection) {
    const starsBenchmarkEl = document.getElementById('starsBenchmark');
    const issueResolutionBenchmarkEl = document.getElementById('issueResolutionBenchmark');
    const commitFrequencyBenchmarkEl = document.getElementById('commitFrequencyBenchmark');
    const popularityBenchmarkEl = document.getElementById('popularityBenchmark');
    
    if (starsBenchmarkEl) {
      createBenchmarkGauge(starsBenchmarkEl);
    }
    
    if (issueResolutionBenchmarkEl) {
      createBenchmarkGauge(issueResolutionBenchmarkEl);
    }
    
    if (commitFrequencyBenchmarkEl) {
      createBenchmarkGauge(commitFrequencyBenchmarkEl);
    }
    
    if (popularityBenchmarkEl) {
      createBenchmarkGauge(popularityBenchmarkEl);
    }
  }
}

// Create benchmark gauge
function createBenchmarkGauge(element) {
  // Create needle element
  const needle = document.createElement('div');
  needle.className = 'needle';
  element.appendChild(needle);
  
  // Set initial data-value
  element.setAttribute('data-value', '0');
  
  return {
    element,
    needle,
    setValue(value) {
      // Ensure value is between 0 and 100
      const safeValue = Math.max(0, Math.min(100, value));
      
      // Calculate needle rotation (0-180 degrees)
      const rotation = (safeValue * 180) / 100;
      
      // Update needle position
      needle.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
      
      // Update data-value attribute
      element.setAttribute('data-value', Math.round(safeValue));
      
      return this;
    }
  };
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
  
  showLoading();
  clearError();
  hideResults();
  hideComparisonResults();
  
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
    showError(error.message || 'An error occurred while comparing repositories');
    console.error('Error details:', error);
  } finally {
    hideLoading();
  }
}

// Display repository comparison results
function displayComparisonResults(data) {
  const { repos, benchmarks } = data;
  
  // Populate comparison table
  populateComparisonTable(repos);
  
  // Create comparison charts
  createComparisonCharts(repos);
  
  // Create language distribution charts
  createLanguageComparisonCharts(repos);
  
  // Generate findings and recommendations
  generateFindings(repos, benchmarks);
  
  // Show comparison results
  showComparisonResults();
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
  
  // Destroy existing chart
  if (window[canvasId]) {
    window[canvasId].destroy();
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
  languageComparisonCharts.forEach(chart => chart.destroy());
  languageComparisonCharts = [];
  
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
  
  languageComparisonCharts.push(chart);
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

// Show comparison results
function showComparisonResults() {
  comparisonResultsContainer.classList.remove('d-none');
  comparisonResultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Hide comparison results
function hideComparisonResults() {
  comparisonResultsContainer.classList.add('d-none');
}

// Update benchmark gauges with repo data
function updateBenchmarks(repoData, insights) {
  // Create gauge instances if they don't exist
  if (!starsBenchmark) {
    const starsBenchmarkEl = document.getElementById('starsBenchmark');
    if (starsBenchmarkEl) {
      starsBenchmark = createBenchmarkGauge(starsBenchmarkEl);
    }
  }
  
  if (!issueResolutionBenchmark) {
    const issueResolutionBenchmarkEl = document.getElementById('issueResolutionBenchmark');
    if (issueResolutionBenchmarkEl) {
      issueResolutionBenchmark = createBenchmarkGauge(issueResolutionBenchmarkEl);
    }
  }
  
  if (!commitFrequencyBenchmark) {
    const commitFrequencyBenchmarkEl = document.getElementById('commitFrequencyBenchmark');
    if (commitFrequencyBenchmarkEl) {
      commitFrequencyBenchmark = createBenchmarkGauge(commitFrequencyBenchmarkEl);
    }
  }
  
  if (!popularityBenchmark) {
    const popularityBenchmarkEl = document.getElementById('popularityBenchmark');
    if (popularityBenchmarkEl) {
      popularityBenchmark = createBenchmarkGauge(popularityBenchmarkEl);
    }
  }
  
  // Calculate benchmark values
  
  // Stars benchmark: logarithmic scale up to 10k stars = 100%
  const starScore = Math.min(100, Math.log10(repoData.stars + 1) * 33);
  
  // Issue resolution time benchmark: <2 days = 100%, 30+ days = 0%
  const resolutionScore = 100 - Math.min(100, (insights.avgResolutionTime / 30) * 100);
  
  // Commit frequency benchmark: >100 per month = 100%
  const commitFreq = insights.commitActivity ? 
    insights.commitActivity[insights.commitActivity.length - 1].count : 30;
  const commitScore = Math.min(100, (commitFreq / 100) * 100);
  
  // Overall popularity: combination of stars, forks and watchers
  const popularityScore = Math.min(100, 
    ((Math.log10(repoData.stars + 1) * 0.6) + 
     (Math.log10(repoData.forks + 1) * 0.3) + 
     (Math.log10(repoData.watchers + 1) * 0.1)) * 15);
  
  // Update gauge values
  if (starsBenchmark) starsBenchmark.setValue(starScore);
  if (issueResolutionBenchmark) issueResolutionBenchmark.setValue(resolutionScore);
  if (commitFrequencyBenchmark) commitFrequencyBenchmark.setValue(commitScore);
  if (popularityBenchmark) popularityBenchmark.setValue(popularityScore);
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

// Handle form submission
async function handleFormSubmit(event) {
  event.preventDefault();
  
  const repoUrl = repoUrlInput.value.trim();
  if (!validateRepoUrl(repoUrl)) {
    showError('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repository)');
    return;
  }
  
  showLoading();
  clearError();
  hideResults();
  hideComparisonResults();
  
  try {
    const response = await fetch('/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ repoUrl }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      let errorMessage = data.message || 'Failed to analyze repository';
      if (data.error) {
        errorMessage += `. ${data.error}`;
      }
      throw new Error(errorMessage);
    }
    
    displayResults(data);
  } catch (error) {
    let errorMessage = error.message || 'An error occurred while analyzing the repository';
    
    // If it's a network error, provide more helpful message
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    }
    
    showError(errorMessage);
    
    console.error('Error details:', error);
  } finally {
    hideLoading();
  }
}

// Main function to display analysis results
function displayResults(data) {
  const { repoData, contributors, issues, pullRequests, insights, mockDataMessage } = data;
  
  // Display basic repository info
  displayRepoInfo(repoData);
  
  // Display health score
  displayHealthScore(insights.healthScore);
  
  // Display contributors
  displayContributors(insights.mostActiveContributors);
  
  // Display issue resolution time
  displayResolutionTime(insights.avgResolutionTime);
  
  // Display PR frequency
  displayPRFrequency(insights.prFrequency);
  
  // Display code complexity indicators (new)
  displayCodeComplexity(insights.codeComplexity || generateMockCodeComplexity());
  
  // Display commit activity over time (new)
  displayCommitActivity(insights.commitActivity || generateMockCommitActivity());
  
  // Display issue categories (new)
  displayIssueCategories(insights.issueCategories || generateMockIssueCategories(issues));
  
  // Create visualization charts
  createContributorsChart(insights.mostActiveContributors);
  createIssuesChart(insights.issuesByMonth);
  createPullRequestsChart(pullRequests);
  
  // Create new charts
  createCommitFrequencyChart(insights.commitActivity || generateMockCommitActivity());
  createLanguageDistributionChart(insights.languageStats || generateMockLanguageStats(repoData.language));
  createIssueCategoryChart(insights.issueCategories || generateMockIssueCategories(issues));
  
  // Update benchmark gauges if the function exists
  if (typeof window.updateBenchmarks === 'function') {
    try {
      window.updateBenchmarks(repoData, insights);
    } catch (error) {
      console.error('Error updating benchmarks:', error);
    }
  } else {
    // Dispatch an event that features.js can listen for
    document.dispatchEvent(new CustomEvent('repoAnalysisComplete', {
      detail: { repoData, insights }
    }));
  }
  
  // Display mock data message if provided
  if (mockDataMessage) {
    displayMockDataMessage(mockDataMessage);
  }
  
  // Show the results container
  showResults();
}

// Display UI elements functions
function showLoading() {
  loadingIndicator.classList.remove('d-none');
}

function hideLoading() {
  loadingIndicator.classList.add('d-none');
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('d-none');
}

function clearError() {
  errorMessage.textContent = '';
  errorMessage.classList.add('d-none');
}

function hideResults() {
  resultsContainer.classList.add('d-none');
}

function showResults() {
  resultsContainer.classList.remove('d-none');
  
  // Scroll to results
  resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

function displayRepoInfo(repoData) {
  document.getElementById('repoName').textContent = repoData.name;
  document.getElementById('repoDescription').textContent = repoData.description || 'No description provided';
  document.getElementById('repoLanguage').textContent = repoData.language || 'Unknown';
  document.getElementById('repoStars').textContent = formatNumber(repoData.stars);
  document.getElementById('repoForks').textContent = formatNumber(repoData.forks);
  document.getElementById('repoIssues').textContent = formatNumber(repoData.openIssues);
  document.getElementById('repoWatchers').textContent = formatNumber(repoData.watchers);
}

function displayHealthScore(score) {
  const healthScoreElement = document.getElementById('healthScore');
  const roundedScore = Math.round(score);
  
  // Update progress bar
  healthScoreElement.style.width = `${roundedScore}%`;
  healthScoreElement.setAttribute('aria-valuenow', roundedScore);
  healthScoreElement.textContent = `${roundedScore}% Health Score`;
  
  // Set color based on score
  if (roundedScore >= 70) {
    healthScoreElement.classList.add('bg-success');
    healthScoreElement.classList.remove('bg-warning', 'bg-danger');
  } else if (roundedScore >= 40) {
    healthScoreElement.classList.add('bg-warning');
    healthScoreElement.classList.remove('bg-success', 'bg-danger');
  } else {
    healthScoreElement.classList.add('bg-danger');
    healthScoreElement.classList.remove('bg-success', 'bg-warning');
  }
}

// NEW FUNCTION: Display code complexity metrics
function displayCodeComplexity(complexity) {
  // Create elements if they don't exist
  if (!document.getElementById('codeComplexitySection')) {
    const complexitySection = document.createElement('div');
    complexitySection.id = 'codeComplexitySection';
    complexitySection.className = 'card mb-4 shadow-sm';
    complexitySection.innerHTML = `
      <div class="card-header bg-secondary text-white">
        <h3 class="card-title h5 mb-0">Code Complexity Analysis</h3>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <div class="list-group">
              <div class="list-group-item d-flex justify-content-between align-items-center">
                Total Lines of Code
                <span id="totalLOC" class="badge bg-primary rounded-pill"></span>
              </div>
              <div class="list-group-item d-flex justify-content-between align-items-center">
                Average File Size
                <span id="avgFileLOC" class="badge bg-primary rounded-pill"></span>
              </div>
              <div class="list-group-item d-flex justify-content-between align-items-center">
                Largest File
                <span id="maxFileLOC" class="badge bg-primary rounded-pill"></span>
              </div>
              <div class="list-group-item d-flex justify-content-between align-items-center">
                Cyclomatic Complexity
                <span id="cyclomaticComplexity" class="badge bg-primary rounded-pill"></span>
              </div>
              <div class="list-group-item d-flex justify-content-between align-items-center">
                Comment Ratio
                <span id="commentRatio" class="badge bg-primary rounded-pill"></span>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="chart-container">
              <canvas id="languageDistributionChart" width="100%" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Insert before the Issues Trends section
    const issuesTrendsSection = document.querySelector('.card-header.bg-info').closest('.card');
    issuesTrendsSection.parentNode.insertBefore(complexitySection, issuesTrendsSection);
  }
  
  // Update complexity metrics
  document.getElementById('totalLOC').textContent = formatNumber(complexity.totalLOC) + ' lines';
  document.getElementById('avgFileLOC').textContent = formatNumber(complexity.averageFileLOC) + ' lines';
  document.getElementById('maxFileLOC').textContent = formatNumber(complexity.maxFileLOC) + ' lines';
  document.getElementById('cyclomaticComplexity').textContent = complexity.cyclomaticComplexity;
  document.getElementById('commentRatio').textContent = (complexity.commentRatio * 100).toFixed(0) + '%';
}

// NEW FUNCTION: Display commit activity
function displayCommitActivity(activity) {
  // Create elements if they don't exist
  if (!document.getElementById('commitActivitySection')) {
    const activitySection = document.createElement('div');
    activitySection.id = 'commitActivitySection';
    activitySection.className = 'card mb-4 shadow-sm';
    activitySection.innerHTML = `
      <div class="card-header bg-dark text-white">
        <h3 class="card-title h5 mb-0">Commit Activity</h3>
      </div>
      <div class="card-body">
        <canvas id="commitFrequencyChart" width="100%" height="250"></canvas>
      </div>
    `;
    
    // Insert before the Issues Trends section
    const issuesTrendsSection = document.querySelector('.card-header.bg-info').closest('.card');
    issuesTrendsSection.parentNode.insertBefore(activitySection, issuesTrendsSection);
  }
}

// NEW FUNCTION: Display issue categories
function displayIssueCategories(categories) {
  // Create elements if they don't exist
  if (!document.getElementById('issueCategoriesSection')) {
    const categoriesSection = document.createElement('div');
    categoriesSection.id = 'issueCategoriesSection';
    categoriesSection.className = 'card mb-4 shadow-sm';
    categoriesSection.innerHTML = `
      <div class="card-header bg-purple text-white" style="background-color: #6f42c1;">
        <h3 class="card-title h5 mb-0">Issue Categories</h3>
      </div>
      <div class="card-body">
        <canvas id="issueCategoryChart" width="100%" height="250"></canvas>
      </div>
    `;
    
    // Insert after the PR Activity section
    const prSection = document.querySelector('.card-header.bg-warning').closest('.card');
    prSection.parentNode.insertBefore(categoriesSection, prSection.nextSibling);
  }
}

function displayContributors(contributors) {
  const contributorsList = document.getElementById('contributorsList');
  contributorsList.innerHTML = '';
  
  contributors.forEach(contributor => {
    const listItem = document.createElement('li');
    listItem.className = 'list-group-item';
    listItem.innerHTML = `
      <img src="${contributor.avatar}" alt="${contributor.username}" class="contributor-avatar">
      <div>
        <p class="contributor-name">${contributor.username}</p>
      </div>
      <span class="contributor-commits">${formatNumber(contributor.contributions)} commits</span>
    `;
    contributorsList.appendChild(listItem);
  });
}

function displayResolutionTime(days) {
  const avgTimeElement = document.getElementById('avgResolutionTime');
  avgTimeElement.textContent = days ? days.toFixed(1) : 'N/A';
}

function displayPRFrequency(frequency) {
  const frequencyElement = document.getElementById('prFrequency');
  frequencyElement.textContent = frequency || 'N/A';
}

// Chart Creation Functions
function createContributorsChart(contributors) {
  const ctx = document.getElementById('contributorsChart').getContext('2d');
  
  // Destroy previous chart instance if it exists
  if (contributorsChart) {
    contributorsChart.destroy();
  }
  
  contributorsChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: contributors.map(c => c.username),
      datasets: [{
        data: contributors.map(c => c.contributions),
        backgroundColor: [
          '#4285F4', '#EA4335', '#FBBC05', '#34A853', '#FF6D01',
          '#46BDC6', '#7BAAF7', '#F66B0E', '#107C41', '#8E44AD'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12
          }
        },
        title: {
          display: true,
          text: 'Contribution Distribution'
        }
      }
    }
  });
}

// NEW FUNCTION: Create commit frequency chart
function createCommitFrequencyChart(commitActivity) {
  const ctx = document.getElementById('commitFrequencyChart').getContext('2d');
  
  // Destroy previous chart instance if it exists
  if (commitFrequencyChart) {
    commitFrequencyChart.destroy();
  }
  
  // Extract data
  const labels = commitActivity.map(item => formatMonthLabel(item.month));
  const data = commitActivity.map(item => item.count);
  
  commitFrequencyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Commits',
        data: data,
        borderColor: '#8E44AD',
        backgroundColor: 'rgba(142, 68, 173, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#8E44AD'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Monthly Commit Activity'
        }
      }
    }
  });
}

// NEW FUNCTION: Create language distribution chart
function createLanguageDistributionChart(languageStats) {
  const ctx = document.getElementById('languageDistributionChart').getContext('2d');
  
  // Destroy previous chart instance if it exists
  if (languageDistributionChart) {
    languageDistributionChart.destroy();
  }
  
  // Extract data
  const languages = Object.keys(languageStats);
  const percentages = Object.values(languageStats);
  
  // Color mapping for common languages
  const languageColors = {
    'JavaScript': '#F7DF1E',
    'TypeScript': '#3178C6',
    'Python': '#3776AB',
    'Java': '#007396',
    'C#': '#239120',
    'PHP': '#777BB4',
    'C++': '#F34B7D',
    'Ruby': '#CC342D',
    'Go': '#00ADD8',
    'Swift': '#FFAC45',
    'Kotlin': '#7F52FF',
    'Rust': '#DEA584',
    'HTML': '#E34F26',
    'CSS': '#1572B6'
  };
  
  // Generate colors for languages
  const colors = languages.map(lang => languageColors[lang] || getRandomColor());
  
  languageDistributionChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: languages,
      datasets: [{
        data: percentages,
        backgroundColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12
          }
        },
        title: {
          display: true,
          text: 'Language Distribution'
        }
      }
    }
  });
}

// NEW FUNCTION: Create issue category chart
function createIssueCategoryChart(categories) {
  const ctx = document.getElementById('issueCategoryChart').getContext('2d');
  
  // Destroy previous chart instance if it exists
  if (issueCategoryChart) {
    issueCategoryChart.destroy();
  }
  
  // Extract data
  const labels = Object.keys(categories).map(key => key.charAt(0).toUpperCase() + key.slice(1));
  const data = Object.values(categories);
  
  // Category colors
  const categoryColors = {
    'Bug': '#FF6B6B',
    'Feature': '#4ECDC4',
    'Enhancement': '#7367F0',
    'Documentation': '#FF9F43',
    'Question': '#28C76F'
  };
  
  const colors = labels.map(label => categoryColors[label] || getRandomColor());
  
  issueCategoryChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Number of Issues',
        data: data,
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 5,
        barPercentage: 0.6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Issues by Category'
        }
      }
    }
  });
}

// NEW FUNCTION: Generate random color for charts
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function createIssuesChart(issuesByMonth) {
  const ctx = document.getElementById('issuesChart').getContext('2d');
  
  // Convert object to sorted arrays for chart
  const months = Object.keys(issuesByMonth).sort();
  const openedIssues = months.map(month => issuesByMonth[month].opened);
  const closedIssues = months.map(month => issuesByMonth[month].closed);
  
  // Format month labels (YYYY-MM to MMM YYYY)
  const formattedMonths = months.map(formatMonthLabel);
  
  // Destroy previous chart instance if it exists
  if (issuesChart) {
    issuesChart.destroy();
  }
  
  issuesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: formattedMonths,
      datasets: [
        {
          label: 'Opened Issues',
          data: openedIssues,
          borderColor: '#EA4335',
          backgroundColor: 'rgba(234, 67, 53, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        },
        {
          label: 'Closed Issues',
          data: closedIssues,
          borderColor: '#34A853',
          backgroundColor: 'rgba(52, 168, 83, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Monthly Issue Trends'
        }
      }
    }
  });
}

function createPullRequestsChart(pullRequests) {
  const ctx = document.getElementById('pullRequestsChart').getContext('2d');
  
  // Group PRs by month
  const prByMonth = {};
  
  pullRequests.forEach(pr => {
    const date = new Date(pr.createdAt);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!prByMonth[monthKey]) {
      prByMonth[monthKey] = { opened: 0, merged: 0 };
    }
    
    prByMonth[monthKey].opened++;
    
    if (pr.state === 'closed') {
      prByMonth[monthKey].merged++;
    }
  });
  
  // Convert object to sorted arrays for chart
  const months = Object.keys(prByMonth).sort();
  const openedPRs = months.map(month => prByMonth[month].opened);
  const mergedPRs = months.map(month => prByMonth[month].merged);
  
  // Format month labels
  const formattedMonths = months.map(formatMonthLabel);
  
  // Destroy previous chart instance if it exists
  if (pullRequestsChart) {
    pullRequestsChart.destroy();
  }
  
  pullRequestsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: formattedMonths,
      datasets: [
        {
          label: 'Opened PRs',
          data: openedPRs,
          backgroundColor: '#4285F4',
          barPercentage: 0.6
        },
        {
          label: 'Merged PRs',
          data: mergedPRs,
          backgroundColor: '#7BAAF7',
          barPercentage: 0.6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Monthly Pull Request Activity'
        }
      }
    }
  });
}

// Helper Functions
function formatNumber(num) {
  return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num;
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Validate GitHub repository URL format
function validateRepoUrl(url) {
  const githubUrlPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/?$/;
  return githubUrlPattern.test(url);
}

// NEW FUNCTION: Generate mock code complexity data
function generateMockCodeComplexity() {
  return {
    averageFileLOC: Math.floor(Math.random() * 300) + 100,
    maxFileLOC: Math.floor(Math.random() * 2000) + 500,
    totalLOC: Math.floor(Math.random() * 100000) + 10000,
    cyclomaticComplexity: (Math.random() * 15 + 5).toFixed(1),
    commentRatio: (Math.random() * 0.3).toFixed(2)
  };
}

// NEW FUNCTION: Generate mock commit activity data
function generateMockCommitActivity() {
  const months = 6;
  const activity = [];
  
  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    activity.unshift({
      month: `${date.getFullYear()}-${date.getMonth() + 1}`,
      count: Math.floor(Math.random() * 200) + 20
    });
  }
  
  return activity;
}

// NEW FUNCTION: Generate mock language stats
function generateMockLanguageStats(primaryLanguage) {
  const languages = {
    [primaryLanguage || 'JavaScript']: Math.floor(Math.random() * 40) + 40,
  };
  
  const otherLanguages = ['TypeScript', 'Python', 'HTML', 'CSS', 'Java', 'Ruby', 'Go', 'C#'];
  const usedCount = Math.floor(Math.random() * 4) + 2;
  
  let remaining = 100 - languages[primaryLanguage || 'JavaScript'];
  
  for (let i = 0; i < usedCount && i < otherLanguages.length; i++) {
    if (otherLanguages[i] !== primaryLanguage) {
      const percentage = i === usedCount - 1 ? 
        remaining : 
        Math.floor(Math.random() * (remaining / 2));
      
      languages[otherLanguages[i]] = percentage;
      remaining -= percentage;
    }
  }
  
  return languages;
}

// NEW FUNCTION: Generate mock issue categories
function generateMockIssueCategories(issues) {
  const categories = {
    'bug': Math.floor(Math.random() * 30) + 10,
    'feature': Math.floor(Math.random() * 30) + 10,
    'enhancement': Math.floor(Math.random() * 20) + 5,
    'documentation': Math.floor(Math.random() * 15) + 5,
    'question': Math.floor(Math.random() * 10) + 5
  };
  
  return categories;
}

// NEW FUNCTION: Display mock data message
function displayMockDataMessage(message) {
  // Check if message element already exists
  let messageElement = document.getElementById('mockDataMessage');
  
  if (!messageElement) {
    // Create message element if it doesn't exist
    messageElement = document.createElement('div');
    messageElement.id = 'mockDataMessage';
    messageElement.className = 'alert alert-warning mt-3';
    messageElement.role = 'alert';
    
    // Insert it at the top of the results container
    const resultsContainer = document.getElementById('results');
    resultsContainer.insertBefore(messageElement, resultsContainer.firstChild.nextSibling);
  }
  
  messageElement.textContent = message;
} 