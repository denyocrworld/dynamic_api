const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 3000;
const cors = require('cors')

app.use(express.json());
app.use(cors());

// GET api/{endpoint}
app.get("/api/:endpoint", (req, res) => {
  const { endpoint } = req.params;
  const page = 1;
  const perPage = 10;

  const data = getDataFromJson(endpoint);
  const total = data.length;
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedData = data.slice(startIndex, endIndex);

  const totalPages = Math.ceil(total / perPage);
  const currentUrl = `/api/${endpoint}`;
  const nextPageUrl =
    page < totalPages
      ? `${currentUrl}?page=${page + 1}&perPage=${perPage}`
      : null;
  const prevPageUrl =
    page > 1 ? `${currentUrl}?page=${page - 1}&perPage=${perPage}` : null;

  if (data) {
    return res.json({
      data: paginatedData,
      links: {
        first: `${currentUrl}?page=1&perPage=${perPage}`,
        last: `${currentUrl}?page=${totalPages}&perPage=${perPage}`,
        prev: prevPageUrl,
        next: nextPageUrl,
      },
      meta: {
        current_page: page,
        from: startIndex + 1,
        to: endIndex,
        per_page: perPage,
        total: total,
        last_page: totalPages,
      },
    });
  } else {
    res.status(404).json({ error: "Data not found" });
  }
});

// GET api/{endpoint}/{id}
app.get("/api/:endpoint/:id", (req, res) => {
  const { endpoint, id } = req.params;
  const data = getDataFromJson(endpoint);
  if (data) {
    const item = data.find((item) => item.id == id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: "Data not found" });
    }
  } else {
    res.status(404).json({ error: "Endpoint not found" });
  }
});

// POST api/{endpoint}
app.post("/api/:endpoint", (req, res) => {
  const { endpoint } = req.params;
  const { body } = req;
  const data = getDataFromJson(endpoint);
  if (data) {
    const newId = generateId(endpoint);
    const newData = { id: newId, ...body };
    data.push(newData);
    saveDataToJson(endpoint, data);
    res
      .status(201)
      .json({ data: { id: newId }, message: "Data added successfully" });
  } else {
    res.status(404).json({ error: "Endpoint not found" });
  }
});

// PUT api/{endpoint}/{id}
app.put("/api/:endpoint/:id", (req, res) => {
  const { endpoint, id } = req.params;
  const { body } = req;
  const data = getDataFromJson(endpoint);
  if (data) {
    const index = data.findIndex((item) => item.id == id);
    if (index !== -1) {
      data[index] = { id, ...body };
      saveDataToJson(endpoint, data);
      res.json({ message: "Data updated successfully" });
    } else {
      res.status(404).json({ error: "Data not found" });
    }
  } else {
    res.status(404).json({ error: "Endpoint not found" });
  }
});

// DELETE api/{endpoint}/{id}
app.delete("/api/:endpoint/:id", (req, res) => {
  const { endpoint, id } = req.params;
  const data = getDataFromJson(endpoint);
  if (data) {
    const index = data.findIndex((item) => item.id == id);
    if (index !== -1) {
      data.splice(index, 1);
      saveDataToJson(endpoint, data);
      res.json({ message: "Data deleted successfully" });
    } else {
      res.status(404).json({ error: "Data not found" });
    }
  } else {
    res.status(404).json({ error: "Endpoint not found" });
  }
});

// DELETE api/{endpoint}/action/delete-all
app.delete("/api/:endpoint/action/delete-all", (req, res) => {
  const { endpoint } = req.params;
  const filePath = getDataFilePath(endpoint);

  try {
    fs.writeFileSync(filePath, "[]");
    res.json({ message: "All data deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete all data" });
  }
});

function getDataFromJson(endpoint) {
  try {
    const filePath = getDataFilePath(endpoint);
    const rawData = fs.readFileSync(filePath);
    const data = JSON.parse(rawData);
    return data ?? [];
  } catch (error) {
    return [];
  }
}

function saveDataToJson(endpoint, data) {
  try {
    const filePath = getDataFilePath(endpoint);
    fs.writeFileSync(filePath, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save data to JSON file:", error);
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
  const directory = "data";
  const filePath = path.join(__dirname, directory, `${endpoint}.json`);
  createDirectoryIfNotExists(path.join(__dirname, directory));
  return filePath;
}

function getIdsFilePath(endpoint) {
  const directory = "data";
  const indexDirectory = "index";
  const filePath = path.join(
    __dirname,
    directory,
    indexDirectory,
    `${endpoint}_ids.json`
  );
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
