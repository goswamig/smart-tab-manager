// popup.js
document.getElementById('organizeTabs').addEventListener('click', async () => {
  try {
    // Show loading state
    const button = document.getElementById('organizeTabs');
    const originalText = button.textContent;
    button.textContent = 'Processing...';
    button.disabled = true;

    // Get all tabs
    const tabs = await chrome.tabs.query({});
    const tabData = tabs.map(tab => ({
      url: tab.url,
      title: tab.title,
      id: tab.id
    }));

    console.log('Sending tabs to backend:', tabData);

    // Send tabs to backend
    const response = await fetch('http://localhost:3000/process-tabs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tabs: tabData })
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const organizedTabs = await response.json();
    console.log('Received organized tabs:', organizedTabs);
    
    displayOrganizedTabs(organizedTabs);
    
    // Store in chrome storage
    chrome.storage.local.set({ organizedTabs });

    // Reset button
    button.textContent = originalText;
    button.disabled = false;

  } catch (error) {
    console.error('Error:', error);
    document.getElementById('topicContainer').innerHTML = `
      <div class="error">
        Error: ${error.message}. Make sure the backend server is running on port 3000.
      </div>
    `;
    
    // Reset button
    const button = document.getElementById('organizeTabs');
    button.textContent = 'Try Again';
    button.disabled = false;
  }
});

function displayOrganizedTabs(organizedTabs) {
  const container = document.getElementById('topicContainer');
  container.innerHTML = '';

  Object.entries(organizedTabs).forEach(([topic, tabs]) => {
    const topicDiv = document.createElement('div');
    topicDiv.className = 'topic';

  
     // Clean the title text by removing the encoding artifacts
     const cleanTabs = tabs.map(tab => ({
      ...tab,
      title: tab.title.replace(/â€¢/g, '•').trim() // Replace the broken bullet with proper one
                        .replace(/^\s*[•·]\s*/, '') // Remove leading bullet points and whitespace
    }));  

    topicDiv.innerHTML = `
      <h3>
        ${topic}
        <span>${tabs.length} tab${tabs.length !== 1 ? 's' : ''}</span>
      </h3>
      <div class="tab-list">
        ${tabs.map(tab => `
          <div class="tab" data-tab-id="${tab.id}" title="${tab.title}">
            ${tab.title}
          </div>
        `).join('')}
      </div>
    `;

    // Add click handlers for tabs
    topicDiv.querySelectorAll('.tab').forEach(tabElement => {
      tabElement.addEventListener('click', () => {
        const tabId = parseInt(tabElement.dataset.tabId);
        chrome.tabs.update(tabId, { active: true });
        
        // Highlight the clicked tab
        topicDiv.querySelectorAll('.tab').forEach(tab => {
          tab.style.background = '#f8f9fa';
        });
        tabElement.style.background = '#e9ecef';
      });
    });

    container.appendChild(topicDiv);
  });
}