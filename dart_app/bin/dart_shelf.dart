import 'dart:convert';
import 'dart:io';
import 'package:path/path.dart' as path;
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:shelf_router/shelf_router.dart';

void main() {
  final app = Router();

  // GET api/{endpoint}
  app.get('/api/<endpoint>', (Request request, String endpoint) {
    int page =
        int.tryParse(request.url.queryParameters["page"].toString()) ?? 1;
    int perPage =
        int.tryParse(request.url.queryParameters["per_page"].toString()) ?? 10;

    print("page: $page");
    print(request.url.queryParameters);

    final data = getDataFromJson(endpoint);
    final total = data.length;
    final startIndex = (page - 1) * perPage;
    var endIndex = startIndex + perPage;

    if (data.length < endIndex) {
      endIndex = data.length;
    }

    final paginatedData =
        data.isEmpty ? [] : data.sublist(startIndex, endIndex);

    final totalPages = (total / perPage).ceil();
    final currentUrl = '/api/$endpoint';
    final nextPageUrl = page < totalPages
        ? '$currentUrl?page=${page + 1}&perPage=$perPage'
        : null;

    final prevPageUrl =
        page > 1 ? '$currentUrl?page=${page - 1}&perPage=$perPage' : null;

    return Response.ok(
        jsonEncode({
          'data': paginatedData,
          'links': {
            'first': '$currentUrl?page=1&perPage=$perPage',
            'last':
                '$currentUrl?page=${totalPages > 0 ? totalPages : 1}&perPage=$perPage',
            'prev': prevPageUrl,
            'next': nextPageUrl,
          },
          'meta': {
            'current_page': page,
            'from': startIndex + 1,
            'to': endIndex,
            'per_page': perPage,
            'total': total,
            'last_page': totalPages,
          },
        }),
        headers: {'Content-Type': 'application/json'});
  });

  // GET api/{endpoint}/{id}
  app.get('/api/<endpoint>/<id>',
      (Request request, String endpoint, String id) {
    final data = getDataFromJson(endpoint);
    final item =
        data.firstWhere((item) => item['id'] == id, orElse: () => null);
    if (item != null) {
      return Response.ok(jsonEncode(item),
          headers: {'Content-Type': 'application/json'});
    } else {
      return Response.notFound('Data not found');
    }
  });

  // POST api/{endpoint}
  app.post('/api/<endpoint>', (Request request, String endpoint) async {
    final body = jsonDecode(await request.readAsString());
    final data = getDataFromJson(endpoint);
    final newId = generateId(endpoint);
    final newData = {'id': newId, ...body};
    data.add(newData);
    saveDataToJson(endpoint, data);
    return Response(
      HttpStatus.created,
      body: jsonEncode({
        'data': {'id': newId},
        'message': 'Data added successfully',
      }),
      headers: {'Content-Type': 'application/json'},
    );
  });

  // PUT api/{endpoint}/{id}
  app.put('/api/<endpoint>/<id>',
      (Request request, String endpoint, String id) async {
    final body = jsonDecode(await request.readAsString());
    final data = getDataFromJson(endpoint);
    final index = data.indexWhere((item) => item['id'] == int.parse(id));
    if (index != -1) {
      data[index] = {'id': int.parse(id), ...body};
      saveDataToJson(endpoint, data);
      return Response.ok(jsonEncode({'message': 'Data updated successfully'}),
          headers: {'Content-Type': 'application/json'});
    } else {
      return Response.notFound('Data not found');
    }
  });

  // DELETE api/{endpoint}/{id}
  app.delete('/api/<endpoint>/<id>',
      (Request request, String endpoint, String id) {
    final data = getDataFromJson(endpoint);
    final index = data.indexWhere((item) => item['id'] == int.parse(id));
    if (index != -1) {
      data.removeAt(index);
      saveDataToJson(endpoint, data);
      return Response.ok(jsonEncode({'message': 'Data deleted successfully'}),
          headers: {'Content-Type': 'application/json'});
    } else {
      return Response.notFound('Data not found');
    }
  });

  // DELETE api/{endpoint}/action/delete-all
  app.delete('/api/<endpoint>/action/delete-all',
      (Request request, String endpoint) {
    final filePath = getDataFilePath(endpoint);
    File(filePath).writeAsStringSync('[]');
    return Response.ok(jsonEncode({'message': 'All data deleted successfully'}),
        headers: {'Content-Type': 'application/json'});
  });

  final handler = const Pipeline().addMiddleware(logRequests()).addHandler(app);
  const port = 8080;
  shelf_io.serve(handler, InternetAddress.anyIPv4, port).then((server) {
    print('Server is running on port $port');
  });
}

List<dynamic> getDataFromJson(String endpoint) {
  try {
    final filePath = getDataFilePath(endpoint);
    final rawData = File(filePath).readAsStringSync();
    final data = jsonDecode(rawData);
    return data;
  } catch (error) {
    return [];
  }
}

void saveDataToJson(String endpoint, List<dynamic> data) {
  try {
    final filePath = getDataFilePath(endpoint);
    File(filePath).writeAsStringSync(jsonEncode(data));
  } catch (error) {
    print('Failed to save data to JSON file: $error');
  }
}

int generateId(String endpoint) {
  final idsFilePath = getIdsFilePath(endpoint);
  var lastId = 0;
  try {
    final rawIds = File(idsFilePath).readAsStringSync();
    lastId = int.tryParse(rawIds) ?? 0;
  } catch (error) {
    lastId = 0;
  }
  final newId = lastId + 1;
  File(idsFilePath).writeAsStringSync(newId.toString());
  return newId;
}

String getDataFilePath(String endpoint) {
  final directory = 'data';
  final filePath = path.join(directory, '$endpoint.json');
  if (File(filePath).existsSync() == false) {
    File(filePath).createSync(recursive: true);
    File(filePath).writeAsStringSync("[]");
  }
  return filePath;
}

String getIdsFilePath(String endpoint) {
  final directory = 'data';
  final indexDirectory = 'index';
  final filePath = path.join(directory, indexDirectory, '${endpoint}_ids.json');
  createDirectoryIfNotExists(path.join(directory, indexDirectory));
  return filePath;
}

void createDirectoryIfNotExists(String directoryPath) {
  if (!Directory(directoryPath).existsSync()) {
    Directory(directoryPath).createSync(recursive: true);
  }
}
