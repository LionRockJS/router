import {Controller} from '@lionrockjs/central';
import RouteList from '../../classes/RouteList.mjs';

class ControllerTest extends Controller {
  async action_test() {
    this.state.set(Controller.STATE_BODY, 'test');
  }

  async action_fail() {
    throw new Error('controller error');
  }
}

class MockApp {
  routes = new Map();

  get(path, callback) {
    this.routes.set(`${path}-GET`, callback);
  }

  post(path, callback) {
    this.routes.set(`${path}-POST`, callback);
  }

  async run(path, method = 'GET') {
    const request = { params: {} };
    const reply = {};
    const callback = this.routes.get(`${path}-${method}`);
    if (!callback) return { status: 404, body: 'route not found' };
    await callback(request, reply);
    return reply;
  }
}

class MockRouteAdapter {
  static async handler(result, reply) {
    Object.assign(reply, { result });
  }

  static addRoute(app, route, callback) {
    switch (route.method) {
      case 'POST':
        return app.post(route.path, callback);
      case 'GET':
      default:
        return app.get(route.path, callback);
    }
  }
}

describe('Route Test', () => {
  beforeEach(() => {
    RouteList.routeCreated = false;
    RouteList.routeMap = new Map();
    RouteList.errorOnDuplicate = false;
  });

  test('add route', async () => {
    RouteList.add('/hello-world/:id', 'controller/Test', 'view', 'POST');
    const route = RouteList.routeMap.get('/hello-world/:id-POST');
    expect(route.action).toBe('view');
    expect(route.controller).toBe('controller/Test');
    expect(route.method).toBe('POST');
    expect(route.path).toBe('/hello-world/:id');
    expect(route.weight).toBe(5);
  });

  test('add multi route', async () => {
    RouteList.add('/hello-world/:id', 'controller/Test', 'view', 'POST');
    RouteList.add('/hello/:id', 'controller/Test', 'hello');

    const route = RouteList.routeMap.get('/hello-world/:id-POST');
    expect(route.action).toBe('view');
    expect(route.controller).toBe('controller/Test');
    expect(route.method).toBe('POST');
    expect(route.path).toBe('/hello-world/:id');
    expect(route.weight).toBe(5);

    const route2 = RouteList.routeMap.get('/hello/:id-GET');
    expect(route2.action).toBe('hello');
    expect(route2.controller).toBe('controller/Test');
    expect(route2.method).toBe('GET');
    expect(route2.path).toBe('/hello/:id');
    expect(route2.weight).toBe(5);
  });

  test('add duplicate route', async () => {
    RouteList.add('/hello-world/:id', 'controller/Test', 'view', 'POST');
    RouteList.add('/hello/:id', 'controller/Test', 'hello');
    RouteList.add('/hello-world/:id', 'controller/Test', 'view', 'POST');

    const route = RouteList.routeMap.get('/hello-world/:id-POST');
    expect(route.action).toBe('view');
    expect(route.controller).toBe('controller/Test');
    expect(route.method).toBe('POST');
    expect(route.path).toBe('/hello-world/:id');
    expect(route.weight).toBe(5);

    const route2 = RouteList.routeMap.get('/hello/:id-GET');
    expect(route2.action).toBe('hello');
    expect(route2.controller).toBe('controller/Test');
    expect(route2.method).toBe('GET');
    expect(route2.path).toBe('/hello/:id');
    expect(route2.weight).toBe(5);
  });

  test('add exist route with different controller', async () => {
    try {
      RouteList.add('/hello-world/:id', 'controller/Test', 'view', 'POST');
      RouteList.add('/hello-world/:id', 'controller/Test2', 'view', 'POST');
      expect('this should not be run').toBe(false);
    } catch (e) {
      expect(/Route Already added/.test(e.message)).toBe(true);
    }
  });

  test('remove route', () => {
    RouteList.add('/hello-world/:id', 'controller/Test', 'view', 'POST');
    RouteList.add('/hello/:id', 'controller/Test', 'hello');
    RouteList.remove('/hello-world/:id', 'POST');

    // first route removed, the 0 item should be 2nd route
    const route = RouteList.routeMap.get('/hello-world/:id-POST');
    expect(route).toBe(undefined);

    const route2= RouteList.routeMap.get('/hello/:id-GET');
    expect(route2.action).toBe('hello');
    expect(route2.controller).toBe('controller/Test');
    expect(route2.method).toBe('GET');
    expect(route2.path).toBe('/hello/:id');
    expect(route2.weight).toBe(5);
  });

  test('add stub', () => {
    RouteList.stub('/book/read/:id', 'read book', 'GET');
    const route = RouteList.routeMap.get('/book/read/:id-GET');
    expect(route.action).toBe(undefined);
    expect(route.controller).toBe(undefined);
    expect(route.method).toBe('GET');
    expect(route.path).toBe('/book/read/:id');
    expect(route.message).toBe('read book');
    expect(route.weight).toBe(5);
  });

  test('add multiple stub', () => {
    RouteList.stub('/book/read/:id', 'read book', 'GET');
    RouteList.stub('/book/read/:id', 'read book post', 'POST');

    const route = RouteList.routeMap.get('/book/read/:id-GET');
    expect(route.method).toBe('GET');
    expect(route.path).toBe('/book/read/:id');
    expect(route.message).toBe('read book');
    expect(route.weight).toBe(5);

    const route2 = RouteList.routeMap.get('/book/read/:id-POST');
    expect(route2.method).toBe('POST');
    expect(route2.path).toBe('/book/read/:id');
    expect(route2.message).toBe('read book post');
    expect(route2.weight).toBe(5);
  });

  test('add same stub', () => {
    RouteList.stub('/book/read/:id', 'read book', 'GET');
    RouteList.stub('/book/read/:id', 'read book', 'GET');

    const route = RouteList.routeMap.get('/book/read/:id-GET');
    expect(route.method).toBe('GET');
    expect(route.path).toBe('/book/read/:id');
    expect(route.message).toBe('read book');
    expect(route.weight).toBe(5);
  });

  test('add exist stub with different message', async () => {
    try {
      RouteList.stub('/book/read/:id', 'read book', 'GET');
      RouteList.stub('/book/read/:id', 'read books', 'GET');

      expect('this should not be run').toBe(false);
    } catch (e) {
      expect(/Stub Route Already added/.test(e.message)).toBe(true);
    }
  });

  test('create route', async () => {
    const app = new MockApp();
    RouteList.add('/hello-world/:id', ControllerTest, 'test', 'POST');
    RouteList.createRoute(app, MockRouteAdapter);

    const reply = await app.run('/hello-world/:id', 'POST');
    expect(reply.result.body).toBe('test');
  });

  test('controller error, catch by controller exit', async () => {
    const app = new MockApp();
    RouteList.add('/hello-world/:id', ControllerTest, 'fail', 'POST');
    RouteList.createRoute(app, MockRouteAdapter);

    const reply = await app.run('/hello-world/:id', 'POST');
    expect(reply.result.status).toBe(500);
    expect(reply.result.body).toBe('controller error');
  });

  test('error cannot catch by exit', async () => {
    const app = new MockApp();
    RouteList.add('/hello-world/:id', 'controller/Missing', 'fail', 'POST');
    RouteList.createRoute(app, MockRouteAdapter);

    const reply = await app.run('/hello-world/:id', 'POST');
    expect(reply.result.status).toBe(500);
    expect(reply.result.body).toBe("Resolve path error: path controller/Missing.mjs not found. prefixPath: classes , store: {} ");
  });
});
