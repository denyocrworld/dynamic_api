const axios = require('axios');

async function getData(endpoint) {
    try {
        const response = await axios.get(`http://localhost:3000/api/${endpoint}`);
        return response;
    } catch (error) {
        console.error('GET Error:', error.response.data);
    }
}

async function getDataById(endpoint, id) {
    try {
        const response = await axios.get(`http://localhost:3000/api/${endpoint}/${id}`);
        return response;
    } catch (error) {
        console.error('GET by ID Error:', error.response.data);
    }
}


async function addData(endpoint, data) {
    try {
        const response = await axios.post(`http://localhost:3000/api/${endpoint}`, data);
        console.log('POST Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('POST Error:', error.response.data);
    }
}

async function updateData(endpoint, id, data) {
    try {
        const response = await axios.put(`http://localhost:3000/api/${endpoint}/${id}`, data);
        console.log('PUT Response:', response.data);
        return response;
    } catch (error) {
        console.error('PUT Error:', error.response.data);
    }
}

async function deleteData(endpoint, id) {
    try {
        const response = await axios.delete(`http://localhost:3000/api/${endpoint}/${id}`);
        console.log('DELETE Response:', response.data);
        return response;
    } catch (error) {
        console.error('DELETE Error:', error.response.data);
    }
}

async function test() {
    // Contoh penggunaan
    const endpoint = 'products';
    const data = { product_name: 'Product A', price: 10.99 };

    // GET
    await getData(endpoint);
    return;

    // POST
    var res = await addData(endpoint, data);
    console.log(res.data);

    // PUT
    const id = res.data.id; // ID data yang akan diupdate
    console.log(id);

    // GET
    await getData(endpoint);

    // PUT
    const updatedData = { product_name: 'Product A (Updated)', price: 15.99 };
    await updateData(endpoint, id, updatedData);

    // GET by ID
    var res = await getDataById(endpoint, 312);

    // DELETE
    await deleteData(endpoint, id);
}

test();
