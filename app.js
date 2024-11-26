const express = require("express");

const app = express();
const bcrypt = require('bcryptjs');
const cors = require("cors");
const axios = require('axios');
const path = require("path");
const mongoose = require("mongoose");
const User = require("./routes/modals/users")
const promptData = require("./routes/modals/input_Data.json")
const API_Key = "332dd53da1mshb8ea9defac497d0p1eee33jsn3a9d78c14faf"

mongoose.connect("mongodb+srv://borse030:T0LgBfKnDQOxpwMS@cluster0.6cmx4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/Users", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('MongoDB connection error:', err));

app.use(express.json()); // To parse JSON bodies
app.use(cors());

// Signup API
app.post('/signup', async (req, res) => {
  const { name, userId, password } = req.body;
  console.log("Data ", req.body)

  // Check if all required fields are provided
  if (!name || !userId || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    // Check if userId already exists
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({ message: 'UserId already exists' });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      name,
      userId,
      password: hashedPassword
    });

    // Save the user to the database
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Sign In API
app.post('/signin', async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ message: 'Please provide both email and password' });
  }

  try {
    // Check if the user exists
    const existingUser = await User.findOne({ userId });
    if (!existingUser) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // If successful
    res.status(200).json({ message: 'Sign in successful!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


app.post('/openAI', async (req, res) => {
  const { messages } = req.body; // Get messages from the request body
  console.log("DATA ", messages)
  const options = {
    method: 'POST',
    url: 'https://chatgpt-42.p.rapidapi.com/conversationgpt4-2',
    headers: {
      'x-rapidapi-key': API_Key,
      'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
      'Content-Type': 'application/json',
    },
    data: {
      messages,
      system_prompt: '',
      temperature: 0.9,
      top_k: 5,
      top_p: 0.9,
      max_tokens: 256,
    },
  };

  try {
    const response = await axios.request(options);
    console.log("respo ", response)
    res.json(response.data); // Send the API response back to the client
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch the response' });
  }
});


app.post('/Summariser', async (req, res) => {
  console.log("PPPP  ", promptData.API_Features[0].length.defaultPrompt)

  const { prompt } = req.body.data;

  console.log("pkj ", req.body.data)
  // Get the prompt from the request body
  let Summariser_Prompt = `${promptData.API_Features[0].length.defaultPrompt} - ${prompt}`

  console.log("askkk ", Summariser_Prompt)
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const options = {
    method: 'POST',
    url: 'https://chatgpt-42.p.rapidapi.com/conversationgpt4-2',
    headers: {
      'x-rapidapi-key': API_Key,
      'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
      'Content-Type': 'application/json',
    },
    data: {
      messages: [
        {
          role: 'user',
          content: Summariser_Prompt, // Use the prompt from the frontend
        },
      ],
      system_prompt: '',
      temperature: 0.9,
      top_k: 5,
      top_p: 0.9,
      max_tokens: 256,
      web_access: false,
    },
  };

  try {
    const response = await axios.request(options);
    console.log("respo  ", response.data)

    res.json(response.data); // Send the API response back to the client
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch the response' });
  }
});

app.post('/SummariseByPersentage', async (req, res) => {
  try {
    // Destructure the prompt and percent from the request body
    const { prompt, percent } = req.body.data;

    if (!prompt || typeof percent === 'undefined') {
      return res.status(400).json({ error: 'Prompt and percent are required' });
    }

    // Get the summarization prompt based on the percent value
    const summarizationOptions = promptData.API_Features[0].length;
    let summarizationPrompt = summarizationOptions[percent];
    console.log("Final Prompt  ", summarizationPrompt)
    // If percent is not a valid key, use the default prompt
    if (!summarizationPrompt) {
      summarizationPrompt = summarizationOptions.defaultPrompt;
    }

    // Combine the summarization type with the user prompt
    let Summariser_Prompt = `${summarizationPrompt} - ${prompt}`;

    console.log("Summarization Prompt: ", Summariser_Prompt);

    // Make the API request
    const options = {
      method: 'POST',
      url: 'https://chatgpt-42.p.rapidapi.com/conversationgpt4-2',
      headers: {
        'x-rapidapi-key': API_Key,
        'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
        'Content-Type': 'application/json',
      },
      data: {
        messages: [
          {
            role: 'user',
            content: Summariser_Prompt, // Use the generated summarizer prompt
          },
        ],
        system_prompt: '',
        temperature: 0.9,
        top_k: 5,
        top_p: 0.9,
        max_tokens: 256,
        web_access: false,
      },
    };

    // Send the request and return the response
    const response = await axios.request(options);
    console.log("API Response: ", response.data);

    res.json(response.data); // Send the API response back to the client

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: 'Failed to fetch the response' });
  }
});

app.post("/detectLanguage", async (req, res) => {

  const { text } = req.body.data;
  console.log("text ", text);

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

const TranslatePrompt = promptData.API_Features[1].detectLanguage;

  let Translator_Prompt = `${TranslatePrompt} - ${text}`; 

  console.log("Translato Prompt: ", Translator_Prompt);




  try{

  
  const options = {
    method: 'POST',
    url: 'https://chatgpt-42.p.rapidapi.com/conversationgpt4-2',
    headers: {
      'x-rapidapi-key': API_Key,
      'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
      'Content-Type': 'application/json',
    },
    data: {
      messages: [
        {
          role: 'user',
          content: Translator_Prompt, // Use the generated summarizer prompt
        },
      ],
      system_prompt: '',
      temperature: 0.9,
      top_k: 5,
      top_p: 0.9,
      max_tokens: 256,
      web_access: false,
    },
  };

  // Send the request and return the response
  const response = await axios.request(options);
  console.log("API Response: ", response.data);

  res.json(response.data); // Send the API response back to the client

} catch (error) {
  console.error("Error:", error);
  res.status(500).json({ error: 'Failed to fetch the response' });
}

})


app.post('/checkTranslator', async (req, res) => {

console.log("req.body  ", req.body)


  const { selectedLanguage, selectedIndustry, selectedProfession, input } = req.body.data

  const translatorFeature = promptData.API_Features[1];

  let prompt = translatorFeature.defaultPrompt;
console.log("prompt ", prompt)
  
  let promptText = `${prompt} ${selectedLanguage} - ${input}`;
  let inputText = "defaultPrompt"
  if (selectedProfession && selectedIndustry) {
    const key = `${selectedProfession}_${selectedIndustry}`;
    if (translatorFeature.professionAndIndustry && translatorFeature.professionAndIndustry[key]) {
      prompt = translatorFeature.professionAndIndustry[key];
      inputText = `${selectedProfession}_${selectedIndustry}`;
    }
  } else {
    if (selectedProfession && translatorFeature.profession[selectedProfession]) {
      prompt = translatorFeature.profession[selectedProfession];
      inputText = selectedProfession;
    }
    if (selectedIndustry && translatorFeature.industry[selectedIndustry]) {
      prompt = translatorFeature.industry[selectedIndustry];
      inputText = selectedIndustry;
    }
  }
  promptText = `${prompt} ${selectedLanguage} - ${input}`;
console.log("PPP  ", promptText )
 
  try{

  
    const options = {
      method: 'POST',
      url: 'https://chatgpt-42.p.rapidapi.com/conversationgpt4-2',
      headers: {
        'x-rapidapi-key': API_Key,
        'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
        'Content-Type': 'application/json',
      },
      data: {
        messages: [
          {
            role: 'user',
            content: promptText, // Use the generated summarizer prompt
          },
        ],
        system_prompt: '',
        temperature: 0.9,
        top_k: 5,
        top_p: 0.9,
        max_tokens: 256,
        web_access: false,
      },
    };
  
    // Send the request and return the response
    const response = await axios.request(options);
    console.log("API Response: ", response.data);
  
    res.json(response.data); // Send the API response back to the client
  
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: 'Failed to fetch the response' });
  }

});







app.post('/GrammarCheck', async (req, res) => {
  const { text } = req.body.data;

  if (!text) {
    return res.status(400).json({ error: 'Text is required for grammar check.' });
  }

  // const GrammarCheck_Prompt = `Identify and correct the grammar, spelling, and clarity mistakes in the following text: "${text}". Highlight each mistake and suggest a correction. If there are no mistakes, respond with following text only "No errors found."`;
  const GrammarCheck_Prompt = `Correct the grammar, spelling, and clarity of the following text: "${text}", Just give the corrected text not anything else.`;

  const options = {
    method: 'POST',
    url: 'https://chatgpt-42.p.rapidapi.com/conversationgpt4-2',
    headers: {
      'x-rapidapi-key': API_Key,
      'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
      'Content-Type': 'application/json',
    },
    data: {
      messages: [
        {
          role: 'user',
          content: GrammarCheck_Prompt,
        },
      ],
      system_prompt: '',
      temperature: 0.5,
      top_k: 5,
      top_p: 0.9,
      max_tokens: 256,
      web_access: false,
    },
  };

  try {
    const response = await axios.request(options);
    console.log("respo  ", response)
    const aiResponse = response.data;
    console.log("paise ", aiResponse.result)

  
  

    res.json({ aiResponse });
  } catch (error) {
    console.error("Error occurred while fetching AI response: ", error);
    res.status(500).json({ error: 'Failed to fetch grammar-checked response.' });
  }
});









app.listen(process.env.PORT || 4000, () => {
  console.log("Listening to 4000 ")
})
