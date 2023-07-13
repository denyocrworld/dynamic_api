<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;

// GET api/{endpoint}
Route::get('/api/{endpoint}', function (Request $request, $endpoint) {
    $page = $request->query('page', 1);
    $perPage = $request->query('perPage', 10);

    $data = getDataFromJson($endpoint);
    $total = count($data);
    $startIndex = ($page - 1) * $perPage;
    $paginatedData = array_slice($data, $startIndex, $perPage);

    $totalPages = ceil($total / $perPage);
    $currentUrl = "/api/{$endpoint}";
    $nextPageUrl = $page < $totalPages ? "{$currentUrl}?page=" . ($page + 1) . "&perPage={$perPage}" : null;
    $prevPageUrl = $page > 1 ? "{$currentUrl}?page=" . ($page - 1) . "&perPage={$perPage}" : null;

    return response()->json([
        'data' => $paginatedData,
        'links' => [
            'first' => "{$currentUrl}?page=1&perPage={$perPage}",
            'last' => "{$currentUrl}?page=" . ($totalPages > 0 ? $totalPages : 1) . "&perPage={$perPage}",
            'prev' => $prevPageUrl,
            'next' => $nextPageUrl,
        ],
        'meta' => [
            'current_page' => $page,
            'from' => $startIndex + 1,
            'to' => $startIndex + count($paginatedData),
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => $totalPages,
        ],
    ]);
});

// GET api/{endpoint}/{id}
Route::get('/api/{endpoint}/{id}', function ($endpoint, $id) {
    $data = getDataFromJson($endpoint);
    $item = collect($data)->firstWhere('id', $id);
    if ($item) {
        return response()->json($item);
    } else {
        return response()->json(['error' => 'Data not found'], 404);
    }
});

// POST api/{endpoint}
Route::post('/api/{endpoint}', function (Request $request, $endpoint) {
    $data = getDataFromJson($endpoint);
    $newId = generateId($endpoint);
    $newData = array_merge(['id' => $newId], $request->all());
    $data[] = $newData;
    saveDataToJson($endpoint, $data);
    return response()->json(['data' => ['id' => $newId], 'message' => 'Data added successfully'], 201);
});

// PUT api/{endpoint}/{id}
Route::put('/api/{endpoint}/{id}', function (Request $request, $endpoint, $id) {
    $data = getDataFromJson($endpoint);
    $index = collect($data)->search(function ($item) use ($id) {
        return $item['id'] == $id;
    });

    $data[$index] = array_merge(['id' => $id], $request->all());
    saveDataToJson($endpoint, $data);
    return response()->json(['message' => 'Data updated successfully']);
});

// DELETE api/{endpoint}/{id}
Route::delete('/api/{endpoint}/{id}', function ($endpoint, $id) {
    $data = getDataFromJson($endpoint);
    $index = collect($data)->search(function ($item) use ($id) {
        return $item['id'] == $id;
    });
    if ($index !== false) {
        array_splice($data, $index, 1);
        saveDataToJson($endpoint, $data);
        return response()->json(['message' => 'Data deleted successfully']);
    } else {
        return response()->json(['error' => 'Data not found'], 404);
    }
});

// DELETE api/{endpoint}/action/delete-all
Route::delete('/api/{endpoint}/action/delete-all', function ($endpoint) {
    $filePath = getDataFilePath($endpoint);
    File::put($filePath, '[]');
    return response()->json(['message' => 'All data deleted successfully']);
});

function getDataFromJson($endpoint)
{
    $filePath = getDataFilePath($endpoint);
    if (File::exists($filePath)) {
        $rawData = File::get($filePath);
        $data = json_decode($rawData, true);
        return $data ?? [];
    } else {
        return [];
    }
}

function saveDataToJson($endpoint, $data)
{
    $filePath = getDataFilePath($endpoint);
    File::put($filePath, json_encode($data));
}

function generateId($endpoint)
{
    $idsFilePath = getIdsFilePath($endpoint);
    if (File::exists($idsFilePath)) {
        $lastId = (int) File::get($idsFilePath);
    } else {
        $lastId = 0;
    }
    $newId = $lastId + 1;
    File::put($idsFilePath, $newId);
    return $newId;
}

function getDataFilePath($endpoint)
{
    $directory = 'data';
    $filePath = storage_path("app/{$directory}/{$endpoint}.json");
    createDirectoryIfNotExists(storage_path("app/{$directory}"));
    return $filePath;
}

function getIdsFilePath($endpoint)
{
    $directory = 'data/index';
    $filePath = storage_path("app/{$directory}/{$endpoint}_ids.txt");
    createDirectoryIfNotExists(storage_path("app/{$directory}"));
    return $filePath;
}

function createDirectoryIfNotExists($directoryPath)
{
    if (!File::exists($directoryPath)) {
        File::makeDirectory($directoryPath, 0755, true);
    }
}
