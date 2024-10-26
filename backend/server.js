// backend/server.js
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function to clean JSON response
function cleanJsonResponse(response) {
  // Remove markdown code blocks if present
  response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  // Remove any leading/trailing whitespace
  response = response.trim();
  try {
    return JSON.parse(response);
  } catch (e) {
    console.error('Failed to parse JSON:', response);
    throw new Error('Invalid JSON response from OpenAI');
  }
}

app.post('/process-tabs', async (req, res) => {
  console.log('Received request to process tabs');
  const { tabs } = req.body;
  
  console.log(`Processing ${tabs.length} tabs`);

  // Example tabs for logging (limited to prevent huge logs)
  console.log('Sample of tabs being processed:', 
    tabs.slice(0, 3).map(t => ({ title: t.title, url: t.url })));

  // More explicit prompt
  const prompt = `
Analyze these browser tabs and group them into relevant topics. 
Return ONLY a JSON object where:
- Keys are topic names (use clear, concise names)
- Values are arrays of tab indices
- Do not include any markdown formatting or code blocks
- The response should be a valid JSON object only

Example expected format:
{
  "Development": [0, 3, 4],
  "News": [1, 5],
  "Shopping": [2, 6]
}

Tabs to analyze:
${tabs.map((tab, i) => `${i}: ${tab.title} (${tab.url})`).join('\n')}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an assistant that organizes browser tabs into topics. Always respond with pure JSON only, no markdown, no explanations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" } // Force JSON response format
    });

    const rawResponse = completion.choices[0].message.content;
    console.log('Raw OpenAI response:', rawResponse);

    const topicAssignments = cleanJsonResponse(rawResponse);
    console.log('Cleaned and parsed response:', topicAssignments);

    // Validate the response structure
    if (typeof topicAssignments !== 'object' || topicAssignments === null) {
      throw new Error('Invalid response structure');
    }

    // Convert the response into the desired format
    const organizedTabs = {};
    Object.entries(topicAssignments).forEach(([topic, tabIndices]) => {
      if (!Array.isArray(tabIndices)) {
        console.warn(`Invalid indices for topic ${topic}:`, tabIndices);
        return;
      }
      // Filter out any invalid indices
      const validIndices = tabIndices.filter(i => typeof i === 'number' && i >= 0 && i < tabs.length);
      if (validIndices.length > 0) {
        organizedTabs[topic] = validIndices.map(i => tabs[i]);
      }
    });

    res.json(organizedTabs);
  } catch (error) {
    console.error('Error processing tabs:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Failed to process tabs', 
      details: error.message,
      type: error.constructor.name
    });
  }
});

// Add a basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});