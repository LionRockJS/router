import { Controller } from '@lionrockjs/central';
interface Route {
    path: string;
    controller: string | typeof Controller;
    action: string;
    method: string;
    weight: number;
    message?: string;
}
export default class RouteList {
    #private;
    static routeMap: Map<string, Route>;
    static routeCreated: boolean;
    static verbose: boolean;
    /**
     *
     * @param {string} path
     * @param {string | Controller} controller
     * @param {string} action
     * @param {string} method
     * @param {number} weight
     */
    static add(path: string, controller: string | typeof Controller, action?: string, method?: string, weight?: number): void;
    static stub(path: string, message: string, method?: string, weight?: number): void;
    static remove(path: string, method?: string): void;
    static createRoute(app: any, routeAdapter: any): void;
}
export {};
