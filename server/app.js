const express = require('express');
const OpenAI = require('openai');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const fs = require('fs');

const {
    subjects,
    logoColorStyles,
    themes,
    hashString,
    downloadFile
} = require('./utils');

// Enable environment variables on the server (from the .env file)
dotenv.config();

// OpenAI configuration
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // This is the default and can be omitted
});

// Setup express and routing
const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static('data'));

app.get('/', (_, res) => {
    res.sendFile('index.html');
});

// Read in the database on startup (the file is rewritten upon update)
const database = JSON.parse(fs.readFileSync('data/database.json'));

// A hello world method to check that the server is running correctly and that
// responses are sent correctly
app.get('/helloworld/:name/:pet', (req, res) => {
    const {
        name,
        pet
    } = req.params;
    const message = `Hello ${name}! I hear you have a pet ${pet}.`;
    res.send(message);
});

// Send the list of logo subjects available
app.get('/subjects', (req, res) => {
    res.send(subjects);
});

// Send the list of logo color styles available
app.get('/logoColorStyles', (req, res) => {
    res.send(logoColorStyles);
});

// Send the list of themes available (only the theme names, not the descriptions)
app.get('/themes', (req, res) => {
    res.send(Object.keys(themes));
});

// Given a prompt, return a URL to an AI-generated image
app.post('/imageGen', async (req, res) => {
    const prompt = req.body;

    // Ensure the prompt is a JSON object and contains the prompt field
    if (!prompt.prompt) {
        res.status(400).send('Missing prompt');
        return;
    }

    await openai.images.generate(
        {
            model: 'dall-e-3',
            prompt: prompt.prompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard'
        }
    ).then((result) => {
        if (!result) {
            res.status(503).send('No response from OpenAI');
        } else {
            res.send(result.data[0].url);
        }
    }).catch(
        (error) => {
            console.log(error);
            res.status(503).send('Something went wrong: ' + error);
        }
    );
});

// Given a description, logo subject, logo color style, and logo theme, return a
// JSON object containing the project name, project summary, project description,
// logo prompt, and project tags
app.post('/contentGen', async (req, res) => {
    const payload = req.body;

    // Ensure the payload is a JSON object and contains the required fields
    if (!payload.description) {
        res.status(400).send('Missing description');
        return;
    } else if (!payload.logoSubject) {
        res.status(400).send('Missing logoSubject');
        return;
    } else if (!payload.logoColorStyle) {
        res.status(400).send('Missing logoColorStyle');
        return;
    } else if (!payload.logoTheme) {
        res.status(400).send('Missing logoTheme');
        return;
    }

    // Extract the logo theme description from the theme name (if it exists)
    payload.logoThemeDescription = themes[payload.logoTheme || ''] || '';

    // Remove the logoTheme name from the payload (it tends to confuse the AI)
    delete payload.logoTheme;

    // Send the payload to GPT-3.5 Turbo
    await openai.chat.completions.create({
        // model: 'gpt-3.5-turbo',
        model: 'gpt-4',
        messages: [
            {
                role: 'system',
                content: `
You are an assistant that helps generate names and logos for projects. You
are given a project's description, a logo subject, a logo color style, and
a logo theme, where:

- projectDescription: The description of the project as provided by the user
- logoSubject: A subject idea for the logo, such as "Maths", "Science", "Music",
               etc., which should be a part of the logo design
- logoColorStyle: A color style for the logo, such as "2-Color", "3-Color",
                   "6-Color", etc., which should be incorporated in the logo design
- logoThemeDescription: A description of the color scheme for the logo

The data is given as a JSON object with the following format:

{
    "description": "...",
    "logoSubject": "...",
    "logoColorStyle": "...",
    "logoThemeDescription": "...",
}

You should generate the following data:

- projectName: The name of the project. It should be a creative, catchy name which
               fits the project's description and logo, and is easy to remember.
- projectSummary: A short summary of the project which could be used as the
                  description on a project's GitHub page, for example.
- projectDescription: A longer description of the project (a paragraph or two). It
                      should explain what the project is and why it is important.
                      It may be used as part of the README for the project
- logoPrompt: A basic and concise description of the project's logo, which should capture all
              important aspects specified by the user. The prompt will be developed further
              in the image generation stage, so it should be as simple as possible.
- projectTags: Tags that can be used to search for the project. For example,
               ["math", "linear-algebra", "matrix"]. Generate 3-5 tags.

The data should be presented as a JSON object with the following format:

{
    "projectName": "...",
    "projectSummary": "...",
    "projectDescription": "...",
    "logoPrompt": "...",
    "projectTags": ["...", "...", "..."],
}
                `
            },
            {
                role: 'user',
                content: JSON.stringify(payload)
            }
        ]
    }).then((result) => {
        if (!result) {
            console.log('Error: ', result);
            res.status(503).send('No response from OpenAI');
        } else {
            // Send as JSON instead of plain text
            try {
                res.send(JSON.parse(result.choices[0].message.content));
            } catch (err) {
                console.log('Error: ', err);
                res.status(783).send('Invalid AI-generated JSON');
            }
        }
    }).catch(
        (error) => {
            console.log(error);
            res.status(503).send('No response from OpenAI');
        }
    );
});

// Save the result of an AI-generated project setup to the 'database', and download
// the image (as the URLs exprie after a short while). Returns the hash of the saved
// data and whether or not it was unique
app.post('/saveResult', async (req, res) => {
    const payload = req.body;

    // Ensure the payload is valid JSON and that it
    // has the required fields
    try {
        if (!payload.projectName) {
            res.status(400).send('Missing projectName');
        } else if (!payload.projectSummary) {
            res.status(400).send('Missing projectSummary');
        } else if (!payload.projectDescription) {
            res.status(400).send('Missing projectDescription');
        } else if (!payload.projectTags) {
            res.status(400).send('Missing projectTags');
        } else if (!payload.logoUrl) {
            res.status(400).send('Missing logoUrl');
        } else {
            // Content is valid, so we need to hash everything to ensure
            // unique filenames (we assume the description will be unique)

            const hashVal = hashString(payload.projectDescription);
            const imageName = `${hashVal}.png`;
            const imagePath = `./data/images/${imageName}`;

            // Download the image
            downloadFile(payload.logoUrl, imagePath);

            // Save the data to the 'database'
            const data = {
                ...payload,
                hash: hashVal
            };

            // Check if the hash is unique
            const unique = database[hashVal] === undefined;

            // Write to the database stored in memory and update the disk copy
            database[hashVal] = data;
            fs.writeFileSync('./data/database.json', JSON.stringify(database));

            res.send({
                hash: hashVal,
                unique
            });
        }
    } catch (err) {
        console.log('Error: ', err);
        res.status(400).send('Invalid JSON');
    }
});

// List all of the hashes stored in the database
app.get('/listHashes', async (req, res) => {
    res.send(Object.keys(database));
});

// Given a hash, return the name of the object
app.get('/nameFromHash/:hash', async (req, res) => {
    const {
        hash
    } = req.params;

    if (database[hash]) {
        res.send(database[hash].projectName);
    } else {
        res.status(404).send('Not Found');
    }
});

// Given a hash, return the whole object. The input is
// a JSON object of the form {hash: '...'}
app.post('/fromHash', async (req, res) => {
    const hash = req.body;

    if (!hash.hash) {
        res.status(400).send('Missing hash');
    } else if (database[hash.hash]) {
        res.send(database[hash.hash]);
    } else {
        res.status(404).send('Not Found');
    }
});

module.exports = app;
