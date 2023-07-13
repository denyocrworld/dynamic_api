const axios = require("axios");
const { describe, beforeAll, it, expect } = require("@jest/globals");

async function getData(endpoint) {
  try {
    const url = `http://localhost:3000/api/${endpoint}`;
    console.log(url);
    const response = await axios.get(url);
    return response;
  } catch (error) {
    console.log(error);
  }
}

async function getDataById(endpoint, id) {
  try {
    const url = `http://localhost:3000/api/${endpoint}/${id}`;
    console.log(url);
    const response = await axios.get(url);
    return response;
  } catch (error) {
    console.log(error);
  }
}

async function addData(endpoint, data) {
  try {
    const url = `http://localhost:3000/api/${endpoint}`;
    console.log(url);
    const response = await axios.post(url, data);
    console.log("POST Response:", response.data);
    return response;
  } catch (error) {
    console.log(error);
  }
}

async function updateData(endpoint, id, data) {
  try {
    const url = `http://localhost:3000/api/${endpoint}/${id}`;
    console.log(url);
    const response = await axios.put(url, data);
    console.log("PUT Response:", response.data);
    return response;
  } catch (error) {
    console.log(error);
  }
}

async function deleteData(endpoint, id) {
  try {
    const url = `http://localhost:3000/api/${endpoint}/${id}`;
    console.log(`DELETE: ${url}`);
    const response = await axios.delete(url);
    console.log("DELETE Response:", response.data);
    return response;
  } catch (error) {
    console.log(error);
  }
}

async function deleteAllData(endpoint) {
  try {
    const url = `http://localhost:3000/api/${endpoint}/action/delete-all`;
    console.log(url);
    const response = await axios.delete(url);
    console.log("DELETE Response:", response.data);
    return response;
  } catch (error) {
    console.error("DELETE Error:", error.response.data);
  }
}

describe("API Tests", () => {
  const endpoint = "products";
  const data = { product_name: "Product A", price: 10.99 };
  let addedDataId = null;

  beforeAll(async () => {
    await deleteAllData(endpoint);
  });

  it("should add data", async () => {
    const response = await addData(endpoint, data);
    expect(response.status).toBe(201);
    addedDataId = response.data.data.id;
  });

  it("should get data", async () => {
    const response = await getData(endpoint);
    expect(response.status).toBe(200);
    expect(response.data.data.length).toBe(1);
    expect(response.data.data[0].id).toBe(addedDataId);
  });

  it("should update data", async () => {
    const updatedData = { product_name: "Product A (Updated)", price: 15.99 };
    const response = await updateData(endpoint, addedDataId, updatedData);
    expect(response.status).toBe(200);
  });

  it("should get data by ID", async () => {
    const response = await getDataById(endpoint, addedDataId);
    expect(response.status).toBe(200);
    expect(parseInt(response.data.id)).toBe(parseInt(addedDataId));
  });

  it("should delete data", async () => {
    const response = await deleteData(endpoint, addedDataId);
    expect(response.status).toBe(200);
  });
});
