
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());

// Enable CORS for all methods
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

// GET api/{endpoint}
app.get('/api/:endpoint', (req, res) => {
  const { endpoint } = req.params;
  const data = getDataFromJson(endpoint);
  if (data) {
    res.json(data);
  } else {
    res.status(404).json({ error: 'Data not found' });
  }
});

// GET api/{endpoint}/{id}
app.get('/api/:endpoint/:id', (req, res) => {
  const { endpoint, id } = req.params;
  const data = getDataFromJson(endpoint);
  if (data) {
    const item = data.find(item => item.id == id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: 'Data not found' });
    }
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});

// POST api/{endpoint}
app.post('/api/:endpoint', (req, res) => {
  const { endpoint } = req.params;
  const { body } = req;
  const data = getDataFromJson(endpoint);
  if (data) {
    const newId = generateId(endpoint);
    const newData = { id: newId, ...body };
    data.push(newData);
    saveDataToJson(endpoint, data);
    res.status(201).json({ data: { id: newId }, message: 'Data added successfully' });
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});

// PUT api/{endpoint}/{id}
app.put('/api/:endpoint/:id', (req, res) => {
  const { endpoint, id } = req.params;
  const { body } = req;
  const data = getDataFromJson(endpoint);
  if (data) {
    const index = data.findIndex(item => item.id == id);
    if (index !== -1) {
      data[index] = { id, ...body };
      saveDataToJson(endpoint, data);
      res.json({ message: 'Data updated successfully' });
    } else {
      res.status(404).json({ error: 'Data not found' });
    }
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});

// DELETE api/{endpoint}/{id}
app.delete('/api/:endpoint/:id', (req, res) => {
  const { endpoint, id } = req.params;
  const data = getDataFromJson(endpoint);
  if (data) {
    const index = data.findIndex(item => item.id == id);
    if (index !== -1) {
      data.splice(index, 1);
      saveDataToJson(endpoint, data);
      res.json({ message: 'Data deleted successfully' });
    } else {
      res.status(404).json({ error: 'Data not found' });
    }
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});

function getDataFromJson(endpoint) {
  try {
    const filePath = getDataFilePath(endpoint);
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData);
  } catch (error) {
    return [];
  }
}

function saveDataToJson(endpoint, data) {
  try {
    const filePath = getDataFilePath(endpoint);
    fs.writeFileSync(filePath, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data to JSON file:', error);
  }
}

function generateId(endpoint) {
  const idsFilePath = getIdsFilePath(endpoint);
  let lastId = 0;
  try {
    const rawIds = fs.readFileSync(idsFilePath);
    lastId = parseInt(rawIds) || 0;
  } catch (error) {
    lastId = 0;
  }
  const newId = lastId + 1;
  fs.writeFileSync(idsFilePath, newId.toString());
  return newId;
}

function getDataFilePath(endpoint) {
  const directory = 'data';
  const filePath = path.join(__dirname, directory, `${endpoint}.json`);
  createDirectoryIfNotExists(path.join(__dirname, directory));
  return filePath;
}

function getIdsFilePath(endpoint) {
  const directory = 'data';
  const indexDirectory = 'index';
  const filePath = path.join(__dirname, directory, indexDirectory, `${endpoint}_ids.json`);
  createDirectoryIfNotExists(path.join(__dirname, directory, indexDirectory));
  return filePath;
}

function createDirectoryIfNotExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
