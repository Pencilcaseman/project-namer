<img src="./client/logo_4096.png" alt="Logo" width="500"/>

# Project-Namer

Produce AI-generated names, logos, summaries and tags for your projects! Spend more time developing and 
less time worrying about finding a name for your project or creating a high-quality logo for it. 

## Running the Website

### 1. Install NodeJS

To run the website, you will need to have [NodeJS](https://nodejs.org/en) installed on your system and accessible from the command line. 

### 2. Install Dependencies

Open a terminal window in the project directory and run `npm i` to install the necessary packages.

### 3. Start the Server

In the same terminal window, run `npm start`. This will start the server which hosts the API as well as the front end website. The server runs on port `8080`, so ensure you enter the correct URL.

### 4. Open the Website!

In a browser of your choice, navigate to `localhost:8080` (or click [here](localhost:8080))

## Running the Tests 

Assuming you have already installed all the necessary dependencies, simply run `npm test` to start the test suite. This may take up to five minutes to complete, depending on network speeds and OpenAI's API load.

> [!CAUTION]
> Running the tests modifies the 'database', so it's advisable to clear the database after the tests complete (note this will erase any stored projects).
>
> To do this, run:
>
> ```
> echo "{}" > data/database.json
>
> rm -rf data/images
> mkdir data/images
> ```

## API Documentation

The API is documented fully in [api_doc.md](/api_doc.md), stating the necessary parameters, the output of a given request, and examples showing a simple use case.

