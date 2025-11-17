interface RouteResult {
  status: number;
  body: any;
  cookies?: any;
  headers?: Record<string, string>;
}

interface RouteInfo {
  path: string;
  method: string;
}

export default class Route {
  static async handler(result: RouteResult, response: any): Promise<void> {

    //result.cookies
    //result.headers
    //result.status
    //result.body

    response.status(result.status);
    response.send(result.body);
  }

  static addRoute(app: any, route: RouteInfo, callback: Function): any {
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
