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
    
    const cleanTabs = tabs.map(tab => ({
      ...tab,
      title: tab.title.replace(/â€¢/g, '•').trim()
                        .replace(/^\s*[•·]\s*/, '')
    }));

    topicDiv.innerHTML = `
      <h3>
        <span class="topic-name">${topic}</span>
        <div class="topic-controls">
          <span class="tab-count">${cleanTabs.length} tab${cleanTabs.length !== 1 ? 's' : ''}</span>
          <button class="close-topic" title="Close all tabs in this topic">×</button>
        </div>
      </h3>
      <div class="tab-list">
        ${cleanTabs.map(tab => `
          <div class="tab" data-tab-id="${tab.id}" title="${tab.title}">
            <span class="tab-title">${tab.title}</span>
            <button class="close-tab" data-tab-id="${tab.id}" title="Close tab">×</button>
          </div>
        `).join('')}
      </div>
    `;

    // Add click handlers for topic close button
    const closeTopicButton = topicDiv.querySelector('.close-topic');
    closeTopicButton.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      // Show confirmation dialog
      const tabCount = cleanTabs.length;
      if (confirm(`Close all ${tabCount} tabs in "${topic}"?`)) {
        try {
          // Get all tab IDs in this topic
          const tabIds = cleanTabs.map(tab => tab.id);
          
          // Close all tabs
          await chrome.tabs.remove(tabIds);
          
          // Animate topic removal
          topicDiv.style.opacity = '0';
          setTimeout(() => {
            topicDiv.style.height = '0';
            topicDiv.style.padding = '0';
            topicDiv.style.margin = '0';
            setTimeout(() => {
              topicDiv.remove();
            }, 300);
          }, 300);
          
        } catch (error) {
          console.error('Error closing topic tabs:', error);
          alert('Failed to close some tabs');
        }
      }
    });

    // Add click handlers for individual tabs
    topicDiv.querySelectorAll('.tab').forEach(tabElement => {
      const tabTitle = tabElement.querySelector('.tab-title');
      const closeButton = tabElement.querySelector('.close-tab');
      const tabId = parseInt(tabElement.dataset.tabId);

      // Click on title to activate tab
      tabTitle.addEventListener('click', () => {
        chrome.tabs.update(tabId, { active: true });
        
        // Highlight the clicked tab
        topicDiv.querySelectorAll('.tab').forEach(tab => {
          tab.style.background = '#f8f9fa';
        });
        tabElement.style.background = '#e9ecef';
      });

      // Click on close button to close tab
      closeButton.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await chrome.tabs.remove(tabId);
          tabElement.style.opacity = '0';
          setTimeout(() => {
            tabElement.style.height = '0';
            tabElement.style.padding = '0';
            tabElement.style.margin = '0';
            setTimeout(() => {
              tabElement.remove();
              // Update tab count
              const remainingTabs = topicDiv.querySelectorAll('.tab').length;
              const countSpan = topicDiv.querySelector('.tab-count');
              countSpan.textContent = `${remainingTabs} tab${remainingTabs !== 1 ? 's' : ''}`;
              
              // Remove topic if no tabs left
              if (remainingTabs === 0) {
                topicDiv.style.opacity = '0';
                setTimeout(() => topicDiv.remove(), 300);
              }
            }, 300);
          }, 300);
        } catch (error) {
          console.error('Error closing tab:', error);
        }
      });
    });

    container.appendChild(topicDiv);
  });
}