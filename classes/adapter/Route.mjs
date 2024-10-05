export default class Route {
  static async handler(result, response) {

    //result.cookies
    //result.headers
    //result.status
    //result.body

    response.status(result.status);
    response.send(result.body);
  }

  static addRoute(app, route, callback) {
    switch (route.method) {
      case "POST":
        return app.post(route.path, callback);
      case "PUT":
        return app.put(route.path, callback);
      case "DELETE":
        return app.delete(route.path, callback);
      case "GET":
      default:
        return app.get(route.path, callback);
    }
  }
}
