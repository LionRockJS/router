import {Central, Controller} from '@lionrockjs/central';
import HelperRoute from './helper/Route.mjs';

const noop = () => {/***/};

const ErrorFactory = e => class ControllerError extends Controller {
    static suppressActionNotFound = true;

    async after() {
      throw (e);
    }
};

export default class RouteList {
  static routeMap = new Map();
  static routeCreated = false;
  static verbose = false;

  static #addRoute(path, method, weight, route, errorMessage) {
    const key = `${path}-${method}`;
    const record = this.routeMap.get(key);
    //guard if record not found;
    if (record) {
      //same route, skip adding to routeMap.
      if (record.controller === route.controller && record.action === route.action && record.message === route.message) return;
      //different controller or action, throw error.

      //route is higher weight, replace record
      if (route.weight > record.weight) {
        this.routeMap.set(key, route);
        return;
      }

      //route is lower weight, skip adding to routeMap.
      if(route.weight < record.weight) return;

      //same weight, throw error
      Central.log(['route', route], false);
      Central.log(['record', record], false);
      throw new Error(errorMessage + key);
    }

    this.routeMap.set(key, route);
  }

  /**
   *
   * @param {string} path
   * @param {string | Controller} controller
   * @param {string} action
   * @param {string} method
   * @param {number} weight
   */

  static add(path, controller, action = 'index', method = "GET", weight = 5) {
    //routes already created. do nothing
    if(this.routeCreated){
      if(this.verbose) Central.log('Cannot Add route after route created:' + path );
      return;
    }

    this.#addRoute(
      path,
      method,
      weight,
      {
        path,
        controller,
        action,
        method,
        weight,
      },
      'Route Already added:',
    );
  }

  static stub(path, message, method = "GET", weight = 5) {
    this.#addRoute(
      path,
      method,
      weight,
      {
        path,
        method,
        message,
        weight,
      },
      'Stub Route Already added:',
    );
  }

  static remove(path, method = "GET") {
    //routes already created. do nothing
    if(this.routeCreated){
      throw new Error('Route cannot remove after routes created.');
    };

    this.routeMap.delete(`${path}-${method}`);
  }

  static createRoute(app, routeAdapter) {
    if(this.routeCreated)throw new Error('cannot create route after routes created.');

    this.routeMap.forEach((route, k) => {
      // guards
      if (!route) return;
      // simply return stub message
      if (route.message) {
        routeAdapter.addRoute(app, route, async (request, reply, next = noop) => {
          const result = {
            status: 200,
            body : `RouteList.stub: ${route.path} -> ${route.message}`,
          }
          await routeAdapter.handler(result, reply)
        });
        return;
      }

      routeAdapter.addRoute(app, route, async (request, reply, next = noop) => {
        await Central.flushCache();
        request.params.action = route.action;
        request.params.controller = (typeof route.controller === 'string') ? route.controller : route.controller.name;
        const execute = (Central.config.system?.debug === true) ?
          HelperRoute.execute_debug :
          HelperRoute.execute_production;

        try {
          const controller = (typeof route.controller === 'string') ? await Central.import(route.controller) : route.controller;
          // separate controller.execute(request) to HelperRoute to allow add debugging information.
          const result = await execute(controller, request);
          // default result type is html
          if (!result.headers['Content-Type']) result.headers['Content-Type'] = 'text/html; charset=utf-8';
          // this is extension point to adapt result to response from app.
          await routeAdapter.handler(result, reply);
        } catch (e) {
          // this catch handles error on require buggy controller
          const result = await execute(ErrorFactory(e), request);
          await routeAdapter.handler(result, reply);
        }

        next();
      });
    });

    this.routeCreated = true;
  }
}
