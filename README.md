# smart-tab-manager
A chrome extension which manages many tabs across multiple windows.
![Demo of the feature](SmartTabManager.gif)


## Add your openAI API Key
  Make sure you have environmental variable defined `OPENAI_API_KEY` in your `SHELL` or `bashrc` or `bash_profile`

## Run backend 
`node backend/server.js`

## Load the Extension
To load the extension in Chrome:

a. Open Chrome browser

b. Type chrome://extensions in the address bar

c. In the top-right corner, toggle ON "Developer mode"

d. Click "Load unpacked" button in the top-left

e. Navigate to and select your chrome-extension folder (not the root project folder)


## To test if it's working:

The extension icon should appear in your Chrome toolbar

Clicking it should open the popup with the "Organize Open Tabs" button

Open several tabs and click the button to test the organization feature
