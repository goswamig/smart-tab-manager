// backend/server.js
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');  // Add this line
const app = express();
app.use(cors());  // Add this line
app.use(express.json());

const openai = new OpenAI({
  apiKey: 'OPENAI_API_KEY' // Replace with your actual API key
});

app.post('/process-tabs', async (req, res) => {
console.log('Received request to process tabs'); // Add logging
  const { tabs } = req.body;
  
  console.log(`Processing ${tabs.length} tabs`); // Add logging

  // Prepare prompt for GPT
  const prompt = `Given these tabs, group them into relevant topics. Format the response as JSON with topic names as keys and arrays of tab indices as values. Tabs:\n${
    tabs.map((tab, i) => `${i}: ${tab.title} (${tab.url})`).join('\n')
  }`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that organizes browser tabs into logical topics. Respond only with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const topicAssignments = JSON.parse(completion.choices[0].message.content);
    console.log('Successfully processed tabs:', topicAssignments); // Add logging

    // Convert the response into the desired format
    const organizedTabs = {};
    Object.entries(topicAssignments).forEach(([topic, tabIndices]) => {
      organizedTabs[topic] = tabIndices.map(i => tabs[i]);
    });

    res.json(organizedTabs);
  } catch (error) {
    console.error('Error processing tabs:', error);
    res.status(500).json({ error: 'Failed to process tabs', details: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});